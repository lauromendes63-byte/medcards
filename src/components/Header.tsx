import React from 'react';
import { Flame, UploadCloud, Settings } from 'lucide-react';
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
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-2.5 px-3.5 sm:px-6 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Nome Limpo MedCards */}
        <div className="flex items-center gap-2.5">
          <img 
            src={MEDCARDS_SVG_DATA_URI} 
            alt="MedCards" 
            className="w-7 h-7 rounded-xl shadow-xs object-cover border border-blue-100" 
          />
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none">
            MedCards
          </h1>
        </div>

        {/* Lado Direito: Streak e Ações Rápidas */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sequência / Streak */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-extrabold shadow-3xs"
            title={`${progresso.sequenciaDias} dias consecutivos de estudo`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{progresso.sequenciaDias}d</span>
          </div>

          {/* Importador e Exportador */}
          {onAbrirImportExport && (
            <button
              id="btn-import-export-header"
              onClick={onAbrirImportExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/90 hover:border-slate-300 transition-transform duration-100 ease-out active:scale-[0.98] cursor-pointer shadow-3xs"
              title="Importar ou exportar flashcards (Anki, JSON, Eixos)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" strokeWidth={1.75} />
              <span className="hidden xs:inline">Import/Export</span>
            </button>
          )}

          {/* Atalho Configurações */}
          {onAbrirConfiguracoes && (
            <button
              onClick={onAbrirConfiguracoes}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-transform duration-100 ease-out active:scale-[0.98] cursor-pointer"
              title="Configurações e Dados"
            >
              <Settings className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

