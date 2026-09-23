import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

const buildIsoTime = new Date().toISOString();
const buildFormattedTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

function versionGeneratorPlugin(): Plugin {
  return {
    name: 'version-generator-plugin',
    generateBundle() {
      const versionData = {
        version: '2.2.0',
        buildTime: buildIsoTime,
        buildDateFormatted: buildFormattedTime,
        releaseNotes: 'MedCards v2.2: Editor WYSIWYG com Active Recall Interativo (todos os tipos), Foco Provas UFPA, Tipografia Suave Semibold 600 e Processamento 100% Offline'
      };
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(versionData, null, 2)
      });
      try {
        const publicPath = path.resolve(__dirname, 'public/version.json');
        fs.writeFileSync(publicPath, JSON.stringify(versionData, null, 2));
      } catch {}
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), versionGeneratorPlugin()],
    define: {
      __APP_BUILD_TIMESTAMP__: JSON.stringify(buildIsoTime),
      __APP_BUILD_LABEL__: JSON.stringify(buildFormattedTime),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
