
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlobFromFloat32, decodeAudioData, base64ToUint8Array, downsampleBuffer } from '../utils/audioUtils';
import { CONFIG, getNextApiKey } from '../config';

interface LiveServiceCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onAudioData: (buffer: AudioBuffer) => void;
  onTranscription: (role: 'user' | 'model', text: string) => void;
  onError: (error: Error) => void;
}

export class LiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // State flags
  private isConnected: boolean = false;
  private isSocketOpen: boolean = false; // New flag to track actual WebSocket state
  
  constructor() {
    // Get a fresh key from rotation logic
    const apiKey = getNextApiKey();
    if (!apiKey) {
        throw new Error("No API_KEY available");
    }
    
    const options: any = { apiKey: apiKey };
    
    // Config logic handles undefined check, but we double check here to be safe
    if (CONFIG.API_BASE_URL && CONFIG.API_BASE_URL.startsWith('http')) {
      options.baseUrl = CONFIG.API_BASE_URL;
    }
    this.ai = new GoogleGenAI(options);
  }

  async connect(callbacks: LiveServiceCallbacks) {
    // 1. Initialize Audio Contexts with configured sample rates
    try {
        // Use configured sample rates for input/output audio
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.inputAudioContext = new AudioContextClass({ sampleRate: CONFIG.AUDIO.INPUT_SAMPLE_RATE });
        this.outputAudioContext = new AudioContextClass({ sampleRate: CONFIG.AUDIO.OUTPUT_SAMPLE_RATE });
        
        // Resume contexts immediately to bypass autoplay policies
        await Promise.all([
          this.inputAudioContext.resume(),
          this.outputAudioContext.resume()
        ]);
    } catch (e) {
        callbacks.onError(new Error("Failed to initialize audio subsystem. Please allow microphone access."));
        return;
    }

    // 2. Request Microphone Access
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error("Microphone access denied:", e);
      callbacks.onError(new Error("Microphone access denied"));
      return;
    }

    // 3. Configure Live Session
    const config = {
      model: CONFIG.MODELS.LIVE, 
      callbacks: {
        onopen: () => {
            console.log(`[LiveService] Connected to ${CONFIG.MODELS.LIVE}`);
            this.isConnected = true;
            this.isSocketOpen = true; // Mark socket as ready
            callbacks.onOpen();
            // Start streaming only after connection is established
            this.startAudioStreaming();
        },
        onmessage: async (message: LiveServerMessage) => {
          // Process Audio
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext) {
            try {
                const audioData = base64ToUint8Array(base64Audio);
                const audioBuffer = await decodeAudioData(audioData, this.outputAudioContext);
                callbacks.onAudioData(audioBuffer);
            } catch (err) {
                console.warn("[LiveService] Audio decode warning (skipping chunk)", err);
            }
          }

          // Process Transcription
          if (message.serverContent?.outputTranscription?.text) {
             callbacks.onTranscription('model', message.serverContent.outputTranscription.text);
          }
          if (message.serverContent?.inputTranscription?.text) {
             callbacks.onTranscription('user', message.serverContent.inputTranscription.text);
          }
        },
        onclose: () => {
            console.log("[LiveService] Session closed");
            this.isSocketOpen = false;
            this.isConnected = false;
            this.cleanup(); 
            callbacks.onClose();
        },
        onerror: (err: any) => {
            console.error("[LiveService] Protocol/Network Error:", err);
            this.isSocketOpen = false; // Immediately stop sending data
            this.isConnected = false;
            this.cleanup();
            callbacks.onError(err instanceof Error ? err : new Error("Connection error"));
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: CONFIG.SPEECH.VOICE_NAME } }, 
        },
        systemInstruction: CONFIG.SYSTEM_INSTRUCTION,
        inputAudioTranscription: {}, 
        outputAudioTranscription: {},
      },
    };

    // 4. Initiate Connection
    try {
        this.sessionPromise = this.ai.live.connect(config);
        
        // Handle initial connection failures
        await this.sessionPromise.catch((err) => {
           console.error("[LiveService] Connection handshake failed", err);
           throw err;
        });

    } catch (e) {
        this.cleanup();
        callbacks.onError(e instanceof Error ? e : new Error("Failed to connect to Gemini Live Service"));
    }
  }

  disconnect() {
    this.isConnected = false;
    this.isSocketOpen = false;
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        try {
          session.close();
        } catch(e) {
          console.log("Session already closed or failed to close", e);
        }
      }).catch(() => { /* Ignore errors during close */ });
      this.sessionPromise = null;
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.processor) {
      try {
        this.processor.disconnect();
        this.processor.onaudioprocess = null;
      } catch(e) {}
      this.processor = null;
    }
    
    if (this.source) {
      try {
        this.source.disconnect();
      } catch(e) {}
      this.source = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close AudioContexts
    const closeContext = async (ctx: AudioContext | null) => {
      if (ctx && ctx.state !== 'closed') {
        try {
          await ctx.close();
        } catch (e) { console.warn("Error closing audio context", e); }
      }
    };
    closeContext(this.inputAudioContext);
    closeContext(this.outputAudioContext);
    
    this.inputAudioContext = null;
    this.outputAudioContext = null;
  }

  private startAudioStreaming() {
    if (!this.inputAudioContext || !this.mediaStream) return;

    try {
        this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
        this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
            // STRICT GUARD: Only send if socket is truly open
            if (!this.isConnected || !this.sessionPromise || !this.isSocketOpen) return;

            const inputData = e.inputBuffer.getChannelData(0);
            
            // Critical: Handle sample rate mismatch - downsample to configured input rate
            const actualSampleRate = this.inputAudioContext?.sampleRate || CONFIG.AUDIO.INPUT_SAMPLE_RATE;
            let processingData = inputData;
            
            if (actualSampleRate !== CONFIG.AUDIO.INPUT_SAMPLE_RATE) {
                processingData = downsampleBuffer(inputData, actualSampleRate, CONFIG.AUDIO.INPUT_SAMPLE_RATE);
            }

            // Convert to configured sample rate PCM 16-bit (WAV compatible format)
            const pcmBlob = createBlobFromFloat32(processingData, CONFIG.AUDIO.INPUT_SAMPLE_RATE);
            
            this.sessionPromise.then((session) => {
                // Double check connection state inside the promise resolution
                if (this.isConnected && this.isSocketOpen) {
                    try {
                        session.sendRealtimeInput({ media: pcmBlob });
                    } catch (err) {
                        // Suppress errors if we are in the process of disconnecting
                        console.debug("Send input failed (session likely closing)", err);
                    }
                }
            }).catch(() => {
                // Ignore session access errors
            });
        };

        this.source.connect(this.processor);
        this.processor.connect(this.inputAudioContext.destination);
    } catch (e) {
        console.error("[LiveService] Error starting audio stream", e);
    }
  }
}
