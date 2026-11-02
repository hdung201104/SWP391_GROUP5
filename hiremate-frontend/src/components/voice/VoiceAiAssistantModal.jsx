import React, { useState, useEffect, useRef } from 'react';
import { VoiceAgentWebRTCManager } from '../../services/voiceAgentWebRTC';
import voiceAgentApi from '../../api/voiceAgentApi';
import interviewApi from '../../api/interviewApi';

/**
 * Enterprise Real-Time Voice AI Agent Assistant Modal
 * Built on Multi-Key Architecture:
 * - Engine 1: Gemini 2.0 Flash Voice AI (Ultra-Low Latency < 0.5s via GEMINI_VOICE_API_KEY)
 * - Engine 2: OpenAI Realtime WebRTC
 * Supports continuous Vietnamese conversation, 1.2s VAD silence detection,
 * barge-in interruption, live transcription, audio visualizer, and microphone control.
 */
export default function VoiceAiAssistantModal({ isOpen, onClose, user, initialContext = {} }) {
  const [manager] = useState(() => new VoiceAgentWebRTCManager());
  const [engineMode, setEngineMode] = useState('gemini'); // 'gemini' (Gemini 2.0 Flash) | 'webrtc' (OpenAI)
  const [connectionState, setConnectionState] = useState('idle'); // idle | requesting | connecting | listening | thinking | speaking | error
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transcripts, setTranscripts] = useState([]);
  const [audioVolume, setAudioVolume] = useState(0);
  const [voiceChoice, setVoiceChoice] = useState('vi-male'); // 'vi-male' | 'vi-female'
  const [selectedTopic, setSelectedTopic] = useState(initialContext.targetPosition || 'Chuyên viên Công nghệ & Tuyển dụng');

  const transcriptEndRef = useRef(null);

  // Gemini Voice Mode Refs
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);
  const baseSpeechRef = useRef('');
  const isProcessingRef = useRef(false);

  const currentAudioRef = useRef(null);

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  // Clean up all resources when modal closes or unmounts
  useEffect(() => {
    return () => {
      cleanupAllResources();
    };
  }, []);

  const cleanupAllResources = () => {
    // 1. WebRTC cleanup
    try { manager.stop(); } catch (e) {}

    // 2. Speech recognition cleanup
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // 3. Audio stream cleanup
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }

    // 4. Speech synthesis cleanup
    stopSpeaking();
  };

  const handleClose = () => {
    cleanupAllResources();
    setConnectionState('idle');
    setErrorMessage('');
    setAudioVolume(0);
    onClose();
  };

  const stopSpeaking = () => {
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  };

  // Nhận diện ngôn ngữ câu hỏi/phát biểu: Tiếng Anh hay Tiếng Việt
  const isMostlyEnglishText = (text) => {
    if (!text) return false;
    const vnMarks = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;
    const vnWordCount = words.filter((w) => vnMarks.test(w)).length;
    if (vnWordCount / words.length > 0.08) return false;
    const enWords = new Set(['the', 'is', 'are', 'you', 'your', 'what', 'how', 'why', 'can', 'could', 'tell', 'me', 'about', 'experience', 'with', 'project', 'have', 'been', 'which', 'and', 'for', 'in', 'to']);
    const enCount = words.filter((w) => enWords.has(w)).length;
    return enCount >= 2;
  };

  // Chuẩn hóa văn bản cho giọng đọc TTS mượt mà, phát âm chuẩn thuật ngữ tiếng Anh
  // Chuẩn hóa văn bản cho giọng đọc TTS mượt mà, phát âm chuẩn thuật ngữ tiếng Anh
  const cleanVoiceText = (text) => {
    if (!text) return '';
    let s = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[*_#`~>\[\]{}()\"“”„‟«»]/g, ' ')
      .replace(/^(\d+[\.\)]|Câu\s*\d+[:\.]|Q\d+[:\.])\s*/i, '')
      .replace(/[-–—]{2,}/g, ' - ');

    const safeMap = [
      [/\bC#\b/g, 'C Sharp'],
      [/\bC\+\+\b/g, 'C Plus Plus'],
      [/\bCI\/CD\b/gi, 'CI CD'],
      [/\bUI\/UX\b/gi, 'UI UX'],
      [/\bQA\/QC\b/gi, 'QA QC'],
      [/\bv\.v\.\.\.|\bv\.v\.\b/gi, 'vân vân'],
      [/\be\.g\.\b/gi, 'ví dụ'],
      [/\bi\.e\.\b/gi, 'tức là'],
      [/&/g, ' và '],
    ];

    for (const [regex, replacement] of safeMap) {
      s = s.replace(regex, replacement);
    }

    return s
      .replace(/\s*([,;:])\s*/g, '$1 ')
      .replace(/\s*([.!?])\s*/g, '$1 ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Seamless Audio Streaming (Phát toàn vẹn một file duy nhất, không ngắt quãng giữa các câu)
  const speakWithSentenceChunking = (text) => {
    stopSpeaking();
    if (!text) return;

    const clean = cleanVoiceText(text);
    if (!clean) return;

    speechQueueRef.current = [clean];
    speakNextSentenceChunk();
  };

  const speakNextSentenceChunk = () => {
    if (speechQueueRef.current.length === 0) {
      isSpeakingRef.current = false;
      setTimeout(() => {
        setConnectionState('listening');
      }, 500);
      return;
    }

    const chunk = speechQueueRef.current.shift();
    const voiceParam = voiceChoice === 'vi-male' ? 'male' : 'female';

    // Ưu tiên 1: Stream giọng nói tự nhiên từ Backend TTS endpoint
    try {
      const ttsUrl = `/api/v1/ai-interviews/tts?voice=${voiceParam}&text=${encodeURIComponent(chunk)}`;
      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        isSpeakingRef.current = true;
        setConnectionState('speaking');
      };

      audio.onended = () => {
        currentAudioRef.current = null;
        speakNextSentenceChunk();
      };

      audio.onerror = () => {
        currentAudioRef.current = null;
        fallbackBrowserSpeech(chunk);
      };

      audio.play().catch(() => {
        currentAudioRef.current = null;
        fallbackBrowserSpeech(chunk);
      });
    } catch (e) {
      fallbackBrowserSpeech(chunk);
    }
  };

  const fallbackBrowserSpeech = (chunk) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      speakNextSentenceChunk();
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(chunk);
      const isEn = isMostlyEnglishText(chunk);
      utterance.lang = isEn ? 'en-US' : 'vi-VN';

      const voices = window.speechSynthesis.getVoices() || [];
      const isMale = voiceChoice === 'vi-male';
      let selectedVoice = null;
      if (isEn) {
        selectedVoice = voices.find((v) => v.lang.startsWith('en') && (isMale ? /male|david|guy|andrew/i.test(v.name) : /female|jenny|zira|aria/i.test(v.name))) || voices.find((v) => v.lang.startsWith('en'));
      } else {
        selectedVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith('vi') &&
          (isMale ? /nam|male|minh|khoi/i.test(v.name) : /nữ|female|my|linh|mai/i.test(v.name))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || (isEn ? 'en-US' : 'vi-VN');
      }
      utterance.rate = 1.0;
      utterance.pitch = isMale ? 0.95 : 1.05;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setConnectionState('speaking');
      };

      utterance.onend = () => {
        speakNextSentenceChunk();
      };

      utterance.onerror = () => {
        speakNextSentenceChunk();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      speakNextSentenceChunk();
    }
  };

  // Start Gemini 2.0 Flash Voice AI Engine
  const startGeminiVoiceSession = async () => {
    setConnectionState('requesting');
    setErrorMessage('');

    try {
      // 1. Yêu cầu quyền Microphone & khởi tạo Audio Visualizer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      // Web Audio API để đo volume sóng âm theo thời gian thực
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const updateVolumeLoop = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioVolume(Math.min(100, Math.round(avg * 1.6)));
        animationFrameRef.current = requestAnimationFrame(updateVolumeLoop);
      };
      updateVolumeLoop();

      // 2. Thiết lập Speech Recognition tiếng Việt liên tục
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        throw new Error('Trình duyệt của bạn chưa hỗ trợ Web Speech API. Vui lòng sử dụng Google Chrome hoặc Edge.');
      }

      const recognizer = new SpeechRec();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'vi-VN';

      recognizer.onend = () => {
        // Tự động kết nối lại nếu phiên vẫn đang mở và không cố tình đóng
        if (micStreamRef.current && recognitionRef.current) {
          try { recognizer.start(); } catch (e) {}
        }
      };

      // BARGE-IN: Khi người dùng cất tiếng nói, ngắt lời AI ngay tức thì
      recognizer.onspeechstart = () => {
        if (isSpeakingRef.current) {
          stopSpeaking();
          setConnectionState('listening');
        }
      };

      recognizer.onresult = (event) => {
        if (isSpeakingRef.current) {
          stopSpeaking();
          setConnectionState('listening');
        }

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            baseSpeechRef.current = (baseSpeechRef.current ? baseSpeechRef.current + ' ' : '') + piece.trim();
          } else {
            interim += piece;
          }
        }

        const candidateSpeech = (baseSpeechRef.current + (interim ? ' ' + interim : '')).trim();

        // SILENCE DETECTION (VAD 1.2s): Tự động gửi câu hỏi khi ứng viên ngừng nói 1.2s
        if (candidateSpeech) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const finalSpeech = (baseSpeechRef.current || candidateSpeech).trim();
            if (finalSpeech.length >= 3 && !isProcessingRef.current) {
              handleSendCandidateTurn(finalSpeech);
            }
          }, 1200);
        }
      };

      recognizer.onerror = (e) => {
        console.warn('SpeechRecognition error:', e);
      };

      recognizer.start();
      recognitionRef.current = recognizer;

      setConnectionState('listening');

      // AI gửi lời chào mở đầu tự nhiên
      const greeting = `Chào bạn, mình là Hoàng - Chuyên gia Tuyển dụng AI của HireMate. Mình rất vui được hỗ trợ bạn phỏng vấn hoặc giải đáp cơ hội việc làm hôm nay. Bạn muốn bắt đầu với câu hỏi nào trước?`;
      const greetingTurn = {
        id: `ai-init-${Date.now()}`,
        role: 'assistant',
        text: greeting,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscripts([greetingTurn]);
      speakWithSentenceChunking(greeting);

    } catch (err) {
      console.error('Lỗi khởi động Gemini Voice Engine:', err);
      setConnectionState('error');
      setErrorMessage(err.message || 'Không thể truy cập Microphone hoặc khởi động giọng nói.');
      cleanupAllResources();
    }
  };

  // Gửi một lượt nói của ứng viên lên Backend (Gemini 2.0 Flash)
  const handleSendCandidateTurn = async (userSpeechText) => {
    if (!userSpeechText || isProcessingRef.current) return;
    isProcessingRef.current = true;
    baseSpeechRef.current = '';

    const userTurn = {
      id: `cand-${Date.now()}`,
      role: 'candidate',
      text: userSpeechText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscripts((prev) => [...prev, userTurn]);
    setConnectionState('thinking');

    try {
      // Chuẩn bị lịch sử hội thoại gần nhất
      const historyStrings = transcripts.slice(-4).map((t) => `${t.role === 'candidate' ? 'Ứng viên' : 'Hoàng'}: ${t.text}`);
      historyStrings.push(`Ứng viên: ${userSpeechText}`);

      const res = await interviewApi.processVoiceTurnStandalone({
        targetPosition: selectedTopic,
        userSpeech: userSpeechText,
        history: historyStrings,
        persona: initialContext.persona || 'TECH_LEAD',
        difficulty: initialContext.difficulty || 'STANDARD',
      });

      const aiReply = res?.data?.reply || 'Mình hiểu rồi. Bạn có thể nói chi tiết hơn về phần này không?';

      const aiTurn = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setTranscripts((prev) => [...prev, aiTurn]);
      speakWithSentenceChunking(aiReply);

    } catch (err) {
      console.warn('Lỗi xử lý Voice Turn:', err);
      setConnectionState('listening');
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Start Call Handler
  const handleStartCall = async () => {
    setErrorMessage('');
    if (engineMode === 'gemini') {
      await startGeminiVoiceSession();
      return;
    }

    // Mode WebRTC OpenAI
    setConnectionState('requesting');
    try {
      const res = await voiceAgentApi.createSession({
        targetPosition: selectedTopic,
        level: initialContext.level || 'Middle',
        voice: 'alloy',
        jobId: initialContext.jobId || null,
      });

      const sessionData = res?.data || res;
      if (!sessionData?.clientSecret) {
        throw new Error('Máy chủ không trả về token bảo mật cho WebRTC.');
      }

      await manager.start({
        clientSecret: sessionData.clientSecret,
        model: sessionData.model || 'gpt-4o-realtime-preview',
        user: user,
        callbacks: {
          onStateChange: (state) => setConnectionState(state),
          onTranscriptUpdate: (list) => setTranscripts(list),
          onError: (err) => setErrorMessage(err),
          onVolumeChange: (vol) => setAudioVolume(vol),
        },
      });
    } catch (err) {
      console.warn('WebRTC thất bại, tự động chuyển đổi sang Gemini 2.0 Flash Voice AI Engine:', err);
      // Seamless Fallback to Gemini Voice AI
      setEngineMode('gemini');
      await startGeminiVoiceSession();
    }
  };

  const handleToggleMute = () => {
    if (engineMode === 'webrtc') {
      const muted = manager.toggleMute();
      setIsMuted(muted);
    } else {
      if (micStreamRef.current) {
        const audioTracks = micStreamRef.current.getAudioTracks();
        const nextMuteState = !isMuted;
        audioTracks.forEach((t) => { t.enabled = !nextMuteState; });
        setIsMuted(nextMuteState);
      }
    }
  };

  const handleEndCall = () => {
    cleanupAllResources();
    setConnectionState('idle');
    setAudioVolume(0);
  };

  if (!isOpen) return null;

  // Status mapping
  const getStatusBadge = () => {
    switch (connectionState) {
      case 'requesting':
        return { label: 'Đang xin quyền Microphone & Kết nối...', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'connecting':
        return { label: 'Đang kết nối Realtime Server...', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'listening':
        return { label: 'Đang lắng nghe bạn (Nói tiếng Việt tự nhiên)...', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'thinking':
        return { label: 'AI đang suy nghĩ phản hồi (<0.5s)...', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse' };
      case 'speaking':
        return { label: 'AI đang trò chuyện bằng giọng nói...', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'error':
        return { label: 'Lỗi kết nối', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      default:
        return { label: 'Sẵn sàng bắt đầu hội thoại', color: 'bg-slate-700/40 text-slate-300 border-slate-600/30' };
    }
  };

  const badge = getStatusBadge();
  const isCallActive = ['connecting', 'listening', 'thinking', 'speaking'].includes(connectionState);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl transition-all">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0e131f] border border-white/10 shadow-2xl shadow-indigo-950/60 overflow-hidden text-slate-100">

        {/* Glow Effects Background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-indigo-500/30 text-white">
              <span className="material-symbols-outlined text-2xl">graphic_eq</span>
              {isCallActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Trợ Lý Phỏng Vấn & Tuyển Dụng Giọng Nói AI
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {engineMode === 'gemini' ? 'Gemini 3.5 Flash Neural Voice' : 'OpenAI WebRTC'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Giao tiếp hai chiều bằng giọng nói tiếng Việt tức thì • Tự động ngắt câu sau 1.2s • Ngắt lời AI (Barge-in)
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Status Notification Strip */}
        <div className="relative z-10 px-6 py-2.5 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium ${badge.color}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {badge.label}
            </span>

            {isCallActive && (
              <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-amber-400">tips_and_updates</span>
                Mẹo: Bạn có thể cất tiếng nói bất kỳ lúc nào để ngắt lời AI!
              </span>
            )}
          </div>

          {/* Engine & Voice Chooser */}
          {!isCallActive && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-xs">AI Engine:</span>
                <select
                  value={engineMode}
                  onChange={(e) => setEngineMode(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                >
                  <option value="gemini" className="bg-slate-900">Gemini 2.0 Flash (Siêu tốc)</option>
                  <option value="webrtc" className="bg-slate-900">OpenAI Realtime WebRTC</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-xs">Giọng:</span>
                <select
                  value={voiceChoice}
                  onChange={(e) => setVoiceChoice(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                >
                  <option value="vi-male" className="bg-slate-900">Nam (Trầm ấm, Chuyên gia)</option>
                  <option value="vi-female" className="bg-slate-900">Nữ (Truyền cảm, Tự nhiên)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">

          {/* Left Column: Interactive Orb & Audio Visualizer (5 cols) */}
          <div className="md:col-span-5 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-b from-white/[0.01] to-black/30">

            {/* Dynamic Interactive Voice Orb */}
            <div className="relative my-6 flex items-center justify-center">
              {/* Outer Glowing Rings */}
              <div
                className={`absolute rounded-full transition-all duration-300 ${
                  connectionState === 'speaking'
                    ? 'w-48 h-48 bg-indigo-500/25 blur-xl scale-125 animate-pulse'
                    : connectionState === 'listening'
                    ? 'w-44 h-44 bg-emerald-500/25 blur-xl scale-110'
                    : connectionState === 'thinking'
                    ? 'w-44 h-44 bg-purple-500/25 blur-xl animate-spin'
                    : 'w-36 h-36 bg-slate-700/10 blur-md'
                }`}
              />

              {/* Middle Pulsing Halo */}
              <div
                className={`w-32 h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-inner ${
                  connectionState === 'speaking'
                    ? 'border-indigo-400 bg-gradient-to-tr from-indigo-900/60 to-purple-800/60 shadow-indigo-500/40 scale-105'
                    : connectionState === 'listening'
                    ? 'border-emerald-400 bg-gradient-to-tr from-emerald-950/60 to-teal-900/60 shadow-emerald-500/40'
                    : connectionState === 'thinking'
                    ? 'border-purple-400 bg-gradient-to-tr from-purple-950/60 to-fuchsia-950/60'
                    : 'border-white/10 bg-slate-900/60'
                }`}
                style={{
                  transform: connectionState === 'speaking' || connectionState === 'listening'
                    ? `scale(${1 + audioVolume * 0.003})`
                    : 'scale(1)',
                }}
              >
                {/* Core Icon / Waveform */}
                {connectionState === 'thinking' ? (
                  <span className="material-symbols-outlined text-4xl text-purple-300 animate-spin">
                    progress_activity
                  </span>
                ) : connectionState === 'speaking' ? (
                  <div className="flex items-center gap-1">
                    {[40, 75, 100, 60, 90, 45, 80].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-indigo-300 rounded-full animate-pulse"
                        style={{
                          height: `${Math.max(12, (h * audioVolume) / 100)}px`,
                          animationDelay: `${i * 90}ms`,
                        }}
                      />
                    ))}
                  </div>
                ) : connectionState === 'listening' ? (
                  <div className="flex items-center gap-1">
                    {[30, 60, 85, 50, 75, 40].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(10, (h * audioVolume) / 100)}px`,
                        }}
                      />
                    ))}
                  </div>
                ) : connectionState === 'error' ? (
                  <span className="material-symbols-outlined text-4xl text-rose-400">
                    error_outline
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    mic_none
                  </span>
                )}
              </div>
            </div>

            {/* Context Topic Info */}
            <div className="w-full max-w-xs text-center space-y-1 mb-4">
              <p className="text-xs font-semibold text-slate-300 truncate">
                {selectedTopic}
              </p>
              <p className="text-[11px] text-slate-500">
                {user?.fullName || 'Ứng viên'} • Chuyên gia AI Hoàng
              </p>
            </div>

            {/* Call Action Controls */}
            <div className="flex items-center gap-3">
              {!isCallActive ? (
                <button
                  onClick={handleStartCall}
                  disabled={connectionState === 'requesting'}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">call</span>
                  {connectionState === 'requesting' ? 'Đang kích hoạt...' : 'Bắt đầu cuộc gọi'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleToggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                        : 'bg-white/10 text-slate-200 border border-white/20 hover:bg-white/20'
                    }`}
                    title={isMuted ? 'Bật Microphone' : 'Tắt Microphone'}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isMuted ? 'mic_off' : 'mic'}
                    </span>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">call_end</span>
                    Kết thúc
                  </button>
                </>
              )}
            </div>

            {/* Error Message Alert with Retry */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs text-center max-w-xs flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-rose-400 shrink-0">warning</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="px-3 py-1 bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/50 text-white rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">refresh</span>
                  <span>Thử lại kết nối</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Live Transcription Feed (7 cols) */}
          <div className="md:col-span-7 flex flex-col h-[380px] md:h-[480px] bg-black/30">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="material-symbols-outlined text-base text-indigo-400">forum</span>
                Bản Ghi Hội Thoại Thời Gian Thực (Live Transcript)
              </div>
              <span className="text-[10px] text-slate-500">
                {transcripts.length} lượt trao đổi
              </span>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-600">record_voice_over</span>
                  <p className="text-xs">Chưa có nội dung hội thoại.</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Nhấn "Bắt đầu cuộc gọi" và nói tiếng Việt tự nhiên với trợ lý AI. Văn bản hội thoại sẽ tự động xuất hiện tại đây theo thời gian thực.
                  </p>
                </div>
              ) : (
                transcripts.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col ${
                      item.role === 'candidate' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                      <span>{item.role === 'candidate' ? 'Bạn' : 'Trợ lý Hoàng'}</span>
                      <span>•</span>
                      <span>{item.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                        item.role === 'candidate'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                          : 'bg-white/10 text-slate-200 border border-white/10 rounded-tl-none'
                      }`}
                    >
                      {item.text || (
                        <span className="italic text-slate-400 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                          Đang trả lời...
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Suggestions / Tools Hint */}
            <div className="p-3 border-t border-white/5 bg-white/[0.02]">
              <p className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-indigo-400">psychology</span>
                Gợi ý câu hỏi giọng nói mẫu:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Tìm giúp tôi các việc làm React tại Hà Nội',
                  'Xem danh sách đơn tôi đã ứng tuyển',
                  'Phỏng vấn thử tôi câu hỏi về Tối ưu hóa Database',
                  'Mẹo trả lời câu hỏi mức lương mong muốn',
                ].map((hint, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 cursor-default transition-all"
                  >
                    "{hint}"
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 border-t border-white/10 bg-black/40 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-400">verified_user</span>
            Bảo mật phiên: Multi-Key Architecture (Gemini 2.0 Flash Voice AI & WebRTC)
          </div>
          <div className="text-slate-500 hidden sm:block">
            Powered by Google Gemini Voice API & HireMate Recruitment Core
          </div>
        </div>

      </div>
    </div>
  );
}
