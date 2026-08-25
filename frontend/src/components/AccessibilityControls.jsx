import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { Type, Eye, VolumeX, Volume2 } from 'lucide-react';

const AccessibilityControls = () => {
  const { 
    textSize, 
    setTextSize, 
    highContrast, 
    toggleHighContrast, 
    stopSpeaking, 
    isSpeaking,
    selectedVoiceName,
    setSelectedVoiceName,
    availableVoices
  } = useAccessibility();
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-navy-800 rounded-lg shadow-sm border border-gray-100 dark:border-navy-700">
      
      {/* Font Size Adjusters */}
      <div className="flex items-center gap-1 border-r border-gray-200 dark:border-navy-600 pr-2">
        <Type className="w-4 h-4 text-gray-500 dark:text-navy-400" />
        <span className="text-xs font-semibold text-gray-600 dark:text-navy-300 mr-1 hidden sm:inline">
          {t('textSize')}:
        </span>
        <button
          onClick={() => setTextSize('normal')}
          className={`px-2 py-1 text-xs rounded transition-all ${
            textSize === 'normal'
              ? 'bg-healthcare-500 text-white font-bold'
              : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-navy-200 hover:bg-gray-200'
          }`}
          title={t('normal')}
        >
          A
        </button>
        <button
          onClick={() => setTextSize('large')}
          className={`px-2 py-1 text-xs rounded transition-all ${
            textSize === 'large'
              ? 'bg-healthcare-500 text-white font-bold text-base'
              : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-navy-200 hover:bg-gray-200'
          }`}
          title={t('large')}
          style={{ fontSize: '14px' }}
        >
          A+
        </button>
        <button
          onClick={() => setTextSize('xlarge')}
          className={`px-2 py-1 text-xs rounded transition-all ${
            textSize === 'xlarge'
              ? 'bg-healthcare-500 text-white font-bold text-lg'
              : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-navy-200 hover:bg-gray-200'
          }`}
          title={t('extraLarge')}
          style={{ fontSize: '18px' }}
        >
          A++
        </button>
      </div>

      {/* Voice Selection Dropdown */}
      {availableVoices.length > 0 && (
        <div className="flex items-center gap-1 border-r border-gray-200 dark:border-navy-600 pr-2">
          <Volume2 className="w-4 h-4 text-gray-500 dark:text-navy-400" />
          <span className="text-xs font-semibold text-gray-600 dark:text-navy-300 mr-1 hidden md:inline">
            Voice:
          </span>
          <select
            value={selectedVoiceName}
            onChange={(e) => setSelectedVoiceName(e.target.value)}
            className="text-xs font-semibold px-2 py-1 bg-gray-50 dark:bg-navy-750 text-gray-700 dark:text-navy-200 rounded border border-gray-200 dark:border-navy-650 focus:ring-1 focus:ring-healthcare-500 max-w-[130px] sm:max-w-[180px] truncate outline-none cursor-pointer"
          >
            <option value="">Default Auto-Detect</option>
            {availableVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* High Contrast Mode Toggle */}
      <button
        onClick={toggleHighContrast}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-all ${
          highContrast
            ? 'bg-black text-yellow-400 font-bold border-2 border-yellow-400'
            : 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-navy-200 hover:bg-gray-200'
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>{t('highContrast')}</span>
      </button>

      {/* Stop Sound Button */}
      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 transition-all font-semibold animate-pulse"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Stop Sound</span>
        </button>
      )}
    </div>
  );
};

export default AccessibilityControls;
