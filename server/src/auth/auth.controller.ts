import { Controller, Post, Body, Get, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce/:address')
  @ApiOperation({ summary: '获取登录用的随机随机数' })
  getNonce(@Param('address') address: string) {
    return { nonce: this.authService.generateNonce(address) };
  }

  @Post('verify')
  @ApiOperation({ summary: '校验签名并登录（钱包签名登录）' })
  async verify(@Body() body: { address: string, signature: string }) {
    const { user, tokens } = await this.authService.verifySignature(body.address, body.signature);
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  @Post('verify-privy')
  @ApiOperation({ summary: '校验 Privy 并登录（社交登录）' })
  async verifyPrivy(@Body() body: any) {
    const { user, tokens, isNewUser } = await this.authService.verifyPrivy(body);
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      isNewUser: isNewUser || false,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新 Access Token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const tokens = await this.authService.refreshToken(body.refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录用户信息（需要 Bearer Token）' })
  async getMe(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const payload = this.authService.verifyToken(token);
    
    return { userId: payload.sub, address: payload.address, role: payload.role };
  }
}
