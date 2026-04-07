'use client';

import { useState, useCallback, useEffect } from 'react';
import { createSpeechRecognition, isWebSpeechSupported, ISpeechRecognition, SpeechRecognitionEvent } from '@/lib/voice-parser';

interface Props {
  onResult: (text: string) => void;
}

export default function VoiceInput({ onResult }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);

  useEffect(() => {
    setIsSupported(isWebSpeechSupported());
  }, []);

  const startListening = useCallback(() => {
    const rec = createSpeechRecognition();
    if (!rec) return;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
    rec.start();
  }, [onResult]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening
          ? 'bg-[#E10600] text-white'
          : 'bg-gray-100 text-gray-600 hover:text-[#E10600] hover:bg-gray-200'
        }`}
    >
      {isListening ? (
        <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}
