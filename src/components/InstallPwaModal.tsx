import React from 'react';
import { Smartphone, X, Download, Share, PlusSquare, CheckCircle2, Globe } from 'lucide-react';
import { MEDCARDS_SVG_DATA_URI } from '../utils/pwaSetup';

interface InstallPwaModalProps {
  onClose: () => void;
  onInstallClick?: () => void;
  canInstallDirectly?: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  onClose,
  onInstallClick,
  canInstallDirectly,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 p-5 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            Aplicativo Web / PWA
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mx-auto w-16 h-16">
          <img 
            src={MEDCARDS_SVG_DATA_URI} 
            alt="Ícone MedCards" 
            className="w-16 h-16 rounded-2xl shadow-lg shadow-blue-600/25 mx-auto object-cover border border-slate-100" 
          />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Instalar MedCards no Celular
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Tenha acesso instantâneo ao MedCards na tela inicial do seu celular, com tela cheia e salvamento offline.
          </p>
        </div>

        {canInstallDirectly && onInstallClick ? (
          <button
            onClick={onInstallClick}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Agora</span>
          </button>
        ) : (
          <div className="text-left space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                iOS
              </span>
              <p className="text-[11px] leading-tight">
                No Safari do iPhone, toque no botão <strong>Compartilhar</strong> (quadrado com seta <Share className="w-3 h-3 inline" />) e toque em <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-slate-200/80">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                Android
              </span>
              <p className="text-[11px] leading-tight">
                No Chrome do Android, toque no menu de <strong>3 pontinhos ⋮</strong> no canto superior e selecione <strong>"Instalar aplicativo"</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Funciona 100% offline no seu dispositivo</span>
        </div>
      </div>
    </div>
  );
};
