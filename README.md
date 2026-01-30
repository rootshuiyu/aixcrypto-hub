# AixCrypto Hub

一个基于 Next.js、NestJS 和智能合约的全栈 Web3 预测市场平台。

## 项目结构

- `src/` - Next.js 前端应用
- `server/` - NestJS 后端服务
- `admin-web/` - 管理后台前端
- `contracts/` - 智能合约（Hardhat）

## 快速开始

### 安装依赖

```bash
# 根目录
npm install

# 后端
cd server && npm install

# 管理后台
cd admin-web && npm install

# 智能合约
cd contracts && npm install
```

### 运行开发环境

```bash
# 同时启动前端、后端和管理后台
npm run dev:all

# 或分别启动
npm run dev              # 前端 (端口 3000)
cd server && npm run start:dev  # 后端 (端口 3001)
cd admin-web && npm run dev     # 管理后台 (端口 3002)
```

## 数据库设置

项目使用 PostgreSQL 数据库，通过 Prisma ORM 管理。

### 数据库迁移

```bash
cd server
npx prisma migrate dev
```

### 初始化数据（种子数据）

```bash
cd server
npx prisma db seed
```

数据库迁移文件和种子数据已包含在仓库中：
- `server/prisma/schema.prisma` - 数据库模型定义
- `server/prisma/migrations/` - 数据库迁移文件
- `server/prisma/seed.ts` - 初始数据种子文件

## 在另一台电脑上下载

```bash
git clone https://github.com/rootshuiyu/aixcrypto-hub.git
cd aixcrypto-hub
npm install
cd server && npm install
cd ../admin-web && npm install
cd ../contracts && npm install

# 设置数据库
cd server
# 创建 .env 文件并配置 DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
```

## 环境变量

请确保在 `server/` 目录下创建 `.env` 文件，配置数据库连接：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/aixl_db?schema=public"
```

## 许可证

ISC
