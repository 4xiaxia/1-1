export enum AgentState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AudioConfig {
  sampleRate: number;
}
