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
        version: '2.6.0',
        buildTime: buildIsoTime,
        buildDateFormatted: buildFormattedTime,
        releaseNotes: "MedCards v2.6.0: Personalização completa da tela inicial (nome, objetivo com chips rápidos e temas visuais do card no dashboard e configurações), correção definitiva do bug de duplicidade de eixos e cards ao importar via IA no iOS/iPhone, e redesign mobile-first da Central de Integração com foco prioritário em Colar JSON do Gemini."
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/jszip')) {
              return 'vendor-jszip';
            }
            if (id.includes('src/components/ComplexFlowchart') || id.includes('src/components/FlowchartBuilder')) {
              return 'chunk-flowcharts';
            }
            if (id.includes('src/components/ImportExportModal')) {
              return 'chunk-import-export';
            }
            if (id.includes('src/components/SimulationTrainingView')) {
              return 'chunk-simulation';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      port: 5173,
      host: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
