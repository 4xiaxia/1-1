
import React, { useState, useEffect, useRef } from 'react';
import { LiveService } from './services/liveService';
import { QwenService } from './services/qwenService'; // New Service
import { VoiceMode } from './services/voiceService';
import { AgentState, ChatMessage } from './types';
import AgentAvatar from './components/AgentAvatar';
import Toast, { ToastType } from './components/Toast';
import VoiceModeIndicator from './components/VoiceModeIndicator';
import { GoogleGenAI } from '@google/genai';
import { CONFIG, getNextApiKey } from './config';

// --- Data Constants ---
const SPOT_DATA = {
  red: {
    title: '红色之旅',
    subtitle: '分类列表页面',
    color: 'red',
    bg: 'bg-red-500',
    text: 'text-red-600',
    lightBg: 'bg-red-50',
    spots: [
        { id: 'r1', name: '辛亥革命纪念馆', promo: '革命摇篮 薪火相传', desc: '郑氏宗祠，革命摇篮，见证了东里村的觉醒年代。', x: 35, y: 40, detailImage: 'https://picsum.photos/seed/r1/600/400' },
        { id: 'r2', name: '旌义状石碑', promo: '中山亲颁 无上荣光', desc: '孙中山亲颁，表彰海外华侨的爱国义举。', x: 65, y: 25, detailImage: 'https://picsum.photos/seed/r2/600/400' },
        { id: 'r3', name: '红军古道', promo: '重走长征 忆苦思甜', desc: '蜿蜒于山林之间，重走长征路，感受红色记忆。', x: 25, y: 65, detailImage: 'https://picsum.photos/seed/r3/600/400' },
    ]
  },
  nature: {
    title: '自然风景',
    subtitle: '分类列表页面',
    color: 'emerald',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    spots: [
        { id: 'n1', name: '仙灵瀑布', promo: '飞流直下 清凉一夏', desc: '落差百米，飞流直下，是夏日清凉避暑的绝佳胜地。', x: 70, y: 45, detailImage: 'https://picsum.photos/seed/n1/600/400' },
        { id: 'n2', name: '东里水库', promo: '湖光山色 碧波荡漾', desc: '湖光山色，碧波荡漾，适合垂钓与露营。', x: 50, y: 55, detailImage: 'https://picsum.photos/seed/n2/600/400' },
        { id: 'n3', name: '油桐花海', promo: '五月飞雪 浪漫花径', desc: '每年五月，油桐花开，如雪纷飞，浪漫至极。', x: 80, y: 75, detailImage: 'https://picsum.photos/seed/n3/600/400' },
        { id: 'n4', name: '千年古榕', promo: '独木成林 岁月见证', desc: '千年古榕树，独木成林，见证了村庄的沧桑巨变。', x: 30, y: 80, detailImage: 'https://picsum.photos/seed/n4/600/400' },
    ]
  },
  people: {
    title: '东里名人',
    subtitle: '人文荟萃',
    color: 'purple',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50',
    spots: [
        { 
            id: 'p1', 
            name: '革命先辈', 
            promo: '缅怀先烈 浩气长存', 
            desc: '追忆为国家独立、民族解放奋斗牺牲的英雄人物，传承红色基因。', 
            x: 45, y: 35, 
            detailImage: 'https://picsum.photos/seed/p1/600/400',
            directory: [
                { name: '郑玉指', tag: '同盟会会员', desc: '辛亥革命华侨领袖，追随孙中山先生，倾家荡产资助革命。其故居位于东里中路76号，现为县级文物保护单位。' },
                { name: '颜子俊', tag: '爱国侨领', desc: '著名爱国华侨领袖，抗战期间积极组织海外华侨捐资捐物，支持祖国抗战。' },
                { name: '郑义', tag: '红军烈士', desc: '1930年参加红军，在反围剿战斗中英勇牺牲，年仅22岁。' }
            ]
        },
        { 
            id: 'p2', 
            name: '乡贤名人', 
            promo: '德高望重 造福桑梓', 
            desc: '介绍德高望重，热心公益，造福桑梓的杰出乡贤事迹。', 
            x: 75, y: 60, 
            detailImage: 'https://picsum.photos/seed/p2/600/400',
            directory: [
                { name: '郑老先生', tag: '慈善家', desc: '改革开放初期捐资百万修建东里小学教学楼，设立"东里奖学金"，资助贫困学生数百人。' },
                { name: '李教授', tag: '文化学者', desc: '致力于整理东里村族谱与地方志，编撰《东里村史》，为传承村落文化做出巨大贡献。' },
                { name: '张医师', tag: '名医', desc: '悬壶济世五十年，医术精湛，医德高尚，免费为村里老人义诊。' }
            ]
        },
        { 
            id: 'p3', 
            name: '青年后生', 
            promo: '朝气蓬勃 未来可期', 
            desc: '展现朝气蓬勃，在各行各业崭露头角，建设家乡的新生代力量。', 
            x: 20, y: 70, 
            detailImage: 'https://picsum.photos/seed/p3/600/400',
            directory: [
                { name: '2024届 郑晓明', tag: '清华大学', desc: '以优异成绩考入清华大学计算机系，是东里村近十年来第一位考入清北的学生。' },
                { name: '东里青年创业团', tag: '返乡创业', desc: '由5名返乡大学生组成的创业团队，利用电商平台推广东里特产，年销售额破千万。' },
                { name: '林小红', tag: '非遗传承人', desc: '90后剪纸艺术家，致力于将传统剪纸艺术与现代设计结合，作品多次在省市获奖。' }
            ]
        },
    ]
  }
};

const WeatherWidget = () => {
  return (
    <div className="bg-[#facc15] px-3 py-1.5 rounded-full shadow-sm border border-yellow-500/20 transform rotate-1">
      <span className="text-xs font-black text-gray-800 tracking-wide">天气 2025/12/12</span>
    </div>
  );
};

type RouteType = 'G' | 'Q';

const App: React.FC = () => {
  const [route, setRoute] = useState<RouteType>('G'); // G = Gemini, Q = Qwen
  
  const [isCallActive, setIsCallActive] = useState(false); // For Gemini: Connected. For Qwen: Recording.
  const [isProcessingQwen, setIsProcessingQwen] = useState(false); // For Qwen: Sending/Receiving

  const [isConnecting, setIsConnecting] = useState(false); 
  const [isCheckingMic, setIsCheckingMic] = useState(false); 
  const [agentState, setAgentState] = useState<AgentState>(AgentState.IDLE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>('info');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(VoiceMode.IDLE);

  // Navigation States
  const [currentView, setCurrentView] = useState<'dashboard' | 'map' | 'detail' | 'media'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<'red' | 'nature' | 'people'>('red');
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null); 
  const [detailSpot, setDetailSpot] = useState<any | null>(null); 

  // UI States
  const [showHistory, setShowHistory] = useState(false);
  const [inputMode, setInputMode] = useState<'none' | 'text'>('none');
  const [inputText, setInputText] = useState('');

  // Draggable States
  const [avatarPos, setAvatarPos] = useState<{x: number, y: number} | null>(null);
  const [controlsPos, setControlsPos] = useState<{x: number, y: number} | null>(null);
  
  const activeDrag = useRef<'avatar' | 'controls' | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Refs for audio handling
  const liveService = useRef<LiveService | null>(null);
  const qwenService = useRef<QwenService | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const nextStartTime = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Ref for Text Chat Fallback
  const textChatClient = useRef<any | null>(null);
  
  // Ref for Reconnect
  const reconnectAttempts = useRef(0);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showHistory]);

  // Toast Timer (now handled by Toast component itself)
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space key - start conversation when idle
      if (e.code === 'Space' && voiceMode === VoiceMode.IDLE && !isCallActive) {
        // Only if not in text input mode
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        
        if (!isInputFocused) {
          e.preventDefault();
          handleVoiceButtonClick();
        }
      }
      // Escape key - stop conversation
      else if (e.code === 'Escape' && (isCallActive || voiceMode !== VoiceMode.IDLE)) {
        e.preventDefault();
        endCall();
        setInputMode('none'); // Also close text input if open
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [voiceMode, isCallActive, inputMode]);

  // Dragging Logic
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, item: 'avatar' | 'controls') => {
      e.preventDefault();
      
      const element = e.currentTarget;
      const rect = element.getBoundingClientRect();
      
      activeDrag.current = item;
      dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };

      if (item === 'avatar' && !avatarPos) {
          setAvatarPos({ x: rect.left, y: rect.top });
      } else if (item === 'controls' && !controlsPos) {
          setControlsPos({ x: rect.left, y: rect.top });
      }
  };

  useEffect(() => {
      const handleGlobalPointerMove = (e: PointerEvent) => {
          if (!activeDrag.current) return;
          e.preventDefault();
          
          const newX = e.clientX - dragOffset.current.x;
          const newY = e.clientY - dragOffset.current.y;
          
          if (activeDrag.current === 'avatar') {
              setAvatarPos({ x: newX, y: newY });
          } else if (activeDrag.current === 'controls') {
              setControlsPos({ x: newX, y: newY });
          }
      };

      const handleGlobalPointerUp = () => {
          activeDrag.current = null;
      };

      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      
      return () => {
          window.removeEventListener('pointermove', handleGlobalPointerMove);
          window.removeEventListener('pointerup', handleGlobalPointerUp);
      };
  }, [avatarPos, controlsPos]);

  // --- Route Switch Logic ---
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
  };

  const toggleRoute = () => {
      const newRoute = route === 'G' ? 'Q' : 'G';
      setRoute(newRoute);
      showToast(`已切换至 ${newRoute === 'G' ? 'G路线 (Gemini)' : 'Q路线 (Qwen)'} ⚡️`, 'info');
      // Reset states
      if (isCallActive) endCall();
      reconnectAttempts.current = 0;
  };

  // --- Voice Logic ---

  const checkMicrophone = async (): Promise<boolean> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (e) {
        return false;
    }
  };

  const handleVoiceButtonClick = async () => {
    if (route === 'G') {
        // G Route: Toggle Call
        if (isCallActive) {
            endCall();
        } else {
            initiateCall();
        }
    } else {
        // Q Route: Toggle Recording
        if (isProcessingQwen) return; // Busy
        
        if (isCallActive) {
            // Stop recording & Send
            stopQwenRecording();
        } else {
            // Start Recording
            startQwenRecording();
        }
    }
  };

  const initiateCall = async () => {
    if (isConnecting || isCheckingMic) return;

    setIsCheckingMic(true);
    reconnectAttempts.current = 0;
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const hasMic = await checkMicrophone();
    setIsCheckingMic(false);

    if (hasMic) {
        await startGeminiCall();
    } else {
        showToast("麦克风不可用，已为您切换到文字模式 ⌨️", 'warning');
        setInputMode('text');
        setAgentState(AgentState.IDLE);
        setVoiceMode(VoiceMode.TEXT_MODE);
    }
  };

  // --- GEMINI HANDLER ---
  const startGeminiCall = async (isRetry = false) => {
    setIsConnecting(true);
    setVoiceMode(VoiceMode.LIVE_CONNECTING);
    if (isRetry) {
        showToast(`正在尝试重连 (${reconnectAttempts.current}/3)...`, 'info');
    }

    try {
        liveService.current = new LiveService();
        
        if (!audioContext.current || audioContext.current.state === 'closed') {
             audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        await audioContext.current.resume();

        await liveService.current.connect({
            onOpen: () => {
            setIsConnecting(false);
            setIsCallActive(true);
            setAgentState(AgentState.LISTENING);
            setVoiceMode(VoiceMode.LIVE_ACTIVE);
            reconnectAttempts.current = 0; 
            if (!isRetry) {
                addMessage('model', '哇！终于见到你啦！我是东里村的小萌，今天想去哪里玩呀？✨');
                showToast("小萌听得到哦，快说话吧！🎤", 'success');
            } else {
                showToast("重连成功！我们继续聊~", 'success');
            }
            },
            onClose: () => {
            setAgentState(AgentState.IDLE);
            setIsCallActive(false);
            setIsConnecting(false);
            setVoiceMode(VoiceMode.IDLE);
            },
            onError: (err) => {
            console.error(err);
            setIsCallActive(false);
            setAgentState(AgentState.IDLE);
            setIsConnecting(false);
            setVoiceMode(VoiceMode.ERROR);
            
            // Retry Logic for Network Errors
            if (reconnectAttempts.current < 3 && !err.message.includes("Microphone")) {
                reconnectAttempts.current += 1;
                console.log(`Retrying connection attempt ${reconnectAttempts.current}`);
                setTimeout(() => startGeminiCall(true), 1000); 
            } else if (reconnectAttempts.current >= 3) {
                 // Auto Switch to Q Route
                 showToast("G路线繁忙，自动切换至Q备用路线 🚀", 'warning');
                 setRoute('Q');
                 reconnectAttempts.current = 0;
                 setVoiceMode(VoiceMode.IDLE);
            } else if (err.message.includes("Microphone")) {
                showToast("麦克风连接中断，切换文字模式", 'error');
                setInputMode('text');
                setVoiceMode(VoiceMode.TEXT_MODE);
            } else {
                showToast("网络不稳定，请稍后再试", 'error');
                setTimeout(() => setVoiceMode(VoiceMode.IDLE), 2000);
            }
            },
            onTranscription: (role, text) => {
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === role && Date.now() - lastMsg.timestamp < 3000) {
                    return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + " " + text }];
                }
                return [...prev, { id: Date.now().toString(), role, text, timestamp: Date.now() }];
            });

            if (role === 'user') {
                setAgentState(AgentState.THINKING);
            } else {
                setAgentState(AgentState.SPEAKING);
            }
            },
            onAudioData: (buffer) => {
            if (!audioContext.current) return;
            
            setAgentState(AgentState.SPEAKING);

            const src = audioContext.current.createBufferSource();
            src.buffer = buffer;
            src.connect(audioContext.current.destination);

            const currentTime = audioContext.current.currentTime;
            if (nextStartTime.current < currentTime) {
                nextStartTime.current = currentTime;
            }
            src.start(nextStartTime.current);
            nextStartTime.current += buffer.duration;

            src.onended = () => {
                if (audioContext.current && audioContext.current.currentTime >= nextStartTime.current - 0.2) {
                    setAgentState(AgentState.LISTENING);
                }
            };
            }
        });
    } catch (e) {
      console.error("Connection failed", e);
      setIsConnecting(false);
      setToastMessage("连接失败，请检查网络");
    }
  };

  // --- QWEN HANDLER ---
  const startQwenRecording = async () => {
      try {
          setIsCallActive(true); // Treat as "Active" (Recording)
          setAgentState(AgentState.LISTENING);
          setVoiceMode(VoiceMode.QWEN_RECORDING);
          qwenService.current = new QwenService();
          await qwenService.current.startRecording({
              onOpen: () => showToast("正在录音... 点击结束并发送 📤", 'info'),
              onClose: () => {
                  setIsCallActive(false);
                  setIsProcessingQwen(false);
                  setAgentState(AgentState.IDLE);
                  setVoiceMode(VoiceMode.IDLE);
              },
              onAudioData: (buffer) => {
                 setAgentState(AgentState.SPEAKING);
              },
              onTranscription: (text, isFinal) => {
                  setMessages(prev => {
                      const lastMsg = prev[prev.length - 1];
                      if (lastMsg && lastMsg.role === 'model' && Date.now() - lastMsg.timestamp < 5000) {
                          return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + text }];
                      }
                      return [...prev, { id: Date.now().toString(), role: 'model', text, timestamp: Date.now() }];
                  });
              },
              onError: (err) => {
                  console.error("Qwen Error", err);
                  showToast("Q路线连接失败，请检查后端服务是否开启", 'error');
                  setIsCallActive(false);
                  setIsProcessingQwen(false);
                  setAgentState(AgentState.IDLE);
                  setVoiceMode(VoiceMode.ERROR);
                  setTimeout(() => setVoiceMode(VoiceMode.IDLE), 2000);
              }
          });
      } catch (e) {
          showToast("无法启动录音", 'error');
          setIsCallActive(false);
          setVoiceMode(VoiceMode.ERROR);
          setTimeout(() => setVoiceMode(VoiceMode.IDLE), 2000);
      }
  };

  const stopQwenRecording = () => {
      if (!qwenService.current) return;
      setIsCallActive(false); // Stop UI recording state
      setIsProcessingQwen(true); // Start processing state
      setAgentState(AgentState.THINKING);
      setVoiceMode(VoiceMode.QWEN_PROCESSING);
      showToast("小萌思考中... 🧠", 'info');
      qwenService.current.stopAndSend({
          onOpen: () => {},
          onClose: () => {
              setIsProcessingQwen(false);
              setAgentState(AgentState.IDLE);
              setVoiceMode(VoiceMode.IDLE);
          },
          onAudioData: (buffer) => {
              setAgentState(AgentState.SPEAKING);
          },
          onTranscription: (text, isFinal) => {
               setMessages(prev => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg && lastMsg.role === 'model' && Date.now() - lastMsg.timestamp < 5000) {
                      return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + text }];
                  }
                  return [...prev, { id: Date.now().toString(), role: 'model', text, timestamp: Date.now() }];
              });
          },
          onError: (err) => {
               console.error("Qwen Send Error", err);
               showToast("发送失败，请检查 qwen-mini-server.js 是否运行", 'error');
               setIsProcessingQwen(false);
               setAgentState(AgentState.IDLE);
               setVoiceMode(VoiceMode.ERROR);
               setTimeout(() => setVoiceMode(VoiceMode.IDLE), 2000);
          }
      });
  };

  const endCall = () => {
    reconnectAttempts.current = 100; 
    if (liveService.current) {
      liveService.current.disconnect();
    }
    // No explicit disconnect needed for Qwen as it is transactional, but reset states
    setIsCallActive(false);
    setIsConnecting(false);
    setIsProcessingQwen(false);
    setAgentState(AgentState.IDLE);
    setVoiceMode(VoiceMode.IDLE);
  };

  const addMessage = (role: 'user' | 'model', text: string) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role, text, timestamp: Date.now() }]);
  };

  // --- Text Chat Logic (Downgrade Fallback) ---
  const handleSendText = async (e: React.FormEvent) => {
      e.preventDefault();
      const text = inputText.trim();
      if (!text) return;

      setInputText('');
      setInputMode('none');
      setShowHistory(true); 
      addMessage('user', text);
      setAgentState(AgentState.THINKING);

      if (isCallActive) {
          endCall();
      }

      try {
          const apiKey = getNextApiKey();
          if (!apiKey) throw new Error("No API Key");

          // Always create new client to ensure key rotation if needed
          const options: any = { apiKey: apiKey };
          if (CONFIG.API_BASE_URL) {
              options.baseUrl = CONFIG.API_BASE_URL;
          }
          
          const ai = new GoogleGenAI(options);
          textChatClient.current = ai.chats.create({
              model: CONFIG.MODELS.TEXT,
              config: {
                  systemInstruction: CONFIG.SYSTEM_INSTRUCTION,
              }
          });
          

          const result = await textChatClient.current.sendMessage({ message: text });
          const responseText = result.text;
          
          addMessage('model', responseText);
          setAgentState(AgentState.IDLE);

      } catch (error) {
          console.error("Text chat failed", error);
          addMessage('model', '呜呜，小萌网路有点卡，再说一次好不好？');
          setAgentState(AgentState.IDLE);
      }
  };

  const handleCategoryClick = (category: 'red' | 'nature' | 'people') => {
      setActiveCategory(category);
      setCurrentView('map');
      setSelectedSpot(null); // Reset selection
  };

  const handleSpotClick = (spot: any) => {
      if (selectedSpot && selectedSpot.id === spot.id) {
          setSelectedSpot(null); // Toggle off
      } else {
          setSelectedSpot(spot);
      }
  };

  const navigateToDetail = (spot: any) => {
      setDetailSpot(spot);
      setCurrentView('detail');
  };

  const openNavigation = (spotName: string) => {
      // Simulate opening a navigation app or a map search
      const url = `https://www.google.com/maps/search/?api=1&query=东里村 ${spotName}`;
      window.open(url, '_blank');
  };

  // --- Render Functions ---

  const renderDashboard = () => (
    <>
      {/* Header */}
      <div className="relative z-20 pt-4 px-6 flex justify-between items-center animate-fade-in">
        <div className="flex flex-col">
           <h1 className="text-3xl font-black text-gray-700 tracking-tight leading-none">东里村</h1>
           <h2 className="text-xs text-gray-400 font-medium mt-1 tracking-wider">村官智能体 伴您游</h2>
        </div>
        <WeatherWidget />
      </div>

      {/* Main Grid */}
      <div className="relative z-10 flex-1 pl-6 pr-0 py-3 grid grid-cols-[1fr_auto] gap-2 animate-slide-up">
        {/* Left Section: Cards */}
        <div className="grid grid-cols-2 gap-3 auto-rows-min pr-4">
            
            {/* Village Intro */}
            <div className="col-span-2 h-32 bg-gray-200 rounded-3xl relative overflow-hidden group cursor-pointer hover:bg-gray-300 transition-colors shadow-sm">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-12 bg-yellow-400 rounded-xl border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-1 group-hover:shadow-none transition-all">
                        <i className="fas fa-play text-xl"></i>
                    </div>
                </div>
                <span className="absolute left-6 top-6 text-xl font-bold text-gray-600">村子简介</span>
            </div>

            {/* Red Tour */}
            <div 
                onClick={() => handleCategoryClick('red')}
                className="h-40 bg-gray-300 rounded-3xl relative p-6 flex items-end hover:scale-[1.02] transition-transform cursor-pointer shadow-sm group overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="fas fa-star text-6xl text-gray-600"></i>
                </div>
                <span className="text-lg font-medium text-gray-600">红色之旅</span>
            </div>

            {/* Nature Scenery */}
            <div 
                onClick={() => handleCategoryClick('nature')}
                className="h-40 bg-gray-300 rounded-3xl relative p-6 flex items-end hover:scale-[1.02] transition-transform cursor-pointer shadow-sm group overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="fas fa-tree text-6xl text-gray-600"></i>
                </div>
                 <span className="text-lg font-medium text-gray-600">自然风景</span>
            </div>

            {/* Celebrities */}
            <div 
                onClick={() => handleCategoryClick('people')}
                className="h-40 bg-gray-300 rounded-3xl relative p-6 flex items-end hover:scale-[1.02] transition-transform cursor-pointer shadow-sm group overflow-hidden"
            >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="fas fa-user-graduate text-6xl text-gray-600"></i>
                 </div>
                 <span className="text-lg font-medium text-gray-600">东里名人</span>
            </div>

            {/* Video Self-media */}
            <div 
                onClick={() => setCurrentView('media')}
                className="h-40 bg-gray-300 rounded-3xl relative p-6 flex items-end hover:scale-[1.02] transition-transform cursor-pointer shadow-sm group overflow-hidden"
            >
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="fas fa-photo-video text-6xl text-gray-600"></i>
                 </div>
                 <span className="text-lg font-medium text-gray-600">视频自媒体</span>
            </div>
        </div>

        {/* Right Section: Sidebar Buttons (Docked) */}
        <div className="flex flex-col items-end pt-2">
            <div className="flex flex-col gap-5 bg-white/40 backdrop-blur-xl rounded-l-2xl py-4 pl-3 pr-2 border-l border-white/60 shadow-sm mr-0">
                <button 
                    onClick={() => setToastMessage("个人中心功能开发中 🚧")}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-12 h-12 bg-gradient-to-b from-blue-400 to-blue-500 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-user"></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-600">我的</span>
                </button>
                <button 
                    onClick={() => setToastMessage("打卡功能开发中 🚧")}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="w-12 h-12 bg-gradient-to-b from-blue-400 to-blue-500 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-600">打卡</span>
                </button>
                <button onClick={() => setShowHistory(true)} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 bg-gradient-to-b from-blue-400 to-blue-500 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-history"></i>
                    </div>
                    <span className="text-[10px] font-bold text-gray-600">历史消息</span>
                </button>
            </div>
        </div>
      </div>
    </>
  );

  const renderMediaPage = () => {
    return (
      <div className="flex flex-col h-full bg-[#f4f6f8] relative z-20 animate-fade-in">
         {/* Header */}
         <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md z-30 sticky top-0 shadow-sm border-b border-gray-100/50">
             <button 
                onClick={() => setCurrentView('dashboard')}
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 active:scale-95 transition hover:bg-gray-50 border border-gray-100"
             >
                 <i className="fas fa-chevron-left"></i>
             </button>
             <span className="font-bold text-xl text-gray-700 tracking-wide">视频自媒体</span>
             <div className="w-10"></div>
         </div>

         {/* Content List */}
         <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide">
            {/* Mock Data */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50 flex flex-col gap-3">
                    <div className="h-32 bg-gray-200 rounded-2xl relative overflow-hidden">
                        <img src={`https://picsum.photos/seed/media${i}/600/400`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                <i className="fas fa-play text-rose-500 ml-1"></i>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg leading-tight">东里村的新变化，你发现了吗？第{i}期</h3>
                        <div className="flex items-center justify-between mt-2">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">👱‍♂️</div>
                                <span className="text-xs text-gray-500 font-medium">小萌村官</span>
                             </div>
                             <span className="text-xs text-gray-400">2025-12-12</span>
                        </div>
                    </div>
                </div>
            ))}
             <div className="h-16 flex items-center justify-center text-gray-400 text-xs">
                 - 到底啦 -
             </div>
         </div>
      </div>
    )
  };

  const renderMapPage = () => {
      const activeData = SPOT_DATA[activeCategory];
      
      return (
        <div className="flex flex-col h-full bg-[#f4f6f8] relative z-20 animate-fade-in">
             {/* Map Header - Sticky & Blurred */}
             <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-white/80 backdrop-blur-md z-30 sticky top-0 shadow-sm border-b border-gray-100/50">
                 <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 active:scale-95 transition hover:bg-gray-50 border border-gray-100"
                 >
                     <i className="fas fa-chevron-left"></i>
                 </button>
                 <span className="font-bold text-xl text-gray-700 tracking-wide">村落导览</span>
                 <div className="w-10"></div> {/* Spacer */}
             </div>

             {/* Map Area */}
             <div className="relative h-72 mx-6 mt-4 mb-6 bg-[#e8e4d9] rounded-[2rem] shadow-inner border border-stone-200 overflow-visible shrink-0 select-none">
                 {/* Decorative Map Elements (Abstract) */}
                 <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" preserveAspectRatio="none">
                        <path d="M0,50 Q100,20 200,60 T400,40" stroke="#a8c5e6" strokeWidth="20" fill="none" />
                        <path d="M50,0 Q60,100 40,200" stroke="#dcd7c9" strokeWidth="15" fill="none" />
                    </svg>
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#a39e93 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                 </div>

                 {/* Pins & Bubbles */}
                 {Object.entries(SPOT_DATA).map(([catKey, data]) => (
                     data.spots.map(spot => {
                         const isSelected = selectedSpot && selectedSpot.id === spot.id;
                         return (
                            <div 
                                key={spot.id}
                                className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                                style={{ left: `${spot.x}%`, top: `${spot.y}%`, zIndex: isSelected ? 50 : (catKey === activeCategory ? 10 : 1) }}
                            >
                                {/* Popover Bubble */}
                                {isSelected && (
                                    <div className="absolute bottom-full mb-3 bg-white rounded-2xl shadow-xl p-4 w-48 flex flex-col items-center gap-3 animate-slide-up origin-bottom z-50">
                                        <div className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg w-full text-center truncate tracking-wide">
                                            {spot.promo || '热门打卡点'}
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); navigateToDetail(spot); }}
                                                className="flex-1 bg-blue-500 text-white text-xs py-2 rounded-xl active:scale-95 transition shadow-sm font-medium"
                                            >
                                                详情
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openNavigation(spot.name); }}
                                                className="flex-1 bg-green-500 text-white text-xs py-2 rounded-xl active:scale-95 transition shadow-sm font-medium"
                                            >
                                                导航
                                            </button>
                                        </div>
                                        {/* Triangle Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white filter drop-shadow-sm"></div>
                                    </div>
                                )}

                                {/* Marker Icon */}
                                <div 
                                    onClick={() => handleSpotClick(spot)}
                                    className={`
                                        ${catKey === 'red' ? 'text-red-500' : catKey === 'people' ? 'text-purple-500' : 'text-emerald-500'} 
                                        filter drop-shadow-md cursor-pointer hover:scale-125 transition-transform
                                        ${catKey === activeCategory ? 'text-4xl animate-bounce-short' : 'text-2xl opacity-60'}
                                    `}
                                >
                                    <i className={`fas ${catKey === 'people' ? 'fa-user' : 'fa-map-marker-alt'}`}></i>
                                </div>
                                {catKey === activeCategory && !isSelected && (
                                    <span className="text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap mt-1 pointer-events-none tracking-wide text-gray-600">
                                        {spot.name}
                                    </span>
                                )}
                            </div>
                         );
                     })
                 ))}
             </div>

             {/* Category Tabs */}
             <div className="bg-gray-200/60 p-1.5 mx-6 rounded-2xl flex shrink-0 mb-6 shadow-inner">
                 <button 
                    onClick={() => { setActiveCategory('red'); setSelectedSpot(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all tracking-wide ${activeCategory === 'red' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     红色之旅
                 </button>
                 <button 
                    onClick={() => { setActiveCategory('nature'); setSelectedSpot(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all tracking-wide ${activeCategory === 'nature' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     自然风景
                 </button>
                 <button 
                    onClick={() => { setActiveCategory('people'); setSelectedSpot(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all tracking-wide ${activeCategory === 'people' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     东里名人
                 </button>
             </div>

             {/* List Content */}
             <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-4 scrollbar-hide">
                 {activeData.spots.map(spot => (
                     <div 
                        key={spot.id} 
                        onClick={() => navigateToDetail(spot)}
                        className="bg-white p-5 rounded-3xl shadow-sm flex items-center gap-5 animate-slide-up cursor-pointer active:bg-gray-50 transition border border-gray-50 hover:border-gray-100"
                     >
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${activeData.lightBg} ${activeData.text}`}>
                             <i className={`fas ${activeCategory === 'red' ? 'fa-star' : activeCategory === 'people' ? 'fa-user-graduate' : 'fa-tree'} text-2xl`}></i>
                         </div>
                         <div className="flex-1">
                             <h4 className="font-bold text-gray-800 text-lg tracking-tight">{spot.name}</h4>
                             <p className="text-xs text-gray-500 mt-1 line-clamp-1 leading-relaxed tracking-wide">{spot.desc}</p>
                         </div>
                         <button className={`w-10 h-10 rounded-full border flex items-center justify-center ${activeData.text} border-current opacity-40`}>
                             <i className="fas fa-chevron-right text-sm"></i>
                         </button>
                     </div>
                 ))}
             </div>
        </div>
      );
  };

  const renderDetailPage = () => {
      if (!detailSpot) return null;

      const categoryInfo = SPOT_DATA[activeCategory];

      return (
          <div className="flex flex-col h-full bg-[#f4f6f8] relative z-20 animate-fade-in">
             {/* New Header Design */}
             <div className="flex items-center justify-between px-6 pt-6 pb-2 bg-[#f4f6f8] z-30">
                 <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setCurrentView('map')}
                        className="w-12 h-12 rounded-full bg-yellow-400 shadow-sm flex items-center justify-center text-gray-800 active:scale-95 transition border-2 border-white/50"
                     >
                         <i className="fas fa-arrow-left text-lg"></i>
                     </button>
                     <div className="flex flex-col">
                        <span className="font-black text-2xl text-gray-800 tracking-wide">{categoryInfo.title}</span>
                        <span className="text-xs text-gray-500 font-bold tracking-widest">{categoryInfo.subtitle}</span>
                     </div>
                 </div>
                 <WeatherWidget />
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide">
                 
                 {/* Image Card Container */}
                 <div className="bg-white rounded-[2rem] shadow-sm mt-4 overflow-hidden border-2 border-blue-500/20 relative">
                     {/* Image Area */}
                     <div className="relative aspect-[16/10] bg-gray-200">
                        <img src={detailSpot.detailImage} alt={detailSpot.name} className="w-full h-full object-cover" />
                        
                        {/* Green Title Bar Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-[#86efac] py-2 px-4">
                            <span className="font-bold text-gray-800 text-lg">{detailSpot.name}</span>
                        </div>
                     </div>

                     {/* Description */}
                     <div className="p-5 pt-6">
                         <p className="text-gray-600 text-sm leading-relaxed tracking-wide text-justify line-clamp-3">
                            {detailSpot.desc}
                         </p>
                     </div>

                     {/* Action Buttons Row */}
                     <div className="flex items-center justify-between px-5 pb-5 gap-3">
                         <button className="flex-1 bg-sky-200/80 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition hover:bg-sky-200">
                             <span className="text-sm font-bold text-sky-700">听导览</span>
                         </button>
                         <button className="flex-1 bg-orange-200/80 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition hover:bg-orange-200">
                             <div className="text-xs font-bold text-orange-700 text-center leading-tight">拍照<br/>AI明信片</div>
                         </button>
                         <button className="flex-1 bg-rose-200/80 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition hover:bg-rose-200">
                             <span className="text-sm font-bold text-rose-700">点亮打卡</span>
                         </button>
                     </div>

                     {/* Directory List or Text Content */}
                     {detailSpot.directory ? (
                        <div className="mx-5 mb-6 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fas fa-list-ul text-blue-400"></i>
                                <span className="text-blue-500 font-bold">人物名录</span>
                            </div>
                            {detailSpot.directory.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-800 text-lg">{item.name}</span>
                                        {item.tag && <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded font-medium">{item.tag}</span>}
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                     ) : (
                         <div className="mx-5 mb-6 bg-blue-100/50 rounded-[2rem] min-h-[140px] flex items-center justify-center p-6 border border-blue-100">
                             <span className="text-blue-400 font-bold text-lg">景点文字内容</span>
                         </div>
                     )}
                 </div>
             </div>
          </div>
      );
  };

  return (
    <div className="h-screen w-full max-w-[980px] mx-auto bg-[#f4f6f8] text-gray-800 relative overflow-hidden flex flex-col font-sans select-none shadow-2xl">
      
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0 flex items-center justify-center">
         <span className="text-8xl font-black rotate-[-15deg]">非商用使用</span>
      </div>

      {/* Route Toggle Switch */}
      <div className="absolute top-24 right-6 z-40 flex flex-col items-end gap-1">
         <button 
            onClick={toggleRoute}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold transition-all border ${
                route === 'G' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-purple-100 text-purple-600 border-purple-200'
            }`}
         >
            <div className={`w-2 h-2 rounded-full ${route === 'G' ? 'bg-blue-500' : 'bg-purple-500'} animate-pulse`}></div>
            {route === 'G' ? 'G路线 (Gemini)' : 'Q路线 (Qwen)'}
         </button>
      </div>

      {/* Main Content View Switcher */}
      {currentView === 'dashboard' ? renderDashboard() : 
       currentView === 'map' ? renderMapPage() : 
       currentView === 'media' ? renderMediaPage() :
       renderDetailPage()}

      {/* --- Character (Draggable) --- */}
      <div 
          onPointerDown={(e) => handlePointerDown(e, 'avatar')}
          className={`z-50 w-48 h-48 md:w-64 md:h-64 touch-none cursor-move transition-transform active:scale-105 ${!avatarPos ? 'absolute bottom-8 -left-4' : 'fixed'}`}
          style={avatarPos ? { left: avatarPos.x, top: avatarPos.y } : undefined}
      >
          <AgentAvatar state={agentState} volume={0.5} />
      </div>

      {/* --- Interaction Capsule (Draggable & "Backlit") --- */}
      <div 
          onPointerDown={(e) => handlePointerDown(e, 'controls')}
          className={`z-50 touch-none cursor-move active:scale-105 transition-transform ${!controlsPos ? 'absolute bottom-10 left-1/2 -translate-x-1/2' : 'fixed'}`}
          style={controlsPos ? { left: controlsPos.x, top: controlsPos.y } : undefined}
      >
          {/* Mic Check Bar - New Feature */}
          {isCheckingMic && (
             <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-48 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/20 animate-fade-in z-50">
                 <div className="flex items-center gap-2 px-2 mb-1">
                    <i className="fas fa-wave-square text-blue-400 text-xs"></i>
                    <span className="text-[10px] text-white font-bold">正在检测通话环境...</span>
                 </div>
                 <div className="h-1 bg-gray-600 rounded-full overflow-hidden mx-2 mb-1">
                    <div className="h-full bg-blue-400 animate-progress w-full origin-left"></div>
                 </div>
             </div>
          )}

          {/* Call Status Hint Bubble - Enhanced */}
          {isCallActive && (
             <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-xs px-4 py-2 rounded-2xl shadow-lg border border-white/20 animate-bounce-slow z-50 flex items-center gap-2 whitespace-nowrap ${
                 route === 'G' ? 'bg-rose-500' : 'bg-purple-500'
             }`}>
                 <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                 <span className="font-bold">
                    {route === 'G' ? '已接通！直接说话即可，点击挂断' : '正在录音...再次点击发送'}
                 </span>
                 <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${route === 'G' ? 'border-t-rose-500' : 'border-t-purple-500'}`}></div>
             </div>
          )}

          <div className="flex items-center bg-black/60 backdrop-blur-xl rounded-full p-1.5 pl-6 shadow-[0_0_20px_rgba(255,255,255,0.2)] gap-4 pointer-events-none ring-1 ring-white/30 border border-white/10">
              <div className="flex flex-col leading-none pointer-events-auto cursor-pointer group" onClick={() => setInputMode('text')}>
                  <span className="text-white font-bold text-lg drop-shadow-md group-hover:text-blue-200 transition-colors">键盘</span>
                  <span className="text-[10px] text-gray-300 transform scale-90 origin-left">可以拖动</span>
              </div>
              
              <button 
                  onClick={handleVoiceButtonClick}
                  className={`h-12 px-6 rounded-full font-bold flex items-center gap-2 transition-all pointer-events-auto shadow-lg shadow-white/10 ${
                      isCallActive 
                      ? (route === 'G' ? 'bg-rose-500 text-white animate-pulse' : 'bg-purple-500 text-white animate-pulse')
                      : (isConnecting || isCheckingMic || isProcessingQwen)
                        ? 'bg-gray-100 text-gray-500 cursor-wait'
                        : 'bg-white text-cyan-600 hover:bg-gray-50'
                  }`}
              >
                  {isCallActive ? (
                      <>
                          {route === 'G' ? <i className="fas fa-phone-slash"></i> : <i className="fas fa-paper-plane"></i>}
                          <span className="text-lg">{route === 'G' ? '挂断' : '发送'}</span>
                      </>
                  ) : (isConnecting || isCheckingMic || isProcessingQwen) ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i>
                        <span className="text-sm">
                            {isCheckingMic ? '环境检测' : isProcessingQwen ? '思考中...' : '连接中...'}
                        </span>
                      </>
                  ) : (
                      <>
                          <i className="fas fa-microphone"></i>
                          <span className="text-lg">语音畅聊</span>
                      </>
                  )}
              </button>
          </div>
      </div>

      {/* --- Voice Mode Indicator --- */}
      <VoiceModeIndicator mode={voiceMode} />

      {/* --- Toast Notification --- */}
      {toastMessage && (
          <Toast 
            message={toastMessage} 
            type={toastType} 
            duration={3000}
            onClose={() => setToastMessage(null)}
          />
      )}

      {/* --- Text Input Overlay --- */}
      {inputMode === 'text' && (
          <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center pb-32 animate-fade-in">
              <div className="bg-white w-full max-w-lg mx-4 rounded-2xl p-4 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700">发送消息给小萌</span>
                      <button onClick={() => setInputMode('none')} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
                  </div>
                  <form onSubmit={handleSendText} className="flex gap-2">
                      <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="问问村里有什么好吃的..."
                          autoFocus
                          className="flex-1 bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button 
                          type="submit" 
                          disabled={!inputText.trim()}
                          className="w-12 h-12 bg-blue-500 rounded-xl text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300"
                      >
                          <i className="fas fa-paper-plane"></i>
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* --- History / Chat Overlay --- */}
      {showHistory && (
          <div className="absolute inset-y-0 right-0 w-full md:w-96 bg-white/95 backdrop-blur shadow-2xl z-[70] flex flex-col animate-slide-left border-l border-gray-100">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <i className="fas fa-comments text-blue-500"></i>
                      聊天记录
                  </h3>
                  <button onClick={() => setShowHistory(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
                      <i className="fas fa-times"></i>
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
                  {messages.length === 0 ? (
                      <div className="text-center text-gray-400 mt-20 flex flex-col gap-2">
                          <i className="fas fa-wind text-4xl mb-2 text-gray-300"></i>
                          <p>还没有消息哦</p>
                          <p className="text-xs">快和小萌打个招呼吧！</p>
                      </div>
                  ) : (
                      messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                  msg.role === 'user' 
                                  ? 'bg-blue-500 text-white rounded-tr-none' 
                                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                              }`}>
                                  {msg.text}
                              </div>
                          </div>
                      ))
                  )}
                  <div ref={chatEndRef} />
              </div>
          </div>
      )}

      <style>{`
        @keyframes slide-left {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .animate-slide-left {
            animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bounce-short {
            0%, 100% { transform: translate(-50%, -50%); }
            50% { transform: translate(-50%, -65%); }
        }
        .animate-bounce-short {
            animation: bounce-short 1s infinite;
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -5px); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 2s infinite;
        }
        @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
        }
        .animate-progress {
            animation: progress 1.5s ease-out forwards;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default App;
