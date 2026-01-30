import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);

  constructor(private prisma: PrismaService) {}

  // 生成 License Key
  generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
    }
    return `AIXL-${segments.join('-')}`;
  }

  // 创建新授权
  async createLicense(data: {
    customerId: string;
    customerName: string;
    projectName?: string;
    expiresAt: Date;
    maxServers?: number;
    features?: Record<string, boolean>;
  }) {
    const key = this.generateLicenseKey();
    
    const license = await this.prisma.license.create({
      data: {
        key,
        customerId: data.customerId,
        customerName: data.customerName,
        projectName: data.projectName || 'AixL',
        expiresAt: data.expiresAt,
        maxServers: data.maxServers || 1,
        features: data.features || {},
        fingerprints: [],
      },
    });

    this.logger.log(`✅ Created license: ${key} for ${data.customerName}`);
    return license;
  }

  // 验证授权（核心接口）
  async verifyLicense(data: {
    licenseKey: string;
    fingerprint: string;
    ipAddress: string;
    version?: string;
    serverInfo?: any;
  }): Promise<{
    valid: boolean;
    reason?: string;
    license?: any;
    expiresAt?: Date;
    features?: any;
    daysRemaining?: number;
  }> {
    const license = await this.prisma.license.findUnique({
      where: { key: data.licenseKey },
    });

    // 1. 检查 License 是否存在
    if (!license) {
      this.logger.warn(`❌ Invalid license key: ${data.licenseKey} from ${data.ipAddress}`);
      return { valid: false, reason: 'INVALID_KEY' };
    }

    // 2. 检查是否被吊销
    if (license.isRevoked) {
      this.logger.warn(`❌ Revoked license used: ${data.licenseKey}`);
      return { valid: false, reason: 'REVOKED' };
    }

    // 3. 检查是否激活
    if (!license.isActive) {
      return { valid: false, reason: 'INACTIVE' };
    }

    // 4. 检查过期时间
    const now = new Date();
    if (now > license.expiresAt) {
      this.logger.warn(`❌ Expired license: ${data.licenseKey}`);
      return { valid: false, reason: 'EXPIRED' };
    }

    // 5. 检查硬件指纹
    if (license.fingerprints.length > 0) {
      if (!license.fingerprints.includes(data.fingerprint)) {
        // 检查是否超过最大服务器数
        if (license.fingerprints.length >= license.maxServers) {
          this.logger.warn(`❌ Hardware mismatch: ${data.licenseKey}, new fingerprint: ${data.fingerprint}`);
          return { valid: false, reason: 'HARDWARE_MISMATCH' };
        }
        // 自动绑定新指纹
        await this.prisma.license.update({
          where: { id: license.id },
          data: {
            fingerprints: [...license.fingerprints, data.fingerprint],
          },
        });
        this.logger.log(`🔗 Bound new fingerprint to license: ${data.licenseKey}`);
      }
    } else {
      // 首次使用，绑定指纹
      await this.prisma.license.update({
        where: { id: license.id },
        data: {
          fingerprints: [data.fingerprint],
        },
      });
      this.logger.log(`🔗 First bind fingerprint to license: ${data.licenseKey}`);
    }

    // 6. 记录心跳
    await this.prisma.heartbeat.create({
      data: {
        licenseId: license.id,
        fingerprint: data.fingerprint,
        ipAddress: data.ipAddress,
        version: data.version || 'unknown',
        serverInfo: data.serverInfo,
      },
    });

    // 计算剩余天数
    const daysRemaining = Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    this.logger.log(`✅ License verified: ${data.licenseKey} from ${data.ipAddress}, ${daysRemaining} days remaining`);

    return {
      valid: true,
      license: {
        customerId: license.customerId,
        customerName: license.customerName,
        projectName: license.projectName,
      },
      expiresAt: license.expiresAt,
      features: license.features,
      daysRemaining,
    };
  }

  // 吊销授权
  async revokeLicense(licenseKey: string, reason?: string) {
    const license = await this.prisma.license.update({
      where: { key: licenseKey },
      data: {
        isRevoked: true,
        revokeReason: reason || 'Manual revocation',
      },
    });
    
    this.logger.warn(`⛔ License revoked: ${licenseKey}, reason: ${reason}`);
    return license;
  }

  // 恢复授权
  async restoreLicense(licenseKey: string) {
    const license = await this.prisma.license.update({
      where: { key: licenseKey },
      data: {
        isRevoked: false,
        revokeReason: null,
      },
    });
    
    this.logger.log(`✅ License restored: ${licenseKey}`);
    return license;
  }

  // 延期授权
  async extendLicense(licenseKey: string, newExpiresAt: Date) {
    const license = await this.prisma.license.update({
      where: { key: licenseKey },
      data: { expiresAt: newExpiresAt },
    });
    
    this.logger.log(`📅 License extended: ${licenseKey} to ${newExpiresAt.toISOString()}`);
    return license;
  }

  // 获取所有授权
  async getAllLicenses() {
    return this.prisma.license.findMany({
      include: {
        _count: { select: { heartbeats: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 获取单个授权详情
  async getLicenseByKey(key: string) {
    return this.prisma.license.findUnique({
      where: { key },
      include: {
        _count: { select: { heartbeats: true } },
      },
    });
  }

  // 获取心跳记录
  async getHeartbeats(licenseKey: string, limit = 100) {
    const license = await this.prisma.license.findUnique({
      where: { key: licenseKey },
    });
    
    if (!license) return [];
    
    return this.prisma.heartbeat.findMany({
      where: { licenseId: license.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // 重置硬件绑定
  async resetFingerprints(licenseKey: string) {
    const license = await this.prisma.license.update({
      where: { key: licenseKey },
      data: { fingerprints: [] },
    });
    
    this.logger.log(`🔄 Fingerprints reset for license: ${licenseKey}`);
    return license;
  }

  // 删除授权
  async deleteLicense(licenseKey: string) {
    const license = await this.prisma.license.delete({
      where: { key: licenseKey },
    });
    
    this.logger.warn(`🗑️ License deleted: ${licenseKey}`);
    return license;
  }

  // 获取统计信息
  async getStats() {
    const [total, active, expired, revoked, recentHeartbeats] = await Promise.all([
      this.prisma.license.count(),
      this.prisma.license.count({ where: { isActive: true, isRevoked: false, expiresAt: { gt: new Date() } } }),
      this.prisma.license.count({ where: { expiresAt: { lt: new Date() } } }),
      this.prisma.license.count({ where: { isRevoked: true } }),
      this.prisma.heartbeat.count({ where: { createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);

    return {
      total,
      active,
      expired,
      revoked,
      heartbeats24h: recentHeartbeats,
    };
  }
}
