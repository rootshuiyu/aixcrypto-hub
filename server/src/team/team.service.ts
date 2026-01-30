import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 每 5 分钟同步所有团队的积分（校准机制）
   * 确保团队总积分与成员实际积分总和一致
   */
  @Cron('0 */5 * * * *')
  async syncAllTeamPoints() {
    try {
      const teams = await this.prisma.team.findMany({
        select: { id: true, name: true, totalPts: true }
      });

      let syncedCount = 0;
      let correctedCount = 0;

      for (const team of teams) {
        const members = await this.prisma.user.findMany({
          where: { teamId: team.id },
          select: { pts: true }
        });

        const actualTotal = members.reduce((sum, m) => sum + m.pts, 0);
        const storedTotal = team.totalPts;

        // 如果差异超过 0.01，则进行校正
        if (Math.abs(actualTotal - storedTotal) > 0.01) {
          await this.prisma.team.update({
            where: { id: team.id },
            data: { totalPts: actualTotal }
          });
          correctedCount++;
          this.logger.warn(
            `[TEAM_SYNC] Corrected ${team.name}: ${storedTotal.toFixed(2)} → ${actualTotal.toFixed(2)} (diff: ${(actualTotal - storedTotal).toFixed(2)})`
          );
        }
        syncedCount++;
      }

      if (correctedCount > 0) {
        this.logger.log(`[TEAM_SYNC] Synced ${syncedCount} teams, corrected ${correctedCount} discrepancies`);
      }
    } catch (error) {
      this.logger.error(`[TEAM_SYNC] Failed to sync team points: ${error.message}`);
    }
  }

  /**
   * 手动触发团队积分同步（管理员用）
   */
  async manualSyncAllTeamPoints(): Promise<{ success: boolean; teamsChecked: number; corrected: number }> {
    const teams = await this.prisma.team.findMany({
      select: { id: true, name: true, totalPts: true }
    });

    let corrected = 0;

    for (const team of teams) {
      const members = await this.prisma.user.findMany({
        where: { teamId: team.id },
        select: { pts: true }
      });

      const actualTotal = members.reduce((sum, m) => sum + m.pts, 0);

      if (Math.abs(actualTotal - team.totalPts) > 0.01) {
        await this.prisma.team.update({
          where: { id: team.id },
          data: { totalPts: actualTotal }
        });
        corrected++;
      }
    }

    return { success: true, teamsChecked: teams.length, corrected };
  }

  /**
   * 获取用户所属团队及成员
   */
  async getMyTeam(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: {
              select: {
                id: true,
                username: true,
                address: true,
                pts: true,
              },
              orderBy: { pts: 'desc' }
            }
          }
        }
      }
    });

    if (!user?.teamId) {
      return null;
    }

    const team = user.team;
    return {
      ...team,
      isLeader: team.leaderId === userId,
      memberCount: team.members.length,
    };
  }

  /**
   * 创建团队
   */
  async createTeam(userId: string, name: string, description: string, isPublic: boolean = true) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.teamId) throw new BadRequestException('You are already in a team. Leave your current team first.');

    const existingTeam = await this.prisma.team.findUnique({ where: { name } });
    if (existingTeam) throw new BadRequestException('Team name already exists');

    // 生成唯一邀请码
    const inviteCode = this.generateInviteCode();

    const team = await this.prisma.team.create({
      data: {
        name,
        description,
        leaderId: userId,
        inviteCode,
        isPublic,
        members: {
          connect: { id: userId }
        }
      }
    });

    this.logger.log(`Team created: ${team.name} by user ${userId}`);

    return {
      ...team,
      isLeader: true,
      memberCount: 1,
    };
  }

  /**
   * 通过邀请码加入团队
   */
  async joinTeamByInviteCode(userId: string, inviteCode: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.teamId) throw new BadRequestException('You are already in a team. Leave your current team first.');

    const team = await this.prisma.team.findUnique({
      where: { inviteCode },
      include: { members: true }
    });

    if (!team) throw new NotFoundException('Invalid invite code');

    // 检查团队人数限制
    if (team.members.length >= team.maxMembers) {
      throw new BadRequestException(`Team is full (max ${team.maxMembers} members)`);
    }

    // 加入团队
    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id }
    });

    // 🔧 优化：改用增量更新，避免全量 reduce 计算导致的性能抖动
    await this.prisma.team.update({
      where: { id: team.id },
      data: { 
        totalPts: { increment: user.pts } 
      }
    });

    this.logger.log(`User ${userId} joined team ${team.name} via invite code`);

    // 通知团队成员
    this.eventsGateway.broadcastSystemMessage('TEAM_UPDATE', `${user.username} has joined the team!`);

    return { success: true, teamId: team.id, teamName: team.name };
  }

  /**
   * 直接加入公开团队（通过团队ID）
   */
  async joinPublicTeam(userId: string, teamId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.teamId) throw new BadRequestException('You are already in a team. Leave your current team first.');

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });

    if (!team) throw new NotFoundException('Team not found');
    if (!team.isPublic) throw new BadRequestException('This team is private. Use an invite code to join.');

    // 检查团队人数限制
    if (team.members.length >= team.maxMembers) {
      throw new BadRequestException(`Team is full (max ${team.maxMembers} members)`);
    }

    // 加入团队
    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id }
    });

    // 🔧 优化：改用增量更新
    await this.prisma.team.update({
      where: { id: teamId },
      data: { 
        totalPts: { increment: user.pts } 
      }
    });

    this.logger.log(`User ${userId} joined public team ${team.name}`);

    return { success: true, teamId: team.id, teamName: team.name };
  }

  /**
   * 离开团队
   */
  async leaveTeam(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { team: { include: { members: true } } }
    });

    if (!user) throw new NotFoundException('User not found');
    if (!user.teamId) throw new BadRequestException('You are not in any team');

    const team = user.team;
    const isLeader = team.leaderId === userId;
    const memberCount = team.members.length;

    // 如果是队长且还有其他成员，需要先转让队长
    if (isLeader && memberCount > 1) {
      throw new BadRequestException('You are the team leader. Transfer leadership before leaving, or disband the team.');
    }

    // 如果是队长且只有自己，解散团队
    if (isLeader && memberCount === 1) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { teamId: null }
      });
      await this.prisma.team.delete({ where: { id: team.id } });
      
      this.logger.log(`Team ${team.name} disbanded by leader ${userId}`);
      return { success: true, message: 'Team disbanded successfully' };
    }

    // 普通成员离开
    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: null }
    });

    // 🔧 优化：改用增量更新 (减少)
    await this.prisma.team.update({
      where: { id: team.id },
      data: { 
        totalPts: { decrement: user.pts } 
      }
    });

    this.logger.log(`User ${userId} left team ${team.name}`);

    return { success: true, message: 'Left team successfully' };
  }

  /**
   * 转让队长
   */
  async transferLeadership(currentLeaderId: string, newLeaderId: string) {
    const currentLeader = await this.prisma.user.findUnique({
      where: { id: currentLeaderId },
      include: { team: true }
    });

    if (!currentLeader?.team) throw new NotFoundException('You are not in any team');
    if (currentLeader.team.leaderId !== currentLeaderId) {
      throw new BadRequestException('You are not the team leader');
    }

    const newLeader = await this.prisma.user.findUnique({ where: { id: newLeaderId } });
    if (!newLeader || newLeader.teamId !== currentLeader.teamId) {
      throw new BadRequestException('New leader must be a team member');
    }

    await this.prisma.team.update({
      where: { id: currentLeader.teamId },
      data: { leaderId: newLeaderId }
    });

    this.logger.log(`Leadership transferred from ${currentLeaderId} to ${newLeaderId} in team ${currentLeader.team.name}`);

    return { success: true, newLeaderId };
  }

  /**
   * 踢出成员（仅队长可用）
   */
  async kickMember(leaderId: string, memberId: string) {
    const leader = await this.prisma.user.findUnique({
      where: { id: leaderId },
      include: { team: true }
    });

    if (!leader?.team) throw new NotFoundException('You are not in any team');
    if (leader.team.leaderId !== leaderId) throw new BadRequestException('You are not the team leader');
    if (leaderId === memberId) throw new BadRequestException('You cannot kick yourself');

    const member = await this.prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.teamId !== leader.teamId) {
      throw new BadRequestException('User is not a team member');
    }

    await this.prisma.user.update({
      where: { id: memberId },
      data: { teamId: null }
    });

    // 🔧 优化：改用增量更新 (减少)
    await this.prisma.team.update({
      where: { id: leader.teamId },
      data: { 
        totalPts: { decrement: member.pts } 
      }
    });

    this.logger.log(`User ${memberId} was kicked from team ${leader.team.name} by leader ${leaderId}`);

    return { success: true, message: 'Member kicked successfully' };
  }

  /**
   * 刷新邀请码（仅队长可用）
   */
  async refreshInviteCode(leaderId: string) {
    const leader = await this.prisma.user.findUnique({
      where: { id: leaderId },
      include: { team: true }
    });

    if (!leader?.team) throw new NotFoundException('You are not in any team');
    if (leader.team.leaderId !== leaderId) throw new BadRequestException('You are not the team leader');

    const newInviteCode = this.generateInviteCode();

    const updatedTeam = await this.prisma.team.update({
      where: { id: leader.teamId },
      data: { inviteCode: newInviteCode }
    });

    this.logger.log(`Invite code refreshed for team ${leader.team.name}`);

    return { success: true, inviteCode: newInviteCode };
  }

  /**
   * 搜索公开团队
   */
  async searchPublicTeams(query: string, limit: number = 10) {
    return this.prisma.team.findMany({
      where: {
        isPublic: true,
        name: { contains: query, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        description: true,
        totalPts: true,
        maxMembers: true,
        _count: { select: { members: true } }
      },
      orderBy: { totalPts: 'desc' },
      take: limit
    });
  }

  /**
   * 获取团队排行榜
   */
  async getTeamLeaderboard() {
    const teams = await this.prisma.team.findMany({
      orderBy: { totalPts: 'desc' },
      take: 20,
      include: {
        _count: { select: { members: true } }
      }
    });

    return teams.map((team, index) => ({
      rank: index + 1,
      id: team.id,
      name: team.name,
      totalPts: team.totalPts,
      memberCount: team._count.members,
    }));
  }

  /**
   * 内部辅助：更新团队总分
   */
  async updateTeamTotalPts(teamId: string) {
    const members = await this.prisma.user.findMany({
      where: { teamId }
    });
    const total = members.reduce((sum, m) => sum + m.pts, 0);

    await this.prisma.team.update({
      where: { id: teamId },
      data: { totalPts: total }
    });
  }

  /**
   * 生成邀请码
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的字符
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
