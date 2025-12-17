/**
 * Runway TTS (Text-to-Speech) Service (Shengsuanyun API)
 * 
 * Model: runway/eleven_multilingual_v2
 * Voice: Clyde (cute female voice, fits the "Xiao Meng" persona)
 * API: Async task generation
 */

import { CONFIG } from '../config';

interface TTSOptions {
  text: string;
  voice?: string; // Default: 'Clyde'
  speed?: number; // Speech speed (0.5 - 2.0)
}

interface TTSResult {
  audioUrl?: string;
  audioData?: Uint8Array;
  duration?: number;
}

export class TTSService {
  private apiKey: string;
  private baseUrl: string;
  private defaultVoice = 'Clyde'; // Cute female voice for Xiao Meng
  private defaultModel = 'runway/eleven_multilingual_v2';

  constructor() {
    this.apiKey = import.meta.env.VITE_SHENGSUANYUN_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_SHENGSUANYUN_BASE_URL || 'https://router.shengsuanyun.com/api';
    
    if (!this.apiKey) {
      console.warn('[TTSService] Shengsuanyun API Key not configured');
    }
  }

  /**
   * Generate speech from text using async task API
   */
  async generateSpeech(options: TTSOptions): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('Shengsuanyun API Key not configured');
    }

    if (!options.text || options.text.trim().length === 0) {
      throw new Error('Text is required for TTS');
    }

    // Step 1: Create TTS task
    const createResponse = await fetch(`${this.baseUrl}/v1/tasks/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        input: {
          text: options.text,
          voice: options.voice || this.defaultVoice,
          speed: options.speed || 1.0,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`TTS task creation failed: ${createResponse.status} ${errorText}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.id;

    // Step 2: Poll for result
    return this.pollTaskResult(taskId);
  }

  /**
   * Poll task status until completion
   */
  private async pollTaskResult(taskId: string, maxAttempts = 30): Promise<TTSResult> {
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
        // The output might contain a URL or base64 audio data
        if (data.output?.audio_url) {
          return {
            audioUrl: data.output.audio_url,
            duration: data.output?.duration,
          };
        } else if (data.output?.audio_data) {
          // If base64 encoded audio data is returned
          const audioData = this.base64ToUint8Array(data.output.audio_data);
          return {
            audioData,
            duration: data.output?.duration,
          };
        } else {
          throw new Error('No audio output in completed task');
        }
      } else if (data.status === 'failed') {
        throw new Error(`TTS task failed: ${data.error || 'Unknown error'}`);
      }

      // Status is 'pending' or 'processing', continue polling
    }

    throw new Error('TTS timeout: task did not complete in time');
  }

  /**
   * Download audio from URL and convert to AudioBuffer
   */
  async downloadAndDecode(audioUrl: string, audioContext: AudioContext): Promise<AudioBuffer> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('[TTSService] Audio download/decode error:', error);
      throw error;
    }
  }

  /**
   * Convert Uint8Array audio data to AudioBuffer
   */
  async decodeAudioData(audioData: Uint8Array, audioContext: AudioContext): Promise<AudioBuffer> {
    try {
      const arrayBuffer = audioData.buffer;
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('[TTSService] Audio decode error:', error);
      throw error;
    }
  }

  /**
   * Helper: Convert base64 to Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
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
