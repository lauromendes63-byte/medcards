// Utilitário Oficial de Suporte PWA / WebAPK Nativo para o MedCards

export const MEDCARDS_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mcBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2575FC" />
      <stop offset="60%" stop-color="#1D68F2" />
      <stop offset="100%" stop-color="#144BCC" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>
    <filter id="cShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#091E4A" flood-opacity="0.28" />
    </filter>
    <filter id="bShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#091E4A" flood-opacity="0.18" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#mcBg)" />
  <path d="M0 116 C0 52 52 0 116 0 L396 0 C460 0 512 52 512 116 L512 150 C330 110 170 170 0 190 Z" fill="#FFFFFF" opacity="0.14" />

  <g transform="translate(256, 260) rotate(9) translate(-130, -155)" filter="url(#bShadow)">
    <rect width="260" height="310" rx="36" fill="#BFDBFE" />
    <rect x="30" y="38" width="110" height="14" rx="7" fill="#60A5FA" />
    <rect x="30" y="66" width="180" height="10" rx="5" fill="#93C5FD" />
  </g>

  <g transform="translate(126, 105)" filter="url(#cShadow)">
    <rect width="260" height="310" rx="36" fill="url(#cardGrad)" stroke="#FFFFFF" stroke-width="4" />
    <rect x="26" y="26" width="66" height="22" rx="8" fill="#EFF6FF" />
    <text x="59" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="#1D68F2" text-anchor="middle" letter-spacing="1">MED</text>

    <g transform="translate(130, 155)">
      <rect x="-22" y="-68" width="44" height="136" rx="18" fill="#1D68F2" />
      <rect x="-68" y="-22" width="136" height="44" rx="18" fill="#1D68F2" />
      <circle cx="0" cy="0" r="42" fill="#FFFFFF" />
      <path d="M-34 0 L-18 0 L-8 -20 L4 22 L14 -10 L22 0 L34 0" 
            fill="none" 
            stroke="#EF4444" 
            stroke-width="6" 
            stroke-linecap="round" 
            stroke-linejoin="round" />
    </g>

    <rect x="36" y="254" width="188" height="8" rx="4" fill="#CBD5E1" />
    <rect x="65" y="272" width="130" height="7" rx="3.5" fill="#E2E8F0" />
  </g>

  <circle cx="414" cy="98" r="6" fill="#93C5FD" opacity="0.85" />
</svg>`;

export const MEDCARDS_SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(MEDCARDS_SVG_ICON)}`;

// Guardar evento nativo para disparar banner/botão de instalação
let deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne prompt padrão invasivo para controlar o momento exato
    e.preventDefault();
    deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('medcards-pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    console.log('MedCards instalado como aplicativo nativo!');
  });
}

/**
 * Dispara o prompt nativo de instalação do PWA no navegador (Android / Chrome)
 */
export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choiceResult.outcome === 'accepted';
  } catch (err) {
    console.warn('Erro ao acionar prompt de instalação PWA:', err);
    return false;
  }
}

/**
 * Verifica se o app está elegível para instalação neste momento
 */
export function isPWAInstallable(): boolean {
  return !!deferredInstallPrompt;
}

/**
 * Verifica se já está rodando em modo standalone (como app instalado)
 */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Inicializa a configuração PWA com manifest estático oficial e registro de Service Worker
 */
export async function setupMedcardsPWA(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Assegurar que o link para o manifest oficial estático exista e seja mantido
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = '/manifest.json';

  // 2. Metas do sistema para PWA
  const setMeta = (nameOrProperty: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`) as HTMLMetaElement;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, nameOrProperty);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  setMeta('application-name', 'MedCards');
  setMeta('apple-mobile-web-app-title', 'MedCards');
  setMeta('theme-color', '#1D68F2');
  setMeta('mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-status-bar-style', 'default');

  // 3. Registrar o Service Worker oficial para ativação de WebAPK no Android
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('MedCards PWA Service Worker registrado com escopo:', registration.scope);

      // Checa atualizações em background
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nova versão do MedCards instalada em background.');
            }
          });
        }
      });
    } catch (swErr) {
      console.warn('Falha no registro do Service Worker:', swErr);
    }
  }
}
