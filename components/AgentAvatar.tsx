
import React from 'react';
import { AgentState } from '../types';

interface AgentAvatarProps {
  state: AgentState;
  volume: number; // 0 to 1
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ state, volume }) => {
  // Simple simulation of lip sync or movement based on volume
  const scale = 1 + (state === AgentState.SPEAKING ? Math.min(volume * 2, 0.2) : 0);
  
  // Placeholder for a cute anime-style village official
  const avatarUrl = "https://p3-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/fc199582e9de4dc0aa8504d355f9d556.png~tplv-a9rns2rl98-image.png?rcl=2025121504085354595C474DC6E532537C&rk3s=8e244e95&rrcfp=dafada99&x-expires=2081966933&x-signature=mxa8QnR473vsYNvqMJp61%2B5CG2M%3D"; 

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      
      {/* Heartbeat Effect - The "Love" Badge */}
      <div className="absolute top-0 right-6 z-40 animate-bounce-slow">
        <div className="bg-white p-1.5 rounded-full shadow-md border border-rose-100 flex items-center justify-center">
            <i className="fas fa-heart text-rose-500 text-sm animate-pulse"></i>
        </div>
      </div>

      {/* Main Avatar Container */}
      <div 
        className="relative z-10 transition-transform duration-100 ease-out rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-white group"
        style={{ 
            width: '120px', 
            height: '120px', 
            transform: `scale(${scale})`,
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)'
        }}
      >
        <img 
            src={avatarUrl} 
            alt="Xiao Meng" 
            className="w-full h-full object-cover transform translate-y-2"
        />
        
        {/* Blush Effect (Cheeks) - Kept for "Moe" factor */}
        <div className="absolute top-[45%] left-[20%] w-4 h-2 bg-rose-300 rounded-full blur-md opacity-40 animate-pulse"></div>
        <div className="absolute top-[45%] right-[20%] w-4 h-2 bg-rose-300 rounded-full blur-md opacity-40 animate-pulse"></div>

        {/* Status Overlay Ring */}
        <div className={`absolute inset-0 border-4 rounded-full ${
            state === AgentState.LISTENING ? 'border-blue-400 animate-pulse' :
            state === AgentState.THINKING ? 'border-yellow-400 animate-spin-slow' :
            state === AgentState.SPEAKING ? 'border-green-400' :
            'border-pink-200'
        }`}></div>
      </div>

      {/* Name Tag */}
      <div className="absolute bottom-2 z-20 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg border border-rose-100 transform translate-y-8 flex items-center gap-3 min-w-[140px]">
        <div className="w-10 h-10 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center shrink-0">
             <span className="text-xl">👩‍🌾</span>
        </div>
        <div className="flex flex-col">
            <h2 className="text-base font-black text-rose-500 leading-tight">村官小萌</h2>
            <span className="text-[10px] font-bold text-gray-400 leading-tight">东里村百事通</span>
        </div>
      </div>
      
      {/* State Bubble */}
      {state === AgentState.THINKING && (
          <div className="absolute top-0 right-0 bg-white px-3 py-1.5 rounded-2xl rounded-bl-none shadow-lg animate-bounce z-30 border border-gray-100">
              <span className="text-xs text-gray-600 font-bold">思考中... 🤔</span>
          </div>
      )}
       {state === AgentState.LISTENING && (
          <div className="absolute top-0 left-0 bg-white px-3 py-1.5 rounded-2xl rounded-br-none shadow-lg animate-pulse z-30 border border-blue-100">
              <span className="text-xs text-blue-500 font-bold">在听啦在听啦... 👂</span>
          </div>
      )}
      
      <style>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AgentAvatar;
