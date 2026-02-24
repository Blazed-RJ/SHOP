import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Generate deviceId + detect device name once at startup
if (!localStorage.getItem('deviceId')) {
  localStorage.setItem('deviceId', crypto.randomUUID());
}
if (!localStorage.getItem('deviceName')) {
  const ua = navigator.userAgent;
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : ua.includes('Edge') ? 'Edge' : 'Browser';
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iPhone' : 'Device';
  localStorage.setItem('deviceName', `${browser} on ${os}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);

