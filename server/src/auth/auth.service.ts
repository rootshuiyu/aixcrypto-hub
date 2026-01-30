import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { verifyMessage } from 'viem';
import { QuestService } from '../quest/quest.service';
import { JwtService, TokenPair } from './jwt.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // Nonce 存儲 - 生產環境建議使用 Redis
  // TODO: 如需多實例部署，請配置 Redis 替換此內存存儲
  // 示例: npm install ioredis，然後使用 RedisService
  private nonces = new Map<string, { nonce: string, expires: number }>();

  constructor(
    private prisma: PrismaService,
    private questService: QuestService,
    private jwtService: JwtService,
    private eventsGateway: EventsGateway,
  ) {}

  // 生成一个随机随机数，防止重放攻击
  generateNonce(address: string) {
    const nonce = `Sign this message to login to Superoctop Hub: ${Math.floor(Math.random() * 1000000)}`;
    const expires = Date.now() + 1000 * 60 * 5; // 5分钟有效期
    this.nonces.set(address.toLowerCase(), { nonce, expires });
    return nonce;
  }

  // 校验签名并登录/注册
  async verifySignature(address: string, signature: string): Promise<{ user: any; tokens: TokenPair }> {
    const addr = address.toLowerCase();
    const stored = this.nonces.get(addr);

    if (!stored || stored.expires < Date.now()) {
      throw new UnauthorizedException('Nonce expired or not found. Please request a new nonce.');
    }

    // 校验签名
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message: stored.nonce,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 校验成功，清除 nonce
    this.nonces.delete(addr);

    // 查找或创建用户
    let user = await this.prisma.user.findUnique({ where: { address: addr } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          address: addr,
          username: `Explorer_${addr.slice(2, 8)}`,
          pts: 1000, // 初始奖励积分
        }
      });
    }

    // 生成 JWT Token 对
    const tokens = this.jwtService.generateTokenPair({
      sub: user.id,
      address: user.address,
      role: user.role || 'USER',
    });

    return { user, tokens };
  }

  // 校验 Privy 登录并同步用户
  async verifyPrivy(data: { 
    privyId: string, 
    address?: string, 
    email?: string, 
    twitterId?: string, 
    discordId?: string,
    referrerCode?: string
  }): Promise<{ user: any; tokens: TokenPair, isNewUser: boolean }> {
    try {
      const { privyId, address, email, twitterId, discordId, referrerCode } = data;
      this.logger.log(`Verifying Privy user: ${privyId}`);

      // 1. 优先通过 privyId 查找用户
      let user = await this.prisma.user.findUnique({
        where: { privyId }
      });

      // 2. 如果没找到，尝试通过其他唯一标识查找（处理关联）
      if (!user) {
        const conditions = [];
        if (address) conditions.push({ address });
        if (email) conditions.push({ email });
        if (twitterId) conditions.push({ twitterId });
        if (discordId) conditions.push({ discordId });

        if (conditions.length > 0) {
          user = await this.prisma.user.findFirst({
            where: { OR: conditions }
          });
        }
      }

      let isNewUser = false;
      
      if (!user) {
        // 3. 确实是新用户，创建
        this.logger.log(`Creating new user for Privy ID: ${privyId}`);
        isNewUser = true;
        
        // 如果有邀请码，查找邀请人
        let referrerId = null;
        if (referrerCode) {
          const referrer = await this.prisma.user.findUnique({
            where: { referralCode: referrerCode }
          });
          if (referrer) {
            referrerId = referrer.id;
            this.logger.log(`User invited by: ${referrer.username} (${referrerId})`);
          }
        }

        user = await this.prisma.user.create({
          data: {
            privyId,
            address: address || null,
            email: email || null,
            twitterId: twitterId || null,
            discordId: discordId || null,
            username: twitterId || discordId || (email ? email.split('@')[0] : `Explorer_${privyId.slice(-6)}`),
            pts: 1000,
            referrerId,
          }
        });

        // 如果有邀请人，发放邀请奖励并更新任务进度
        if (referrerId) {
          // 直接发放 100 PTS 邀请奖励给邀请人
          await this.prisma.user.update({
            where: { id: referrerId },
            data: { pts: { increment: 100 } }
          });
          this.logger.log(`Referral reward: +100 PTS to user ${referrerId}`);
          
          // 更新邀请任务进度
          await this.questService.updateProgress(referrerId, 'REFERRAL');
        }

        // 初始化任务
        const allTasks = await this.prisma.task.findMany();
        if (allTasks.length > 0) {
          await this.prisma.userTask.createMany({
            data: allTasks.map(t => ({
              userId: user.id,
              taskId: t.id,
              progress: 0,
              status: 'IN_PROGRESS'
            }))
          });
        }
      } else {
        // 4. 已有用户，同步更新信息
        this.logger.log(`Syncing existing user: ${user.id}`);
        const wasAddressEmpty = !user.address;
        
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            privyId: user.privyId || privyId,
            address: address || user.address,
            email: email || user.email,
            twitterId: twitterId || user.twitterId,
            discordId: discordId || user.discordId,
          }
        });

        // 🔧 强化：完善社交账号绑定任务触发逻辑
        if (twitterId && !user.twitterId) {
          await this.questService.updateProgress(user.id, 'TWITTER_LINK');
        }
        if (discordId && !user.discordId) {
          await this.questService.updateProgress(user.id, 'DISCORD_LINK');
        }

        // 如果是新绑定的钱包，触发任务进度
        if (wasAddressEmpty && address) {
          await this.questService.updateProgress(user.id, 'WALLET_LINK');
        }

        // 📣 实时同步到管理后台
        this.eventsGateway.emitUserProfileUpdate(user.id, {
          username: user.username,
          address: user.address,
          email: user.email,
          twitterId: user.twitterId,
          discordId: user.discordId,
        });

        // 补全任务进度
        const existingTasksCount = await this.prisma.userTask.count({
          where: { userId: user.id }
        });
        if (existingTasksCount === 0) {
          const allTasks = await this.prisma.task.findMany();
          await this.prisma.userTask.createMany({
            data: allTasks.map(t => ({
              userId: user.id,
              taskId: t.id,
              progress: 0,
              status: 'IN_PROGRESS'
            }))
          });
        }
      }

      // 更新登录任务进度
      await this.questService.updateProgress(user.id, 'LOGIN');

      // 生成 JWT Token 对
      const tokens = this.jwtService.generateTokenPair({
        sub: user.id,
        address: user.address,
        privyId: user.privyId,
        role: user.role || 'USER',
      });

      return { user, tokens, isNewUser };
    } catch (error) {
      this.logger.error(`CRITICAL: verifyPrivy failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 刷新 Token
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return this.jwtService.refreshAccessToken(
      refreshToken,
      (id) => this.prisma.user.findUnique({ where: { id } })
    );
  }

  // 验证 Token（用于中间件）
  verifyToken(token: string) {
    return this.jwtService.verifyAccessToken(token);
  }
}
