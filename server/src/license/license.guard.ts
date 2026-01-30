import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { LicenseService } from './license.service';

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(private licenseService: LicenseService) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否有有效授权
    if (!this.licenseService.isValid()) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: '系统授权已过期，请联系供应商',
          error: 'LICENSE_INVALID',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // 检查是否处于降级模式
    if (global['LICENSE_DEGRADED']) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: '系统授权验证失败，部分功能不可用',
          error: 'LICENSE_DEGRADED',
          reason: global['LICENSE_FAILURE_REASON'],
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return true;
  }
}

// 功能特性守卫工厂
export function FeatureGuard(feature: string) {
  @Injectable()
  class FeatureGuardClass implements CanActivate {
    constructor(private licenseService: LicenseService) {}

    canActivate(context: ExecutionContext): boolean {
      if (!this.licenseService.hasFeature(feature)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: `功能 "${feature}" 未授权`,
            error: 'FEATURE_NOT_LICENSED',
          },
          HttpStatus.FORBIDDEN
        );
      }
      return true;
    }
  }
  return FeatureGuardClass;
}
