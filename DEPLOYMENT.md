# AixL Platform 部署文档

## 目录

1. [系统要求](#系统要求)
2. [部署架构](#部署架构)
3. [快速部署](#快速部署)
4. [详细配置](#详细配置)
5. [授权系统](#授权系统)
6. [SSL 配置](#ssl-配置)
7. [监控与维护](#监控与维护)
8. [故障排除](#故障排除)

---

## 系统要求

### 硬件要求
- CPU: 4 核心以上
- 内存: 8GB 以上
- 硬盘: 50GB SSD 以上

### 软件要求
- Docker 24.0+
- Docker Compose 2.0+
- Nginx（可选，用于 SSL）

---

## 部署架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (SSL/443)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Frontend   │ │   Backend   │ │  Admin Web  │
    │  (Next.js)  │ │  (NestJS)   │ │  (Next.js)  │
    │    :3000    │ │    :3001    │ │    :3002    │
    └─────────────┘ └──────┬──────┘ └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌──────▼──────┐
       │  PostgreSQL │ │ Redis │ │   License   │
       │    :5432    │ │ :6379 │ │   Server    │
       └─────────────┘ └───────┘ └─────────────┘
```

---

## 快速部署

### 1. 准备环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑配置
nano .env.production
```

### 2. 运行部署脚本

```bash
# 添加执行权限
chmod +x scripts/deploy.sh

# 完整部署
./scripts/deploy.sh

# 或分步执行
./scripts/deploy.sh build    # 仅构建
./scripts/deploy.sh start    # 仅启动
./scripts/deploy.sh stop     # 停止
./scripts/deploy.sh restart  # 重启
./scripts/deploy.sh logs     # 查看日志
./scripts/deploy.sh status   # 查看状态
```

### 3. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 检查后端健康
curl http://localhost:3001/health

# 查看日志
docker-compose logs -f backend
```

---

## 详细配置

### 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `DB_PASSWORD` | 数据库密码 | `StrongP@ssw0rd` |
| `LICENSE_KEY` | 授权密钥 | `AIXL-XXXX-XXXX-XXXX` |
| `LICENSE_SERVER` | 授权服务器地址 | `https://license.yourserver.com` |
| `JWT_SECRET` | JWT 签名密钥 | `32位以上随机字符串` |
| `ADMIN_TOKEN` | 管理 API Token | `随机字符串` |
| `PRIVY_APP_ID` | Privy 应用 ID | `从 Privy 控制台获取` |

### 数据库配置

数据库迁移在部署时自动执行。手动迁移：

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行迁移
npx prisma migrate deploy

# 初始化数据（可选）
npx prisma db seed
```

---

## 授权系统

### 授权验证流程

1. 后端启动时连接授权服务器验证 License
2. 验证通过后缓存授权信息
3. 每 6 小时自动心跳检测
4. 网络故障时有 72 小时宽限期

### 授权状态

- `VALID`: 授权有效
- `EXPIRED`: 授权过期
- `REVOKED`: 授权被吊销
- `HARDWARE_MISMATCH`: 硬件指纹不匹配
- `INVALID_KEY`: 无效的授权密钥

### 授权失败处理

```bash
# .env.production 中配置
LICENSE_FORCE_STOP=false  # 失败时降级运行
LICENSE_FORCE_STOP=true   # 失败时停止服务
```

---

## SSL 配置

### 使用 Let's Encrypt

```bash
# 安装 certbot
apt-get update
apt-get install certbot

# 获取证书
certbot certonly --webroot -w /var/www/certbot -d yourdomain.com -d admin.yourdomain.com

# 证书位置
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 复制证书到项目

```bash
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

### 自动续期

```bash
# 添加 crontab
0 0 1 * * certbot renew --quiet && docker-compose restart nginx
```

---

## 监控与维护

### 查看日志

```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 重启服务

```bash
# 重启所有
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 备份数据库

```bash
# 创建备份
docker-compose exec postgres pg_dump -U aixl aixl > backup_$(date +%Y%m%d).sql

# 恢复备份
docker-compose exec -T postgres psql -U aixl aixl < backup_20260130.sql
```

### 更新部署

```bash
# 拉取最新代码（如果需要）
# git pull origin main

# 重新构建并部署
./scripts/deploy.sh
```

---

## 故障排除

### 常见问题

#### 1. 后端无法连接数据库

```bash
# 检查数据库容器
docker-compose logs postgres

# 检查连接
docker-compose exec backend npx prisma db push --accept-data-loss
```

#### 2. License 验证失败

```bash
# 检查 License Key 是否正确
echo $LICENSE_KEY

# 检查授权服务器连接
curl -X POST https://license.yourserver.com/api/verify \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"AIXL-XXXX-XXXX-XXXX","fingerprint":"test"}'
```

#### 3. 前端无法连接后端

```bash
# 检查 API URL 配置
docker-compose exec frontend env | grep NEXT_PUBLIC

# 检查网络
docker-compose exec frontend wget -q -O- http://backend:3001/health
```

#### 4. WebSocket 连接失败

```bash
# 检查 Nginx WebSocket 配置
nginx -t

# 检查后端 WebSocket
docker-compose logs backend | grep -i socket
```

---

## 联系支持

如需技术支持，请联系供应商。

提供信息：
- 错误日志截图
- 环境配置（隐藏敏感信息）
- 部署步骤描述
