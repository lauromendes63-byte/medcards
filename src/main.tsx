import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupMedcardsPWA } from './utils/pwaSetup';

// Inicializa a configuração PWA com ícone Data-URI e Web App Manifest dinâmico
setupMedcardsPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

