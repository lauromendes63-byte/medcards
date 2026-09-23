import React from 'react';
import { 
  LayoutGrid, 
  RotateCcw, 
  Plus,
  GraduationCap, 
  BarChart3,
} from 'lucide-react';
import { TabNavegacao } from '../types';

interface BottomNavBarProps {
  tabAtiva: TabNavegacao;
  onTabChange: (tab: TabNavegacao) => void;
  pendentesHojeCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  tabAtiva,
  onTabChange,
  pendentesHojeCount,
}) => {
  return (
    <nav 
      id="nav-inferior-fixa"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] px-2 sm:px-6 shadow-lg touch-manipulation select-none"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        
        {/* Tab 1: Eixos */}
        <button
          id="tab-btn-eixos"
          onClick={() => onTabChange('eixos')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] active:scale-95 ${
            tabAtiva === 'eixos' 
              ? 'text-blue-600 font-black bg-blue-50/80' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutGrid className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] tracking-tight mt-0.5">Eixos</span>
        </button>

        {/* Tab 2: Revisões */}
        <button
          id="tab-btn-revisoes"
          onClick={() => onTabChange('revisoes')}
          className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] active:scale-95 ${
            tabAtiva === 'revisoes' 
              ? 'text-blue-600 font-black bg-blue-50/80' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <RotateCcw className="w-5 h-5 stroke-[2]" />
            {pendentesHojeCount > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
                {pendentesHojeCount > 99 ? '99+' : pendentesHojeCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Revisões</span>
        </button>

        {/* Tab 3: Criar Card (Destaque Central) */}
        <button
          id="tab-btn-criar-card"
          onClick={() => onTabChange('criar_card')}
          className="flex flex-col items-center justify-center -mt-3.5 group transition-transform active:scale-90 cursor-pointer min-h-[52px]"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
            tabAtiva === 'criar_card'
              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-105'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/25'
          }`}>
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </div>
          <span className={`text-[9.5px] tracking-tight mt-0.5 font-bold ${
            tabAtiva === 'criar_card' ? 'text-emerald-700' : 'text-slate-600'
          }`}>
            Criar
          </span>
        </button>

        {/* Tab 4: Provas / Treino */}
        <button
          id="tab-btn-provas"
          onClick={() => onTabChange('provas')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] active:scale-95 ${
            tabAtiva === 'provas' 
              ? 'text-blue-600 font-black bg-blue-50/80' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <GraduationCap className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] tracking-tight mt-0.5">Provas</span>
        </button>

        {/* Tab 5: Métricas */}
        <button
          id="tab-btn-metricas"
          onClick={() => onTabChange('metricas')}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] active:scale-95 ${
            tabAtiva === 'metricas' 
              ? 'text-blue-600 font-black bg-blue-50/80' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] tracking-tight mt-0.5">Métricas</span>
        </button>

      </div>
    </nav>
  );
};
