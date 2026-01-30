# ============================================
# AixL Backend Dockerfile (Production)
# 使用字节码编译保护源码
# ============================================

# 阶段1: 构建
FROM node:18-alpine AS builder

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# 安装 bytenode 并编译为字节码
RUN npm install -g bytenode
COPY scripts/compile.js ./scripts/
RUN node scripts/compile.js

# 生成 Prisma Client
RUN npx prisma generate

# 阶段2: 生产镜像
FROM node:18-alpine AS production

WORKDIR /app

# 安装运行时依赖
RUN npm install -g bytenode

# 只复制必要文件
COPY --from=builder /app/compiled ./compiled
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# 环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

EXPOSE 3001

# 启动命令
CMD ["node", "compiled/main.js"]
