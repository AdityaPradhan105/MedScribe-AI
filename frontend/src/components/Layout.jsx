import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAccessibility } from '../context/AccessibilityContext';
import AccessibilityControls from './AccessibilityControls';
import {
  Menu,
  X,
  LayoutDashboard,
  ScanLine,
  Pill,
  MessageSquare,
  Mic,
  HeartPulse,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  Languages
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const { speakText } = useAccessibility();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Apply light/dark theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: t('dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('scanner'), path: '/ocr', icon: ScanLine },
    { name: t('lookup'), path: '/medicines', icon: Pill },
    { name: t('chat'), path: '/chat', icon: MessageSquare },
    { name: t('voice'), path: '/voice-assistant', icon: Mic },
    { name: t('emergency'), path: '/emergency', icon: HeartPulse }
  ];

  // Include admin panel only for administrator role
  if (user && user.role === 'admin') {
    navItems.push({ name: t('admin'), path: '/admin', icon: Settings });
  }

  // Accessibility read-aloud helper on hover (if user hovered an element, read it if requested)
  // We can hook a simple screen-reader speak on click or double click for elderly.
  const readLabel = (e, text) => {
    // Only speak on double click or holding shift for a simple helper
    if (e.shiftKey) {
      speakText(text);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100 flex font-sans transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-navy-900 border-r border-gray-100 dark:border-navy-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Sidebar Brand/Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-navy-800">
            <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-healthcare-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-healthcare-200 dark:shadow-none">
                M
              </div>
              <span className="font-bold text-lg tracking-tight text-healthcare-700 dark:text-healthcare-400">
                MedScribe AI Assistant
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-gray-450 hover:text-gray-500 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  onDoubleClick={(e) => readLabel(e, item.name)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-healthcare-500 text-white shadow-md shadow-healthcare-100 dark:shadow-none'
                      : 'text-gray-600 dark:text-navy-300 hover:bg-gray-50 dark:hover:bg-navy-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Shift + Click to read aloud"
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-gray-400 dark:text-navy-400 group-hover:text-healthcare-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        {user && (
          <div className="p-4 border-t border-gray-100 dark:border-navy-800 bg-gray-50 dark:bg-navy-900">
            <div className="flex items-center justify-between mb-3">
              <div className="truncate pr-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-navy-400 uppercase tracking-wider">
                  {user.role}
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                  {user.name}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all"
                title={t('logout')}
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Page Layout */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Top Header navbar */}
        <header className="h-16 bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-md text-gray-500 hover:text-gray-650 lg:hidden focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-bold text-base sm:text-lg text-gray-800 dark:text-white hidden sm:block">
              {navItems.find((n) => n.path === location.pathname)?.name || t('welcome')}
            </h2>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Accessibility Controls Widget */}
            <div className="hidden md:block">
              <AccessibilityControls />
            </div>

            {/* Language Selection Dropdown */}
            <div className="relative group flex items-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-navy-800 rounded-lg cursor-pointer text-xs sm:text-sm font-semibold hover:bg-gray-200 dark:hover:bg-navy-750">
                <Globe className="w-4 h-4 text-healthcare-600 dark:text-healthcare-400" />
                <span className="hidden sm:inline">
                  {languages.find((l) => l.code === language)?.label || 'Language'}
                </span>
                <span className="sm:hidden">{language.toUpperCase()}</span>
              </div>
              {/* Dropdown container */}
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-1.5 space-y-0.5">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg transition-all ${
                        language === lang.code
                          ? 'bg-healthcare-50 dark:bg-healthcare-950 text-healthcare-700 dark:text-healthcare-300 font-bold'
                          : 'text-gray-650 dark:text-navy-300 hover:bg-gray-50 dark:hover:bg-navy-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-700 rounded-lg text-gray-650 dark:text-navy-300 transition-all focus:outline-none"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile-only Accessibility widget */}
        <div className="p-3 bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-navy-800 md:hidden flex justify-center">
          <AccessibilityControls />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
