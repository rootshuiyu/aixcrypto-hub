import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as os from 'os';
import * as crypto from 'crypto';

interface LicenseData {
  valid: boolean;
  reason?: string;
  expiresAt?: Date;
  features?: Record<string, boolean>;
  daysRemaining?: number;
}

@Injectable()
export class LicenseService implements OnModuleInit {
  private readonly logger = new Logger(LicenseService.name);
  private readonly LICENSE_SERVER = process.env.LICENSE_SERVER || 'http://localhost:4000';
  private readonly LICENSE_KEY = process.env.LICENSE_KEY;
  
  private cachedLicense: LicenseData | null = null;
  private lastCheck: Date | null = null;
  private isLicensed = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async onModuleInit() {
    // 如果没有配置 License，跳过验证（开发模式）
    if (!this.LICENSE_KEY) {
      this.logger.warn('⚠️ No LICENSE_KEY configured, running in development mode');
      this.isLicensed = true;
      return;
    }

    // 启动时验证
    await this.verifyLicense();
    
    // 启动定时心跳（每6小时）
    this.startHeartbeat();
  }

  // 获取硬件指纹
  private getHardwareFingerprint(): string {
    const data = [
      os.hostname(),
      os.cpus()[0]?.model || 'unknown',
      os.platform(),
      os.arch(),
      os.totalmem().toString(),
    ].join('|');
    
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 32);
  }

  // 验证授权
  async verifyLicense(): Promise<boolean> {
    if (!this.LICENSE_KEY) {
      return true; // 开发模式
    }

    const fingerprint = this.getHardwareFingerprint();

    try {
      const response = await axios.post(
        `${this.LICENSE_SERVER}/api/verify`,
        {
          licenseKey: this.LICENSE_KEY,
          fingerprint,
          version: '1.0.0',
          serverInfo: {
            hostname: os.hostname(),
            platform: os.platform(),
            nodeVersion: process.version,
          },
        },
        { timeout: 10000 }
      );

      if (response.data.valid) {
        this.cachedLicense = response.data;
        this.lastCheck = new Date();
        this.isLicensed = true;
        
        this.logger.log(`✅ License verified, expires: ${response.data.expiresAt}, ${response.data.daysRemaining} days remaining`);
        
        // 如果剩余天数少于7天，发出警告
        if (response.data.daysRemaining < 7) {
          this.logger.warn(`⚠️ License expiring soon! Only ${response.data.daysRemaining} days remaining`);
        }
        
        return true;
      } else {
        this.logger.error(`❌ License validation failed: ${response.data.reason}`);
        this.handleLicenseFailure(response.data.reason);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ License server unreachable: ${error.message}`);
      
      // 网络错误时使用缓存（72小时宽限期）
      if (this.cachedLicense && this.isWithinGracePeriod()) {
        this.logger.warn('⚠️ Using cached license (grace period)');
        return true;
      }
      
      this.handleLicenseFailure('NETWORK_ERROR');
      return false;
    }
  }

  // 宽限期检查（72小时）
  private isWithinGracePeriod(): boolean {
    if (!this.lastCheck) return false;
    const hours = (Date.now() - this.lastCheck.getTime()) / 3600000;
    return hours < 72;
  }

  // 处理授权失败
  private handleLicenseFailure(reason: string) {
    this.isLicensed = false;
    
    // 根据配置决定是否强制停止
    const forceStop = process.env.LICENSE_FORCE_STOP === 'true';
    
    if (forceStop) {
      this.logger.error(`🛑 License validation failed (${reason}), shutting down...`);
      process.exit(1);
    } else {
      this.logger.warn(`⚠️ License validation failed (${reason}), running in degraded mode`);
      // 设置全局降级标志
      global['LICENSE_DEGRADED'] = true;
      global['LICENSE_FAILURE_REASON'] = reason;
    }
  }

  // 定时心跳
  private startHeartbeat() {
    // 每6小时验证一次
    this.heartbeatInterval = setInterval(async () => {
      this.logger.debug('🔄 License heartbeat check...');
      await this.verifyLicense();
    }, 6 * 60 * 60 * 1000);
  }

  // 检查是否有有效授权
  isValid(): boolean {
    return this.isLicensed;
  }

  // 检查特定功能是否启用
  hasFeature(feature: string): boolean {
    if (!this.cachedLicense?.features) return true; // 默认启用
    return this.cachedLicense.features[feature] !== false;
  }

  // 获取授权信息
  getLicenseInfo() {
    return {
      isLicensed: this.isLicensed,
      cachedLicense: this.cachedLicense,
      lastCheck: this.lastCheck,
      isDegraded: global['LICENSE_DEGRADED'] || false,
      failureReason: global['LICENSE_FAILURE_REASON'],
    };
  }

  // 清理
  onModuleDestroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
