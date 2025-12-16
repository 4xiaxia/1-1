# 语音对话插件核心逻辑优化说明

## 核心文件：`VoiceChatCore.js`

我们对您提供的 `VoiceChat.js` 和 `VoiceChatPro.js` 进行了整合和优化，创建了新的核心文件 `VoiceChatCore.js`。

### 主要优化点

| 优化项 | 优化前 (`VoiceChat`/`VoiceChatPro`) | 优化后 (`VoiceChatCore`) | 优势 |
| :--- | :--- | :--- | :--- |
| **API 数据传输** | 强制将录音转换为 Base64 字符串后调用 `apiHandler` | `apiHandler` 直接接收 **`Blob` 对象** 和 **MIME 类型** | 提高效率，避免不必要的 Base64 转换开销，方便后端直接处理二进制流。 |
| **MIME 类型选择** | 录音格式选择逻辑分散且简单 | 集中在 `_getBestMimeType` 方法中，支持用户配置 `preferredMimeType`，兼容性更强。 | 提高跨浏览器和跨设备（如 iOS/微信）的录音成功率。 |
| **TTS 播放** | `speak` 方法为同步调用，无 Promise 返回 | `speak` 方法返回 **Promise**，支持异步等待 TTS 播放完成。 | 流程控制更精确，确保播放完成后再进入 `idle` 状态。 |
| **状态管理** | 状态更新逻辑分散 | 集中在 `setState` 中，并增加了状态重复检查，避免不必要的事件触发。 | 代码更健壮，易于调试和维护。 |
| **辅助工具** | Base64 转换逻辑分散在内部 | 提取到静态属性 `VoiceChatCore.utils` 中，方便用户在 `apiHandler` 中按需使用。 | 模块化，方便用户在需要 Base64 时进行转换。 |

### 使用方法

#### 1. 引入文件

在您的 HTML 文件中引入新的核心文件：

```html
<script src="VoiceChatCore.js"></script>
```

#### 2. 初始化

初始化方式与之前类似，但请注意 `apiHandler` 的参数变化。

```javascript
const voiceChat = new VoiceChatCore({
    // **重要变更：apiHandler 现在接收 Blob 对象和 MIME 类型**
    apiHandler: async (audioBlob, mimeType) => {
        // 示例：如果您的后端仍然需要 Base64，可以使用提供的工具函数进行转换
        const base64Audio = await VoiceChatCore.utils.blobToBase64(audioBlob);
        
        // 1. 将 Base64 或 Blob 发送到您的后端 API
        const response = await fetch('YOUR_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio: base64Audio,
                mimeType: mimeType,
                // 其他参数...
            })
        });
        
        const data = await response.json();
        
        // 2. 返回结果
        // 结果对象应包含 text (回复文本) 和/或 audio (Base64 或 URL 音频)
        return {
            text: data.reply_text,
            audio: data.reply_audio_base64 // 可选，Base64 或音频 URL
        };
    },
    onStateChange: (state) => {
        console.log('当前状态:', state); // 'idle', 'recording', 'processing', 'playing'
    },
    onError: (error) => {
        console.error('发生错误:', error.message);
    },
    onLog: (msg) => {
        console.info('日志:', msg);
    },
    autoSpeak: true,
    lang: 'zh-CN',
    preferredMimeType: 'audio/mp4' // 可选：指定优先使用的录音格式
});
```

#### 3. 控制方法

| 方法 | 描述 |
| :--- | :--- |
| `voiceChat.startRecording()` | 开始录音。 |
| `voiceChat.stopRecording()` | 停止录音，并触发 `apiHandler`。 |
| `voiceChat.playAudio(audioSource)` | 播放 Base64 字符串或音频 URL。返回 Promise。 |
| `voiceChat.speak(text)` | 使用浏览器 TTS 朗读文本。返回 Promise。 |
| `VoiceChatCore.isSupported()` | 静态方法：检查浏览器是否支持录音功能。 |
| `VoiceChatCore.getSupportedMimeTypes()` | 静态方法：获取浏览器支持的录音 MIME 类型列表。 |

### 辅助工具 (`VoiceChatCore.utils`)

为了方便用户在 `apiHandler` 中进行数据格式转换，我们提供了以下辅助函数：

| 函数 | 描述 |
| :--- | :--- |
| `VoiceChatCore.utils.blobToBase64(blob)` | 将 `Blob` 对象转换为 Base64 字符串。返回 Promise。 |
| `VoiceChatCore.utils.base64ToBlob(base64, mimeType)` | 将 Base64 字符串转换为 `Blob` 对象。 |

如果您希望后端直接处理 Blob 二进制数据，可以考虑使用 `FormData` 而不是 Base64，这将进一步提高效率。

```javascript
// 示例：使用 FormData 直接发送 Blob
apiHandler: async (audioBlob, mimeType) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.' + mimeType.split('/')[1].split(';')[0]);
    
    const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        body: formData // 直接发送 FormData
    });
    // ... 后续处理
}
```
