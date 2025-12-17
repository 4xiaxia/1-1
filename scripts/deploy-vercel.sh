#!/bin/bash
# scripts/deploy-vercel.sh - Vercel One-Click Deployment Script

echo "☁️  Vercel一键部署脚本"
echo "=========================================="

# 1. Check Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "📦 安装Vercel CLI..."
  npm install -g vercel
fi

# 2. Login to Vercel (if not logged in)
echo "🔐 检查Vercel登录状态..."
vercel whoami || vercel login

# 3. Check for API key
if [ -z "$VITE_API_KEY" ]; then
  echo "⚠️  警告: VITE_API_KEY未设置"
  echo "   部署后请在Vercel控制台配置环境变量"
fi

# 4. Deploy
echo "🚀 部署到Vercel..."
if [ -n "$VITE_API_KEY" ]; then
  vercel --prod \
    --yes \
    --env VITE_API_KEY="$VITE_API_KEY"
else
  vercel --prod --yes
fi

if [ $? -eq 0 ]; then
  echo "✅ 部署完成！"
  echo ""
  echo "📝 后续步骤："
  echo "   1. 在Vercel控制台添加环境变量 VITE_API_KEY"
  echo "   2. 重新部署以使环境变量生效"
else
  echo "❌ 部署失败"
  exit 1
fi
