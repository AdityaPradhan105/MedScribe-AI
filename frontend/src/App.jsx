import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Layout from './components/Layout';

// Lazy load page components for bundle size optimization
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PrescriptionScanner = lazy(() => import('./pages/PrescriptionScanner'));
const MedicineLookup = lazy(() => import('./pages/MedicineLookup'));
const HealthChat = lazy(() => import('./pages/HealthChat'));
const VoiceAssistant = lazy(() => import('./pages/VoiceAssistant'));
const EmergencyInfo = lazy(() => import('./pages/EmergencyInfo'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Protected Route Wrapper Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, serverWakingUp } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950 px-4 text-center">
        <div className="w-10 h-10 border-4 border-healthcare-200 border-t-healthcare-600 rounded-full animate-spin mb-4" />
        {serverWakingUp ? (
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-healthcare-750 dark:text-healthcare-400">
              Connecting to secure database server...
            </p>
            <p className="text-xs text-gray-500 dark:text-navy-400 mt-1.5 leading-relaxed">
              Our free-tier hosting takes about 50 seconds to boot up after being idle. Thank you for your patience!
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-navy-300">Checking authorization...</p>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="w-full min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-healthcare-200 border-t-healthcare-600 rounded-full animate-spin mb-3" />
            <p className="text-xs text-gray-500 dark:text-navy-450">Loading page component...</p>
          </div>
        }
      >
        {children}
      </Suspense>
    </Layout>
  );
};

// Main App Router
function App() {
  return (
    <Router>
      <LanguageProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <Suspense
              fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950">
                  <div className="w-9 h-9 border-4 border-healthcare-200 border-t-healthcare-600 rounded-full animate-spin mb-2" />
                  <p className="text-xs text-gray-550 dark:text-navy-450">Initializing application...</p>
                </div>
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ocr"
                  element={
                    <ProtectedRoute>
                      <PrescriptionScanner />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medicines"
                  element={
                    <ProtectedRoute>
                      <MedicineLookup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <HealthChat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/voice-assistant"
                  element={
                    <ProtectedRoute>
                      <VoiceAssistant />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/emergency"
                  element={
                    <ProtectedRoute>
                      <EmergencyInfo />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;

