
import React, { useState, useEffect, useRef } from 'react';
import MicIcon from './icons/MicIcon';
import type { LanguageCode } from '../types';

interface VoiceInputProps {
  onResult: (text: string) => void;
  languageCode: LanguageCode;
  disabled?: boolean;
}

// Extend Window interface for WebkitSpeechRecognition (Safari/older Chrome)
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, languageCode, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Map app language codes to Web Speech API locales
  const getLocale = (code: string) => {
    const map: Record<string, string> = {
      'ms': 'ms-MY',
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'zh': 'zh-CN',
      'hi': 'hi-IN',
      'ar': 'ar-SA'
    };
    return map[code] || 'en-US';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!isSupported) {
      alert("Maaf, pelayar anda tidak menyokong input suara. Sila gunakan Google Chrome atau Safari terkini.");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      // Initialize new instance every time to ensure fresh config
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = getLocale(languageCode);
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        // Handle common errors gracefully without logging scary errors
        if (event.error === 'no-speech') {
            // Silence detected, just stop listening
            setIsListening(false);
            return;
        }
        if (event.error === 'aborted') {
            setIsListening(false);
            return;
        }
        if (event.error === 'not-allowed') {
            alert("Akses mikrofon tidak dibenarkan. Sila semak tetapan pelayar anda.");
            setIsListening(false);
            return;
        }

        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`
        p-2 rounded-full transition-all duration-300 flex items-center justify-center
        ${isListening 
          ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse' 
          : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={isListening ? "Hentikan" : "Sebut bahan"}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
    >
      <MicIcon className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
    </button>
  );
};

export default VoiceInput;
