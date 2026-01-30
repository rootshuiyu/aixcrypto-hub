import { PrismaClient } from '@prisma/client';

// 强制设置环境变量，确保 ts-node 运行时能找到数据库
process.env.DATABASE_URL = 'postgresql://postgres:123456@localhost:5432/aixl_db?schema=public';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Superoctop Seeding Start ---');

  try {
    // 1. 创建或更新 Mock 用户
    const user = await prisma.user.upsert({
      where: { id: 'mock-user-1' },
      update: { pts: 1000 },
      create: {
        id: 'mock-user-1',
        address: '0x1234567890abcdef',
        username: 'Genesis Player',
        pts: 1000,
      },
    });
    console.log(`User created: ${user.username}`);

    // 2. 创建初始市场 (C10 + GOLD)
    const market = await prisma.market.upsert({
      where: { id: 'c10-index-2026' },
      update: {},
      create: {
        id: 'c10-index-2026',
        title: 'C10 Index > 800 by end of week?',
        status: 'ACTIVE',
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        resolutionTime: new Date(Date.now() + 1000 * 60 * 60 * 25),
        poolSize: 5000,
        aiPrediction: 'Based on current C10 momentum, there is a 65% probability...',
      },
    });

    const goldMarket = await prisma.market.upsert({
      where: { id: 'gold-index-2026' },
      update: {},
      create: {
        id: 'gold-index-2026',
        title: 'Gold Spot Price > $2400 before Feb?',
        status: 'ACTIVE',
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        resolutionTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8),
        poolSize: 3500,
        aiPrediction: 'Gold shows strong resistance at 2350, look for a breakout...',
      },
    });
    console.log(`Markets initialized: C10 & GOLD`);

    // 3. 创建 AI 代理
    const agents = [
      { name: 'Rookie Bot', description: 'Simple pattern matching agent.', level: 'EASY', winRate: 45.2 },
      { name: 'AlphaTrend', description: 'Technical analysis expert.', level: 'MEDIUM', winRate: 58.5 },
      { name: 'DeepSeek Agent', description: 'Deep learning market forecaster.', level: 'HARD', winRate: 67.8 },
      { name: 'Master Whale', description: 'Simulates high-net-worth trading patterns.', level: 'MASTER', winRate: 74.1 },
    ];

    for (const agent of agents) {
      await prisma.agent.upsert({
        where: { id: agent.name.toLowerCase().replace(/\s/g, '-') },
        update: agent,
        create: {
          id: agent.name.toLowerCase().replace(/\s/g, '-'),
          ...agent,
        },
      });
    }
    console.log('AI Agents initialized.');

    // 4. 创建初始任务数据
    const tasks = [
      { id: 't1', title: 'First Prediction', description: 'Complete your first market prediction.', reward: 100, type: 'PREDICTION', goal: 1 },
      { id: 't2', title: 'Daily Warrior', description: 'Complete 5 predictions in a single day.', reward: 500, type: 'PREDICTION', goal: 5 },
      { id: 't3', title: 'AI Challenger', description: 'Battle against AI Agents 3 times.', reward: 300, type: 'BATTLE', goal: 3 },
    ];

    for (const task of tasks) {
      await prisma.task.upsert({
        where: { id: task.id },
        update: task,
        create: task,
      });
    }
    console.log('Quests initialized.');

    // 5. 创建初始回合数据 (Round)
    const now = new Date();
    const startTime = new Date(now.getTime() - 1000 * 60 * 5); // 5 分钟前开始
    const endTime = new Date(now.getTime() + 1000 * 60 * 5);   // 5 分钟后结束
    const lockTime = new Date(endTime.getTime() - 1000 * 10);  // 结束前 10 秒锁定

    const activeRound = await prisma.round.upsert({
      where: { category_roundNumber: { category: 'C10', roundNumber: 74869 } },
      update: {
        status: 'BETTING',
        startTime,
        endTime,
        lockTime,
      },
      create: {
        roundNumber: 74869,
        category: 'C10',
        status: 'BETTING',
        startTime,
        endTime,
        lockTime,
        openPrice: 36541.50,
        longPool: 1500,
        shortPool: 1200,
        longBetCount: 15,
        shortBetCount: 12,
      },
    });
    console.log(`Active Round created: #${activeRound.roundNumber}`);

    // 6. 创建初始指数历史数据 (MarketIndex)
    for (let i = 0; i < 50; i++) {
      await prisma.marketIndex.create({
        data: {
          type: 'C10',
          value: 36000 + Math.random() * 1000,
          timestamp: new Date(now.getTime() - i * 1000 * 60),
        }
      });
    }
    console.log('Market Index history initialized.');

    // 7. 创建初始团队数据
    await prisma.team.deleteMany({});
    const team = await prisma.team.create({
      data: {
        id: 'team-alpha',
        name: 'Superoctop Elite',
        description: 'The founding team of Superoctop Hub.',
        totalPts: 4600,
        rank: 12,
      },
    });

    // 将用户加入团队并创建更多 Mock 成员
    const teamMembers = [
      { id: 'mock-user-1', address: '0x123...', username: 'Genesis Player', pts: 1000, teamId: 'team-alpha' },
      { id: 'mock-user-2', address: '0x222...', username: 'Member 2', pts: 1200, teamId: 'team-alpha' },
      { id: 'mock-user-3', address: '0x333...', username: 'Member 3', pts: 800, teamId: 'team-alpha' },
      { id: 'mock-user-4', address: '0x444...', username: 'Member 4', pts: 1600, teamId: 'team-alpha' },
    ];

    for (const u of teamMembers) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u
      });
    }

    console.log('--- Seeding Complete! ---');
  } catch (err) {
    console.error('Seed error:', err);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
