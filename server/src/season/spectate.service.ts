import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class SpectateService {
  private readonly logger = new Logger(SpectateService.name);
  private activeSpectators: Map<string, Set<string>> = new Map(); // battleId -> userId[]

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 获取实时对战列表（仅限公开的活跃对战）
   */
  async getLiveBattles() {
    return this.prisma.battle.findMany({
      where: {
        isPublic: true,
        // 假设没有 status 字段，我们根据 timestamp 判断最近 10 分钟内的对战
        timestamp: { gte: new Date(Date.now() - 10 * 60 * 1000) }
      },
      include: {
        user: { select: { username: true, address: true } },
        agent: true
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  /**
   * 获取精彩对战回放
   */
  async getRecentHighlights(limit: number = 20) {
    return this.prisma.battle.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { username: true, address: true } },
        agent: true
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * 获取对战详情回放
   */
  async getBattleReplay(id: string) {
    const battle = await this.prisma.battle.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, address: true } },
        agent: true
      }
    });

    if (!battle) throw new NotFoundException('Battle not found');
    return battle;
  }

  /**
   * 加入观战
   */
  async joinSpectate(battleId: string, userId: string) {
    const battle = await this.prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle) throw new NotFoundException('Battle not found');

    if (!this.activeSpectators.has(battleId)) {
      this.activeSpectators.set(battleId, new Set());
    }
    this.activeSpectators.get(battleId).add(userId);

    const spectatorCount = this.activeSpectators.get(battleId).size;
    this.logger.log(`User ${userId} started spectating battle ${battleId}. Total: ${spectatorCount}`);

    // 通知对战参与者有人在观战
    this.eventsGateway.server.to(battleId).emit('spectatorJoined', { userId, count: spectatorCount });

    return { success: true, spectatorCount };
  }

  /**
   * 离开观战
   */
  leaveSpectate(battleId: string, userId: string) {
    if (this.activeSpectators.has(battleId)) {
      this.activeSpectators.get(battleId).delete(userId);
      const spectatorCount = this.activeSpectators.get(battleId).size;
      
      this.eventsGateway.server.to(battleId).emit('spectatorLeft', { userId, count: spectatorCount });
      
      if (spectatorCount === 0) {
        this.activeSpectators.delete(battleId);
      }
    }
  }

  /**
   * 切换对战公开状态
   */
  async toggleBattleVisibility(battleId: string, userId: string, isPublic: boolean) {
    const battle = await this.prisma.battle.findUnique({ where: { id: battleId } });
    
    if (!battle || battle.userId !== userId) {
      throw new BadRequestException('Not authorized or battle not found');
    }

    const updated = await this.prisma.battle.update({
      where: { id: battleId },
      data: { isPublic }
    });

    return { success: true, isPublic: updated.isPublic };
  }
}










