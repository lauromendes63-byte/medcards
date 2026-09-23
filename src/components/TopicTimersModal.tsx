import React, { useState } from 'react';
import { X, Clock, RotateCcw, Check, Sparkles, Sliders } from 'lucide-react';
import { ConfiguracaoTimers, TopicoClinico } from '../types';
import { DEFAULT_CONFIG_TIMERS, formatarTempoMinutos } from '../utils/timerUtils';

interface TopicTimersModalProps {
  topico: TopicoClinico;
  eixoTitulo: string;
  configGlobal: ConfiguracaoTimers;
  onClose: () => void;
  onSalvar: (customTimers?: ConfiguracaoTimers) => void;
  onResetarRodada1: () => void;
}

export const TopicTimersModal: React.FC<TopicTimersModalProps> = ({
  topico,
  eixoTitulo,
  configGlobal,
  onClose,
  onSalvar,
  onResetarRodada1,
}) => {
  const [usarCustomizado, setUsarCustomizado] = useState(!!topico.customTimers);
  const [timers, setTimers] = useState<ConfiguracaoTimers>(
    topico.customTimers || JSON.parse(JSON.stringify(configGlobal || DEFAULT_CONFIG_TIMERS))
  );
  const [notificacao, setNotificacao] = useState<string | null>(null);

  const atualizarCampo = (
    rodada: 'rodada1' | 'rodada2' | 'rodada3Plus',
    campo: 'erreiMinutos' | 'dificilMinutos' | 'bomMinutos' | 'facilMinutos',
    valor: number
  ) => {
    setTimers(prev => ({
      ...prev,
      [rodada]: {
        ...prev[rodada],
        [campo]: Math.max(1, valor),
      },
    }));
  };

  const handleSalvar = () => {
    if (usarCustomizado) {
      onSalvar(timers);
    } else {
      onSalvar(undefined); // Remove customização e volta a herdar o global
    }
    onClose();
  };

  const handleResetarRodada1 = () => {
    onResetarRodada1();
    setNotificacao('Todos os cards deste tópico foram resetados para a Rodada 1!');
    setTimeout(() => setNotificacao(null), 3000);
  };

  const handleRestaurarPadrao = () => {
    setTimers(JSON.parse(JSON.stringify(DEFAULT_CONFIG_TIMERS)));
    setUsarCustomizado(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Timers do Tópico
              </h3>
              <p className="text-[11px] text-slate-500">
                {eixoTitulo} • <span className="font-semibold text-slate-700">{topico.titulo}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificação Temporária */}
        {notificacao && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{notificacao}</span>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Ação Imediata: Resetar para Rodada 1 */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Reiniciar Ciclo Deste Tópico</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Força todos os cards deste tópico a voltarem para a Rodada 1 para revisão imediata no plantão/dia.
              </p>
            </div>
            <button
              onClick={handleResetarRodada1}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resetar Agora</span>
            </button>
          </div>

          {/* Opção de Usar Customização ou Herdado */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="font-bold text-slate-800 block">Personalizar Intervalos Deste Tópico</span>
              <span className="text-[11px] text-slate-500 block">
                {usarCustomizado 
                  ? 'Este tópico usa prazos específicos definidos abaixo.' 
                  : 'Este tópico usa os timers globais das Configurações.'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={usarCustomizado} 
                onChange={(e) => setUsarCustomizado(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {usarCustomizado && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Bloco Rodada 1 */}
              <div className="p-3 bg-white rounded-2xl border border-rose-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700 text-xs uppercase tracking-wider">
                    Rodada 1 • Cards Novos / 1ª Revisão
                  </span>
                  <span className="text-[10px] text-slate-400">minutos</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Errei ({formatarTempoMinutos(timers.rodada1.erreiMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada1.erreiMinutos}
                      onChange={e => atualizarCampo('rodada1', 'erreiMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Difícil ({formatarTempoMinutos(timers.rodada1.dificilMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada1.dificilMinutos}
                      onChange={e => atualizarCampo('rodada1', 'dificilMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Bom ({formatarTempoMinutos(timers.rodada1.bomMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada1.bomMinutos}
                      onChange={e => atualizarCampo('rodada1', 'bomMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Fácil ({formatarTempoMinutos(timers.rodada1.facilMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada1.facilMinutos}
                      onChange={e => atualizarCampo('rodada1', 'facilMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco Rodada 2 */}
              <div className="p-3 bg-white rounded-2xl border border-amber-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700 text-xs uppercase tracking-wider">
                    Rodada 2 • Consolidação
                  </span>
                  <span className="text-[10px] text-slate-400">minutos</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Errei ({formatarTempoMinutos(timers.rodada2.erreiMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada2.erreiMinutos}
                      onChange={e => atualizarCampo('rodada2', 'erreiMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Difícil ({formatarTempoMinutos(timers.rodada2.dificilMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada2.dificilMinutos}
                      onChange={e => atualizarCampo('rodada2', 'dificilMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Bom ({formatarTempoMinutos(timers.rodada2.bomMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada2.bomMinutos}
                      onChange={e => atualizarCampo('rodada2', 'bomMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Fácil ({formatarTempoMinutos(timers.rodada2.facilMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada2.facilMinutos}
                      onChange={e => atualizarCampo('rodada2', 'facilMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco Rodada 3+ */}
              <div className="p-3 bg-white rounded-2xl border border-blue-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700 text-xs uppercase tracking-wider">
                    Rodada 3+ • Fixação Estendida
                  </span>
                  <span className="text-[10px] text-slate-400">minutos (ex: 60 = 1h, 180 = 3h)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Errei ({formatarTempoMinutos(timers.rodada3Plus.erreiMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada3Plus.erreiMinutos}
                      onChange={e => atualizarCampo('rodada3Plus', 'erreiMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Difícil ({formatarTempoMinutos(timers.rodada3Plus.dificilMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada3Plus.dificilMinutos}
                      onChange={e => atualizarCampo('rodada3Plus', 'dificilMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Bom ({formatarTempoMinutos(timers.rodada3Plus.bomMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada3Plus.bomMinutos}
                      onChange={e => atualizarCampo('rodada3Plus', 'bomMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Fácil ({formatarTempoMinutos(timers.rodada3Plus.facilMinutos)})</label>
                    <input
                      type="number"
                      min={1}
                      value={timers.rodada3Plus.facilMinutos}
                      onChange={e => atualizarCampo('rodada3Plus', 'facilMinutos', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRestaurarPadrao}
                  className="text-slate-500 hover:text-slate-800 text-[11px] underline"
                >
                  Restaurar valores padrão base
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Configuração</span>
          </button>
        </div>
      </div>
    </div>
  );
};
