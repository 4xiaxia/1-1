#!/bin/bash
# scripts/dev.sh - Local Development Quick Start Script

echo "🚀 东里村小萌村官 - 本地开发环境启动脚本"
echo "=========================================="

# 1. Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js版本过低，需要18+，当前版本: $(node -v)"
  exit 1
fi
echo "✅ Node.js版本检查通过: $(node -v)"

# 2. Check for environment variables file
if [ ! -f .env.local ]; then
  echo "⚠️  未找到.env.local，从模板复制..."
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo "✅ 已创建.env.local，请编辑并填入您的API密钥"
  else
    echo "⚠️  .env.example不存在，创建空的.env.local"
    touch .env.local
  fi
  echo ""
  echo "📝 获取API密钥："
  echo "   1. Gemini API: https://aistudio.google.com/apikey"
  echo "   2. 胜算云API: https://router.shengsuanyun.com"
  echo ""
  read -p "按Enter键继续（确保已配置API密钥）..."
fi

# 3. Install dependencies
if [ ! -d node_modules ]; then
  echo "📦 安装依赖..."
  npm install
else
  echo "✅ 依赖已安装"
fi

# 4. Start development server
echo ""
echo "🎉 启动开发服务器..."
echo "   访问地址: http://localhost:5173"
echo "   按 Ctrl+C 停止服务器"
echo ""
npm run dev
