import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 每日 0 点重置「每日任务」进度，使签到、首测等每天可重新完成
   * 能连就不重写：复用现有 Task.isDaily / type 与 UserTask 表
   * 返回统计供管理后台「立即重置」展示；定时任务每日 0 点也会调用
   */
  @Cron('0 0 * * *')
  async resetDailyTasks(): Promise<{ count: number; taskCount: number }> {
    try {
      const dailyTasks = await this.prisma.task.findMany({
        where: {
          OR: [
            { isDaily: true },
            { type: { startsWith: 'DAILY_' } },
          ],
        },
        select: { id: true },
      });
      if (dailyTasks.length === 0) {
        this.logger.log('[QUEST] No daily tasks to reset.');
        return { count: 0, taskCount: 0 };
      }

      const taskIds = dailyTasks.map((t) => t.id);
      const result = await this.prisma.userTask.updateMany({
        where: { taskId: { in: taskIds } },
        data: {
          progress: 0,
          status: 'IN_PROGRESS',
          claimedAt: null,
        },
      });
      this.logger.log(`[QUEST] Daily tasks reset: ${result.count} UserTask(s) for ${taskIds.length} daily task(s).`);
      return { count: result.count, taskCount: taskIds.length };
    } catch (error) {
      this.logger.error(`[QUEST] resetDailyTasks failed: ${(error as Error)?.message}`);
      return { count: 0, taskCount: 0 };
    }
  }

  /**
   * 物理同步初始任务（仅在数据库为空时运行一次）
   * 🔧 优化：不再在代码里硬编码任务详情，只通过 ID 探测
   */
  async ensureInitialTasks() {
    const count = await this.prisma.task.count();
    if (count > 0) return;

    this.logger.log('🚀 Database empty, waiting for admin to initialize tasks via dashboard.');
    // 如果确实需要默认任务，建议通过 prisma/seed.ts 或管理后台导入，而不是在 Service 里硬编码
  }

  /**
   * 获取用户任务列表 (核心互通逻辑)
   */
  async getTasks(userId: string) {
    await this.ensureInitialTasks();

    // 从数据库实时查询所有可用任务（不再使用硬编码数组）
    const tasks = await this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { userId }
        }
      }
    });

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      reward: task.reward,
      goal: task.goal,
      type: task.type,
      isDaily: task.isDaily || task.type.startsWith('DAILY_'),
      progress: task.users[0]?.progress || 0,
      status: task.users[0]?.status || 'NOT_STARTED'
    }));
  }

  /**
   * 更新进度、领取奖励等逻辑保持原样...
   */
  async updateProgress(userId: string, actionType: string, increment: number = 1) {
    if (!userId || userId === 'guest') return;
    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          OR: [
            { type: actionType },
            { type: `DAILY_${actionType}` }
          ]
        }
      });

      for (const task of tasks) {
        let userTask = await this.prisma.userTask.findUnique({
          where: { userId_taskId: { userId, taskId: task.id } }
        });

        if (!userTask) {
          userTask = await this.prisma.userTask.create({
            data: { userId, taskId: task.id, progress: 0, status: 'IN_PROGRESS' }
          });
        }

        if (userTask.status === 'CLAIMED') continue;
        if (userTask.status === 'COMPLETED' && !task.type.startsWith('DAILY_')) continue;

        const newProgress = Math.min(userTask.progress + increment, task.goal);
        const newStatus = newProgress >= task.goal ? 'COMPLETED' : 'IN_PROGRESS';

        await this.prisma.userTask.update({
          where: { id: userTask.id },
          data: { progress: newProgress, status: newStatus }
        });
        
        this.eventsGateway.emitTaskUpdate(userId, {
          id: task.id,
          title: task.title,
          progress: newProgress,
          goal: task.goal,
          status: newStatus
        });
      }
    } catch (error) {
      this.logger.error(`Progress update failed: ${error.message}`);
    }
  }

  async claimReward(userId: string, taskId: string) {
    const userTask = await this.prisma.userTask.findUnique({
      where: { userId_taskId: { userId, taskId } }
    });

    if (!userTask || userTask.status !== 'COMPLETED') {
      throw new NotFoundException('Task not ready to claim');
    }

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    
    return this.prisma.$transaction(async (tx) => {
      await tx.userTask.update({
        where: { id: userTask.id },
        data: { status: 'CLAIMED', claimedAt: new Date() }
      });

      const user = await tx.user.findUnique({ where: { id: userId } });
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { pts: { increment: task.reward }, version: { increment: 1 } }
      });

      this.eventsGateway.emitBalanceUpdate(userId, updatedUser.pts);
      return { success: true, newBalance: updatedUser.pts };
    });
  }
}
