import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const VoiceInteraction = ({ onResult, placeholder }) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      const langMap = {
        en: 'en-US',
        hi: 'hi-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        te: 'te-IN',
        ta: 'ta-IN'
      };
      
      rec.lang = langMap[language] || 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (onResult) {
          onResult(text);
        }
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setError('Microphone permission denied.');
        } else {
          setError('Could not hear clearly. Try again.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [language, onResult]);

  const toggleListening = () => {
    if (!recognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setError(null);
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-3.5 rounded-full transition-all duration-300 shadow-md ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse ring-4 ring-red-200 dark:ring-red-950Scale'
            : 'bg-healthcare-500 hover:bg-healthcare-600 text-white hover:scale-105'
        }`}
        title={isListening ? 'Stop Listening' : 'Talk now'}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      
      {isListening && (
        <span className="text-xs font-semibold text-red-500 mt-1 animate-bounce">
          {placeholder || t('speakNow')}
        </span>
      )}

      {error && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInteraction;
