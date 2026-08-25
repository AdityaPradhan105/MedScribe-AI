import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../utils/api';
import { Mic, MicOff, Volume2, ShieldAlert, BookOpen, VolumeX } from 'lucide-react';

const VoiceAssistant = () => {
  const { t, language } = useLanguage();
  const { speakText, stopSpeaking, isSpeaking } = useAccessibility();

  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        setError('');
        setSpeechResult('');
        setAiResponse('');
        stopSpeaking();
      };

      rec.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setSpeechResult(text);
        setIsListening(false);
        await queryAI(text);
      };

      rec.onerror = (e) => {
        console.error(e.error);
        if (e.error === 'not-allowed') {
          setError('Microphone permission denied.');
        } else {
          setError('Could not hear clearly. Please tap the button and speak again.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [language]);

  const toggleVoice = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const queryAI = async (queryText) => {
    setLoading(true);
    try {
      const res = await api.sendChatMessage(
        [],
        `Explain simply or answer: ${queryText}`,
        language
      );
      if (res.success) {
        setAiResponse(res.data.message);
        // Play reply aloud immediately
        speakText(res.data.message);
      } else {
        const errorMsg = res.message === 'SERVER_BUSY' ? t('rateLimit') : (res.message || 'Error processing response.');
        setError(errorMsg);
        speakText(errorMsg);
      }
    } catch (err) {
      setError('Could not connect to health database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center py-6 px-4">
      <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        <div>
          <h2 className="font-bold text-2xl sm:text-3xl text-gray-800 dark:text-white">
            {t('voice')}
          </h2>
          <p className="text-gray-500 dark:text-navy-450 mt-2 text-xs sm:text-sm md:text-base leading-relaxed max-w-md mx-auto">
            No typing needed. Tap the large blue button below, state your health question or tell us a medicine name, and listen to the advice!
          </p>
        </div>

        {/* Large Central Button */}
        <div className="flex flex-col items-center justify-center py-4">
          <button
            onClick={toggleVoice}
            disabled={loading}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg border-4 ${
              isListening
                ? 'bg-red-500 border-red-300 text-white scale-105'
                : 'bg-healthcare-500 hover:bg-healthcare-600 border-healthcare-300 text-white hover:scale-105 shadow-healthcare-100'
            }`}
            title="Tap to speak"
          >
            {isListening ? (
              <>
                <MicOff className="w-10 h-10" />
                <span className="text-xs font-semibold mt-1 uppercase tracking-wider">Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-xs font-semibold mt-1 uppercase tracking-wider animate-pulse">Speak</span>
              </>
            )}
          </button>

          {isListening && (
            <p className="mt-4 text-sm font-semibold text-red-500 animate-pulse">
              Listening... Speak now!
            </p>
          )}

          {loading && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-healthcare-200 border-t-healthcare-600 rounded-full animate-spin" />
              <p className="text-xs text-gray-500">Processing...</p>
            </div>
          )}
        </div>

        {/* Display recognized speech */}
        {speechResult && (
          <div className="p-4 bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-850 rounded-2xl text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">You said:</span>
            <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">"{speechResult}"</p>
          </div>
        )}

        {/* Display AI response in large, highly readable text */}
        {aiResponse && (
          <div className="p-5 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-2xl text-left space-y-3 relative group">
            <div className="flex items-center justify-between border-b border-teal-100 dark:border-navy-850 pb-2">
              <span className="text-[10px] font-bold text-teal-650 dark:text-teal-405 uppercase tracking-wider">
                MedScribe AI Says:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => speakText(aiResponse)}
                  className="p-1.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-lg hover:scale-105 transition-all"
                  title="Listen again"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-1.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg hover:scale-105 transition-all"
                    title="Stop audio"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {/* LARGE font size for elderly readers */}
            <p className="text-sm sm:text-base text-teal-850 dark:text-teal-200 leading-relaxed font-medium">
              {aiResponse}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-navy-450 border-t border-teal-100 dark:border-navy-850 pt-2 italic">
              Disclaimer: AI helper only.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50/75 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Suggested prompts card */}
      <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-5 shadow-sm space-y-3 text-left">
        <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-healthcare-500" />
          <span>Things you can ask MedScribe AI:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-650 dark:text-navy-350">
          <div className="p-2 bg-gray-50 dark:bg-navy-800/40 rounded-xl hover:bg-gray-100 transition-all cursor-pointer" onClick={() => { setSpeechResult('पैरासिटामोल के क्या नुकसान हैं?'); queryAI('पैरासिटामोल के क्या नुकसान हैं?'); }}>
            • "पैरासिटामोल के क्या नुकसान हैं?" <span className="text-xs text-gray-400 block mt-0.5">(Side effects of Paracetamol)</span>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-navy-800/40 rounded-xl hover:bg-gray-100 transition-all cursor-pointer" onClick={() => { setSpeechResult('सांप के काटने पर पहले क्या करें?'); queryAI('सांप के काटने पर पहले क्या करें?'); }}>
            • "सांप के काटने पर पहले क्या करें?" <span className="text-xs text-gray-400 block mt-0.5">(Snakebite first-aid)</span>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-navy-800/40 rounded-xl hover:bg-gray-100 transition-all cursor-pointer" onClick={() => { setSpeechResult('बुखार होने पर क्या परहेज करें?'); queryAI('बुखार होने पर क्या परहेज करें?'); }}>
            • "बुखार होने पर क्या परहेज करें?" <span className="text-xs text-gray-400 block mt-0.5">(What to avoid during fever)</span>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-navy-800/40 rounded-xl hover:bg-gray-100 transition-all cursor-pointer" onClick={() => { setSpeechResult('ओआरएस का घोल कैसे बनाएं?'); queryAI('ओआरएस का घोल कैसे बनाएं?'); }}>
            • "ओआरएस का घोल कैसे बनाएं?" <span className="text-xs text-gray-400 block mt-0.5">(How to prepare ORS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
