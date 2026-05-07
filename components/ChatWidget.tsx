
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createChatSession, transcribeAudio } from '../services/geminiService';
import type { LanguageCode, Language, ChatMessage } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import SendIcon from './icons/SendIcon';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import SpeakerXMarkIcon from './icons/SpeakerXMarkIcon';
import WaveformIcon from './icons/WaveformIcon';
import SlimeIcon from './icons/SlimeIcon';

interface ChatWidgetProps {
  currentLanguage: LanguageCode;
  languages: Language[];
  onAutoGenerate?: (ingredients: string) => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  startLiveOnOpen?: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  currentLanguage, 
  languages, 
  onAutoGenerate, 
  isOpen, 
  onToggle, 
  startLiveOnOpen 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Live Mode States
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLiveListening, setIsLiveListening] = useState(false);
  // Transcript buffer for continuous listening
  const [liveTranscript, setLiveTranscript] = useState('');
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const liveRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error("Failed to read blob"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  // Refs for silence detection logic
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTranscriptRef = useRef('');
  const resumeListeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const langObj = languages.find(l => l.code === currentLanguage);
    const langName = langObj ? langObj.name : 'Bahasa Melayu';
    
    chatSessionRef.current = createChatSession(langName);
    
    if (messages.length === 0) {
      const greeting = currentLanguage === 'ms' 
        ? "Hai! Saya Toma. Nak saya bantu cari/jana resepi apa hari ni?"
        : "Hello! I'm Toma. What recipe can I help you find/generate today?";
      
      setMessages([{
        id: 'init',
        role: 'model',
        text: greeting,
        timestamp: Date.now()
      }]);
    }
  }, [currentLanguage, languages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis.cancel();
      stopLiveListening();
      setIsLiveMode(false);
      if (resumeListeningTimerRef.current) clearTimeout(resumeListeningTimerRef.current);
    } else {
        // If opened with auto-start live mode
        if (startLiveOnOpen) {
            const timer = setTimeout(() => {
                if (!isLiveMode) {
                    setIsLiveMode(true);
                    setIsMuted(false);
                    startLiveListening();
                }
            }, 600); 
            return () => clearTimeout(timer);
        }
    }
  }, [isOpen, startLiveOnOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, liveTranscript]);

  // Simple heuristic to guess language of the text response
  const detectTextLanguage = (text: string): string => {
      const malayPattern = /\b(saya|awak|kita|ada|apa|nak|boleh|resipi|masak|makan|itu|ini|dan|yang|untuk|dengan)\b/i;
      const englishPattern = /\b(i|you|we|have|what|want|can|recipe|cook|eat|this|that|and|for|the|is|are|with)\b/i;

      if (malayPattern.test(text)) return 'ms-MY';
      if (englishPattern.test(text)) return 'en-US';
      
      const langMap: Record<string, string> = { 'ms': 'ms-MY', 'en': 'en-US' };
      return langMap[currentLanguage] || 'ms-MY';
  };

  const stopAndTranscribe = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
    }
    setAudioLevel(0);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    } else {
        // If not recording or already stopped, just clear states
        setIsLiveListening(false);
        setLiveTranscript('');
    }
  }, []);

  const startLiveListening = useCallback(() => {
    if (!isLiveMode || isTyping || window.speechSynthesis.speaking) return;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        // Audio Visualizer & VAD Setup
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let silenceCounter = 0;

        const updateLevel = () => {
             analyser.getByteFrequencyData(dataArray);
             let sum = 0;
             for (let i = 0; i < bufferLength; i++) {
                 sum += dataArray[i];
             }
             const avg = sum / bufferLength;
             
             // Create a dramatic scaling effect for the UI
             setAudioLevel(Math.min(100, Math.round((avg / 80) * 100)));
             
             // Volume-based Voice Activity Detection (VAD)
             if (avg > 5) { // User is speaking
                 silenceCounter = 0;
             } else { // Silence
                 silenceCounter += 1;
             }

             // Assuming ~60fps, 120 frames = ~2.0 seconds of silence
             if (silenceCounter > 120) {
                 stopAndTranscribe();
                 return;
             }
             
             animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        
        setIsLiveListening(true);
        setLiveTranscript('');

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            setIsLiveListening(false);
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            if (audioChunksRef.current.length > 0) {
                setLiveTranscript(currentLanguage === 'ms' ? 'Menterjemah Groq...' : 'Transcribing...');
                setIsTyping(true);
                try {
                    const base64 = await blobToBase64(audioBlob);
                    const text = await transcribeAudio(base64);
                    if (text && text.trim()) {
                        handleSendMessage(text);
                        return; // success
                    }
                } catch(e) {
                    console.error("Groq Transcription failed:", e);
                } finally {
                    setIsTyping(false);
                    setLiveTranscript('');
                }
            }

            if (isLiveMode && isOpen) {
                resumeListeningTimerRef.current = setTimeout(() => {
                    startLiveListening();
                }, 500);
            }
        };

        mediaRecorder.start();
        updateLevel(); // Start visualizer & VAD

    }).catch(err => {
        console.error("Mic access denied or error:", err);
        setIsLiveMode(false);
    });

  }, [isLiveMode, isTyping, currentLanguage, isOpen]);

  const stopLiveListening = useCallback(() => {
    stopAndTranscribe();
    setIsLiveListening(false);
    setLiveTranscript('');
    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, [stopAndTranscribe]);

  const speakText = useCallback((text: string) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) {
        if (isLiveMode && isOpen) {
             setTimeout(() => startLiveListening(), 500);
        }
        return;
    }
    
    stopLiveListening();
    if (resumeListeningTimerRef.current) clearTimeout(resumeListeningTimerRef.current);
    window.speechSynthesis.cancel();

    // Clean text of emojis for reading
    const cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    
    const detectedLang = detectTextLanguage(cleanText);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = detectedLang;
    
    // Voice Selection Optimization
    let selectedVoice: SpeechSynthesisVoice | undefined;

    const findVoice = (lang: string, keywords: string[]) => {
        return availableVoices.find(v => 
            v.lang === lang && keywords.some(k => v.name.includes(k))
        );
    };

    // 1. Priority: "Google" voices (Neural/Better quality on Android/Chrome)
    selectedVoice = findVoice(detectedLang, ['Google']);

    // 2. Priority: Known good female voices
    if (!selectedVoice) {
        selectedVoice = findVoice(detectedLang, ['Female', 'Samantha', 'Zira', 'Siri']);
    }
    
    // 3. Fallback
    if (!selectedVoice) {
         selectedVoice = availableVoices.find(v => v.lang === detectedLang);
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    // TWEAK: Increase rate slightly to fix "sebutir sebutir" (robotic slow) issues
    utterance.rate = 1.1; 
    utterance.pitch = 1.0;

    utterance.onend = () => {
        if (isLiveMode && isOpen) {
            resumeListeningTimerRef.current = setTimeout(() => {
                startLiveListening();
            }, 500); // Shorter delay for snappier conversation
        }
    };
    
    utterance.onerror = () => {
         if (isLiveMode && isOpen) {
             resumeListeningTimerRef.current = setTimeout(() => {
                startLiveListening();
            }, 500);
         }
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isLiveMode, isMuted, availableVoices, isOpen, startLiveListening]);

  const toggleLiveMode = () => {
      const newMode = !isLiveMode;
      setIsLiveMode(newMode);
      
      if (newMode) {
          setIsMuted(false);
          startLiveListening();
      } else {
          stopLiveListening();
          window.speechSynthesis.cancel();
          if (resumeListeningTimerRef.current) clearTimeout(resumeListeningTimerRef.current);
      }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || !chatSessionRef.current) return;

    window.speechSynthesis.cancel();
    stopLiveListening(); // Ensure mic is off while processing
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLiveTranscript(''); // Clear live buffer on send
    latestTranscriptRef.current = '';
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: textToSend });
      
      let fullResponse = '';
      const responseId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: responseId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of result) {
         const functionCalls = chunk.functionCalls;
         if (functionCalls && functionCalls.length > 0) {
             const call = functionCalls[0];
             if (call.name === 'triggerRecipeApp' && onAutoGenerate) {
                 const args = call.args as { ingredients: string };
                 onAutoGenerate(args.ingredients);
                 
                 fullResponse = currentLanguage === 'ms' 
                    ? `Baik! Saya sedang menjana resepi untuk ${args.ingredients}...`
                    : `Sure! Generating a recipe for ${args.ingredients}...`;
             }
         }

         const c = chunk as GenerateContentResponse;
         if (c.text) {
             fullResponse += c.text;
         }
         
         setMessages(prev => prev.map(msg => 
            msg.id === responseId 
              ? { ...msg, text: fullResponse } 
              : msg
         ));
         scrollToBottom();
      }

      if (fullResponse) {
        speakText(fullResponse);
      } else {
           // If empty response (e.g. tool call only), restart listening
           if (isLiveMode && isOpen) {
             setTimeout(() => startLiveListening(), 500);
           }
      }
      
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: currentLanguage === 'ms' ? "Maaf, ada masalah sambungan." : "Sorry, connection error.",
        timestamp: Date.now()
      }]);
      if (isLiveMode && isOpen) {
         setTimeout(() => startLiveListening(), 1000);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => onToggle(!isOpen)}
        className={`fixed bottom-6 right-6 md:right-24 z-50 p-2 rounded-full shadow-lg transition-all duration-300 overflow-visible border border-gray-100 bg-white hover:scale-105 hover:shadow-xl ${
          isOpen 
            ? 'opacity-0 pointer-events-none scale-0' 
            : 'opacity-100 scale-100'
        }`}
        aria-label="Toggle Chef Chat"
      >
         <SlimeIcon className="w-10 h-10" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed z-40 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl transition-all duration-300 origin-bottom-right
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
          }
          w-full sm:w-[380px] 
          h-[85dvh] sm:h-[500px] sm:max-h-[80vh]
          rounded-t-2xl sm:rounded-2xl
          bottom-0 sm:bottom-24 right-0 sm:right-6
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-emerald-600 text-white rounded-t-2xl shadow-sm relative overflow-hidden shrink-0">
          {isLiveMode && (
              <div className="absolute inset-0 bg-emerald-500/30 pointer-events-none animate-pulse"></div>
          )}
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
                <SlimeIcon className="w-12 h-12 shadow-sm border border-white/20" />
            </div>

            <div>
              <h3 className="font-bold text-lg leading-tight">Chef Toma</h3>
              <p className="text-xs text-emerald-100 opacity-90 flex items-center gap-1">
                {isLiveMode && isLiveListening 
                    ? <span className="flex items-center gap-1 text-white font-bold"><span className="w-2 h-2 bg-red-400 rounded-full animate-ping"></span> Listening...</span> 
                    : isTyping 
                        ? (currentLanguage === 'ms' ? 'Sedang menaip...' : 'Typing...') 
                        : (currentLanguage === 'ms' ? 'Pembantu Maya' : 'Virtual Assistant')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
              <button 
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  if (newMuted) window.speechSynthesis.cancel();
                }}
                className="p-2 bg-emerald-700/50 hover:bg-emerald-700 rounded-full transition-colors"
                title={isMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isMuted ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => onToggle(false)}
                className="p-2 bg-emerald-700/50 hover:bg-emerald-700 rounded-full transition-colors text-white"
                title="Close Chat"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-md' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100 rounded-b-none sm:rounded-b-2xl shrink-0">
           {isLiveMode ? (
               <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 text-sm mb-1 shadow-inner relative overflow-hidden">
                   {/* Audio Visualizer Background Bar */}
                   <div 
                       className="absolute left-0 bottom-0 top-0 bg-emerald-200/50 transition-all duration-75 ease-out"
                       style={{ width: `${audioLevel}%` }}
                   />
                   
                   <div className="flex items-center gap-2 relative z-10">
                       <WaveformIcon className={`w-4 h-4 ${audioLevel > 5 ? 'animate-bounce text-emerald-600' : 'animate-pulse text-emerald-400'}`} />
                       <span className="font-bold">
                           {liveTranscript ? liveTranscript : (currentLanguage === 'ms' ? 'Sedang mendengar (Kuasa Groq)...' : 'Listening (Powered by Groq)...')}
                       </span>
                   </div>
               </div>
           ) : null}

          <div className="flex items-end gap-2 bg-gray-50 rounded-3xl p-2 pl-4 border border-gray-200 focus-within:border-emerald-500/50 focus-within:bg-white focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={currentLanguage === 'ms' ? "Borak dengan Chef..." : "Chat with Chef..."}
              className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm max-h-24 resize-none py-2.5 outline-none appearance-none"
              rows={1}
              disabled={isLiveMode}
            />
            
            <div className="flex items-center gap-1 pb-1">
              <button
                onClick={toggleLiveMode}
                className={`p-2 rounded-full transition-all duration-300 ${
                    isLiveMode 
                        ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' 
                        : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                }`}
                title="Voice Chat / Live Mode"
              >
                  <WaveformIcon className={`w-5 h-5 ${isLiveMode ? 'animate-pulse' : ''}`} />
              </button>

              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping || isLiveMode}
                className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
