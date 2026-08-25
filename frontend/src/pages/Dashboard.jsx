import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../utils/api';
import {
  ScanLine,
  Pill,
  MessageSquare,
  HeartPulse,
  Plus,
  BookOpen,
  Download,
  Eye,
  FileText,
  Volume2
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { speakText } = useAccessibility();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daily health tips translated for rural Indian context
  const healthTips = {
    en: "Drink boiled or filtered water during the monsoon season to prevent stomach infections.",
    hi: "पेट के संक्रमण से बचने के लिए मानसून (बरसात) के मौसम में उबला हुआ या छना हुआ पानी पिएं।",
    bn: "পেটের সংক্রমণ রোধ করতে বর্ষাকালে ফোটানো বা ফিল্টার করা জল পান করুন।",
    mr: "पोटाचे आजार टाळण्यासाठी पावसाळ्यात उकळलेले किंवा गाळलेले पाणी प्यावे.",
    te: "కడుపు ఇన్ఫెక్షన్లను నివారించడానికి వర్షాకాలంలో కాచి వడపోసిన నీటిని తాగండి.",
    ta: "வயிற்றுத் தொற்றுகளைத் தடுக்க மழைக்காலத்தில் காய்ச்சி வடிகட்டிய நீரைக் குடிக்கவும்."
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.getPrescriptions();
        if (res.success) {
          setHistory(res.data.slice(0, 5)); // Show top 5 recent scans
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setHistory([]); // Set blank or let it handle array
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const currentTip = healthTips[language] || healthTips['en'];

  const quickActions = [
    {
      name: t('scanner'),
      desc: t('scanDescription'),
      path: '/ocr',
      icon: ScanLine,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-teal-100 dark:shadow-none'
    },
    {
      name: t('lookup'),
      desc: "Search uses, dosages, and warnings in simple terms.",
      path: '/medicines',
      icon: Pill,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-100 dark:shadow-none'
    },
    {
      name: t('chat'),
      desc: "Get answers to general health questions from our assistant.",
      path: '/chat',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-100 dark:shadow-none'
    },
    {
      name: t('emergency'),
      desc: "Helplines, nearest clinics, and first-aid instructions.",
      path: '/emergency',
      icon: HeartPulse,
      color: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-100 dark:shadow-none'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Card */}
      <div className="p-6 bg-gradient-to-r from-healthcare-500 to-teal-600 dark:from-healthcare-800 dark:to-teal-900 rounded-3xl text-white shadow-lg relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t('welcome')}, {user?.name || 'User'}!
            </h1>
            <p className="text-teal-50 dark:text-teal-200 mt-1.5 max-w-xl text-sm sm:text-base">
              MedScribe AI simplifies prescriptions and helps you understand medicines in simple, regional languages.
            </p>
          </div>
          <button
            onClick={() => speakText(`${t('welcome')} ${user?.name}. MedScribe AI simplifies prescriptions and helps you understand medicines in simple, regional languages.`)}
            className="flex items-center gap-1.5 self-start md:self-center bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all backdrop-blur-sm focus:outline-none"
            title="Read welcome message aloud"
          >
            <Volume2 className="w-4 h-4 text-white" />
            <span>Listen (सुनें)</span>
          </button>
        </div>
      </div>

      {/* Tip of the Day */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 shadow-sm">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-700 dark:text-amber-300">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">
            {t('healthTip')}
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
            {currentTip}
          </p>
        </div>
        <button
          onClick={() => speakText(currentTip)}
          className="p-1.5 text-amber-700 dark:text-amber-450 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg"
          title="Read tip aloud"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-healthcare-500" />
          <span>Quick Features</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className={`p-5 bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group shadow-sm`}
              >
                <div className={`p-3.5 bg-gradient-to-br ${action.color} rounded-xl text-white shadow-md`}>
                  <Icon className="w-6 h-6 group-hover:scale-115 transition-transform" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base text-gray-800 dark:text-white group-hover:text-healthcare-600 dark:group-hover:text-healthcare-400 transition-colors">
                    {action.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-navy-450 mt-0.5 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Scanned History Summary */}
      <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-healthcare-500" />
          <span>{t('history')}</span>
        </h3>
        {loading ? (
          <div className="py-6 text-center text-sm text-gray-400">{t('loading')}</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-450">
            <p>{t('noHistory')}</p>
            <Link
              to="/ocr"
              className="inline-block mt-3 px-4 py-2 bg-healthcare-500 hover:bg-healthcare-600 text-white rounded-xl text-xs font-bold"
            >
              Scan Your First Prescription
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-navy-800 text-gray-550 dark:text-navy-400">
                  <th className="py-3 px-2">Patient / Doctor</th>
                  <th className="py-3 px-2 hidden sm:table-cell">Date</th>
                  <th className="py-3 px-2 hidden md:table-cell">Language</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((scan) => (
                  <tr
                    key={scan._id}
                    className="border-b border-gray-50 dark:border-navy-800 hover:bg-gray-50 dark:hover:bg-navy-800/40 transition-all"
                  >
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-gray-800 dark:text-white">
                        {scan.simplifiedContent.patientName || 'Unknown Patient'}
                      </div>
                      <div className="text-xs text-gray-455 dark:text-navy-400 mt-0.5 truncate max-w-xs">
                        {scan.simplifiedContent.doctorName || 'Unknown Doctor'}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-gray-500 dark:text-navy-300 hidden sm:table-cell">
                      {scan.simplifiedContent.date || new Date(scan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-2 text-xs uppercase text-gray-400 dark:text-navy-400 hidden md:table-cell">
                      {scan.language}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/ocr?id=${scan._id}`}
                          className="p-1.5 text-gray-500 hover:text-healthcare-600 hover:bg-healthcare-50 dark:hover:bg-navy-800 rounded-lg transition-all"
                          title="View Simplified Prescription"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <a
                          href={api.downloadPDFUrl(scan._id)}
                          download={`prescription_${scan._id}.pdf`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-navy-800 rounded-lg transition-all"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
