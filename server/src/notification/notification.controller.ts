import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { AdminTokenGuard } from '../auth/guards/admin-token.guard';

@ApiTags('notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ============================================
  // 用户端 API
  // ============================================

  @Get(':userId')
  @ApiOperation({ summary: '获取用户通知列表' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认 20' })
  async getNotifications(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.notificationService.getNotifications(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get('unread-count/:userId')
  @ApiOperation({ summary: '获取未读通知数量' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  async getUnreadCount(@Param('userId') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记单条通知为已读' })
  @ApiParam({ name: 'id', description: '通知 ID' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Put('read-all/:userId')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  @ApiParam({ name: 'id', description: '通知 ID' })
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }

  // ============================================
  // 管理员 API
  // ============================================

  @Get('admin/all')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 获取所有通知' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllNotifications(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.notificationService.getAllNotifications(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Post('admin/send')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 发送通知给单个用户' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: {
      userId: { type: 'string' },
      type: { type: 'string' },
      title: { type: 'string' },
      message: { type: 'string' },
      metadata: { type: 'object' }
    }
  }})
  async sendNotification(
    @Body() body: { userId: string; type: string; title: string; message: string; metadata?: any }
  ) {
    return this.notificationService.createNotification(
      body.userId,
      body.type,
      body.title,
      body.message,
      body.metadata
    );
  }

  @Post('admin/send-bulk')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 批量发送通知' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: {
      userIds: { type: 'array', items: { type: 'string' } },
      type: { type: 'string' },
      title: { type: 'string' },
      message: { type: 'string' }
    }
  }})
  async sendBulkNotification(
    @Body() body: { userIds: string[]; type: string; title: string; message: string }
  ) {
    const results = await Promise.all(
      body.userIds.map(userId => 
        this.notificationService.createNotification(userId, body.type, body.title, body.message)
      )
    );
    return { success: true, sent: results.length };
  }

  @Post('admin/send-global')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 发送全局通知给所有用户' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: {
      type: { type: 'string' },
      title: { type: 'string' },
      message: { type: 'string' }
    }
  }})
  async sendGlobalNotification(
    @Body() body: { type: string; title: string; message: string }
  ) {
    return this.notificationService.sendGlobalNotification(body.type, body.title, body.message);
  }

  @Delete('admin/:id')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 删除通知' })
  @ApiParam({ name: 'id', description: '通知 ID' })
  async adminDeleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }
}
