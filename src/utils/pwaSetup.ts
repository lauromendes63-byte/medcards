// Utilitário de Suporte PWA Completo e Resiliente para o MedCards
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

  <!-- Fundo Squircle Azul Vibrante #1D68F2 (compatível com Maskable Safe Zone) -->
  <rect width="512" height="512" rx="116" fill="url(#mcBg)" />

  <!-- Brilho óptico superior sutil -->
  <path d="M0 116 C0 52 52 0 116 0 L396 0 C460 0 512 52 512 116 L512 150 C330 110 170 170 0 190 Z" fill="#FFFFFF" opacity="0.14" />

  <!-- Card Secundário em Perspectiva (Metáfora de Flashcards/Baralhos) -->
  <g transform="translate(256, 260) rotate(9) translate(-130, -155)" filter="url(#bShadow)">
    <rect width="260" height="310" rx="36" fill="#BFDBFE" />
    <rect x="30" y="38" width="110" height="14" rx="7" fill="#60A5FA" />
    <rect x="30" y="66" width="180" height="10" rx="5" fill="#93C5FD" />
  </g>

  <!-- Card Principal Frontal com cantos arredondados e sombra -->
  <g transform="translate(126, 105)" filter="url(#cShadow)">
    <rect width="260" height="310" rx="36" fill="url(#cardGrad)" stroke="#FFFFFF" stroke-width="4" />

    <!-- Tag Superior "MED" -->
    <rect x="26" y="26" width="66" height="22" rx="8" fill="#EFF6FF" />
    <text x="59" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="#1D68F2" text-anchor="middle" letter-spacing="1">MED</text>

    <!-- Cruz Médica com Pulso de ECG Integrado -->
    <g transform="translate(130, 155)">
      <!-- Cruz Médica com cantos arredondados -->
      <rect x="-22" y="-68" width="44" height="136" rx="18" fill="#1D68F2" />
      <rect x="-68" y="-22" width="136" height="44" rx="18" fill="#1D68F2" />
      
      <!-- Círculo Central Branco de Contraste -->
      <circle cx="0" cy="0" r="42" fill="#FFFFFF" />
      
      <!-- Linha do Eletrocardiograma (Pulso Clínico) em Vermelho Coral -->
      <path d="M-34 0 L-18 0 L-8 -20 L4 22 L14 -10 L22 0 L34 0" 
            fill="none" 
            stroke="#EF4444" 
            stroke-width="6" 
            stroke-linecap="round" 
            stroke-linejoin="round" />
    </g>

    <!-- Linhas de Estudo do Flashcard -->
    <rect x="36" y="254" width="188" height="8" rx="4" fill="#CBD5E1" />
    <rect x="65" y="272" width="130" height="7" rx="3.5" fill="#E2E8F0" />
  </g>

  <!-- Ponto de Brilho Sutil -->
  <circle cx="414" cy="98" r="6" fill="#93C5FD" opacity="0.85" />
</svg>`;

export const MEDCARDS_SVG_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(MEDCARDS_SVG_ICON)}`;

/**
 * Converte o SVG para PNG Data URI de alta resolução usando Canvas offscreen
 */
function svgToPngDataUri(svgUri: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, size, size);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch {
          // fallback silencioso
        }
        resolve(svgUri);
      };
      img.onerror = () => resolve(svgUri);
      img.src = svgUri;
    } catch {
      resolve(svgUri);
    }
  });
}

/**
 * Inicializa a configuração dinâmica de PWA e Web App Manifest
 */
export async function setupMedcardsPWA(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Atualizar ou injetar favicons e apple-touch-icon diretamente com Data-URI
  const setOrUpdateLink = (rel: string, href: string, type?: string, sizes?: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    if (type) el.type = type;
    if (sizes) el.setAttribute('sizes', sizes);
  };

  setOrUpdateLink('icon', MEDCARDS_SVG_DATA_URI, 'image/svg+xml', 'any');
  setOrUpdateLink('apple-touch-icon', MEDCARDS_SVG_DATA_URI, undefined, '180x180');
  setOrUpdateLink('shortcut icon', MEDCARDS_SVG_DATA_URI);

  // Metas do sistema para PWA
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

  // 2. Tentar gerar versões PNG dinâmicas via Canvas para compatibilidade máxima com Android Chrome WebAPK
  let png192 = '';
  let png512 = '';
  try {
    const [p192, p512] = await Promise.all([
      svgToPngDataUri(MEDCARDS_SVG_DATA_URI, 192),
      svgToPngDataUri(MEDCARDS_SVG_DATA_URI, 512),
    ]);
    png192 = p192;
    png512 = p512;
  } catch (err) {
    console.debug('SVG->PNG canvas fallback ativo:', err);
  }

  // 3. Montar Web App Manifest Dinâmico
  const manifestObject = {
    name: 'MedCards',
    short_name: 'MedCards',
    description: 'MedCards - Flashcards médicos de alto rendimento e revisão espaçada.',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#1D68F2',
    orientation: 'portrait',
    icons: [
      ...(png192 && png192.startsWith('data:image/png')
        ? [
            {
              src: png192,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ]
        : []),
      ...(png512 && png512.startsWith('data:image/png')
        ? [
            {
              src: png512,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ]
        : []),
      {
        src: MEDCARDS_SVG_DATA_URI,
        sizes: '192x192 512x512 any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };

  try {
    const manifestBlob = new Blob([JSON.stringify(manifestObject, null, 2)], {
      type: 'application/manifest+json',
    });
    const manifestBlobUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestBlobUrl;
  } catch (blobErr) {
    console.warn('Falha ao injetar manifest blob:', blobErr);
  }

  // 4. Limpeza de Caches Anteriores e Desativação de Service Worker Estático para Garantir Atualizações Imediatas
  if (typeof window !== 'undefined') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key).catch(() => {}));
      }).catch(() => {});
    }
  }
}
