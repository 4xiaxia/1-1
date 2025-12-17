<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 东里村小萌村官 - 智能导游系统

一个基于 Gemini Live API、Whisper 和 Runway TTS 的智能语音导游应用，支持实时对话、语音转录和文本转语音。

View your app in AI Studio: https://ai.studio/apps/drive/1t7LnRhZ38kBe2S2AJXPVJiEtqcQglDok

## ✨ 功能特性

- 🎤 **多模式语音交互**
  - Live API 模式：实时语音对话（最佳体验）
  - Whisper + TTS 模式：录音转文字 + 文本转语音（次优体验）
  - 通义千问模式：本地后端兜底方案
  - 纯文本模式：最后备选方案
  
- 🎯 **智能降级策略**：自动检测服务可用性，无缝切换到备用方案
- ⌨️ **键盘快捷键**：Space 启动对话，Escape 停止对话
- 📱 **响应式设计**：支持手机、平板、桌面多种设备
- ♿ **无障碍支持**：ARIA 标签和键盘导航

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn

### 本地开发

#### 方式一：使用一键启动脚本（推荐）

```bash
# 运行开发启动脚本
npm run dev:start
# 或者
bash scripts/dev.sh
```

脚本会自动：
- 检查 Node.js 版本
- 创建 `.env.local` 配置文件（如果不存在）
- 安装依赖
- 启动开发服务器

#### 方式二：手动启动

1. 克隆项目并安装依赖：
```bash
git clone <repository-url>
cd 1-1
npm install
```

2. 配置环境变量：
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，填入你的 API 密钥
```

环境变量说明：
- `VITE_API_KEY`: Gemini API 密钥（必需）- [获取地址](https://aistudio.google.com/apikey)
- `VITE_SHENGSUANYUN_API_KEY`: 胜算云 API 密钥（可选）- [获取地址](https://router.shengsuanyun.com)
- `VITE_QWEN_BACKEND_URL`: 通义千问后端地址（可选，默认 `http://localhost:3001`）

3. 启动开发服务器：
```bash
npm run dev
```

访问 http://localhost:5173

## 📦 部署

### 生产构建

```bash
# 使用构建脚本
npm run build:prod
# 或者
bash scripts/build.sh

# 标准构建命令
npm run build
```

构建产物位于 `dist/` 目录。

### Docker 部署

1. 构建并运行 Docker 容器：
```bash
# 设置环境变量
export VITE_API_KEY=your_gemini_api_key
export VITE_SHENGSUANYUN_API_KEY=your_shengsuanyun_api_key

# 运行部署脚本
npm run deploy:docker
# 或者
bash scripts/docker-deploy.sh
```

2. 访问 http://localhost:8080

常用 Docker 命令：
```bash
# 查看日志
docker logs -f dongli-village-ai

# 停止容器
docker stop dongli-village-ai

# 启动容器
docker start dongli-village-ai

# 删除容器
docker rm dongli-village-ai
```

### Vercel 部署

```bash
# 使用 Vercel 部署脚本
npm run deploy:vercel
# 或者
bash scripts/deploy-vercel.sh
```

部署后在 Vercel 控制台配置环境变量：
- `VITE_API_KEY`
- `VITE_SHENGSUANYUN_API_KEY` (可选)

### 其他平台部署

项目可部署到任何支持静态网站的平台：
- **Netlify**: 直接导入 GitHub 仓库，设置构建命令 `npm run build`
- **Cloudflare Pages**: 连接仓库，构建命令 `npm run build`，输出目录 `dist`
- **Nginx**: 将 `dist/` 目录部署到 Nginx，使用提供的 `nginx.conf`

## 🏥 系统健康检查

```bash
# 运行健康检查脚本
npm run health
# 或者
bash scripts/health-check.sh
```

检查项目：
- 前端服务状态
- Gemini API 连通性
- 胜算云 API 连通性
- 通义千问后端状态
- Node.js 和 npm 版本

## 🎮 使用说明

### 键盘快捷键

- **Space**: 空闲状态下启动语音对话
- **Escape**: 停止当前对话或关闭文本输入框

### 语音模式切换

应用会自动尝试以下顺序：
1. **Live API 模式** - 最佳体验，实时对话
2. **Whisper + TTS 模式** - 录音后转录，通过 TTS 播放回复
3. **通义千问模式** - 本地后端备选
4. **纯文本模式** - 最后兜底方案

可通过界面右上角的路线切换按钮在 G 路线（Gemini）和 Q 路线（Qwen）之间切换。

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **样式**: Tailwind CSS
- **语音服务**:
  - Gemini Live API (实时语音)
  - Whisper1 (语音转文字)
  - Runway TTS (文本转语音)
  - 通义千问 (备用方案)

## 📁 项目结构

```
.
├── App.tsx                 # 主应用组件
├── components/            # React 组件
│   ├── Toast.tsx          # 通知组件
│   ├── VoiceModeIndicator.tsx  # 语音模式指示器
│   ├── AgentAvatar.tsx    # 虚拟角色头像
│   └── ...
├── services/              # 服务层
│   ├── voiceService.ts    # 统一语音服务（智能降级）
│   ├── liveService.ts     # Gemini Live API
│   ├── transcriptionService.ts  # Whisper 转录
│   ├── ttsService.ts      # Runway TTS
│   └── qwenService.ts     # 通义千问服务
├── scripts/               # 部署脚本
│   ├── dev.sh            # 开发环境启动
│   ├── build.sh          # 生产构建
│   ├── docker-deploy.sh  # Docker 部署
│   ├── deploy-vercel.sh  # Vercel 部署
│   └── health-check.sh   # 健康检查
├── config.ts             # 配置文件
├── Dockerfile            # Docker 配置
├── nginx.conf           # Nginx 配置
└── .env.example         # 环境变量模板
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目仅供学习和研究使用。
