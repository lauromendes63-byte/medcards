import React from 'react';
import { Flame, Sparkles, Settings } from 'lucide-react';
import { ProgressoDiario } from '../types';
import { MEDCARDS_SVG_DATA_URI } from '../utils/pwaSetup';

interface HeaderProps {
  progresso: ProgressoDiario;
  onExportar: () => void;
  onResetar: () => void;
  onAbrirImportExport?: () => void;
  onAbrirConfiguracoes?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  progresso,
  onAbrirImportExport,
  onAbrirConfiguracoes,
}) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-100/90 py-2.5 px-3.5 sm:px-6 sticky top-0 z-30 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Marca Minimalista */}
        <div className="flex items-center gap-2.5">
          <img 
            src={MEDCARDS_SVG_DATA_URI} 
            alt="MedCards" 
            className="w-7 h-7 rounded-xl object-cover shadow-xs border border-blue-50" 
          />
          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
            MedCards
          </span>
        </div>

        {/* Lado Direito: Streak e Ações Rápidas */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sequência / Streak */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-950 text-xs font-bold"
            title={`${progresso.sequenciaDias} dias seguidos de estudo ativo`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>{progresso.sequenciaDias}d</span>
          </div>

          {/* Importador Inteligente / IA */}
          {onAbrirImportExport && (
            <button
              id="btn-import-export-header"
              onClick={onAbrirImportExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/70 transition-all active:scale-95 cursor-pointer"
              title="Criar com IA Gemini ou importar arquivos"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xs:inline">IA & Dados</span>
            </button>
          )}

          {/* Atalho Configurações */}
          {onAbrirConfiguracoes && (
            <button
              onClick={onAbrirConfiguracoes}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
              title="Configurações e Backup"
            >
              <Settings className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
