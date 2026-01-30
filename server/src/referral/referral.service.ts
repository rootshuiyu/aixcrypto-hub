import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  // 奖励配置
  private readonly REWARDS = {
    SIGNUP_BONUS: 100,      // 新用户注册奖励
    FIRST_BET_BONUS: 50,    // 被推荐人首次下注奖励
    ACTIVITY_BONUS: 10,     // 活跃奖励（每次下注）
  };

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 获取用户的推荐统计数据
   */
  async getReferralStats(userId: string) {
    // 获取推荐人数
    const referralCount = await this.prisma.user.count({
      where: { referrerId: userId }
    });

    // 获取总奖励金额
    const totalRewards = await this.prisma.referralReward.aggregate({
      where: { referrerId: userId },
      _sum: { amount: true }
    });

    // 获取本月新增推荐
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyReferrals = await this.prisma.user.count({
      where: {
        referrerId: userId,
        createdAt: { gte: startOfMonth }
      }
    });

    // 获取本月奖励
    const monthlyRewards = await this.prisma.referralReward.aggregate({
      where: {
        referrerId: userId,
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    return {
      totalReferrals: referralCount,
      totalRewards: totalRewards._sum.amount || 0,
      monthlyReferrals,
      monthlyRewards: monthlyRewards._sum.amount || 0,
      rewardRates: this.REWARDS,
    };
  }

  /**
   * 获取用户推荐的用户列表
   */
  async getReferralList(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { referrerId: userId },
        select: {
          id: true,
          username: true,
          address: true,
          createdAt: true,
          pts: true,
          totalBattles: true,
          totalWins: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: { referrerId: userId }
      })
    ]);

    // 计算每个被推荐人带来的奖励
    const referralsWithRewards = await Promise.all(
      referrals.map(async (referral) => {
        const rewards = await this.prisma.referralReward.aggregate({
          where: {
            referrerId: userId,
            refereeId: referral.id
          },
          _sum: { amount: true }
        });
        return {
          ...referral,
          rewardsGenerated: rewards._sum.amount || 0,
        };
      })
    );

    return {
      referrals: referralsWithRewards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * 获取奖励明细记录
   */
  async getRewardHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [rewards, total] = await Promise.all([
      this.prisma.referralReward.findMany({
        where: { referrerId: userId },
        include: {
          referee: {
            select: {
              id: true,
              username: true,
              address: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.referralReward.count({
        where: { referrerId: userId }
      })
    ]);

    return {
      rewards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * 发放推荐奖励（内部方法，供其他服务调用）
   */
  async grantReferralReward(
    referrerId: string,
    refereeId: string,
    type: 'SIGNUP_BONUS' | 'FIRST_BET_BONUS' | 'ACTIVITY_BONUS',
    description?: string
  ) {
    const amount = this.REWARDS[type];
    if (!amount) {
      this.logger.warn(`Unknown reward type: ${type}`);
      return null;
    }

    try {
      // 创建奖励记录
      const reward = await this.prisma.referralReward.create({
        data: {
          referrerId,
          refereeId,
          amount,
          type,
          description: description || `${type} reward`,
        }
      });

      // 更新推荐人积分
      const updatedUser = await this.prisma.user.update({
        where: { id: referrerId },
        data: { pts: { increment: amount } }
      });

      // 发送实时通知
      this.eventsGateway.emitBalanceUpdate(referrerId, updatedUser.pts);
      
      // 创建通知记录
      await this.createReferralNotification(referrerId, refereeId, amount, type);

      this.logger.log(`Referral reward granted: ${amount} PTS to ${referrerId} (type: ${type})`);
      
      return reward;
    } catch (error) {
      this.logger.error(`Failed to grant referral reward: ${error.message}`);
      return null;
    }
  }

  /**
   * 创建推荐相关通知
   */
  private async createReferralNotification(
    referrerId: string,
    refereeId: string,
    amount: number,
    type: string
  ) {
    try {
      const referee = await this.prisma.user.findUnique({
        where: { id: refereeId },
        select: { username: true, address: true }
      });

      const refereeName = referee?.username || 
        (referee?.address ? `${referee.address.slice(0, 6)}...${referee.address.slice(-4)}` : 'Someone');

      let title = '';
      let content = '';

      switch (type) {
        case 'SIGNUP_BONUS':
          title = 'New Referral!';
          content = `${refereeName} joined using your referral link. You earned ${amount} PTS!`;
          break;
        case 'FIRST_BET_BONUS':
          title = 'Referral Bonus!';
          content = `${refereeName} made their first bet. You earned ${amount} PTS!`;
          break;
        case 'ACTIVITY_BONUS':
          title = 'Activity Reward!';
          content = `You earned ${amount} PTS from ${refereeName}'s activity.`;
          break;
      }

      await this.prisma.notification.create({
        data: {
          userId: referrerId,
          type: 'REFERRAL',
          title,
          content,
          data: JSON.stringify({ refereeId, amount, rewardType: type }),
        }
      });
    } catch (error) {
      this.logger.error(`Failed to create referral notification: ${error.message}`);
    }
  }

  /**
   * 检查并发放首次下注奖励
   */
  async checkAndGrantFirstBetBonus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referrerId: true }
    });

    if (!user?.referrerId) return;

    // 检查是否已经发放过首次下注奖励
    const existingReward = await this.prisma.referralReward.findFirst({
      where: {
        referrerId: user.referrerId,
        refereeId: userId,
        type: 'FIRST_BET_BONUS'
      }
    });

    if (existingReward) return;

    // 检查用户下注次数
    const betCount = await this.prisma.bet.count({
      where: { userId }
    });

    // 首次下注时发放奖励
    if (betCount === 1) {
      await this.grantReferralReward(
        user.referrerId,
        userId,
        'FIRST_BET_BONUS',
        'First bet bonus for referred user'
      );
    }
  }
}
