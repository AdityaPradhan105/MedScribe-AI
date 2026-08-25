import React, { useState } from 'react';
import { api } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import VoiceInteraction from '../components/VoiceInteraction';
import {
  Search,
  Volume2,
  AlertOctagon,
  HelpCircle,
  TrendingDown,
  ShieldCheck,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

const MedicineLookup = () => {
  const { t, language } = useLanguage();
  const { speakText } = useAccessibility();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeMedicine, setActiveMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchTerm) => {
    const term = searchTerm || query;
    if (!term || term.trim() === '') return;

    setLoading(true);
    setError('');
    setActiveMedicine(null);

    try {
      const res = await api.searchMedicines(term, language);
      if (res.success) {
        setResults(res.data);
        if (res.data.length === 0) {
          setError('No medicines found. Try another search.');
        }
      } else {
        setError(res.message || 'Search failed');
      }
    } catch (err) {
      setError('Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceResult = (text) => {
    setQuery(text);
    handleSearch(text);
  };

  const loadMedicineDetails = async (medId) => {
    setLoading(true);
    try {
      const res = await api.getMedicineById(medId, language);
      if (res.success) {
        setActiveMedicine(res.data);
      }
    } catch (err) {
      setError('Failed to load medicine details.');
    } finally {
      setLoading(false);
    }
  };

  const readMedicineAloud = (med) => {
    // Read the translated block if available, fallback to english
    const local = med.translations?.[language] || med;
    
    let narr = `${med.name}. Generic compound chemical: ${med.genericName}. `;
    narr += `Simplified purpose: ${local.descriptionSimple || med.descriptionSimple}. `;
    
    if (local.uses && local.uses.length > 0) {
      narr += `Main uses: ${local.uses.join(', ')}. `;
    }
    if (local.dosage) {
      narr += `Dosage recommendation: ${local.dosage}. `;
    }
    if (local.warnings && local.warnings.length > 0) {
      narr += `Important warnings: ${local.warnings.join('. ')}. `;
    }
    if (med.alternatives && med.alternatives.length > 0) {
      narr += `You can ask your chemist for cheaper alternatives with the same chemical such as: ${med.alternatives.join(', ')}`;
    }

    speakText(narr);
  };

  return (
    <div className="space-y-6">
      
      {/* Search Input Card */}
      <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-5 shadow-sm max-w-3xl mx-auto">
        <h2 className="font-bold text-xl text-gray-800 dark:text-white mb-2 text-center">
          {t('lookup')}
        </h2>
        <p className="text-center text-xs sm:text-sm text-gray-400 dark:text-navy-400 mb-6">
          Find simplified usages, side effects, warnings, and cheaper brand alternatives in simple language.
        </p>

        <div className="flex items-center gap-2">
          {/* Text Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-11 pr-4 w-full py-3 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500 dark:focus:ring-healthcare-600 focus:bg-white dark:focus:bg-navy-900 transition-all text-gray-805 dark:text-white"
              placeholder={t('searchPlaceholder')}
            />
          </div>

          {/* Voice Search Button */}
          <VoiceInteraction onResult={handleVoiceResult} placeholder="Say medicine name..." />
          
          <button
            onClick={() => handleSearch()}
            className="px-5 py-3 bg-healthcare-500 hover:bg-healthcare-600 text-white font-bold rounded-2xl text-sm shadow-md transition-all focus:outline-none"
          >
            Search
          </button>
        </div>

        {error && (
          <p className="text-sm font-semibold text-red-500 mt-3 text-center">{error}</p>
        )}
      </div>

      {/* Grid of Results & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto items-start">
        
        {/* Results List */}
        <div className={`space-y-3 lg:col-span-4 ${activeMedicine ? 'hidden lg:block' : 'lg:col-span-12'}`}>
          {results.length > 0 && (
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Search Results ({results.length})
            </span>
          )}

          {loading && results.length === 0 && (
            <div className="text-center py-10 text-gray-450">{t('loading')}</div>
          )}

          <div className="space-y-3.5">
            {results.map((med) => (
              <div
                key={med._id}
                onClick={() => loadMedicineDetails(med._id)}
                className={`p-4 bg-white dark:bg-navy-900 border rounded-2xl cursor-pointer hover:shadow-md transition-all ${
                  activeMedicine?._id === med._id
                    ? 'border-healthcare-500 bg-healthcare-50/10'
                    : 'border-gray-100 dark:border-navy-800'
                }`}
              >
                <h4 className="font-bold text-base text-gray-800 dark:text-white">{med.name}</h4>
                <p className="text-xs text-gray-405 mt-0.5 truncate italic">
                  Chemical: {med.genericName}
                </p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                  {med.translations?.[language]?.descriptionSimple || med.descriptionSimple}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Detail Frame */}
        {activeMedicine && (
          <div className="lg:col-span-8 bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            
            {/* Header section with voice readout */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-50 dark:border-navy-850 pb-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Medicine Information Profile
                </span>
                <h3 className="font-bold text-2xl text-healthcare-700 dark:text-healthcare-400 mt-0.5">
                  {activeMedicine.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 italic mt-0.5">
                  Generic Composition: {activeMedicine.genericName}
                </p>
              </div>
              <button
                onClick={() => readMedicineAloud(activeMedicine)}
                className="flex items-center gap-1 px-4 py-2 bg-healthcare-500 hover:bg-healthcare-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all focus:outline-none"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen Details</span>
              </button>
            </div>

            {/* Localized Content wrapper */}
            {(() => {
              const local = activeMedicine.translations?.[language] || activeMedicine;
              return (
                <div className="space-y-6">
                  
                  {/* Simplified description banner */}
                  <div className="p-4 bg-teal-50/20 dark:bg-teal-950/10 border border-teal-50 dark:border-teal-950/40 rounded-2xl flex gap-3">
                    <Activity className="w-5 h-5 text-healthcare-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-xs font-semibold text-healthcare-805 dark:text-healthcare-400 uppercase">
                        What it does in simple terms
                      </h5>
                      <p className="text-sm font-semibold text-healthcare-700 dark:text-healthcare-200 mt-0.5 leading-relaxed">
                        {local.descriptionSimple}
                      </p>
                    </div>
                  </div>

                  {/* Uses checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-bold text-sm text-gray-700 dark:text-navy-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-healthcare-500" />
                        <span>Common Uses</span>
                      </h5>
                      <ul className="list-disc pl-5 text-sm text-gray-650 dark:text-navy-300 space-y-1">
                        {local.uses?.map((use, idx) => (
                          <li key={idx} className="font-semibold">{use}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-sm text-gray-700 dark:text-navy-300 flex items-center gap-1.5">
                        <HelpCircle className="w-4.5 h-4.5 text-healthcare-505" />
                        <span>Recommended Dosage</span>
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-navy-300 font-semibold leading-relaxed">
                        {local.dosage}
                      </p>
                    </div>
                  </div>

                  {/* Side Effects */}
                  {local.sideEffects && local.sideEffects.length > 0 && (
                    <div className="space-y-2 border-t border-gray-50 dark:border-navy-850 pt-4">
                      <h5 className="font-bold text-sm text-gray-750 dark:text-navy-300">
                        {t('sideEffects')}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {local.sideEffects.map((se, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-navy-800 text-gray-605 dark:text-navy-305 font-semibold"
                          >
                            {se}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings & precautions */}
                  {(local.warnings?.length > 0 || local.precautions?.length > 0) && (
                    <div className="p-4 rounded-2xl bg-amber-50/35 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/50 space-y-3">
                      <h5 className="font-bold text-sm text-amber-800 dark:text-amber-450 flex items-center gap-1.5">
                        <AlertOctagon className="w-4.5 h-4.5 text-amber-500" />
                        <span>Warnings & Safety Tips</span>
                      </h5>
                      <ul className="list-disc pl-5 text-xs sm:text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        {local.warnings?.map((warn, idx) => (
                          <li key={idx} className="font-semibold">{warn}</li>
                        ))}
                        {local.precautions?.map((prec, idx) => (
                          <li key={idx} className="font-semibold">{prec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cheaper Indian Brand Alternatives */}
                  {activeMedicine.alternatives && activeMedicine.alternatives.length > 0 && (
                    <div className="p-4 rounded-2xl bg-blue-50/20 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/40 space-y-2">
                      <h5 className="font-bold text-sm text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                        <TrendingDown className="w-4.5 h-4.5 text-blue-550" />
                        <span>Cheaper Brand Alternatives (सस्ते विकल्प)</span>
                      </h5>
                      <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed font-semibold">
                        Generic options are often cheaper than brand names. You can ask your chemist for these alternate brands containing the same generic drug:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {activeMedicine.alternatives.map((alt, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900"
                          >
                            {alt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        )}

      </div>
    </div>
  );
};

export default MedicineLookup;
