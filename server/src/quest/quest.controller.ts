import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { QuestService } from './quest.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('quest')
@Controller('quest')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Get('tasks/:userId')
  @ApiOperation({ summary: '获取用户所有任务及进度' })
  getTasks(@Param('userId') userId: string) {
    return this.questService.getTasks(userId);
  }

  @Post('claim')
  @ApiOperation({ summary: '领取任务奖励' })
  claimReward(@Body() body: { userId: string, taskId: string }) {
    return this.questService.claimReward(body.userId, body.taskId);
  }
}


