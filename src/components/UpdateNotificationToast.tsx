import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { checkServerVersion, forceAppUpdate, VersionInfo } from '../utils/versionManager';

export const UpdateNotificationToast: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Checagem inicial após 3 segundos
    const timer = setTimeout(() => {
      checkServerVersion().then((result) => {
        if (result.hasUpdate && result.serverInfo) {
          setUpdateInfo(result.serverInfo);
        }
      });
    }, 3000);

    // 2. Checagem sempre que o usuário voltar para o app (troca de aba / retorno ao celular)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion().then((result) => {
          if (result.hasUpdate && result.serverInfo) {
            setUpdateInfo(result.serverInfo);
          }
        });
      }
    };

    // 3. Checagem quando voltar à conexão online
    const handleOnline = () => {
      checkServerVersion().then((result) => {
        if (result.hasUpdate && result.serverInfo) {
          setUpdateInfo(result.serverInfo);
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!updateInfo || dismissed) {
    return null;
  }

  const handleAtualizar = async () => {
    setIsUpdating(true);
    await forceAppUpdate();
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-blue-500/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">
              Nova atualização publicada no Vercel!
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {updateInfo.buildDateFormatted || 'Toque para carregar a versão mais recente.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAtualizar}
            disabled={isUpdating}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Atualizando...' : 'Atualizar'}</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            title="Dispensar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
