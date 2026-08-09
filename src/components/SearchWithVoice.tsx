"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, X, Volume2, Sparkles, Mic as MicIcon } from "lucide-react";
import { PermissionModal } from "./PermissionModal";

import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

interface SearchProps {
  value: string;
  onSearchChange: (query: string) => void;
  onCategorySelect?: (categoryId: string) => void;
  selectedLanguage?: string; // e.g. 'hi-IN' | 'en-IN' | 'ta-IN' | 'te-IN' | 'kn-IN'
  placeholder?: string;
  listeningPlaceholder?: string;
}

export const SearchWithVoice: React.FC<SearchProps> = ({
  value,
  onSearchChange,
  onCategorySelect,
  selectedLanguage = "hi-IN",
  placeholder = "Search 'electrician', 'water leak'...",
  listeningPlaceholder = "Listening... बोलिए...",
}) => {
  const [query, setQuery] = useState(value);
  
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const [isListening, setIsListening] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const recognitionRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    // Setup for Web Fallback
    if (!Capacitor.isNativePlatform()) {
      const WebSpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (WebSpeechRecognition) {
        const recognition = new WebSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          
          setQuery(transcript);
          onSearchChange(transcript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    } else {
      // Setup for Native (Capacitor)
      // For continuous/partial results on Capacitor:
      const setupNativeListener = async () => {
        if (listenerRef.current) return;
        
        try {
          const listener = await SpeechRecognition.addListener('partialResults', (data: any) => {
            if (data.matches && data.matches.length > 0) {
              setQuery(data.matches[0]);
              onSearchChange(data.matches[0]);
            }
          });
          listenerRef.current = listener;
        } catch (e) {
          console.error("Speech Recognition Listener Error:", e);
        }
      };
      setupNativeListener();
    }
    
    return () => {
      if (listenerRef.current && listenerRef.current.remove) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [selectedLanguage, onSearchChange]);

  const startListening = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        setIsListening(true);
        await SpeechRecognition.start({
          language: selectedLanguage,
          maxResults: 2,
          prompt: "Say what you are looking for...",
          partialResults: true,
          popup: false,
        });
      } catch (error) {
        console.error("Speech Recognition Error:", error);
        setIsListening(false);
      }
    } else {
      if (!recognitionRef.current) return;
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await SpeechRecognition.stop();
      } catch (error) {
        console.error(error);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
    setIsListening(false);
  };

  const toggleVoiceSearch = async () => {
    if (isListening) {
      stopListening();
    } else {
      if (Capacitor.isNativePlatform()) {
        const { available } = await SpeechRecognition.available();
        if (!available) {
          alert("Voice speech recognition is not supported on this device.");
          return;
        }

        const permission = await SpeechRecognition.checkPermissions();
        if (permission.speechRecognition !== 'granted') {
          setShowPermissionModal(true);
        } else {
          setHasPermission(true);
          startListening();
        }
      } else {
        if (!recognitionRef.current) {
          alert("Voice speech recognition is not supported on this browser.");
          return;
        }
        
        if (!hasPermission) {
          setShowPermissionModal(true);
        } else {
          startListening();
        }
      }
    }
  };

  const handlePermissionAllow = async () => {
    setShowPermissionModal(false);
    if (Capacitor.isNativePlatform()) {
      const permission = await SpeechRecognition.requestPermissions();
      if (permission.speechRecognition === 'granted') {
        setHasPermission(true);
        startListening();
      }
    } else {
      setHasPermission(true);
      startListening();
    }
  };

  const handlePermissionDeny = () => {
    setShowPermissionModal(false);
  };

  const handleClear = () => {
    setQuery("");
    onSearchChange("");
  };

  const speakResult = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div style={{ width: '100%', margin: '0 auto', marginTop: '-20px' }}>
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          borderRadius: 24,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          boxShadow: isListening 
            ? '0 8px 30px rgba(245, 158, 11, 0.4)' 
            : '0 8px 30px rgba(0,0,0,0.12)',
          border: isListening ? '2px solid #F59E0B' : '2px solid transparent',
          margin: '0 8px',
        }}
      >
        <Search size={20} color="#94A3B8" style={{ marginLeft: 16 }} />

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearchChange(e.target.value);
          }}
          placeholder={isListening ? listeningPlaceholder : placeholder}
          style={{
            flex: 1,
            padding: '16px 12px',
            fontSize: 14,
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#0F172A',
            width: '100%'
          }}
        />

        {query && (
          <button 
            onClick={handleClear}
            style={{
              padding: 4,
              marginRight: 4,
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        )}

        <button
          onClick={toggleVoiceSearch}
          style={{
            padding: 10,
            marginRight: 8,
            borderRadius: 16,
            border: 'none',
            transition: 'all 0.3s ease',
            background: isListening ? '#F59E0B' : '#0B3D66',
            color: 'white',
            cursor: 'pointer',
            transform: isListening ? 'scale(1.1)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Voice Search"
        >
          <Mic size={20} />
        </button>
      </div>

      {isListening && (
        <div style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 800,
          color: '#F59E0B',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <Sparkles size={16} />
          Listening in {selectedLanguage.split("-")[0].toUpperCase()}... Speak now
        </div>
      )}
      
      <PermissionModal 
        isOpen={showPermissionModal}
        title="Allow Microphone Access"
        description="Neighborly Trust needs microphone access to enable voice search. Your audio is only used for search purposes and is never recorded."
        icon={<MicIcon className="w-8 h-8" />}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />
    </div>
  );
}
