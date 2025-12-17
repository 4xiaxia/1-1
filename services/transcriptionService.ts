/**
 * Whisper1 Audio Transcription Service (Shengsuanyun API)
 * 
 * Supports two modes:
 * 1. Sync API: /v1/audio/transcriptions (for audio < 10 seconds)
 * 2. Async API: /v1/tasks/generations (for longer audio)
 */

import { CONFIG } from '../config';

interface TranscriptionOptions {
  audioBlob: Blob;
  language?: string; // Default: 'zh' for Chinese
  prompt?: string; // Context hint for better accuracy
}

interface TranscriptionResult {
  text: string;
  duration?: number;
}

export class TranscriptionService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Get Shengsuanyun API key from environment
    this.apiKey = import.meta.env.VITE_SHENGSUANYUN_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_SHENGSUANYUN_BASE_URL || 'https://router.shengsuanyun.com/api';
    
    if (!this.apiKey) {
      console.warn('[TranscriptionService] Shengsuanyun API Key not configured');
    }
  }

  /**
   * Transcribe audio using sync API (for short audio < 10s)
   */
  async transcribeSync(options: TranscriptionOptions): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('Shengsuanyun API Key not configured');
    }

    const formData = new FormData();
    formData.append('file', options.audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    
    if (options.language) {
      formData.append('language', options.language);
    }
    
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return {
        text: data.text || '',
        duration: data.duration,
      };
    } catch (error) {
      console.error('[TranscriptionService] Sync transcription error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using async API (for longer audio)
   */
  async transcribeAsync(options: TranscriptionOptions): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('Shengsuanyun API Key not configured');
    }

    // Step 1: Convert blob to base64
    const base64Audio = await this.blobToBase64(options.audioBlob);
    const base64Data = base64Audio.split(',')[1]; // Remove data URL prefix

    // Step 2: Create async task
    const createResponse = await fetch(`${this.baseUrl}/v1/tasks/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'whisper-1',
        input: {
          audio: base64Data,
          language: options.language || 'zh',
          prompt: options.prompt || '',
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Task creation failed: ${createResponse.status} ${errorText}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.id;

    // Step 3: Poll for result
    return this.pollTaskResult(taskId);
  }

  /**
   * Poll task status until completion
   */
  private async pollTaskResult(taskId: string, maxAttempts = 30): Promise<TranscriptionResult> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const response = await fetch(`${this.baseUrl}/v1/tasks/generations/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Task polling failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'completed') {
        return {
          text: data.output?.text || '',
          duration: data.output?.duration,
        };
      } else if (data.status === 'failed') {
        throw new Error(`Transcription task failed: ${data.error || 'Unknown error'}`);
      }

      // Status is 'pending' or 'processing', continue polling
    }

    throw new Error('Transcription timeout: task did not complete in time');
  }

  /**
   * Helper: Convert Blob to Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
