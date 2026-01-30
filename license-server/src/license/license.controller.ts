import { Controller, Post, Get, Body, Param, Query, Ip, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { AdminGuard } from '../admin/admin.guard';

@ApiTags('license')
@Controller('api')
export class LicenseController {
  constructor(private licenseService: LicenseService) {}

  // ============ 公开接口 ============

  @Post('verify')
  @ApiOperation({ summary: '验证授权（客户端调用）' })
  async verify(
    @Body() body: {
      licenseKey: string;
      fingerprint: string;
      version?: string;
      serverInfo?: any;
    },
    @Ip() ipAddress: string,
  ) {
    return this.licenseService.verifyLicense({
      licenseKey: body.licenseKey,
      fingerprint: body.fingerprint,
      ipAddress: ipAddress || 'unknown',
      version: body.version,
      serverInfo: body.serverInfo,
    });
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  async health() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }

  // ============ 管理接口（需要认证）============

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '获取统计信息' })
  async getStats() {
    return this.licenseService.getStats();
  }

  @Get('admin/licenses')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '获取所有授权' })
  async getAllLicenses() {
    return this.licenseService.getAllLicenses();
  }

  @Get('admin/license/:key')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '获取单个授权详情' })
  async getLicense(@Param('key') key: string) {
    return this.licenseService.getLicenseByKey(key);
  }

  @Post('admin/license/create')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '创建新授权' })
  async createLicense(
    @Body() body: {
      customerId: string;
      customerName: string;
      projectName?: string;
      expiresAt: string;
      maxServers?: number;
      features?: Record<string, boolean>;
    },
  ) {
    return this.licenseService.createLicense({
      ...body,
      expiresAt: new Date(body.expiresAt),
    });
  }

  @Post('admin/license/revoke')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '吊销授权' })
  async revokeLicense(
    @Body() body: { licenseKey: string; reason?: string },
  ) {
    return this.licenseService.revokeLicense(body.licenseKey, body.reason);
  }

  @Post('admin/license/restore')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '恢复授权' })
  async restoreLicense(@Body() body: { licenseKey: string }) {
    return this.licenseService.restoreLicense(body.licenseKey);
  }

  @Post('admin/license/extend')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '延期授权' })
  async extendLicense(
    @Body() body: { licenseKey: string; newExpiresAt: string },
  ) {
    return this.licenseService.extendLicense(
      body.licenseKey,
      new Date(body.newExpiresAt),
    );
  }

  @Get('admin/license/:key/heartbeats')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '获取心跳记录' })
  async getHeartbeats(
    @Param('key') key: string,
    @Query('limit') limit?: string,
  ) {
    return this.licenseService.getHeartbeats(key, limit ? parseInt(limit) : 100);
  }

  @Post('admin/license/reset-fingerprints')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '重置硬件绑定' })
  async resetFingerprints(@Body() body: { licenseKey: string }) {
    return this.licenseService.resetFingerprints(body.licenseKey);
  }

  @Delete('admin/license/:key')
  @UseGuards(AdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: '删除授权' })
  async deleteLicense(@Param('key') key: string) {
    return this.licenseService.deleteLicense(key);
  }
}
