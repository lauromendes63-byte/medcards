import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Stethoscope, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play,
  BookOpen,
  Lightbulb,
  Image as ImageIcon,
  Scissors,
  Trash2,
  AlertTriangle,
  X,
  FilePenLine
} from 'lucide-react';
import { CardClinico, EspecialidadeMedica, TipoCard } from '../types';
import { EixoEmojiBadge } from './EixoEmojiBadge';

interface CardsListViewProps {
  cards: CardClinico[];
  onAbrirCard: (card: CardClinico) => void;
  onEditarCard?: (card: CardClinico) => void;
  onNovoCard: () => void;
  onExcluirCard?: (cardId: string) => void;
}

export const CardsListView: React.FC<CardsListViewProps> = ({
  cards,
  onAbrirCard,
  onEditarCard,
  onNovoCard,
  onExcluirCard,
}) => {
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | TipoCard>('todos');
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState<string>('Todas');
  const [cardParaExcluir, setCardParaExcluir] = useState<CardClinico | null>(null);

  const cardsFiltrados = cards.filter(c => {
    if (tipoFiltro !== 'todos' && c.tipoCard !== tipoFiltro) return false;
    if (especialidadeFiltro !== 'Todas' && c.especialidade !== especialidadeFiltro) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      const matchTitulo = c.titulo.toLowerCase().includes(q);
      const matchPergunta = c.perguntaGatilho.toLowerCase().includes(q);
      const matchPerola = c.perolaClinica?.toLowerCase().includes(q) || false;
      return matchTitulo || matchPergunta || matchPerola;
    }
    return true;
  });

  return (
    <div className="w-full space-y-4">
      {/* Topo com Título e Filtros */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
              Biblioteca de Flashcards
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Cards & Oclusões ({cardsFiltrados.length})
            </h2>
          </div>

          <button
            onClick={onNovoCard}
            className="self-start sm:self-auto px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            + Criar Flashcard
          </button>
        </div>

        {/* Barra de Busca */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Filtrar por pergunta, resposta, conduta..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        {/* Filtros de Tipo de Conteúdo */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setTipoFiltro('todos')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tipoFiltro === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({cards.length})
          </button>

          <button
            onClick={() => setTipoFiltro('image_occlusion')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              tipoFiltro === 'image_occlusion' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Oclusão de Imagem</span>
          </button>

          <button
            onClick={() => setTipoFiltro('cloze')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
              tipoFiltro === 'cloze' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scissors className="w-3 h-3" />
            <span>Cloze (Lacunas)</span>
          </button>

          <button
            onClick={() => setTipoFiltro('conceito')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tipoFiltro === 'conceito' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Básico (Frente/Verso)
          </button>

          <button
            onClick={() => setTipoFiltro('fluxograma_oclusao')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tipoFiltro === 'fluxograma_oclusao' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fluxogramas
          </button>

          <button
            onClick={() => setTipoFiltro('caso_clinico')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              tipoFiltro === 'caso_clinico' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Múltipla Escolha
          </button>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="space-y-2.5">
        {cardsFiltrados.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-slate-400 text-xs">
            Nenhum flashcard encontrado para os filtros selecionados.
          </div>
        ) : (
          cardsFiltrados.map(card => {
            const isOclusaoImg = card.tipoCard === 'image_occlusion';
            const isCloze = card.tipoCard === 'cloze';
            const isFluxo = card.tipoCard === 'fluxograma_oclusao';
            const isCaso = card.tipoCard === 'caso_clinico';

            return (
              <div
                key={card.id}
                onClick={() => onAbrirCard(card)}
                className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-2.5"
              >
                {/* Topo: Título com 100% de largura horizontal */}
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                    {card.titulo}
                  </h3>
                  {card.perguntaGatilho && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      {card.perguntaGatilho}
                    </p>
                  )}
                </div>

                {/* Linha Inferior: Badges à esquerda e Ações Minimalistas à direita */}
                <div 
                  className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/90"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <EixoEmojiBadge card={card} size="sm" />

                    {isOclusaoImg && (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        <ImageIcon className="w-3 h-3" />
                        Oclusão
                      </span>
                    )}

                    {isCloze && (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        <Scissors className="w-3 h-3" />
                        Cloze
                      </span>
                    )}

                    {isFluxo && (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Layers className="w-3 h-3" />
                        Fluxo
                      </span>
                    )}

                    {isCaso && (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Stethoscope className="w-3 h-3" />
                        Múltipla Escolha
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-medium">
                      Int: {card.intervaloDias}d • {card.taxaAcerto}% acerto
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onEditarCard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarCard(card);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-3xs"
                        title="Editar flashcard"
                      >
                        <FilePenLine className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbrirCard(card);
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all cursor-pointer active:scale-95 shadow-3xs"
                      title="Revisar flashcard"
                    >
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </button>

                    {onExcluirCard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardParaExcluir(card);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-all cursor-pointer active:scale-95"
                        title="Excluir este flashcard"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmação de Exclusão de Card */}
      {cardParaExcluir && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 border border-rose-100 shadow-xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Excluir Flashcard?</h4>
            </div>

            <p className="text-xs text-slate-600">
              Tem certeza que deseja excluir o flashcard <strong>"{cardParaExcluir.titulo}"</strong>?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCardParaExcluir(null)}
                className="flex-1 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onExcluirCard) {
                    onExcluirCard(cardParaExcluir.id);
                  }
                  setCardParaExcluir(null);
                }}
                className="flex-1 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-xs"
              >
                Excluir Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
