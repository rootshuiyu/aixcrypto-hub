#!/bin/bash
# ============================================
# AixL Platform - Deployment Script
# ============================================

set -e

echo "🚀 AixL Platform Deployment"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境变量
check_env() {
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ .env.production not found${NC}"
        echo "Please copy .env.production.example to .env.production and fill in the values"
        exit 1
    fi
    
    # 加载环境变量
    export $(grep -v '^#' .env.production | xargs)
    
    # 检查必需的变量
    required_vars=("DB_PASSWORD" "LICENSE_KEY" "JWT_SECRET" "ADMIN_TOKEN")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ Missing required variable: $var${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
}

# 构建镜像
build_images() {
    echo ""
    echo -e "${YELLOW}📦 Building Docker images...${NC}"
    
    docker-compose build --no-cache
    
    echo -e "${GREEN}✅ Images built successfully${NC}"
}

# 停止旧容器
stop_old() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
    
    docker-compose down --remove-orphans || true
    
    echo -e "${GREEN}✅ Old containers stopped${NC}"
}

# 数据库迁移
run_migrations() {
    echo ""
    echo -e "${YELLOW}📊 Running database migrations...${NC}"
    
    docker-compose run --rm backend npx prisma migrate deploy
    
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# 启动服务
start_services() {
    echo ""
    echo -e "${YELLOW}🎯 Starting services...${NC}"
    
    docker-compose up -d
    
    echo -e "${GREEN}✅ Services started${NC}"
}

# 健康检查
health_check() {
    echo ""
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    
    sleep 10
    
    # 检查后端健康
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:3001/health > /dev/null; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
            break
        fi
        attempt=$((attempt + 1))
        echo "Waiting for backend... ($attempt/$max_attempts)"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ Backend health check failed${NC}"
        docker-compose logs backend
        exit 1
    fi
}

# 显示状态
show_status() {
    echo ""
    echo "================================"
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "================================"
    echo ""
    docker-compose ps
    echo ""
    echo "Service URLs:"
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:3001"
    echo "  Admin:     http://localhost:3002"
    echo ""
    echo "Logs: docker-compose logs -f [service]"
}

# 主函数
main() {
    check_env
    stop_old
    build_images
    start_services
    run_migrations
    health_check
    show_status
}

# 处理参数
case "$1" in
    build)
        check_env
        build_images
        ;;
    start)
        check_env
        start_services
        ;;
    stop)
        stop_old
        ;;
    restart)
        stop_old
        start_services
        ;;
    logs)
        docker-compose logs -f ${2:-}
        ;;
    status)
        docker-compose ps
        ;;
    *)
        main
        ;;
esac
