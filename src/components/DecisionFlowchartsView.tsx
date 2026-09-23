import React, { useState } from 'react';
import { 
  GitFork, 
  Play, 
  Plus, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Stethoscope,
  X
} from 'lucide-react';
import { CardClinico, EixoClinico, AlgoritmoDecisao, BlocoFluxogramaDecisao } from '../types';
import { EixoEmojiBadge } from './EixoEmojiBadge';
import { FormattedClinicalText } from './FormattedClinicalText';

interface DecisionFlowchartsViewProps {
  cards: CardClinico[];
  eixos: EixoClinico[];
  onEstudarCard: (card: CardClinico) => void;
  onCriarNovoFluxograma: () => void;
  onRegistrarRevisao?: (cardId: string, avaliacao: 'errei' | 'dificil' | 'bom' | 'facil', tempoSegundos: number) => void;
}

export const DecisionFlowchartsView: React.FC<DecisionFlowchartsViewProps> = ({
  cards,
  eixos,
  onEstudarCard,
  onCriarNovoFluxograma,
  onRegistrarRevisao,
}) => {
  // Filtra cards que são fluxogramas ou possuem algoritmo de decisão
  const fluxogramasCards = cards.filter(c => c.tipoCard === 'fluxograma_oclusao' || !!c.algoritmoDecisao);

  // Estado para visualizador interativo em modal
  const [fluxogramaAtivo, setFluxogramaAtivo] = useState<CardClinico | null>(null);
  const [blocosRevelados, setBlocosRevelados] = useState<Record<string, boolean>>({});

  const abrirVisualizador = (card: CardClinico) => {
    setFluxogramaAtivo(card);
    setBlocosRevelados({});
  };

  const fecharVisualizador = () => {
    setFluxogramaAtivo(null);
    setBlocosRevelados({});
  };

  const toggleRevelarBloco = (id: string) => {
    setBlocosRevelados(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const revelarTodos = () => {
    const todos: Record<string, boolean> = {};
    if (fluxogramaAtivo?.algoritmoDecisao) {
      fluxogramaAtivo.algoritmoDecisao.blocos.forEach(b => { todos[b.id] = true; });
    } else if (fluxogramaAtivo?.blocosOclusao) {
      fluxogramaAtivo.blocosOclusao.forEach(b => { todos[b.id] = true; });
    }
    setBlocosRevelados(todos);
  };

  const ocultarTodos = () => {
    setBlocosRevelados({});
  };

  return (
    <div className="w-full space-y-3 pb-24">
      {/* Topo da Aba de Fluxogramas */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <GitFork className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
              Fluxogramas & Algoritmos
            </h2>
            <p className="text-[11px] text-slate-500">
              Árvores de decisão clínica com critérios e condutas
            </p>
          </div>
        </div>

        <button
          onClick={onCriarNovoFluxograma}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Fluxo</span>
        </button>
      </div>

      {/* Lista de Fluxogramas Cadastrados */}
      {fluxogramasCards.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nenhum fluxograma criado ainda</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
              Crie algoritmos de decisão clínica com ramificações condicionais (ex: "Glicemia &gt; 200 mg/dL") ou carregue os dados de exemplo.
            </p>
          </div>
          <button
            onClick={onCriarNovoFluxograma}
            className="px-3.5 py-1.5 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700"
          >
            + Criar Novo Fluxograma
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {fluxogramasCards.map((card) => {
            const alg = card.algoritmoDecisao;
            const totalBlocos = alg?.blocos.length || card.blocosOclusao?.length || 3;

            return (
              <div
                key={card.id}
                onClick={() => abrirVisualizador(card)}
                className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-transform duration-100 ease-out cursor-pointer flex items-center justify-between gap-3 active:scale-[0.98]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <EixoEmojiBadge card={card} size="sm" />
                    <span className="text-[10px] text-slate-500 font-medium">
                      {totalBlocos} etapas de decisão
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {card.titulo}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {alg ? `Ramificações com critérios condicionais ativos` : card.perguntaGatilho}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors">
                    Abrir Árvore
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visualizador Interativo de Algoritmo de Decisão com Critérios Condicionais */}
      {fluxogramaAtivo && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto min-h-screen text-left">
          <div className="w-full max-w-2xl mx-auto px-2.5 sm:px-4 py-2.5 sm:py-4 space-y-2.5 pb-20 animate-in fade-in duration-150">
            
            {/* Topo do Visualizador Fixo (Padrão Provas e Simulados) */}
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-xs font-black text-slate-900">
                  Fluxograma Clínico
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-0.5">
                  <GitFork className="w-2.5 h-2.5" />
                  <span>Algoritmo de Decisão</span>
                </span>
              </div>

              <button
                id="btn-fechar-visualizador-fluxo"
                onClick={fecharVisualizador}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-600 px-1.5 py-0.5 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
              >
                Encerrar
              </button>
            </div>

            {/* Card Principal do Fluxograma */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5 text-left">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {fluxogramaAtivo.titulo}
                </h3>
                {fluxogramaAtivo.perguntaGatilho && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fluxogramaAtivo.perguntaGatilho}
                  </p>
                )}
              </div>

              {/* Barra de Controles e Dicas */}
              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-600">
                  Toque nos blocos para revelar as condutas correspondentes:
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={revelarTodos}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    Revelar Tudo
                  </button>
                  <button
                    onClick={ocultarTodos}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    Ocultar
                  </button>
                </div>
              </div>

              {/* Corpo da Árvore de Decisão */}
              <div className="space-y-3">
                {fluxogramaAtivo.algoritmoDecisao && Array.isArray(fluxogramaAtivo.algoritmoDecisao.blocos) && fluxogramaAtivo.algoritmoDecisao.blocos.length > 0 ? (
                  <div className="space-y-2">
                    {fluxogramaAtivo.algoritmoDecisao.blocos.map((bloco, idx) => {
                      const revelado = blocosRevelados[bloco.id] ?? false;
                      const ramificacao = (fluxogramaAtivo.algoritmoDecisao?.ramificacoes || []).find(r => r?.destinoId === bloco.id);

                      return (
                        <div key={bloco.id || `df-bloco-${idx}`} className="space-y-1.5">
                          {/* Seta Conectora entre Etapas */}
                          {idx > 0 && (
                            <div className="flex items-center justify-center py-1 select-none">
                              <div className="flex items-center gap-1.5 text-indigo-400">
                                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] rotate-90" />
                                {ramificacao?.criterioCondicional && ramificacao.criterioCondicional.trim() ? (
                                  <span className="text-[9.5px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-3xs">
                                    {ramificacao.criterioCondicional}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          )}

                          {/* Bloco da Etapa / Decisão */}
                          <div
                            onClick={() => toggleRevelarBloco(bloco.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                              revelado 
                                ? 'bg-white border-emerald-300 ring-1 ring-emerald-500/20'
                                : 'bg-indigo-50/40 border-indigo-200/80 hover:bg-indigo-50/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                                Etapa #{idx + 1} • {bloco.tipo}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${revelado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {revelado ? 'Revelado' : 'Toque p/ revelar'}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {bloco.titulo}
                            </h4>

                            {revelado ? (
                              <div className="mt-2.5 pt-2 border-t border-slate-100 animate-in fade-in text-xs sm:text-[13px] text-slate-700 font-normal leading-relaxed">
                                <FormattedClinicalText text={bloco.descricao} />
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Qual a resposta indicada para esta etapa? (Toque para revelar)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Fallback para cards com blocos de oclusão simples */
                  <div className="space-y-2">
                    {fluxogramaAtivo.blocosOclusao?.map((bloco, idx) => {
                      const revelado = blocosRevelados[bloco.id] ?? false;
                      return (
                        <div
                          key={bloco.id}
                          onClick={() => toggleRevelarBloco(bloco.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            revelado 
                              ? 'bg-white border-emerald-300' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500">
                              Etapa #{idx + 1}: {bloco.dica}
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold">
                              {revelado ? 'Revelado' : 'Toque p/ ver'}
                            </span>
                          </div>
                          {revelado ? (
                            <div className="text-xs sm:text-[13px] text-slate-700 font-normal leading-relaxed">
                              <FormattedClinicalText text={bloco.textoOculto} />
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-slate-400">
                              •••••••••••••••••••••••• (Toque para ver a resposta)
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Nota de Fixação do Fluxo */}
                {fluxogramaAtivo.perolaClinica && (
                  <div className="p-3 rounded-2xl bg-amber-100/90 border-2 border-amber-300/90 text-xs text-slate-950 space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1 font-black text-amber-900">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Nota de Fixação</span>
                    </div>
                    <p className="text-slate-950 font-semibold leading-relaxed text-xs">
                      {fluxogramaAtivo.perolaClinica}
                    </p>
                  </div>
                )}
              </div>

              {/* Rodapé com Ação */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={fecharVisualizador}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-transform duration-100 ease-out active:scale-[0.98] cursor-pointer shadow-xs"
                >
                  Concluir Visualização
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
