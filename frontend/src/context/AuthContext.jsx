import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('cachedUser');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('cachedUser');
    // If user and token are cached, do not block UI rendering!
    return !(savedToken && savedUser);
  });
  const [serverWakingUp, setServerWakingUp] = useState(false);

  // Endpoint configuration
  const API_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api')
    : '/api';

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const wakeupTimer = setTimeout(() => {
        if (!user) {
          setServerWakingUp(true);
        }
      }, 1500);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for background auth sync

        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await res.json();

        if (data.success) {
          setUser(data.data);
          localStorage.setItem('cachedUser', JSON.stringify(data.data));
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        clearTimeout(wakeupTimer);
        setServerWakingUp(false);
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('cachedUser', JSON.stringify(data.data));
        setToken(data.data.token);
        setUser(data.data);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  const signup = async (name, email, password, role, languagePreference) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, role, languagePreference })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('cachedUser', JSON.stringify(data.data));
        setToken(data.data.token);
        setUser(data.data);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.data);
        localStorage.setItem('cachedUser', JSON.stringify(data.data));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cachedUser');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, serverWakingUp, login, signup, logout, updateProfile, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
