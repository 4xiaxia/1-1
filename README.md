<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 东里村小萌村官 - AI智能导游

基于 Gemini Live API 的实时语音交互智能导游系统，专为中国大陆用户优化。

## ✨ 特性

- 🎙️ **实时语音交互**：基于 Gemini 2.5 Flash Live API，支持实时音频对话
- 🇨🇳 **国内优化**：使用胜算云 API 代理，CDN 资源国内化，确保流畅访问
- 🔄 **备用路由**：集成阿里云通义千问作为备用方案
- 🎨 **精美界面**：现代化 UI 设计，支持移动端和桌面端
- 🔐 **安全配置**：环境变量管理，防止密钥泄漏

## 📋 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **胜算云 API 密钥**（必需）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/4xiaxia/1-1.git
cd 1-1
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的 API 密钥：

```env
# 胜算云 API 密钥（必填）
VITE_API_KEY=your_shengsuanyun_api_key_here

# 胜算云 API 地址（可选，使用默认值）
VITE_API_BASE_URL=https://router.shengsuanyun.com/api

# 通义千问备用后端（可选）
VITE_QWEN_BACKEND_URL=http://localhost:3001/api/qwen-mini
```

#### 🔑 获取胜算云 API 密钥

1. 访问 [胜算云官网](https://router.shengsuanyun.com/)
2. 注册并登录账号
3. 在控制台创建 API 密钥
4. 复制密钥并粘贴到 `.env.local` 文件中

### 4. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动（Vite 默认端口）。

### 5. （可选）启动通义千问备用后端

如需使用阿里云通义千问备用路由：

```bash
# 设置通义千问 API 密钥
export DASHSCOPE_API_KEY=your_dashscope_api_key

# 启动后端服务
node qwen-mini-server.js
```

## 🏗️ 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 🚢 部署指南

### Vercel 部署

1. 在 Vercel 导入项目
2. 在项目设置中添加环境变量：
   - `VITE_API_KEY`：胜算云 API 密钥
   - `VITE_API_BASE_URL`：`https://router.shengsuanyun.com/api`
3. 构建命令：`npm run build`
4. 输出目录：`dist`

### Netlify 部署

1. 在 Netlify 导入项目
2. 在站点设置中添加环境变量（同上）
3. 构建命令：`npm run build`
4. 发布目录：`dist`

### 自托管部署

```bash
# 构建
npm run build

# 使用任何静态服务器部署 dist 目录
# 例如使用 serve
npx serve -s dist
```

## 🔧 技术栈

- **前端框架**：React 19.2.1
- **构建工具**：Vite 6.2.0
- **语言**：TypeScript 5.8.2
- **AI SDK**：@google/genai 1.31.0
- **样式**：Tailwind CSS
- **图标**：Font Awesome

## 📁 项目结构

```
.
├── components/          # React 组件
│   ├── AgentAvatar.tsx # AI 头像组件
│   ├── Controls.tsx    # 控制按钮组件
│   └── SelfView.tsx    # 用户视图组件
├── services/           # 服务层
│   ├── liveService.ts  # Gemini Live API 服务
│   └── qwenService.ts  # 通义千问服务
├── utils/              # 工具函数
│   └── audioUtils.ts   # 音频处理工具
├── config.ts           # 配置文件
├── App.tsx             # 主应用组件
├── index.tsx           # 应用入口
├── index.html          # HTML 模板
├── vite.config.ts      # Vite 配置
└── qwen-mini-server.js # 通义千问后端服务器

```

## 🔐 安全注意事项

- ❌ **永远不要**将 `.env.local` 文件提交到 Git
- ✅ API 密钥通过环境变量管理
- ✅ 使用 `.gitignore` 防止敏感文件泄漏
- ✅ 生产环境在托管平台配置环境变量

## 🛠️ 故障排查

### 构建失败

```bash
# 清除缓存和依赖
rm -rf node_modules package-lock.json
npm install
```

### API 连接失败

1. 检查 `.env.local` 中的 `VITE_API_KEY` 是否正确
2. 确认胜算云 API 密钥有效且未过期
3. 检查网络连接

### 音频问题

1. 确保浏览器允许麦克风权限
2. 使用 HTTPS 或 localhost（浏览器安全要求）
3. 检查浏览器控制台错误信息

## 📝 开发说明

### 环境变量命名规范

所有环境变量必须以 `VITE_` 开头才能在浏览器中访问。

### API 配置

- **默认使用胜算云代理**：确保国内用户流畅访问
- **模型名称添加前缀**：使用 `google/gemini-2.5-flash-*` 格式
- **自动处理认证**：SDK 自动添加 Bearer Token

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

- 项目地址：https://github.com/4xiaxia/1-1
- AI Studio：https://ai.studio/apps/drive/1t7LnRhZ38kBe2S2AJXPVJiEtqcQglDok

---

Made with ❤️ for 东里村
