import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const { speakText } = useAccessibility();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWarmupNotice, setShowWarmupNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowWarmupNotice(false);

    const timer = setTimeout(() => {
      setShowWarmupNotice(true);
    }, 2500);

    const result = await login(email, password);

    clearTimeout(timer);
    setShowWarmupNotice(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
      speakText(result.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="max-w-md w-full bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-xl rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Decorative background blur */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-healthcare-200 dark:bg-healthcare-950 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-healthcare-100 dark:bg-navy-855 rounded-full blur-3xl opacity-30" />

        <div className="relative">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-healthcare-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-healthcare-200 dark:shadow-none animate-pulse">
              A
            </div>
          </div>

          <h3 className="text-center font-bold text-2xl text-gray-800 dark:text-white">
            {t('appName')}
          </h3>
          <p className="text-center text-sm text-gray-500 dark:text-navy-400 mt-1">
            Simple prescription simplifier & medicine helper
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-750 dark:text-red-300 text-sm">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-navy-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500 dark:focus:ring-healthcare-600 focus:bg-white dark:focus:bg-navy-900 transition-all text-gray-800 dark:text-white"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-navy-300 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-450">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500 dark:focus:ring-healthcare-600 focus:bg-white dark:focus:bg-navy-900 transition-all text-gray-805 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-healthcare-500 hover:bg-healthcare-600 disabled:bg-healthcare-300 text-white font-bold shadow-md shadow-healthcare-100 dark:shadow-none hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-healthcare-400"
            >
              {loading ? t('loading') : t('login')}
            </button>

            {showWarmupNotice && (
              <div className="p-3.5 bg-healthcare-50 dark:bg-healthcare-950/20 border border-healthcare-100 dark:border-healthcare-900/40 rounded-xl text-xs text-healthcare-750 dark:text-healthcare-400 leading-relaxed">
                <span className="font-bold block mb-1">💡 Waking up database server...</span>
                Since our server is hosted on a free tier, it spins down after 15 minutes of inactivity. First login takes about 50 seconds. Thank you for your patience!
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-650 dark:text-navy-300">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-bold text-healthcare-600 dark:text-healthcare-400 hover:underline"
            >
              {t('signup')}
            </Link>
          </p>
          

        </div>
      </div>
    </div>
  );
};

export default Login;
