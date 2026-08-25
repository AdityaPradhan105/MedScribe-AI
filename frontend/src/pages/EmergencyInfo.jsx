import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  PhoneCall,
  MapPin,
  Clock,
  Volume2,
  ShieldAlert,
  Heart,
  ChevronRight,
  Flame,
  Sun,
  Shield,
} from 'lucide-react';

const EmergencyInfo = () => {
  const { language, t } = useLanguage();
  const { speakText } = useAccessibility();

  const [helplines, setHelplines] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [firstAid, setFirstAid] = useState({});
  const [activeGuideIdx, setActiveGuideIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmergencyData = async () => {
      try {
        const res = await api.getEmergencyData();
        if (res.success) {
          setHelplines(res.data.helplines);
          setClinics(res.data.clinics);
          setFirstAid(res.data.firstAid);
        }
      } catch (error) {
        console.error('Failed to load emergency data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmergencyData();
  }, []);

  const currentGuides = firstAid[language] || firstAid['en'] || [];
  const activeGuide = currentGuides[activeGuideIdx];

  const readFirstAid = (guide) => {
    if (!guide) return;
    let narr = `${guide.title}. First Aid steps: `;
    guide.steps.forEach((step, idx) => {
      narr += `Step ${idx + 1}: ${step}. `;
    });
    speakText(narr);
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'snake':
        return <ShieldAlert className="w-6 h-6 text-red-500" />;
      case 'sun':
        return <Sun className="w-6 h-6 text-amber-500" />;
      case 'bone':
        return <Heart className="w-6 h-6 text-blue-500" />;
      default:
        return <Shield className="w-6 h-6 text-healthcare-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Helpline Dialers */}
      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-lg text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-red-500 animate-bounce" />
          <span>{t('emergencyHelplines')}</span>
        </h3>

        {loading ? (
          <div className="text-center py-4 text-sm text-gray-400">{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {helplines.map((h, idx) => (
              <a
                key={idx}
                href={`tel:${h.number}`}
                className="p-4 bg-white dark:bg-navy-900 border border-red-100 dark:border-navy-800 hover:border-red-400 dark:hover:border-red-900 hover:shadow-md rounded-2xl flex items-center justify-between group transition-all"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {h.label}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-navy-450 mt-0.5">{h.purpose}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-650 dark:text-red-400 flex items-center justify-center font-bold text-lg">
                  {h.number}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: First Aid Guides */}
        <div className="lg:col-span-7 bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white border-b border-gray-100 dark:border-navy-850 pb-3">
            {t('firstAid')}
          </h3>

          {loading ? (
            <div className="text-center py-10 text-gray-400">{t('loading')}</div>
          ) : (
            <div className="space-y-4">
              {/* Guides tabs */}
              <div className="flex flex-wrap gap-2">
                {currentGuides.map((guide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGuideIdx(idx)}
                    className={`px-3 py-1.8 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      activeGuideIdx === idx
                        ? 'bg-healthcare-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-navy-800 text-gray-650 dark:text-navy-300 hover:bg-gray-200'
                    }`}
                  >
                    {guide.title.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Guide steps display card */}
              {activeGuide && (
                <div className="p-4 bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-850 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-3">
                    <div className="flex items-center gap-2">
                      {getIcon(activeGuide.icon)}
                      <h4 className="font-bold text-base text-gray-800 dark:text-white">
                        {activeGuide.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => readFirstAid(activeGuide)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-healthcare-500 hover:bg-healthcare-600 text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Listen Guide</span>
                    </button>
                  </div>

                  <ol className="space-y-2.5 text-xs sm:text-sm">
                    {activeGuide.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-2 text-gray-650 dark:text-navy-300">
                        <span className="w-5.5 h-5.5 rounded-full bg-healthcare-100 dark:bg-healthcare-950 text-healthcare-700 dark:text-healthcare-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Clinics listing */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white border-b border-gray-100 dark:border-navy-850 pb-3">
            {t('clinicsNearby')}
          </h3>

          {loading ? (
            <div className="text-center py-10 text-gray-400">{t('loading')}</div>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-850 rounded-2xl space-y-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white">
                        {clinic.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-healthcare-500" />
                        <span>{clinic.address}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-healthcare-50 dark:bg-healthcare-950 text-healthcare-700 dark:text-healthcare-400 text-xs rounded-lg whitespace-nowrap">
                      {clinic.distance}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-navy-450 border-t border-gray-100 dark:border-navy-850 pt-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{clinic.hours}</span>
                    </span>
                    <a
                      href={`tel:${clinic.phone}`}
                      className="flex items-center gap-1 text-healthcare-600 dark:text-healthcare-400 hover:underline ml-auto"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call PHC</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmergencyInfo;
