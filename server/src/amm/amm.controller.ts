import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AMMService } from './amm.service';
import { PositionSide } from '@prisma/client';

// DTOs
class BuyDto {
  userId: string;
  roundId: string;
  side: 'YES' | 'NO';
  amount: number;
}

class SellDto {
  userId: string;
  roundId: string;
  side: 'YES' | 'NO';
  shares: number;
}

class QuoteDto {
  roundId: string;
  side: 'YES' | 'NO';
  amount?: number;
  shares?: number;
}

@ApiTags('AMM')
@Controller('amm')
export class AMMController {
  constructor(private readonly ammService: AMMService) {}

  @Get('pool/:roundId')
  @ApiOperation({ summary: '获取流动性池信息' })
  @ApiParam({ name: 'roundId', description: '回合ID' })
  async getPool(@Param('roundId') roundId: string) {
    const pool = await this.ammService.getPool(roundId);
    if (!pool) {
      throw new BadRequestException('Pool not found');
    }
    
    const prices = await this.ammService.getPrices(roundId);
    
    return {
      success: true,
      pool: {
        ...pool,
        ...prices,
      }
    };
  }

  @Get('prices/:roundId')
  @ApiOperation({ summary: '获取当前价格' })
  @ApiParam({ name: 'roundId', description: '回合ID' })
  async getPrices(@Param('roundId') roundId: string) {
    const prices = await this.ammService.getPrices(roundId);
    return { success: true, ...prices };
  }

  @Post('quote/buy')
  @ApiOperation({ summary: '获取买入报价' })
  @ApiBody({ type: QuoteDto })
  async quoteBuy(@Body() dto: QuoteDto) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    
    const side = dto.side === 'YES' ? PositionSide.YES : PositionSide.NO;
    const quote = await this.ammService.quoteBuy(dto.roundId, side, dto.amount);
    
    return { success: true, quote };
  }

  @Post('quote/sell')
  @ApiOperation({ summary: '获取卖出报价' })
  @ApiBody({ type: QuoteDto })
  async quoteSell(@Body() dto: QuoteDto) {
    if (!dto.shares || dto.shares <= 0) {
      throw new BadRequestException('Invalid shares');
    }
    
    const side = dto.side === 'YES' ? PositionSide.YES : PositionSide.NO;
    const quote = await this.ammService.quoteSell(dto.roundId, side, dto.shares);
    
    return { success: true, quote };
  }

  @Post('buy')
  @ApiOperation({ summary: '买入份额' })
  @ApiBody({ type: BuyDto })
  async buy(@Body() dto: BuyDto) {
    if (!dto.userId || !dto.roundId || !dto.side || !dto.amount) {
      throw new BadRequestException('Missing required fields');
    }
    
    const side = dto.side === 'YES' ? PositionSide.YES : PositionSide.NO;
    const result = await this.ammService.executeBuy(
      dto.roundId,
      dto.userId,
      side,
      dto.amount
    );
    
    return result;
  }

  @Post('sell')
  @ApiOperation({ summary: '卖出份额' })
  @ApiBody({ type: SellDto })
  async sell(@Body() dto: SellDto) {
    if (!dto.userId || !dto.roundId || !dto.side || !dto.shares) {
      throw new BadRequestException('Missing required fields');
    }
    
    const side = dto.side === 'YES' ? PositionSide.YES : PositionSide.NO;
    const result = await this.ammService.executeSell(
      dto.roundId,
      dto.userId,
      side,
      dto.shares
    );
    
    return result;
  }

  @Get('positions/:userId')
  @ApiOperation({ summary: '获取用户持仓' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'roundId', required: false, description: '回合ID（可选）' })
  async getPositions(
    @Param('userId') userId: string,
    @Query('roundId') roundId?: string
  ) {
    const positions = await this.ammService.getUserPositions(userId, roundId);
    return { success: true, positions };
  }

  @Get('trades/:roundId')
  @ApiOperation({ summary: '获取交易历史' })
  @ApiParam({ name: 'roundId', description: '回合ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回条数' })
  async getTrades(
    @Param('roundId') roundId: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const trades = await this.ammService.getTrades(roundId, limitNum);
    return { success: true, trades };
  }

  @Get('candles/:roundId')
  @ApiOperation({ summary: '获取K线数据' })
  @ApiParam({ name: 'roundId', description: '回合ID' })
  @ApiQuery({ name: 'interval', required: false, description: '时间间隔: 1s, 5s, 1m' })
  @ApiQuery({ name: 'limit', required: false, description: '返回条数' })
  async getCandles(
    @Param('roundId') roundId: string,
    @Query('interval') interval?: '1s' | '5s' | '1m',
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const candles = await this.ammService.getPriceCandles(
      roundId,
      interval || '5s',
      limitNum
    );
    return { success: true, candles };
  }

  @Get('config')
  @ApiOperation({ summary: '获取AMM配置' })
  async getConfig() {
    return { success: true, config: this.ammService.getConfig() };
  }
}
