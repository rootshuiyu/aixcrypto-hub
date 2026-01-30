import { Controller, Get, Param } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly adminService: AdminService) {}

  @Get('feature-flags')
  @ApiOperation({ summary: '获取所有功能开关状态（公开）' })
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Get('feature-flags/:feature')
  @ApiOperation({ summary: '获取单个功能开关状态（公开）' })
  async getFeatureFlag(@Param('feature') feature: string) {
    const enabled = await this.adminService.getFeatureFlag(feature);
    return { feature, enabled };
  }
}
