"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, Mic, X, Volume2, Sparkles, Mic as MicIcon } from "lucide-react";
import { PermissionModal } from "./PermissionModal";

import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

interface SearchProps {
  onSearchChange: (query: string) => void;
  onCategorySelect?: (categoryId: string) => void;
  selectedLanguage?: string; // e.g. 'hi-IN' | 'en-IN' | 'ta-IN' | 'te-IN' | 'kn-IN'
}

export const SearchWithVoice: React.FC<SearchProps> = ({
  onSearchChange,
  onCategorySelect,
  selectedLanguage = "hi-IN",
}) => {
  const [query, setQuery] = useState("");
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
    <div className="w-full max-w-md mx-auto">
      <div className={`relative flex items-center bg-white rounded-[24px] border-2 transition-all overflow-hidden ${
        isListening ? "border-amber-500 shadow-lg shadow-amber-500/20" : "border-transparent"
      }`}>
        <Search className="w-5 h-5 ml-4 text-gray-400"/>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearchChange(e.target.value);
          }}
          placeholder={isListening ? "Listening... बोलिए..." : "Search 'electrician', 'water leak'..."}
          className="w-full py-4 px-3 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-500 font-medium"
        />

        {query && (
          <button onClick={handleClear} className="p-1 mr-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4"/>
          </button>
        )}

        <button
          onClick={toggleVoiceSearch}
          className={`p-2.5 mr-2 rounded-2xl transition-all ${
            isListening
              ? "bg-amber-500 text-white animate-pulse scale-110"
              : "text-white hover:opacity-90"
          }`}
          style={{ background: isListening ? '' : '#0B3D66' }}
          title="Voice Search"
        >
          <Mic className="w-5 h-5"/>
        </button>
      </div>

      {isListening && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs font-bold text-amber-600 animate-pulse">
          <Sparkles className="w-4 h-4"/>
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
