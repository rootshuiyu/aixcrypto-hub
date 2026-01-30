import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TeamService } from './team.service';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('team')
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('my/:userId')
  @ApiOperation({ summary: '获取我的团队详情' })
  async getMyTeam(@Param('userId') userId: string) {
    return this.teamService.getMyTeam(userId);
  }

  @Post('create')
  @ApiOperation({ summary: '创建新团队' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      userId: { type: 'string' }, 
      name: { type: 'string' }, 
      description: { type: 'string' },
      isPublic: { type: 'boolean', default: true }
    } 
  }})
  async createTeam(@Body() body: { userId: string, name: string, description: string, isPublic?: boolean }) {
    return this.teamService.createTeam(body.userId, body.name, body.description, body.isPublic);
  }

  @Post('join/invite')
  @ApiOperation({ summary: '通过邀请码加入团队' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      userId: { type: 'string' }, 
      inviteCode: { type: 'string' }
    } 
  }})
  async joinByInviteCode(@Body() body: { userId: string, inviteCode: string }) {
    return this.teamService.joinTeamByInviteCode(body.userId, body.inviteCode);
  }

  @Post('join/public')
  @ApiOperation({ summary: '加入公开团队' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      userId: { type: 'string' }, 
      teamId: { type: 'string' }
    } 
  }})
  async joinPublicTeam(@Body() body: { userId: string, teamId: string }) {
    return this.teamService.joinPublicTeam(body.userId, body.teamId);
  }

  @Post('leave')
  @ApiOperation({ summary: '离开当前团队' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      userId: { type: 'string' }
    } 
  }})
  async leaveTeam(@Body() body: { userId: string }) {
    return this.teamService.leaveTeam(body.userId);
  }

  @Post('transfer-leadership')
  @ApiOperation({ summary: '转让队长权限' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      currentLeaderId: { type: 'string' }, 
      newLeaderId: { type: 'string' }
    } 
  }})
  async transferLeadership(@Body() body: { currentLeaderId: string, newLeaderId: string }) {
    return this.teamService.transferLeadership(body.currentLeaderId, body.newLeaderId);
  }

  @Post('kick')
  @ApiOperation({ summary: '踢出团队成员（仅队长）' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      leaderId: { type: 'string' }, 
      memberId: { type: 'string' }
    } 
  }})
  async kickMember(@Body() body: { leaderId: string, memberId: string }) {
    return this.teamService.kickMember(body.leaderId, body.memberId);
  }

  @Post('refresh-invite-code')
  @ApiOperation({ summary: '刷新邀请码（仅队长）' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      leaderId: { type: 'string' }
    } 
  }})
  async refreshInviteCode(@Body() body: { leaderId: string }) {
    return this.teamService.refreshInviteCode(body.leaderId);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索公开团队' })
  @ApiQuery({ name: 'q', description: '搜索关键词' })
  @ApiQuery({ name: 'limit', description: '返回数量限制', required: false })
  async searchTeams(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.teamService.searchPublicTeams(query, limit ? parseInt(limit) : 10);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: '获取团队排行榜' })
  async getTeamLeaderboard() {
    return this.teamService.getTeamLeaderboard();
  }
}
