import React from 'react';
import { X, Settings } from 'lucide-react';
import { CardClinico, EixoClinico, ProgressoDiario, ModoVisualizacaoEixos } from '../types';
import { SettingsView } from './SettingsView';

interface SettingsModalProps {
  onClose: () => void;
  cards: CardClinico[];
  eixos: EixoClinico[];
  progresso: ProgressoDiario;
  onZerarDados: () => void;
  onCarregarExemplo: () => void;
  onAbrirImportExport: () => void;
  modoVisualizacao?: ModoVisualizacaoEixos;
  onModoVisualizacaoChange?: (modo: ModoVisualizacaoEixos) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  cards,
  eixos,
  progresso,
  onZerarDados,
  onCarregarExemplo,
  onAbrirImportExport,
  modoVisualizacao,
  onModoVisualizacaoChange,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#F4F6F9] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[92vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Header Fixo do Modal de Configurações */}
        <div className="bg-white px-4 py-3 border-b border-slate-200/80 rounded-t-3xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Configurações & Dados</h2>
              <p className="text-[10px] text-slate-400 leading-none">Armazenamento local e opções do sistema</p>
            </div>
          </div>

          <button
            id="btn-fechar-configuracoes-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          <SettingsView
            cards={cards}
            eixos={eixos}
            progresso={progresso}
            onZerarDados={onZerarDados}
            onCarregarExemplo={onCarregarExemplo}
            onAbrirImportExport={onAbrirImportExport}
            modoVisualizacao={modoVisualizacao}
            onModoVisualizacaoChange={onModoVisualizacaoChange}
          />
        </div>
      </div>
    </div>
  );
};
