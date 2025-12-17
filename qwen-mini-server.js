
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// 1. 基础配置 - 从环境变量读取
// Configuration - Read from environment variables
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY; 
const PORT = process.env.PORT || 3001;

// 检查 API Key
if (!DASHSCOPE_API_KEY) {
  console.error('❌ 错误：未设置 DASHSCOPE_API_KEY 环境变量');
  console.error('❌ Error: DASHSCOPE_API_KEY environment variable not set');
  console.error('请通过命令行传递：DASHSCOPE_API_KEY=your_key node qwen-mini-server.js');
  console.error('Please pass via command line: DASHSCOPE_API_KEY=your_key node qwen-mini-server.js');
  process.exit(1);
}

// 2. 跨域+解析JSON (小白别改)
// 允许来自前端的 localhost:3000 或其他地址的请求
app.use(cors({ origin: true })); 
app.use(express.json({ limit: '50MB' }));

// 3. 核心接口：1行转发+阿里云自动转码 (无需FFmpeg！方案1)
app.post('/api/qwen-mini', async (req, res) => {
  try {
    console.log('[Qwen Backend] 收到请求，正在转发给阿里云...');
    
    // 直接转发请求到Qwen，阿里云自动处理音频格式（无需自己转码）
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: 'qwen-audio-turbo', // 使用支持语音输入的模型 (qwen-audio-turbo 或 qwen-audio-chat)
        messages: req.body.messages, // 前端直接传构造好的消息 (包含 WebM Base64)
        modalities: ['text', 'audio'],
        audio: { voice: 'Cherry', format: 'mp3', sample_rate: 16000 }, // 输出音频配置
        stream: true
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-Region': 'cn-shanghai' // 显式指定区域
        },
        responseType: 'stream'
      }
    );

    // 4. 流式转发到前端 (小白别改)
    res.setHeader('Content-Type', 'text/event-stream');
    
    response.data.on('data', chunk => {
        // 直接透传阿里云的 SSE 数据流
        res.write(chunk);
    });
    
    response.data.on('end', () => {
        res.end();
        console.log('[Qwen Backend] 请求处理完成');
    });
    
  } catch (err) {
    console.error('[Qwen Backend] 出错啦:', err.message);
    if (err.response) {
        console.error('详细错误:', err.response.data);
    }
    res.status(500).send(`出错了：${err.message}`);
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`✅ 极简后端启动成功！地址：http://localhost:${PORT}`);
  console.log(`⚠️ 夏夏请注意：保持这个窗口打开，不要关闭哦！`);
});
