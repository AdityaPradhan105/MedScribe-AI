import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const AccessibilityContext = createContext();

function transliterateDevanagari(text) {
  const vowels = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऑ': 'o'
  };
  const matras = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'o', '्': ''
  };
  const nasals = {
    'ं': 'n', 'ँ': 'n', 'ः': 'h'
  };
  const consonants = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ळ': 'l', 'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy', 'ड़': 'd', 'ढ़': 'dh'
  };

  let result = '';
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (vowels[char] !== undefined) {
      result += vowels[char];
      i++;
    } else if (consonants[char] !== undefined) {
      let base = consonants[char];
      
      if (nextChar === '्') {
        result += base;
        i += 2;
      } else if (matras[nextChar] !== undefined) {
        result += base + matras[nextChar];
        i += 2;
      } else if (nasals[nextChar] !== undefined) {
        result += base + 'a' + nasals[nextChar];
        i += 2;
      } else {
        const isNextSpaceOrPunct = !nextChar || /[\s\p{P}]/u.test(nextChar);
        result += base + (isNextSpaceOrPunct ? '' : 'a');
        i++;
      }
    } else if (nasals[char] !== undefined) {
      result += nasals[char];
      i++;
    } else {
      result += char;
      i++;
    }
  }
  return result;
}

export const AccessibilityProvider = ({ children }) => {
  const { language } = useLanguage();
  const [textSize, setTextSizeState] = useState(() => {
    return localStorage.getItem('accessibilityTextSize') || 'normal'; // normal, large, xlarge
  });
  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('accessibilityHighContrast') === 'true';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoiceName, setSelectedVoiceNameState] = useState(() => {
    return localStorage.getItem('accessibilityVoiceName') || '';
  });
  const [availableVoices, setAvailableVoices] = useState([]);

  // Load and sync native browser voices asynchronously
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voicesList = window.speechSynthesis.getVoices();
      
      // Filter voices to only keep English and Indian regional languages (Hindi, Marathi, Bengali, Telugu, Tamil)
      const allowedLanguages = ['en', 'hi', 'bn', 'mr', 'te', 'ta'];
      const filteredVoices = voicesList.filter(v => {
        const vLang = v.lang.toLowerCase();
        return allowedLanguages.some(lang => vLang === lang || vLang.startsWith(lang + '-') || vLang.startsWith(lang));
      });
      
      setAvailableVoices(filteredVoices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const setSelectedVoiceName = (name) => {
    setSelectedVoiceNameState(name);
    localStorage.setItem('accessibilityVoiceName', name);
  };

  // Apply visual settings to document element
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Manage text size classes
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
    if (textSize === 'large') {
      root.classList.add('text-size-large');
    } else if (textSize === 'xlarge') {
      root.classList.add('text-size-xlarge');
    } else {
      root.classList.add('text-size-normal');
    }
    localStorage.setItem('accessibilityTextSize', textSize);
  }, [textSize]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Manage high contrast class
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('accessibilityHighContrast', highContrast.toString());
  }, [highContrast]);

  const setTextSize = (size) => {
    if (['normal', 'large', 'xlarge'].includes(size)) {
      setTextSizeState(size);
    }
  };

  const toggleHighContrast = () => {
    setHighContrastState((prev) => !prev);
  };

  /**
   * Reads a given text block aloud using the native Web Speech Synthesis API
   */
  const speakText = (text, targetLang = null, fallbackText = null) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Stop any ongoing speech or cloud playback
    window.speechSynthesis.cancel();
    if (window.activeAudioFallback) {
      const audio = window.activeAudioFallback;
      audio.pause();
      try {
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      } catch (e) {
        console.warn(e);
      }
      window.activeAudioFallback = null;
    }
    setIsSpeaking(false);

    if (!text || text.trim() === '') return;

    const voices = window.speechSynthesis.getVoices();
    let voice = null;
    if (selectedVoiceName) {
      voice = voices.find(v => v.name === selectedVoiceName);
    }

    let resolvedLang = targetLang || language;
    
    // Script detection heuristic to override language if the text contains non-Latin scripts.
    // This handles cases where the user has the interface set to English, but the AI responds in Hindi/Bengali/etc.
    if (!targetLang) {
      if (/[\u0900-\u097F]/.test(text)) {
        resolvedLang = 'hi';
      } else if (/[\u0980-\u09FF]/.test(text)) {
        resolvedLang = 'bn';
      } else if (/[\u0C00-\u0C7F]/.test(text)) {
        resolvedLang = 'te';
      } else if (/[\u0B80-\u0BFF]/.test(text)) {
        resolvedLang = 'ta';
      }
    }

    const currentLang = resolvedLang;
    
    let textToSpeak = text;
    let spokenLang = currentLang;

    // Simple language mapping for TTS voice selection
    const langMap = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
      te: 'te-IN',
      ta: 'ta-IN'
    };

    if (voice) {
      const vLang = voice.lang.toLowerCase();
      // If we have a manually chosen English voice but the text is Hindi/Marathi, transliterate!
      if ((currentLang === 'hi' || currentLang === 'mr') && (vLang.startsWith('en') || vLang.startsWith('eng'))) {
        textToSpeak = fallbackText || transliterateDevanagari(text);
        spokenLang = 'en';
      }
    } else {
      // Find and set a local voice corresponding to the target language (case-insensitive)
      // We prioritize female voices for a gentler, more supportive assistant tone.
      // We also filter out uninstalled Microsoft regional desktop voices which fail silently and fall back to English.
      const targetLangCode = (langMap[currentLang] || 'en-US').toLowerCase();
      const cleanLang = currentLang.toLowerCase();

      let matchingVoices = voices.filter(v => {
        const vLang = v.lang.toLowerCase();
        const vName = v.name.toLowerCase();
        const langMatch = vLang === targetLangCode || vLang.startsWith(targetLangCode) || vLang.startsWith(cleanLang);
        if (!langMatch) return false;
        
        // Filter out local Microsoft desktop regional voices (usually uninstalled/broken on Windows systems)
        if (currentLang !== 'en' && vName.includes('microsoft') && !vName.includes('online') && !vName.includes('natural')) {
          console.log(`Filtering out potentially uninstalled Microsoft desktop voice: ${v.name}`);
          return false;
        }
        return true;
      });



      const femaleIndicators = ['female', 'kalpana', 'zira', 'samantha', 'susan', 'heera', 'hazel', 'swara', 'neerja', 'lata', 'priya', 'geeta', 'shruti'];
      const maleIndicators = ['male', 'david', 'hemant', 'rishi', 'george', 'ravi', 'harish'];

      matchingVoices.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aIsFemale = femaleIndicators.some(ind => aName.includes(ind)) || (!maleIndicators.some(ind => aName.includes(ind)) && aName.includes('google'));
        const bIsFemale = femaleIndicators.some(ind => bName.includes(ind)) || (!maleIndicators.some(ind => bName.includes(ind)) && bName.includes('google'));
        if (aIsFemale && !bIsFemale) return -1;
        if (!aIsFemale && bIsFemale) return 1;
        return 0;
      });

      voice = matchingVoices[0];

      // If it's a regional language (not English) and no matching native voice is found locally,
      // we use the local English voice to speak the transliterated text (Hinglish/Benglish) phonetically.
      if (currentLang !== 'en' && !voice) {
        let activeFallback = fallbackText;
        if (!activeFallback && (currentLang === 'hi' || currentLang === 'mr')) {
          activeFallback = transliterateDevanagari(text);
          console.log(`Auto-transliterated ${currentLang} to Latin fallback: ${activeFallback}`);
        }
        
        if (activeFallback) {
          console.log(`No native voice found for ${currentLang}. Switched to transliterated phonetic fallback via English voice.`);
          textToSpeak = activeFallback;
          spokenLang = 'en';
          
          // Prioritize Indian English (en-IN) voices for a natural Indian accent when reading transliterated regional text
          const indianEnglishVoice = voices.find(v => {
            const vLang = v.lang.toLowerCase();
            return vLang === 'en-in' || vLang.startsWith('en-in');
          });
          
          if (indianEnglishVoice) {
            console.log(`Using Indian English voice for fallback: ${indianEnglishVoice.name}`);
            voice = indianEnglishVoice;
          } else {
            voice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
          }
        } else {
          // As a final resort, try to stream from the cloud TTS
          console.log(`No native voice found for ${currentLang} and no transliterated fallback. Running cloud fallback.`);
          
          // Split text into chunks of <= 180 characters to avoid API query length limit (around 200)
          const sentences = text.match(/[^.!?\n।]+[.!?\n।]*/g) || [text];
          const chunks = [];
          let currentChunk = "";
          
          sentences.forEach(sentence => {
            if ((currentChunk + sentence).length > 180) {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = sentence;
            } else {
              currentChunk += sentence;
            }
          });
          if (currentChunk) chunks.push(currentChunk.trim());
          
          let chunkIdx = 0;
          setIsSpeaking(true);
          
          const playNextChunk = () => {
            if (chunkIdx >= chunks.length) {
              setIsSpeaking(false);
              return;
            }
            
            const chunkText = chunks[chunkIdx];
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${currentLang}&client=tw-ob&q=${encodeURIComponent(chunkText)}`;
            
            const audio = document.createElement('audio');
            audio.referrerPolicy = 'no-referrer';
            audio.style.display = 'none';
            audio.src = ttsUrl;
            document.body.appendChild(audio);
            window.activeAudioFallback = audio;
            
            audio.onended = () => {
              try {
                if (audio.parentNode) {
                  audio.parentNode.removeChild(audio);
                }
              } catch (e) {
                console.warn(e);
              }
              chunkIdx++;
              playNextChunk();
            };
            
            audio.onerror = (err) => {
              console.error("Cloud TTS error:", err);
              try {
                if (audio.parentNode) {
                  audio.parentNode.removeChild(audio);
                }
              } catch (e) {
                console.warn(e);
              }
              setIsSpeaking(false);
            };
            
            audio.play().catch(e => {
              console.error("Playback failed:", e);
              try {
                if (audio.parentNode) {
                  audio.parentNode.removeChild(audio);
                }
              } catch (e) {
                console.warn(e);
              }
              setIsSpeaking(false);
            });
          };
          
          playNextChunk();
          return;
        }
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langMap[spokenLang] || 'en-US';
    if (voice) {
      utterance.voice = voice;
    }

    // Adjust rate for elderly users (slightly slower speech)
    utterance.rate = 0.85;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (window.activeAudioFallback) {
      const audio = window.activeAudioFallback;
      audio.pause();
      try {
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      } catch (e) {
        console.warn(e);
      }
      window.activeAudioFallback = null;
    }
    setIsSpeaking(false);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        highContrast,
        toggleHighContrast,
        speakText,
        stopSpeaking,
        isSpeaking,
        selectedVoiceName,
        setSelectedVoiceName,
        availableVoices
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
