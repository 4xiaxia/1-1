/**
 * Unified Voice Service with Intelligent Fallback Strategy
 * 
 * Fallback chain:
 * 1. Live API (Gemini native audio) - Best experience, real-time
 * 2. Whisper + TTS (Shengsuanyun) - Good experience, near real-time
 * 3. Qwen Backend (local) - Fallback for when cloud services fail
 * 4. Text-only mode - Last resort
 */

import { LiveService } from './liveService';
import { TranscriptionService } from './transcriptionService';
import { TTSService } from './ttsService';
import { QwenService } from './qwenService';
import { CONFIG } from '../config';

export enum VoiceMode {
  IDLE = 'IDLE',
  LIVE_CONNECTING = 'LIVE_CONNECTING',
  LIVE_ACTIVE = 'LIVE_ACTIVE',
  WHISPER_RECORDING = 'WHISPER_RECORDING',
  WHISPER_PROCESSING = 'WHISPER_PROCESSING',
  TTS_PLAYING = 'TTS_PLAYING',
  QWEN_RECORDING = 'QWEN_RECORDING',
  QWEN_PROCESSING = 'QWEN_PROCESSING',
  TEXT_MODE = 'TEXT_MODE',
  ERROR = 'ERROR'
}

export type VoiceServiceMode = 'live' | 'whisper' | 'qwen' | 'text';

interface VoiceServiceCallbacks {
  onModeChange: (mode: VoiceMode) => void;
  onTranscription: (role: 'user' | 'model', text: string) => void;
  onAudioData: (buffer: AudioBuffer) => void;
  onError: (error: Error, canRetry: boolean) => void;
  onMessage?: (message: string) => void;
}

export class VoiceService {
  private currentMode: VoiceServiceMode = 'live';
  private liveService: LiveService | null = null;
  private transcriptionService: TranscriptionService;
  private ttsService: TTSService;
  private qwenService: QwenService | null = null;
  private callbacks: VoiceServiceCallbacks | null = null;
  
  // Recording state for Whisper mode
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.ttsService = new TTSService();
  }

  /**
   * Initialize and start voice conversation with intelligent fallback
   */
  async startConversation(callbacks: VoiceServiceCallbacks): Promise<void> {
    this.callbacks = callbacks;

    try {
      // Try Live API first (best experience)
      await this.tryLiveAPI();
    } catch (liveError) {
      console.warn('[VoiceService] Live API failed, trying Whisper+TTS', liveError);
      callbacks.onMessage?.('Live API不可用，切换到Whisper模式');

      try {
        // Fallback to Whisper + TTS
        await this.tryWhisperTTS();
      } catch (whisperError) {
        console.warn('[VoiceService] Whisper+TTS failed, trying Qwen', whisperError);
        callbacks.onMessage?.('Whisper不可用，切换到通义千问模式');

        try {
          // Fallback to Qwen backend
          await this.tryQwen();
        } catch (qwenError) {
          console.error('[VoiceService] All voice services failed', qwenError);
          callbacks.onMessage?.('语音服务暂时不可用，已切换到文本模式');
          this.currentMode = 'text';
          callbacks.onModeChange(VoiceMode.TEXT_MODE);
          throw new Error('All voice services unavailable, switched to text mode');
        }
      }
    }
  }

  /**
   * Try Live API (Gemini native audio)
   */
  private async tryLiveAPI(): Promise<void> {
    if (!this.callbacks) throw new Error('Callbacks not initialized');

    this.callbacks.onModeChange(VoiceMode.LIVE_CONNECTING);

    // Test if Live API is available
    const apiKey = import.meta.env.VITE_API_KEY || CONFIG.getNextApiKey?.() || '';
    if (!apiKey) {
      throw new Error('No API key available for Live API');
    }

    this.liveService = new LiveService();
    
    await this.liveService.connect({
      onOpen: () => {
        this.currentMode = 'live';
        this.callbacks?.onModeChange(VoiceMode.LIVE_ACTIVE);
        this.callbacks?.onMessage?.('已连接到Live API，可以开始对话');
      },
      onClose: () => {
        this.callbacks?.onModeChange(VoiceMode.IDLE);
      },
      onAudioData: (buffer) => {
        this.callbacks?.onAudioData(buffer);
      },
      onTranscription: (role, text) => {
        this.callbacks?.onTranscription(role, text);
      },
      onError: (error) => {
        this.callbacks?.onError(error, false);
        throw error; // Propagate to trigger fallback
      }
    });
  }

  /**
   * Try Whisper + TTS mode
   */
  private async tryWhisperTTS(): Promise<void> {
    if (!this.callbacks) throw new Error('Callbacks not initialized');

    // Check if Whisper and TTS services are available
    const [whisperAvailable, ttsAvailable] = await Promise.all([
      this.transcriptionService.isAvailable(),
      this.ttsService.isAvailable()
    ]);

    if (!whisperAvailable || !ttsAvailable) {
      throw new Error('Whisper or TTS service not available');
    }

    this.currentMode = 'whisper';
    await this.startWhisperRecording();
  }

  /**
   * Start recording for Whisper transcription
   */
  async startWhisperRecording(): Promise<void> {
    if (!this.callbacks) throw new Error('Callbacks not initialized');

    try {
      this.callbacks.onModeChange(VoiceMode.WHISPER_RECORDING);

      // Get microphone stream
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.callbacks.onMessage?.('正在录音，说完后点击发送');
    } catch (error) {
      this.callbacks.onError(error as Error, true);
      throw error;
    }
  }

  /**
   * Stop Whisper recording and process
   */
  async stopWhisperRecording(): Promise<void> {
    if (!this.callbacks || !this.mediaRecorder) return;

    this.callbacks.onModeChange(VoiceMode.WHISPER_PROCESSING);

    return new Promise<void>((resolve, reject) => {
      if (!this.mediaRecorder) return resolve();

      this.mediaRecorder.onstop = async () => {
        try {
          // Create audio blob
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Stop stream
          if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
          }

          // Transcribe with Whisper
          const transcription = await this.transcriptionService.transcribeSync({
            audioBlob,
            language: 'zh',
            prompt: '东里村旅游对话'
          });

          this.callbacks?.onTranscription('user', transcription.text);
          this.callbacks?.onMessage?.('正在生成语音回复...');

          // Note: Full integration with text generation and TTS would require:
          // 1. Send transcription.text to Gemini text API for response
          // 2. Use TTSService to convert response to speech
          // 3. Play the audio response
          // For now, this marks the end of the transcription phase.
          // The app can handle AI response generation separately via text chat fallback.
          this.callbacks?.onModeChange(VoiceMode.IDLE);
          
          resolve();
        } catch (error) {
          this.callbacks?.onError(error as Error, true);
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Try Qwen backend
   */
  private async tryQwen(): Promise<void> {
    if (!this.callbacks) throw new Error('Callbacks not initialized');

    // Test if Qwen backend is available
    const qwenUrl = import.meta.env.VITE_QWEN_BACKEND_URL || CONFIG.QWEN?.BACKEND_URL || '';
    if (!qwenUrl) {
      throw new Error('Qwen backend URL not configured');
    }

    try {
      const testUrl = qwenUrl.replace('/api/qwen-mini', '/health');
      const response = await fetch(testUrl);
      if (!response.ok) {
        throw new Error('Qwen backend not responding');
      }
    } catch (error) {
      throw new Error('Qwen backend not available');
    }

    this.currentMode = 'qwen';
    this.qwenService = new QwenService();
    
    await this.qwenService.startRecording({
      onOpen: () => {
        this.callbacks?.onModeChange(VoiceMode.QWEN_RECORDING);
        this.callbacks?.onMessage?.('通义千问录音中...');
      },
      onClose: () => {
        this.callbacks?.onModeChange(VoiceMode.IDLE);
      },
      onAudioData: (buffer) => {
        this.callbacks?.onAudioData(buffer);
      },
      onTranscription: (text, isFinal) => {
        this.callbacks?.onTranscription('model', text);
      },
      onError: (error) => {
        this.callbacks?.onError(error, true);
      }
    });
  }

  /**
   * Stop current conversation
   */
  async stopConversation(): Promise<void> {
    if (this.liveService) {
      this.liveService.disconnect();
      this.liveService = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.qwenService) {
      // Qwen service cleanup handled by its own methods
      this.qwenService = null;
    }

    this.callbacks?.onModeChange(VoiceMode.IDLE);
  }

  /**
   * Get current mode
   */
  getCurrentMode(): VoiceServiceMode {
    return this.currentMode;
  }

  /**
   * Check if any voice service is available
   */
  async checkAvailability(): Promise<{
    live: boolean;
    whisper: boolean;
    tts: boolean;
    qwen: boolean;
  }> {
    const [whisperAvailable, ttsAvailable] = await Promise.all([
      this.transcriptionService.isAvailable(),
      this.ttsService.isAvailable()
    ]);

    let qwenAvailable = false;
    try {
      const qwenUrl = import.meta.env.VITE_QWEN_BACKEND_URL || CONFIG.QWEN?.BACKEND_URL || '';
      if (qwenUrl) {
        const testUrl = qwenUrl.replace('/api/qwen-mini', '/health');
        const response = await fetch(testUrl);
        qwenAvailable = response.ok;
      }
    } catch {
      qwenAvailable = false;
    }

    // Live API availability check
    const apiKey = import.meta.env.VITE_API_KEY || '';
    const liveAvailable = !!apiKey;

    return {
      live: liveAvailable,
      whisper: whisperAvailable,
      tts: ttsAvailable,
      qwen: qwenAvailable
    };
  }
}
