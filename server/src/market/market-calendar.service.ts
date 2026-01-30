import { Injectable, Logger } from '@nestjs/common';

/**
 * 市场日历服务
 * 用于管理市场开放时间、节假日等
 */
@Injectable()
export class MarketCalendarService {
  private readonly logger = new Logger(MarketCalendarService.name);

  /**
   * 检查当前是否是交易时间
   */
  isMarketOpen(category: string = 'C10'): boolean {
    // 加密货币市场 24/7 开放
    if (category === 'C10') {
      return true;
    }

    // 黄金市场：周一至周五，全天（简化版本）
    if (category === 'GOLD') {
      const now = new Date();
      const day = now.getDay();
      // 0 = Sunday, 6 = Saturday
      return day >= 1 && day <= 5;
    }

    return true;
  }

  /**
   * 检查市场状态（别名方法，与 isMarketOpen 相同）
   */
  checkMarketOpen(category: string = 'C10'): { isOpen: boolean; message: string } {
    const isOpen = this.isMarketOpen(category);
    
    if (!isOpen) {
      if (category === 'GOLD') {
        return {
          isOpen: false,
          message: 'Gold market is closed on weekends'
        };
      }
    }

    return {
      isOpen: true,
      message: 'Market is open'
    };
  }

  /**
   * 获取下一个市场开放时间
   */
  getNextMarketOpen(category: string = 'C10'): Date {
    if (category === 'C10') {
      // 加密货币市场立即开放
      return new Date();
    }

    if (category === 'GOLD') {
      const now = new Date();
      const day = now.getDay();
      
      // 如果是周末，返回下周一
      if (day === 0) {
        // Sunday -> Monday
        const nextOpen = new Date(now);
        nextOpen.setDate(now.getDate() + 1);
        nextOpen.setHours(0, 0, 0, 0);
        return nextOpen;
      } else if (day === 6) {
        // Saturday -> Monday
        const nextOpen = new Date(now);
        nextOpen.setDate(now.getDate() + 2);
        nextOpen.setHours(0, 0, 0, 0);
        return nextOpen;
      }

      // 工作日立即开放
      return new Date();
    }

    return new Date();
  }

  /**
   * 检查指定日期是否是交易日
   */
  isTradingDay(date: Date, category: string = 'C10'): boolean {
    if (category === 'C10') {
      return true;
    }

    if (category === 'GOLD') {
      const day = date.getDay();
      return day >= 1 && day <= 5;
    }

    return true;
  }

  /**
   * 获取黄金市场状态详情
   */
  getGoldMarketStatus() {
    const now = new Date();
    const day = now.getDay();
    const isOpen = day >= 1 && day <= 5;
    
    // 计算下一个状态变更时间
    let nextChange: Date;
    let nextStatus: 'OPEN' | 'CLOSED';
    
    if (isOpen) {
      // 当前开放，计算到周六的时间
      nextChange = new Date(now);
      const daysUntilSaturday = 6 - day;
      nextChange.setDate(now.getDate() + daysUntilSaturday);
      nextChange.setHours(0, 0, 0, 0);
      nextStatus = 'CLOSED';
    } else {
      // 当前关闭，计算到周一的时间
      nextChange = new Date(now);
      const daysUntilMonday = day === 0 ? 1 : (8 - day);
      nextChange.setDate(now.getDate() + daysUntilMonday);
      nextChange.setHours(0, 0, 0, 0);
      nextStatus = 'OPEN';
    }
    
    const msUntilChange = nextChange.getTime() - now.getTime();
    
    return {
      market: 'GOLD',
      isOpen,
      status: isOpen ? 'OPEN' : 'CLOSED',
      currentTime: now.toISOString(),
      nextStatusChange: {
        status: nextStatus,
        time: nextChange.toISOString(),
        countdown: {
          hours: Math.floor(msUntilChange / (1000 * 60 * 60)),
          minutes: Math.floor((msUntilChange % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((msUntilChange % (1000 * 60)) / 1000),
        },
      },
      tradingHours: {
        description: 'Monday to Friday, 24 hours',
        timezone: 'UTC',
      },
      message: isOpen 
        ? 'Gold market is currently open for trading' 
        : 'Gold market is closed on weekends',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * 获取所有市场状态
   */
  getAllMarketsStatus() {
    const now = new Date();
    
    return {
      timestamp: now.toISOString(),
      markets: {
        C10: {
          isOpen: true,
          status: 'OPEN',
          message: 'Crypto market is always open (24/7)',
        },
        GOLD: this.getGoldMarketStatus(),
      },
    };
  }

  /**
   * 获取市场开/休市倒计时
   */
  getCountdown(market: 'GOLD' | 'C10') {
    if (market === 'C10') {
      return {
        market: 'C10',
        isOpen: true,
        message: 'Crypto market never closes',
        countdown: null,
      };
    }

    const status = this.getGoldMarketStatus();
    return {
      market: 'GOLD',
      isOpen: status.isOpen,
      message: status.message,
      countdown: status.nextStatusChange.countdown,
      nextChange: status.nextStatusChange,
    };
  }
}

