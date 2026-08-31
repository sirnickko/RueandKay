import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/LuxuryLanding.css';
import './styles/LandingStyle.css';
import './styles/mobileresponsiveness.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
