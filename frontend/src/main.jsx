import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Early non-blocking background ping to wake up Render backend from cold start
const backendUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  : '';
fetch(`${backendUrl}/health`).catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

