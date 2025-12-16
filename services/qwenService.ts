
import { CONFIG } from '../config';
import { base64ToUint8Array } from '../utils/audioUtils';

interface QwenServiceCallbacks {
    onOpen: () => void;
    onClose: () => void;
    onAudioData: (buffer: AudioBuffer) => void;
    onTranscription: (text: string, isFinal: boolean) => void;
    onError: (error: Error) => void;
}

export class QwenService {
    private mediaRecorder: MediaRecorder | null = null;
    private outputAudioContext: AudioContext | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    
    // For playback timing
    private nextStartTime: number = 0;

    constructor() {
        // Initialize output context immediately for playback readiness
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
    }

    async startRecording(callbacks: QwenServiceCallbacks) {
        try {
            // 1. Get Microphone Stream
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 2. Initialize MediaRecorder (Native Browser API, produces WebM usually)
            // Try to use a mimeType that Qwen likely supports better, or default to browser default
            let options: MediaRecorderOptions = {};
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstart = () => {
                callbacks.onOpen();
            };
            
            this.mediaRecorder.onerror = (e) => {
                callbacks.onError(new Error("MediaRecorder Error: " + (e as any).error));
            };

            this.mediaRecorder.start();
            
        } catch (e) {
            callbacks.onError(e instanceof Error ? e : new Error("Failed to start Qwen recording"));
        }
    }

    async stopAndSend(callbacks: QwenServiceCallbacks) {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;

        return new Promise<void>((resolve) => {
            if (!this.mediaRecorder) return resolve();

            this.mediaRecorder.onstop = async () => {
                // 1. Create Blob from chunks
                const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                
                // 2. Convert Blob to Base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64String = (reader.result as string).split(',')[1];
                    
                    // 3. Stop Stream Tracks
                    if (this.stream) {
                        this.stream.getTracks().forEach(track => track.stop());
                    }

                    // 4. Send to Backend
                    try {
                        await this.sendRequest(base64String, callbacks);
                    } catch (e) {
                        callbacks.onError(e instanceof Error ? e : new Error("Failed to send to Qwen Backend"));
                    }
                    resolve();
                };
            };

            this.mediaRecorder.stop();
        });
    }

    private async sendRequest(audioBase64: string, callbacks: QwenServiceCallbacks) {
        if (!this.outputAudioContext) return;
        this.nextStartTime = this.outputAudioContext.currentTime;

        try {
            // Construct the messages payload for Qwen-Audio
            // Note: We tell Qwen it's 'webm' (or let auto-detect if supported, but strict API usually wants format)
            // 'qwen-audio-turbo' usually accepts common formats.
            const messages = [{
                role: 'user',
                content: [
                    { 
                        type: 'audio', 
                        audio: { 
                            format: 'webm', // Browser MediaRecorder default is usually webm
                            sample_rate: 16000, // Nominal, API handles resampling usually
                            data: audioBase64 
                        } 
                    },
                    // We can add text input here if we had it, e.g. { type: 'text', text: "..." }
                ]
            }];

            // Initiate SSE Request to our Local Proxy
            const response = await fetch(CONFIG.QWEN.BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.statusText}`);
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                // Keep the last partial line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmed.slice(6);
                            const data = JSON.parse(jsonStr);
                            
                            // 1. Handle Text Delta
                            const delta = data.choices?.[0]?.delta;
                            if (delta?.content) {
                                callbacks.onTranscription(delta.content, false);
                            }
                            
                            // 2. Handle Audio Delta (MP3 Base64)
                            if (delta?.audio?.data) {
                                await this.playAudioChunk(delta.audio.data, callbacks);
                            }

                        } catch (e) {
                            console.warn("Error parsing Qwen SSE chunk", e);
                        }
                    }
                }
            }
            
            callbacks.onClose(); // Interaction finished

        } catch (e) {
            throw e;
        }
    }

    private async playAudioChunk(base64Data: string, callbacks: QwenServiceCallbacks) {
        if (!this.outputAudioContext) return;

        try {
            const audioData = base64ToUint8Array(base64Data);
            // Decode MP3 chunk
            const audioBuffer = await this.outputAudioContext.decodeAudioData(audioData.buffer);
            
            // Play
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputAudioContext.destination);
            
            const now = this.outputAudioContext.currentTime;
            // Schedule smoothly
            const startAt = Math.max(now, this.nextStartTime);
            source.start(startAt);
            this.nextStartTime = startAt + audioBuffer.duration;
            
            callbacks.onAudioData(audioBuffer);
        } catch (e) {
            console.warn("Audio decode failed for chunk", e);
        }
    }
}
