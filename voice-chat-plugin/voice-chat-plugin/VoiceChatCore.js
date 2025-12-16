/**
 * VoiceChatCore.js - 语音对话插件核心逻辑 (优化版)
 * 目标: 提高录音兼容性、数据传输效率和代码可维护性。
 */

class VoiceChatCore {
    constructor(config) {
        this.config = Object.assign({
            // 优化后的apiHandler，现在接收 Blob 对象和 MIME 类型，而不是 Base64 字符串
            apiHandler: async (audioBlob, mimeType) => {
                console.warn('请配置 apiHandler(audioBlob, mimeType) 来处理音频发送');
                // 默认返回模拟回复
                return { text: "这是模拟的大模型回复：我收到了你的语音。", audio: null };
            },
            onStateChange: (state) => { }, // state: 'idle', 'recording', 'processing', 'playing'
            onError: (error) => console.error(error),
            onLog: (msg) => console.log(msg),
            autoSpeak: true, // 是否自动朗读回复
            lang: 'zh-CN',
            preferredMimeType: 'audio/webm;codecs=opus' // 优先使用的MIME类型
        }, config);

        this.recorder = null;
        this.stream = null;
        this.audioChunks = [];
        this.state = 'idle';
        this.isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        this.isWeChat = /MicroMessenger/i.test(navigator.userAgent);
        this.isAndroid = /Android/i.test(navigator.userAgent);
        this.mimeType = this._getBestMimeType(this.config.preferredMimeType);
    }

    /**
     * 确定最佳的录音MIME类型
     */
    _getBestMimeType(preferred) {
        // 1. 优先使用用户配置的类型
        if (MediaRecorder.isTypeSupported(preferred)) {
            return preferred;
        }
        
        // 2. 尝试 WebM/Opus
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            return 'audio/webm;codecs=opus';
        }

        // 3. 尝试 MP4 (iOS/微信/兼容性)
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            return 'audio/mp4';
        }

        // 4. 尝试 WebM
        if (MediaRecorder.isTypeSupported('audio/webm')) {
            return 'audio/webm';
        }

        // 5. 最终回退
        this.config.onLog('警告: 未找到推荐的录音格式，使用默认设置。');
        return ''; // 让 MediaRecorder 使用默认设置
    }

    /**
     * 更新状态
     */
    setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.config.onStateChange(newState);
        }
    }

    /**
     * 开始录音
     */
    async startRecording() {
        if (this.state !== 'idle') {
            this.config.onLog('当前状态非空闲，无法开始录音。');
            return;
        }

        try {
            // 1. 环境检查
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                throw new Error('语音功能需要 HTTPS 环境');
            }

            // 2. 获取权限和流
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // 3. 创建录音实例
            const options = this.mimeType ? { mimeType: this.mimeType } : {};
            this.recorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.recorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.recorder.onstop = async () => {
                await this._handleRecordingStop();
            };
            
            this.recorder.onerror = (e) => {
                this.config.onError(new Error(`录音错误: ${e.error.name}`));
                this._stopStream();
                this.setState('idle');
            };

            // 4. 开始录制 (分片)
            this.recorder.start(1000); // 每秒分片
            this.setState('recording');
            this.config.onLog(`开始录音，使用格式: ${this.recorder.mimeType}`);

        } catch (err) {
            this.config.onError(new Error(`录音失败: ${err.message}`));
            this.setState('idle');
        }
    }

    /**
     * 停止录音
     */
    stopRecording() {
        if (this.recorder && this.state === 'recording') {
            this.recorder.stop();
            this._stopStream();
        }
    }

    /**
     * 停止媒体流
     */
    _stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    /**
     * 内部处理：录音结束 -> 生成 Blob -> 调用API -> 播放回复
     */
    async _handleRecordingStop() {
        this.setState('processing');
        this.config.onLog('录音结束，正在处理...');

        try {
            // 1. 生成 Blob
            const mimeType = this.recorder.mimeType || this.mimeType || 'audio/mp4';
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            
            if (audioBlob.size === 0) {
                throw new Error('录音数据为空，请检查麦克风权限或录音时长。');
            }

            this.config.onLog(`生成 Blob 成功 (${(audioBlob.size / 1024).toFixed(2)}KB)，MIME: ${mimeType}`);

            // 2. 调用用户配置的 API (传入 Blob 和 MIME 类型)
            const response = await this.config.apiHandler(audioBlob, mimeType);

            // 兼容旧版：如果返回的是字符串，封装成对象
            const result = typeof response === 'string' ? { text: response } : response;

            this.config.onLog(`收到回复: ${result.text ? result.text.substring(0, 30) + '...' : 'Audio Data'}`);

            // 3. 播放回复 (优先播放音频，其次TTS)
            if (this.config.autoSpeak) {
                if (result.audio) {
                    await this.playAudio(result.audio);
                } else if (result.text) {
                    await this.speak(result.text);
                } else {
                    this.setState('idle');
                }
            } else {
                this.setState('idle');
            }

        } catch (err) {
            this.config.onError(new Error(`处理失败: ${err.message}`));
            this.setState('idle');
        }
    }

    /**
     * 播放 Base64 或 URL 音频
     */
    playAudio(audioSource) {
        return new Promise((resolve, reject) => {
            if (this.state === 'playing') {
                this.config.onLog('正在播放中，跳过本次播放请求。');
                resolve();
                return;
            }
            
            try {
                const audio = new Audio(audioSource);

                audio.onplay = () => this.setState('playing');
                audio.onended = () => {
                    this.setState('idle');
                    resolve();
                };
                audio.onerror = (e) => {
                    console.error('Audio Playback Error:', e);
                    this.config.onError(new Error('播放音频回复失败'));
                    this.setState('idle');
                    reject(e);
                };

                audio.play().catch(e => {
                    // 处理自动播放策略限制
                    this.config.onLog('警告: 自动播放被浏览器策略拦截。');
                    this.setState('idle');
                    reject(e);
                });
            } catch (e) {
                this.config.onError(new Error(`播放错误: ${e.message}`));
                reject(e);
            }
        });
    }

    /**
     * 文本转语音 (浏览器原生)
     */
    speak(text) {
        return new Promise((resolve, reject) => {
            if (!window.speechSynthesis) {
                const error = new Error('当前浏览器不支持语音合成');
                this.config.onError(error);
                this.setState('idle');
                reject(error);
                return;
            }

            // 取消之前的朗读
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.config.lang;

            // 尝试优化语音选择
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => 
                v.lang.includes(this.config.lang.split('-')[0]) && 
                (v.localService || !this.isAndroid)
            );
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onstart = () => this.setState('playing');
            utterance.onend = () => {
                this.setState('idle');
                resolve();
            };
            utterance.onerror = (e) => {
                console.error('TTS Error:', e);
                this.config.onError(new Error(`语音合成失败: ${e.error}`));
                this.setState('idle');
                reject(e);
            };

            window.speechSynthesis.speak(utterance);
        });
    }
    
    /**
     * 静态方法：检查浏览器支持
     */
    static isSupported() {
        return !!(
            navigator.mediaDevices && 
            navigator.mediaDevices.getUserMedia && 
            window.MediaRecorder
        );
    }
    
    /**
     * 静态方法：获取支持的MIME类型
     */
    static getSupportedMimeTypes() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/mpeg'
        ];
        return types.filter(type => MediaRecorder.isTypeSupported(type));
    }
}

// 导出辅助函数，以便用户在 apiHandler 中使用
VoiceChatCore.utils = {
    /**
     * 辅助：Blob 转 Base64 (如果 apiHandler 仍需要 Base64)
     */
    blobToBase64: (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    },
    
    /**
     * 辅助：Base64 转 Blob (如果需要处理 Base64 响应)
     */
    base64ToBlob: (base64, mimeType) => {
        const parts = base64.split(',');
        const mime = parts[0].match(/:(.*?);/)[1] || mimeType;
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
    }
};

// 确保 VoiceChatCore 可用
window.VoiceChatCore = VoiceChatCore;
