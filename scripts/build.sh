#!/bin/bash
# scripts/build.sh - Production Build Script

echo "📦 东里村小萌村官 - 生产构建脚本"
echo "=========================================="

# 1. Clean old build
if [ -d dist ]; then
  echo "🧹 清理旧构建..."
  rm -rf dist
fi

# 2. Check environment variables
if [ -z "$VITE_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  警告: VITE_API_KEY或GEMINI_API_KEY未设置"
  echo "   生产环境建议配置环境变量"
  read -p "是否继续？(y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 3. Execute build
echo "🔨 执行构建..."
npm run build

# 4. Post-build check
if [ $? -eq 0 ]; then
  echo "✅ 构建成功！"
  echo ""
  echo "📊 构建产物分析："
  du -sh dist 2>/dev/null || echo "dist目录大小统计失败"
  echo ""
  echo "📂 输出目录: dist/"
  echo "   可部署到 Vercel、Netlify、Nginx 等平台"
else
  echo "❌ 构建失败，请检查错误信息"
  exit 1
fi
