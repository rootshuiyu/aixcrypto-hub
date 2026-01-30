import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;       // userId
  address?: string;
  privyId?: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  
  // 安全密鑰 - 必須從環境變量讀取，無默認值
  private readonly JWT_SECRET: string;
  private readonly REFRESH_SECRET: string;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

    if (!this.JWT_SECRET || !this.REFRESH_SECRET) {
      throw new Error(
        '❌ CRITICAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables!\n' +
        'Please configure these in server/.env:\n' +
        '  JWT_SECRET=your-random-secret-key-at-least-32-characters\n' +
        '  JWT_REFRESH_SECRET=another-random-secret-key-at-least-32-characters'
      );
    }

    if (this.JWT_SECRET.length < 32 || this.REFRESH_SECRET.length < 32) {
      this.logger.warn('⚠️ JWT secrets should be at least 32 characters for security');
    }
  }
  
  // 过期时间
  private readonly ACCESS_TOKEN_EXPIRY = '2h';      // Access Token 2小时
  private readonly REFRESH_TOKEN_EXPIRY = '7d';     // Refresh Token 7天

  /**
   * 生成 Token 对（Access + Refresh）
   */
  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = jwt.sign(
      payload,
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { sub: payload.sub, type: 'refresh' },
      this.REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    this.logger.log(`Token pair generated for user: ${payload.sub}`);

    return {
      accessToken,
      refreshToken,
      expiresIn: 2 * 60 * 60, // 2小时（秒）
    };
  }

  /**
   * 验证 Access Token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired. Please refresh or re-login.');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * 验证 Refresh Token
   */
  verifyRefreshToken(token: string): { sub: string } {
    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET) as { sub: string; type: string };
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return { sub: decoded.sub };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * 刷新 Token（用 Refresh Token 换取新的 Access Token）
   */
  async refreshAccessToken(refreshToken: string, getUserById: (id: string) => Promise<any>): Promise<TokenPair> {
    const { sub: userId } = this.verifyRefreshToken(refreshToken);
    
    // 获取用户最新信息
    const user = await getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 生成新的 Token 对
    return this.generateTokenPair({
      sub: user.id,
      address: user.address,
      privyId: user.privyId,
      role: user.role || 'USER',
    });
  }

  /**
   * 从 Authorization Header 提取 Token
   */
  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }
    
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }
    
    return token;
  }
}
