import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['x-admin-token'];
    
    const validToken = process.env.ADMIN_TOKEN;
    
    if (!validToken) {
      throw new UnauthorizedException('Admin token not configured');
    }
    
    if (authHeader !== validToken) {
      throw new UnauthorizedException('Invalid admin token');
    }
    
    return true;
  }
}
