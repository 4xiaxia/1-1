/**
 * Voice Mode Indicator Component
 * 
 * Displays the current voice mode status at the top of the screen
 * with appropriate icons and colors.
 */

import React from 'react';
import { VoiceMode } from '../services/voiceService';

interface VoiceModeIndicatorProps {
  mode: VoiceMode;
  errorMessage?: string;
}

interface ModeIndicator {
  text: string;
  color: string;
  icon: string;
}

const VoiceModeIndicator: React.FC<VoiceModeIndicatorProps> = ({ 
  mode, 
  errorMessage 
}) => {
  const indicators: Record<VoiceMode, ModeIndicator> = {
    [VoiceMode.IDLE]: { 
      text: '准备就绪', 
      color: 'text-gray-400', 
      icon: 'fa-circle' 
    },
    [VoiceMode.LIVE_CONNECTING]: { 
      text: '正在连接Live API...', 
      color: 'text-blue-500', 
      icon: 'fa-spinner fa-pulse' 
    },
    [VoiceMode.LIVE_ACTIVE]: { 
      text: 'Live API对话中', 
      color: 'text-green-500', 
      icon: 'fa-circle-dot fa-beat' 
    },
    [VoiceMode.WHISPER_RECORDING]: { 
      text: '录音中（Whisper模式）', 
      color: 'text-blue-500', 
      icon: 'fa-microphone fa-beat-fade' 
    },
    [VoiceMode.WHISPER_PROCESSING]: { 
      text: '转录中...', 
      color: 'text-yellow-500', 
      icon: 'fa-spinner fa-spin' 
    },
    [VoiceMode.TTS_PLAYING]: { 
      text: '播放语音...', 
      color: 'text-purple-500', 
      icon: 'fa-volume-high fa-beat' 
    },
    [VoiceMode.QWEN_RECORDING]: { 
      text: '录音中（通义千问模式）', 
      color: 'text-orange-500', 
      icon: 'fa-microphone fa-beat-fade' 
    },
    [VoiceMode.QWEN_PROCESSING]: { 
      text: '思考中...', 
      color: 'text-orange-500', 
      icon: 'fa-spinner fa-spin' 
    },
    [VoiceMode.TEXT_MODE]: { 
      text: '文本对话模式', 
      color: 'text-gray-500', 
      icon: 'fa-keyboard' 
    },
    [VoiceMode.ERROR]: { 
      text: errorMessage || '发生错误', 
      color: 'text-red-500', 
      icon: 'fa-exclamation-circle' 
    },
  };

  const indicator = indicators[mode];

  // Don't show indicator in IDLE mode
  if (mode === VoiceMode.IDLE) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="glass-panel px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-xl bg-white/90 border border-white/60">
        <i className={`fas ${indicator.icon} ${indicator.color}`} aria-hidden="true"></i>
        <span className={`text-sm font-medium ${indicator.color}`}>
          {indicator.text}
        </span>
      </div>
    </div>
  );
};

export default VoiceModeIndicator;
