#!/bin/bash
# scripts/docker-deploy.sh - Docker Deployment Script

echo "🐳 Docker容器化部署脚本"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# Check for API key
if [ -z "$VITE_API_KEY" ]; then
  echo "⚠️  警告: VITE_API_KEY未设置"
  echo "   请设置环境变量: export VITE_API_KEY=your_key"
  read -p "是否继续？(y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 1. Build Docker image
echo "📦 构建Docker镜像..."
docker build \
  --build-arg VITE_API_KEY="${VITE_API_KEY}" \
  -t dongli-village-ai:latest \
  .

if [ $? -ne 0 ]; then
  echo "❌ Docker镜像构建失败"
  exit 1
fi

# 2. Stop and remove existing container if it exists
if docker ps -a | grep -q dongli-village-ai; then
  echo "🔄 停止并移除已存在的容器..."
  docker stop dongli-village-ai 2>/dev/null
  docker rm dongli-village-ai 2>/dev/null
fi

# 3. Run container
echo "🚀 启动容器..."
docker run -d \
  --name dongli-village-ai \
  -p 8080:80 \
  --restart unless-stopped \
  dongli-village-ai:latest

if [ $? -eq 0 ]; then
  echo "✅ 部署完成！"
  echo "   访问地址: http://localhost:8080"
  echo ""
  echo "常用命令："
  echo "   查看日志: docker logs -f dongli-village-ai"
  echo "   停止容器: docker stop dongli-village-ai"
  echo "   启动容器: docker start dongli-village-ai"
else
  echo "❌ 容器启动失败"
  exit 1
fi
