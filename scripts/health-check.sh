#!/bin/bash
# scripts/health-check.sh - System Health Check Script

echo "🏥 系统健康检查"
echo "=========================================="

# 1. Check frontend service
echo "1️⃣ 检查前端服务..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   ✅ 前端服务正常 (HTTP 200)"
elif [ "$FRONTEND_STATUS" = "000" ]; then
  echo "   ⚠️  前端服务未运行 (无法连接)"
else
  echo "   ❌ 前端服务异常 (HTTP $FRONTEND_STATUS)"
fi

# 2. Check Gemini API (if API key is set)
# Note: VITE_API_KEY is preferred for Vite builds, GEMINI_API_KEY is legacy support
echo "2️⃣ 检查Gemini API..."
if [ -n "$VITE_API_KEY" ] || [ -n "$GEMINI_API_KEY" ]; then
  API_KEY="${VITE_API_KEY:-$GEMINI_API_KEY}"
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: $API_KEY" \
    "https://generativelanguage.googleapis.com/v1/models?key=$API_KEY" 2>/dev/null || echo "000")
  
  if [ "$API_STATUS" = "200" ]; then
    echo "   ✅ Gemini API正常 (HTTP 200)"
  elif [ "$API_STATUS" = "000" ]; then
    echo "   ⚠️  无法连接Gemini API"
  else
    echo "   ❌ Gemini API异常 (HTTP $API_STATUS)"
  fi
else
  echo "   ⚠️  API Key未设置，跳过检查"
fi

# 3. Check Shengsuanyun API (if configured)
echo "3️⃣ 检查胜算云API..."
if [ -n "$VITE_SHENGSUANYUN_API_KEY" ]; then
  SHENGSUANYUN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $VITE_SHENGSUANYUN_API_KEY" \
    https://router.shengsuanyun.com/api/v1/models 2>/dev/null || echo "000")
  
  if [ "$SHENGSUANYUN_STATUS" = "200" ]; then
    echo "   ✅ 胜算云API正常 (HTTP 200)"
  elif [ "$SHENGSUANYUN_STATUS" = "000" ]; then
    echo "   ⚠️  无法连接胜算云API"
  else
    echo "   ❌ 胜算云API异常 (HTTP $SHENGSUANYUN_STATUS)"
  fi
else
  echo "   ⚠️  胜算云API Key未设置，跳过检查"
fi

# 4. Check Qwen backend (optional)
echo "4️⃣ 检查通义千问后端..."
QWEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
if [ "$QWEN_STATUS" = "200" ]; then
  echo "   ✅ 通义千问后端正常 (HTTP 200)"
elif [ "$QWEN_STATUS" = "000" ]; then
  echo "   ℹ️  通义千问后端未运行（可选服务）"
else
  echo "   ⚠️  通义千问后端异常 (HTTP $QWEN_STATUS)"
fi

# 5. Check Node.js and npm versions
echo "5️⃣ 检查运行环境..."
if command -v node &> /dev/null; then
  echo "   ✅ Node.js: $(node -v)"
else
  echo "   ❌ Node.js未安装"
fi

if command -v npm &> /dev/null; then
  echo "   ✅ npm: $(npm -v)"
else
  echo "   ❌ npm未安装"
fi

echo ""
echo "=========================================="
echo "健康检查完成"
