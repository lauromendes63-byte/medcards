import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  Activity, 
  Zap, 
  Sparkles, 
  HeartPulse, 
  ShieldAlert, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Stethoscope, 
  Layers, 
  FolderPlus, 
  FolderTree, 
  BookOpen, 
  Play,
  RotateCcw, 
  LayoutList, 
  LayoutGrid, 
  Pencil, 
  FilePenLine,
  Trash2, 
  AlertTriangle, 
  Search, 
  X,
  Copy, 
  ClipboardCheck, 
  CheckCircle2, 
  Sliders, 
  FolderInput,
  CheckSquare,
  Square,
  ListChecks,
  MoreVertical
} from 'lucide-react';
import { 
  EixoClinico, 
  CardClinico, 
  EspecialidadeMedica, 
  TopicoClinico, 
  ConfiguracaoTimers, 
  ModoVisualizacaoEixos,
  TipoCard
} from '../types';
import { TopicTimersModal } from './TopicTimersModal';
import { CreateEixoModal } from './CreateEixoModal';
import { StorageService } from '../services/storage';
import { AnkiService } from '../services/ankiService';
import { isCardPendente } from '../utils/timerUtils';

// Rótulos sucintos e otimizados para evitar quebras de linha e manter o 'Pendente' rigorosamente ao lado
export const getBadgeTipoCardCompacto = (tipo: TipoCard) => {
  switch (tipo) {
    case 'image_occlusion':
      return { label: 'Oclusão', desc: 'Oclusão de Imagem' };
    case 'fluxograma_oclusao':
      return { label: 'Fluxo', desc: 'Fluxograma Linear' };
    case 'fluxograma_complexo':
      return { label: 'Fluxo+', desc: 'Fluxograma Complexo (Árvore de Decisão)' };
    case 'cloze':
      return { label: 'Cloze', desc: 'Oclusão de Texto / Lacunas' };
    case 'caso_clinico':
      return { label: 'Caso', desc: 'Caso Clínico (Múltipla Escolha)' };
    case 'conceito':
    default:
      return { label: 'Conceito', desc: 'Flashcard Básico' };
  }
};

// Mapeamento para garantir cores altamente vibrantes, saturadas e com contraste médico nítido
export const obterEstiloCorVibrante = (corTema?: EixoClinico['corTema']) => {
  if (!corTema) {
    return {
      bgIcon: 'bg-white border-2 border-blue-600 ring-2 ring-blue-100/90 text-blue-700 shadow-xs',
      tag: 'bg-blue-100 text-blue-950 border-blue-300',
      hoverBorder: 'hover:border-blue-400',
      activeRing: 'border-blue-500 ring-2 ring-blue-500/20',
      activeGradient: 'from-blue-100/60 to-indigo-50/40',
    };
  }

  const bg = corTema.bgTag || '';
  const accent = (corTema.accent || '').toUpperCase();

  if (bg.includes('purple') || accent.includes('9333EA') || accent.includes('7E22CE')) {
    return {
      bgIcon: 'bg-white border-2 border-purple-600 ring-2 ring-purple-100/90 text-purple-700 shadow-xs',
      tag: 'bg-purple-100 text-purple-950 border-purple-300',
      hoverBorder: 'hover:border-purple-400',
      activeRing: 'border-purple-500 ring-2 ring-purple-500/20',
      activeGradient: 'from-purple-100/60 to-indigo-50/40',
    };
  }

  if (bg.includes('emerald') || accent.includes('059669') || accent.includes('047857')) {
    return {
      bgIcon: 'bg-white border-2 border-emerald-600 ring-2 ring-emerald-100/90 text-emerald-700 shadow-xs',
      tag: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      hoverBorder: 'hover:border-emerald-400',
      activeRing: 'border-emerald-500 ring-2 ring-emerald-500/20',
      activeGradient: 'from-emerald-100/60 to-teal-50/40',
    };
  }

  if (bg.includes('rose') || accent.includes('E11D48') || accent.includes('BE123C')) {
    return {
      bgIcon: 'bg-white border-2 border-rose-600 ring-2 ring-rose-100/90 text-rose-700 shadow-xs',
      tag: 'bg-rose-100 text-rose-950 border-rose-300',
      hoverBorder: 'hover:border-rose-400',
      activeRing: 'border-rose-500 ring-2 ring-rose-500/20',
      activeGradient: 'from-rose-100/60 to-orange-50/40',
    };
  }

  if (bg.includes('amber') || accent.includes('D97706') || accent.includes('B45309')) {
    return {
      bgIcon: 'bg-white border-2 border-amber-600 ring-2 ring-amber-100/90 text-amber-700 shadow-xs',
      tag: 'bg-amber-100 text-amber-950 border-amber-300',
      hoverBorder: 'hover:border-amber-400',
      activeRing: 'border-amber-500 ring-2 ring-amber-500/20',
      activeGradient: 'from-amber-100/60 to-yellow-50/40',
    };
  }

  if (bg.includes('indigo') || accent.includes('4F46E5') || accent.includes('4338CA')) {
    return {
      bgIcon: 'bg-white border-2 border-indigo-600 ring-2 ring-indigo-100/90 text-indigo-700 shadow-xs',
      tag: 'bg-indigo-100 text-indigo-950 border-indigo-300',
      hoverBorder: 'hover:border-indigo-400',
      activeRing: 'border-indigo-500 ring-2 ring-indigo-500/20',
      activeGradient: 'from-indigo-100/60 to-blue-50/40',
    };
  }

  if (bg.includes('cyan') || accent.includes('0891B2') || accent.includes('0E7490')) {
    return {
      bgIcon: 'bg-white border-2 border-cyan-600 ring-2 ring-cyan-100/90 text-cyan-700 shadow-xs',
      tag: 'bg-cyan-100 text-cyan-950 border-cyan-300',
      hoverBorder: 'hover:border-cyan-400',
      activeRing: 'border-cyan-500 ring-2 ring-cyan-500/20',
      activeGradient: 'from-cyan-100/60 to-sky-50/40',
    };
  }

  if (bg.includes('orange') || accent.includes('EA580C') || accent.includes('C2410C')) {
    return {
      bgIcon: 'bg-white border-2 border-orange-600 ring-2 ring-orange-100/90 text-orange-700 shadow-xs',
      tag: 'bg-orange-100 text-orange-950 border-orange-300',
      hoverBorder: 'hover:border-orange-400',
      activeRing: 'border-orange-500 ring-2 ring-orange-500/20',
      activeGradient: 'from-orange-100/60 to-amber-50/40',
    };
  }

  if (bg.includes('teal') || accent.includes('0D9488') || accent.includes('0F766E')) {
    return {
      bgIcon: 'bg-white border-2 border-teal-600 ring-2 ring-teal-100/90 text-teal-700 shadow-xs',
      tag: 'bg-teal-100 text-teal-950 border-teal-300',
      hoverBorder: 'hover:border-teal-400',
      activeRing: 'border-teal-500 ring-2 ring-teal-500/20',
      activeGradient: 'from-teal-100/60 to-emerald-50/40',
    };
  }

  if (bg.includes('fuchsia') || accent.includes('C026D3') || accent.includes('A21CAF')) {
    return {
      bgIcon: 'bg-white border-2 border-fuchsia-600 ring-2 ring-fuchsia-100/90 text-fuchsia-700 shadow-xs',
      tag: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-300',
      hoverBorder: 'hover:border-fuchsia-400',
      activeRing: 'border-fuchsia-500 ring-2 ring-fuchsia-500/20',
      activeGradient: 'from-fuchsia-100/60 to-pink-50/40',
    };
  }

  return {
    bgIcon: 'bg-white border-2 border-blue-600 ring-2 ring-blue-100/90 text-blue-700 shadow-xs',
    tag: 'bg-blue-100 text-blue-950 border-blue-300',
    hoverBorder: 'hover:border-blue-400',
    activeRing: 'border-blue-500 ring-2 ring-blue-500/20',
    activeGradient: 'from-blue-100/60 to-indigo-50/40',
  };
};

interface EixosViewProps {
  eixos: EixoClinico[];
  cards: CardClinico[];
  especialidadeFiltro: EspecialidadeMedica | 'Todas';
  onFiltroChange: (esp: EspecialidadeMedica | 'Todas') => void;
  onEstudarEixo: (eixoId: string, apenasPendentes?: boolean) => void;
  onEstudarCards?: (cards: CardClinico[]) => void;
  onAdicionarCardAoEixo: (eixoId: string, topicoId?: string) => void;
  onAdicionarTopicoAoEixo?: (eixoId: string, titulo: string, descricao?: string) => void;
  onEditarEixo?: (eixo: EixoClinico) => void;
  onExcluirEixo?: (eixoId: string, excluirCards: boolean) => void;
  onEditarTopico?: (eixoId: string, topicoId: string, novoTitulo: string, novaDescricao?: string) => void;
  onExcluirTopico?: (eixoId: string, topicoId: string, excluirCards: boolean) => void;
  onExcluirCard?: (cardId: string) => void;
  onEditarCard?: (card: CardClinico) => void;
  onCardAtualizado?: (card: CardClinico) => void;
  onAbrirCard: (card: CardClinico) => void;
  onCriarNovoEixo?: () => void;
  onCriarNovoCard?: () => void;
  onResetarFila?: (eixoId?: string, topicoId?: string) => void;
  onAbrirImportExport?: (options?: { tab?: 'importar' | 'exportar'; eixoId?: string; cardId?: string }) => void;
  eixoAtivoId?: string | null;
  onSelecionarEixo?: (id: string | null) => void;
  onSalvarTimersTopico?: (eixoId: string, topicoId: string, customTimers?: ConfiguracaoTimers) => void;
  onResetarTopicoParaRodada1?: (eixoId: string, topicoId: string) => void;
  onMoverCard?: (cardId: string, novoEixoId: string, novoTopicoId?: string) => void;
  onMoverTopico?: (eixoOrigemId: string, eixoDestinoId: string, topicoId: string) => void;
  onMoverVariosCards?: (cardIds: string[], novoEixoId: string, novoTopicoId?: string, novoTopicoTitulo?: string) => void;
  onExcluirVariosCards?: (cardIds: string[]) => void;
  modoVisualizacao?: ModoVisualizacaoEixos;
  onModoVisualizacaoChange?: (modo: ModoVisualizacaoEixos) => void;
}

export const EixosView: React.FC<EixosViewProps> = ({
  eixos,
  cards,
  especialidadeFiltro,
  onFiltroChange,
  onEstudarEixo,
  onEstudarCards,
  onAdicionarCardAoEixo,
  onAdicionarTopicoAoEixo,
  onEditarEixo,
  onExcluirEixo,
  onEditarTopico,
  onExcluirTopico,
  onExcluirCard,
  onEditarCard,
  onCardAtualizado,
  onAbrirCard,
  onCriarNovoEixo,
  onCriarNovoCard,
  onResetarFila,
  onAbrirImportExport,
  eixoAtivoId: propEixoAtivoId,
  onSelecionarEixo: propOnSelecionarEixo,
  onSalvarTimersTopico,
  onResetarTopicoParaRodada1,
  onMoverCard,
  onMoverTopico,
  onMoverVariosCards,
  onExcluirVariosCards,
  modoVisualizacao: propModoVisualizacao,
  onModoVisualizacaoChange: propOnModoVisualizacaoChange,
}) => {
  // Eixo expandido atual
  const [internalEixoAtivoId, setInternalEixoAtivoId] = useState<string | null>(null);
  const eixoAtivoId = propEixoAtivoId !== undefined ? propEixoAtivoId : internalEixoAtivoId;
  const setEixoAtivoId = propOnSelecionarEixo || setInternalEixoAtivoId;

  // Estado para expandir tópico dentro do eixo aberto
  const [topicoExpandidoId, setTopicoExpandidoId] = useState<string | null>(null);

  // Modo de visualização (Lista vs Grade)
  const [internalModo, setInternalModo] = useState<ModoVisualizacaoEixos>(() => StorageService.getModoVisualizacaoEixos());
  const modoVisualizacao = propModoVisualizacao !== undefined ? propModoVisualizacao : internalModo;

  // Busca rápida de eixos/tópicos
  const [buscaTexto, setBuscaTexto] = useState('');

  // Toast feedback rápido de cópia
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const mostrarFeedback = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // =========================================================================
  // SELEÇÃO MÚLTIPLA & AÇÕES EM MASSA (BATCH OPERATIONS)
  // =========================================================================
  const [cardsSelecionados, setCardsSelecionados] = useState<Set<string>>(new Set());
  const [modalMoverVariosAberto, setModalMoverVariosAberto] = useState(false);
  const [modalExcluirVariosAberto, setModalExcluirVariosAberto] = useState(false);
  const [destinoVariosEixoId, setDestinoVariosEixoId] = useState<string>(eixos[0]?.id || '');
  const [destinoVariosTopicoModo, setDestinoVariosTopicoModo] = useState<string>('__auto__');
  const [destinoVariosNovoTopicoTitulo, setDestinoVariosNovoTopicoTitulo] = useState<string>('');

  const handleToggleCardSelecionado = (cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCardsSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleToggleSelecionarTodosDoTopico = (cardsDoTopico: CardClinico[]) => {
    const todosSelecionados = cardsDoTopico.every(c => cardsSelecionados.has(c.id));
    setCardsSelecionados(prev => {
      const next = new Set(prev);
      if (todosSelecionados) {
        cardsDoTopico.forEach(c => next.delete(c.id));
      } else {
        cardsDoTopico.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const handleLimparSelecao = () => {
    setCardsSelecionados(new Set());
  };

  const handleEstudarSelecionados = () => {
    if (cardsSelecionados.size === 0 || !onEstudarCards) return;
    const cardsParaEstudo = cards.filter(c => cardsSelecionados.has(c.id));
    handleLimparSelecao();
    onEstudarCards(cardsParaEstudo);
  };

  const handleConfirmarMoverVarios = () => {
    if (cardsSelecionados.size === 0 || !destinoVariosEixoId || !onMoverVariosCards) return;
    const ids = Array.from(cardsSelecionados);

    let topId: string | undefined = undefined;
    let topTitulo: string | undefined = undefined;

    if (destinoVariosTopicoModo === '__novo__') {
      topTitulo = destinoVariosNovoTopicoTitulo.trim() || 'Novo Tópico';
    } else if (destinoVariosTopicoModo !== '__auto__') {
      topId = destinoVariosTopicoModo;
    }

    onMoverVariosCards(ids, destinoVariosEixoId, topId, topTitulo);
    handleLimparSelecao();
    setModalMoverVariosAberto(false);
    setDestinoVariosNovoTopicoTitulo('');
    mostrarFeedback(`${ids.length} flashcards movidos com sucesso!`);
  };

  const handleConfirmarExcluirVarios = () => {
    if (cardsSelecionados.size === 0 || !onExcluirVariosCards) return;
    const ids = Array.from(cardsSelecionados);
    onExcluirVariosCards(ids);
    handleLimparSelecao();
    setModalExcluirVariosAberto(false);
    mostrarFeedback(`${ids.length} flashcards excluídos com sucesso!`);
  };

  // Modais de Eixo
  const [eixoEmEdicao, setEixoEmEdicao] = useState<EixoClinico | null>(null);

  // Menus de opções rápidas (...)
  const [menuTopicoAbertoId, setMenuTopicoAbertoId] = useState<string | null>(null);
  const [menuCardAbertoId, setMenuCardAbertoId] = useState<string | null>(null);

  // Modais de Tópico
  const [modalNovoTopicoAberto, setModalNovoTopicoAberto] = useState(false);
  const [novoTopicoEixoId, setNovoTopicoEixoId] = useState<string | null>(null);
  const [novoTopicoTitulo, setNovoTopicoTitulo] = useState('');
  const [novoTopicoDescricao, setNovoTopicoDescricao] = useState('');

  const [topicoEmEdicao, setTopicoEmEdicao] = useState<{ eixoId: string; topico: TopicoClinico } | null>(null);
  const [editTopicoTitulo, setEditTopicoTitulo] = useState('');
  const [editTopicoDescricao, setEditTopicoDescricao] = useState('');

  const [topicoParaExcluir, setTopicoParaExcluir] = useState<{ eixoId: string; topico: TopicoClinico } | null>(null);

  // Modais de Mover Tópico / Mover Card
  const [topicoParaMover, setTopicoParaMover] = useState<{ eixoOrigemId: string; topico: TopicoClinico } | null>(null);
  const [destinoMoverEixoId, setDestinoMoverEixoId] = useState<string>('');

  const [cardParaMover, setCardParaMover] = useState<CardClinico | null>(null);
  const [destinoCardEixoId, setDestinoCardEixoId] = useState<string>('');
  const [destinoCardTopicoId, setDestinoCardTopicoId] = useState<string>('');

  // Modal de Exclusão de Card individual
  const [cardParaExcluir, setCardParaExcluir] = useState<CardClinico | null>(null);

  // Modal de Renomear Título de Card
  const [cardParaRenomear, setCardParaRenomear] = useState<CardClinico | null>(null);
  const [novoTituloCard, setNovoTituloCard] = useState('');

  const handleSalvarRenomearCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardParaRenomear || !novoTituloCard.trim()) return;
    const cardAtualizado: CardClinico = {
      ...cardParaRenomear,
      titulo: novoTituloCard.trim(),
      dataAtualizacao: new Date().toISOString(),
    };
    StorageService.atualizarCard(cardAtualizado);
    if (onCardAtualizado) {
      onCardAtualizado(cardAtualizado);
    }
    setCardParaRenomear(null);
    mostrarFeedback(`Título do flashcard atualizado para "${cardAtualizado.titulo}"!`);
  };

  // Modal para configurar timers do tópico
  const [topicoParaTimers, setTopicoParaTimers] = useState<{
    topico: TopicoClinico;
    eixoTitulo: string;
    eixoId: string;
  } | null>(null);

  const handleAlternarModo = (novoModo: ModoVisualizacaoEixos) => {
    StorageService.setModoVisualizacaoEixos(novoModo);
    setInternalModo(novoModo);
    if (propOnModoVisualizacaoChange) {
      propOnModoVisualizacaoChange(novoModo);
    }
  };

  const handleToggleEixo = (eixoId: string) => {
    if (eixoAtivoId === eixoId) {
      setEixoAtivoId(null);
    } else {
      setEixoAtivoId(eixoId);
    }
  };

  const especialidadesDisponiveis = useMemo(() => {
    const espSet = new Set<string>();
    eixos.forEach(e => {
      if (e.especialidade) espSet.add(e.especialidade);
    });
    return ['Todas', ...Array.from(espSet)];
  }, [eixos]);

  const renderIcone = (iconeNome: string, classe: string = 'w-4 h-4') => {
    if (!iconeNome) return <Stethoscope className={classe} />;
    if (/\p{Extended_Pictographic}/u.test(iconeNome)) {
      const isGrande = classe.includes('w-5') || classe.includes('h-5');
      return (
        <span className={`${isGrande ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} leading-none select-none filter drop-shadow-xs transform-gpu`}>
          {iconeNome}
        </span>
      );
    }
    switch (iconeNome) {
      case 'Brain':
        return <Brain className={classe} />;
      case 'Activity':
        return <Activity className={classe} />;
      case 'Zap':
        return <Zap className={classe} />;
      case 'Sparkles':
        return <Sparkles className={classe} />;
      case 'Heart':
      case 'HeartPulse':
        return <HeartPulse className={classe} />;
      case 'ShieldAlert':
        return <ShieldAlert className={classe} />;
      case 'Stethoscope':
      default:
        return <Stethoscope className={classe} />;
    }
  };

  const eixosFiltrados = eixos.filter((e) => {
    if (especialidadeFiltro !== 'Todas' && e.especialidade !== especialidadeFiltro) {
      return false;
    }
    if (buscaTexto.trim()) {
      const q = buscaTexto.toLowerCase();
      const matchTitulo = e.titulo.toLowerCase().includes(q);
      const matchSub = e.subtitulo?.toLowerCase().includes(q) || false;
      const matchEsp = e.especialidade.toLowerCase().includes(q);
      const matchTopico = e.topicos?.some(t => t.titulo.toLowerCase().includes(q)) || false;
      return matchTitulo || matchSub || matchEsp || matchTopico;
    }
    return true;
  });

  const handleCriarTopico = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEixoId = novoTopicoEixoId || eixoAtivoId;
    if (!targetEixoId || !novoTopicoTitulo.trim() || !onAdicionarTopicoAoEixo) return;

    onAdicionarTopicoAoEixo(targetEixoId, novoTopicoTitulo.trim(), novoTopicoDescricao.trim());
    setNovoTopicoTitulo('');
    setNovoTopicoDescricao('');
    setModalNovoTopicoAberto(false);
    setNovoTopicoEixoId(null);
    mostrarFeedback('Tópico adicionado com sucesso!');
  };

  const abrirEdicaoTopico = (eixoId: string, topico: TopicoClinico) => {
    setTopicoEmEdicao({ eixoId, topico });
    setEditTopicoTitulo(topico.titulo);
    setEditTopicoDescricao(topico.descricao || '');
  };

  const handleSalvarEdicaoTopico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicoEmEdicao || !editTopicoTitulo.trim() || !onEditarTopico) return;

    onEditarTopico(
      topicoEmEdicao.eixoId,
      topicoEmEdicao.topico.id,
      editTopicoTitulo.trim(),
      editTopicoDescricao.trim()
    );
    setTopicoEmEdicao(null);
    mostrarFeedback('Tópico atualizado!');
  };

  const handleCopiarCard = async (card: CardClinico, e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonStr = AnkiService.exportarCardIndividualJson(card);
    const ok = await AnkiService.copiarParaClipboard(jsonStr);
    if (ok) {
      mostrarFeedback(`Flashcard "${card.titulo}" copiado em JSON!`);
    }
  };

  return (
    <div className="w-full space-y-3 pb-28 relative">
      {/* Toast flutuante de feedback */}
      {feedbackToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Barra de Título da Seção */}
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Eixos ({eixos.length})
          </h3>

          {/* Alternador de Layout: Lista vs Grade */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/70 shrink-0">
            <button
              type="button"
              id="btn-modo-lista-eixos"
              onClick={() => handleAlternarModo('lista')}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                modoVisualizacao === 'lista'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Modo Lista (com expansão completa dos tópicos e cards)"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-modo-grade-eixos"
              onClick={() => handleAlternarModo('grade')}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                modoVisualizacao === 'grade'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Modo Grade (cartões compactos)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ações Rápidas: Novo Eixo e Novo Card */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onCriarNovoEixo && (
            <button
              id="btn-criar-eixo-pill"
              onClick={onCriarNovoEixo}
              className="group inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 text-xs font-bold border border-slate-200/90 hover:border-indigo-300 shadow-2xs transition-transform duration-100 ease-out active:scale-[0.98] cursor-pointer whitespace-nowrap"
              title="Criar novo Eixo Clínico"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-600 shrink-0" strokeWidth={1.75} />
              <span>
                <span className="hidden min-[340px]:inline">Novo </span>Eixo
              </span>
            </button>
          )}

          {onCriarNovoCard && (
            <button
              id="btn-criar-card-pill"
              onClick={onCriarNovoCard}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-sm shadow-blue-500/25 transition-transform duration-100 ease-out active:scale-[0.98] cursor-pointer whitespace-nowrap"
              title="Criar novo Flashcard"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>
                <span className="hidden min-[340px]:inline">Novo </span>Card
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Busca Rápida */}
      {eixos.length > 2 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={buscaTexto}
            onChange={e => setBuscaTexto(e.target.value)}
            placeholder="Buscar por título, especialidade ou tópico..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 shadow-2xs"
          />
          {buscaTexto && (
            <button
              onClick={() => setBuscaTexto('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Barra de Filtros de Especialidade */}
      {especialidadesDisponiveis.length > 2 && (
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x scroll-smooth overscroll-x-contain pb-0.5 px-1 no-scrollbar">
            {especialidadesDisponiveis.map((esp) => (
              <button
                key={esp}
                onClick={() => onFiltroChange(esp as any)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  especialidadeFiltro === esp
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {esp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LISTAGEM DE EIXOS */}
      {eixosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nenhum Eixo Clínico encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
              {buscaTexto ? 'Tente ajustar sua busca ou limpar os filtros.' : 'Crie seu primeiro Eixo Clínico para organizar seus estudos.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            {buscaTexto ? (
              <button
                onClick={() => setBuscaTexto('')}
                className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Limpar Busca
              </button>
            ) : onCriarNovoEixo && (
              <button
                onClick={onCriarNovoEixo}
                className="px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                + Criar Eixo Clínico
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={modoVisualizacao === 'grade' ? 'grid grid-cols-2 gap-2 sm:gap-3' : 'space-y-3'}>
          {eixosFiltrados.map((eixo) => {
            const cardsDoEixo = cards.filter(c => c.eixoId === eixo.id);
            const pendentesHoje = cardsDoEixo.filter(c => isCardPendente(c)).length;
            const isAberto = eixoAtivoId === eixo.id;
            const estiloVibrante = obterEstiloCorVibrante(eixo.corTema);

            // Resolução robusta dos tópicos do eixo (Garante que NENHUM card fica invisível/no limbo)
            const topicosCadastrados = eixo.topicos || [];
            const idsTopicosCadastrados = new Set(topicosCadastrados.map(t => t.id));

            // Cards que não possuem um topicoId correspondente
            const cardsSemTopicoCorrespondente = cardsDoEixo.filter(
              c => !c.topicoId || !idsTopicosCadastrados.has(c.topicoId)
            );

            let topicosDoEixo: TopicoClinico[] = [...topicosCadastrados];
            if (topicosCadastrados.length === 0) {
              topicosDoEixo = [{
                id: 'top-geral',
                eixoId: eixo.id,
                titulo: 'Conceitos Gerais',
                descricao: 'Tópico padrão de flashcards',
                totalCards: cardsDoEixo.length,
              }];
            } else if (topicosCadastrados.length === 1 && cardsSemTopicoCorrespondente.length > 0) {
              // Se o eixo tem apenas 1 tópico existente, agrega todos os cards do eixo nele
              topicosDoEixo = [{
                ...topicosCadastrados[0],
                totalCards: cardsDoEixo.length,
              }];
            } else if (cardsSemTopicoCorrespondente.length > 0) {
              const jaTemGeral = topicosDoEixo.some(t => t.id === 'top-geral' || t.titulo.toLowerCase().includes('geral') || t.titulo.toLowerCase().includes('outros'));
              if (!jaTemGeral) {
                topicosDoEixo.push({
                  id: 'top-geral',
                  eixoId: eixo.id,
                  titulo: 'Outros Flashcards / Geral',
                  descricao: 'Flashcards sem tópico específico',
                  totalCards: cardsSemTopicoCorrespondente.length,
                });
              }
            }

            const topicosCount = topicosDoEixo.length;

            // =================================================================
            // MODO GRADE COMPACTA (QUANDO NÃO ESTÁ ABERTO)
            // =================================================================
            if (modoVisualizacao === 'grade' && !isAberto) {
              return (
                <div
                  key={eixo.id}
                  id={`eixo-card-${eixo.id}`}
                  onClick={() => handleToggleEixo(eixo.id)}
                  className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs ${
                    estiloVibrante.hoverBorder
                  } transition-colors duration-150 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer hover:bg-slate-50/50 w-full min-w-0 max-w-full overflow-hidden transform-gpu ${
                    eixoAtivoId ? 'col-span-full sm:col-span-1' : 'col-span-1'
                  }`}
                >
                  <div className="min-w-0 w-full">
                    <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${estiloVibrante.bgIcon}`}>
                        {renderIcone(eixo.icone, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                      </div>
                      {pendentesHoje > 0 ? (
                        <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 shrink-0 whitespace-nowrap">
                          {pendentesHoje} hoje
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60 shrink-0 whitespace-nowrap">
                          {cardsDoEixo.length} cards
                        </span>
                      )}
                    </div>

                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider border inline-block mb-1 truncate max-w-full ${estiloVibrante.tag}`}>
                      {eixo.especialidade}
                    </span>

                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 break-words min-w-0">
                      {eixo.titulo}
                    </h3>
                    {eixo.subtitulo ? (
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed break-words min-w-0">{eixo.subtitulo}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5 min-w-0">{topicosCount} {topicosCount === 1 ? 'tópico' : 'tópicos'}</p>
                    )}
                  </div>

                  {/* Barra de Ações Inferior Otimizada para 2 Colunas sem Vazamento */}
                  <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-slate-100 w-full min-w-0 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                      {pendentesHoje > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEstudarEixo(eixo.id, true)}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[11px] shadow-3xs transition-colors cursor-pointer min-w-0 flex-1 truncate"
                            title="Estudar cards pendentes deste eixo"
                          >
                            <Play className="w-3 h-3 fill-current shrink-0" />
                            <span className="truncate">Estudar ({pendentesHoje})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEstudarEixo(eixo.id, false)}
                            className="p-1 sm:px-1.5 sm:py-1 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-bold text-[11px] border border-blue-200/70 transition-colors cursor-pointer shrink-0"
                            title="Revisar todos os cards deste eixo"
                          >
                            <BookOpen className="w-3 h-3 shrink-0" strokeWidth={2} />
                            <span className="hidden sm:inline">Revisar</span>
                          </button>
                        </>
                      ) : cardsDoEixo.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => onEstudarEixo(eixo.id, false)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-[11px] shadow-3xs transition-colors cursor-pointer min-w-0 flex-1 truncate"
                          title="Revisar todos os cards deste eixo"
                        >
                          <BookOpen className="w-3 h-3 shrink-0" strokeWidth={2} />
                          <span className="truncate">Revisar ({cardsDoEixo.length})</span>
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEixoEmEdicao(eixo)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title="Personalizar eixo"
                      >
                        <Pencil className="w-3 h-3" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEixo(eixo.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title="Expandir detalhes"
                      >
                        <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // =================================================================
            // MODO LISTA OU MODO GRADE EXPANDIDO (LARGURA TOTAL)
            // =================================================================
            const hasMenuAbertoNoEixo = 
              topicosDoEixo.some(t => t.id === menuTopicoAbertoId) || 
              cardsDoEixo.some(c => c.id === menuCardAbertoId);

            return (
              <div
                key={eixo.id}
                id={`eixo-card-${eixo.id}`}
                className={`bg-white rounded-2xl sm:rounded-3xl border transition-colors duration-150 relative w-full max-w-full transform-gpu ${
                  hasMenuAbertoNoEixo 
                    ? 'z-30 overflow-visible' 
                    : isAberto 
                      ? 'z-10 overflow-visible' 
                      : 'z-0 overflow-hidden'
                } ${
                  isAberto && modoVisualizacao === 'grade' ? 'col-span-full' : ''
                } ${
                  isAberto
                    ? `${estiloVibrante.activeRing} shadow-md`
                    : `border-slate-200/90 shadow-2xs ${estiloVibrante.hoverBorder}`
                }`}
              >
                {/* Cabeçalho do Eixo */}
                <div
                  onClick={() => handleToggleEixo(eixo.id)}
                  className={`p-3.5 sm:p-4 cursor-pointer transition-colors rounded-t-2xl sm:rounded-t-3xl ${
                    isAberto ? `bg-gradient-to-r ${estiloVibrante.activeGradient}` : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Linha Superior: Ícone + Título e Subtítulo (com largura total) + Botões de Controle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div 
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${estiloVibrante.bgIcon}`}
                      >
                        {renderIcone(eixo.icone, 'w-5 h-5')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${estiloVibrante.tag}`}>
                            {eixo.especialidade}
                          </span>
                          {pendentesHoje > 0 ? (
                            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                              {pendentesHoje} hoje
                            </span>
                          ) : (
                            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                              {cardsDoEixo.length} cards
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                          {eixo.titulo}
                        </h3>
                        {eixo.subtitulo ? (
                          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">{eixo.subtitulo}</p>
                        ) : (
                          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{topicosCount} {topicosCount === 1 ? 'tópico' : 'tópicos'}</p>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação Secundária no Canto Superior Direito (Pencil + Expandir) */}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEixoEmEdicao(eixo)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar tema, ícone ou título do eixo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleEixo(eixo.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={isAberto ? 'Recolher detalhes' : 'Expandir tópicos'}
                      >
                        {isAberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Linha de Ações Rápidas de Estudo (Estudar Verde / Revisar Azul) */}
                  {(pendentesHoje > 0 || cardsDoEixo.length > 0) && (
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100/90 flex-wrap" onClick={e => e.stopPropagation()}>
                      {pendentesHoje > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEstudarEixo(eixo.id, true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs shadow-3xs transition-transform duration-100 ease-out active:scale-95 cursor-pointer"
                            title="Estudar cards pendentes deste eixo"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Estudar ({pendentesHoje})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEstudarEixo(eixo.id, false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-3xs transition-transform duration-100 ease-out active:scale-95 cursor-pointer"
                            title="Revisar todos os cards deste eixo"
                          >
                            <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>Revisar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onEstudarEixo(eixo.id, false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs shadow-3xs transition-transform duration-100 ease-out active:scale-95 cursor-pointer"
                          title="Revisar todos os cards deste eixo"
                        >
                          <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Revisar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* =============================================================
                 * DETALHES DO EIXO ABERTO COM TÓPICOS E CARDS
                 * ============================================================= */}
                {isAberto && (
                  <div className="border-t border-slate-100 p-2.5 sm:p-4 bg-slate-50/40 space-y-3 rounded-b-2xl sm:rounded-b-3xl">
                    
                    {/* Barra de Ferramentas do Eixo Aberto */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-700">
                          {topicosDoEixo.length} {topicosDoEixo.length === 1 ? 'tópico' : 'tópicos'}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-500">
                          {cardsDoEixo.length} flashcards
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {onAdicionarTopicoAoEixo && (
                          <button
                            type="button"
                            onClick={() => {
                              setNovoTopicoEixoId(eixo.id);
                              setModalNovoTopicoAberto(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-blue-600" />
                            <span>Novo Tópico</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onAdicionarCardAoEixo(eixo.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Novo Card</span>
                        </button>

                        {onResetarFila && cardsDoEixo.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              onResetarFila(eixo.id);
                              mostrarFeedback('Fila deste eixo zerada para revisão imediata!');
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Resetar timers deste eixo para revisão imediata"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lista de Tópicos do Eixo */}
                    <div className="space-y-2.5">
                      {topicosDoEixo.map((topico) => {
                        const idsConhecidos = new Set(topicosDoEixo.map(t => t.id));
                        const cardsDoTopico = cardsDoEixo.filter(c => {
                          if (c.topicoId === topico.id) return true;
                          if (topico.id === 'top-geral' && (!c.topicoId || !idsConhecidos.has(c.topicoId))) return true;
                          if (topicosDoEixo.length === 1) return true;
                          return false;
                        });

                        const cardsPendentesTopico = cardsDoTopico.filter(c => isCardPendente(c));
                        const pendentesTopico = cardsPendentesTopico.length;
                        const isTopicoExpandido = topicoExpandidoId === topico.id;
                        const todosTopicoSelecionados = cardsDoTopico.length > 0 && cardsDoTopico.every(c => cardsSelecionados.has(c.id));

                        return (
                          <div
                            key={topico.id}
                            className="bg-white rounded-2xl border border-slate-200/80 shadow-3xs overflow-visible"
                          >
                            {/* Cabeçalho do Tópico em 2 Linhas: Linha 1 = Título Completo + Expand, Linha 2 = Badges + Ações */}
                            <div
                              onClick={() => setTopicoExpandidoId(prev => prev === topico.id ? null : topico.id)}
                              className="p-3 sm:p-3.5 cursor-pointer hover:bg-slate-50/70 transition-colors space-y-2"
                            >
                              {/* Linha 1: Título do Tópico 100% legível */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                                    {topico.titulo}
                                  </h4>
                                  {topico.descricao && (
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{topico.descricao}</p>
                                  )}
                                </div>

                                <div className="p-1 text-slate-400 hover:text-slate-700 shrink-0">
                                  {isTopicoExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </div>

                              {/* Linha 2: Badges à esquerda e Ações à direita */}
                              <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5" onClick={e => e.stopPropagation()}>
                                {/* Badges */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {pendentesTopico > 0 ? (
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                                      {pendentesTopico} pendentes
                                    </span>
                                  ) : (
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                                      {cardsDoTopico.length} cards
                                    </span>
                                  )}

                                  {topico.customTimers && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                      <Sliders className="w-2.5 h-2.5" />
                                      <span>Timers</span>
                                    </span>
                                  )}
                                </div>

                                {/* Ações do Tópico: Estudar (Verde) e Revisar (Azul) */}
                                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                  {cardsDoTopico.length > 0 && onEstudarCards && (
                                    cardsPendentesTopico.length > 0 ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => onEstudarCards(cardsPendentesTopico)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs shadow-3xs transition-transform duration-100 ease-out active:scale-95 cursor-pointer"
                                          title="Estudar apenas os flashcards pendentes deste tópico"
                                        >
                                          <Play className="w-3 h-3 fill-current" />
                                          <span>Estudar ({cardsPendentesTopico.length})</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onEstudarCards(cardsDoTopico)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-3xs transition-transform duration-100 ease-out active:scale-95 cursor-pointer"
                                          title="Revisar todos os flashcards deste tópico"
                                        >
                                          <BookOpen className="w-3 h-3" strokeWidth={2} />
                                          <span>Revisar</span>
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => onEstudarCards(cardsDoTopico)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs shadow-3xs transition-transform duration-100 ease-out active:scale-95 cursor-pointer"
                                        title="Revisar todos os flashcards deste tópico"
                                      >
                                        <BookOpen className="w-3 h-3" strokeWidth={2} />
                                        <span>Revisar</span>
                                      </button>
                                    )
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => onAdicionarCardAoEixo(eixo.id, topico.id)}
                                    className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200/80 transition-colors cursor-pointer"
                                    title="Adicionar flashcard neste tópico"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Menu '...' com Opções Secundárias do Tópico */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setMenuTopicoAbertoId(prev => prev === topico.id ? null : topico.id)}
                                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-white border border-slate-200/80 transition-colors cursor-pointer"
                                      title="Mais opções do tópico"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {menuTopicoAbertoId === topico.id && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-40" 
                                          onClick={() => setMenuTopicoAbertoId(null)} 
                                        />
                                        <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95">
                                          {cardsDoTopico.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMenuTopicoAbertoId(null);
                                                handleToggleSelecionarTodosDoTopico(cardsDoTopico);
                                              }}
                                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                            >
                                              <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />
                                              <span>{todosTopicoSelecionados ? 'Desmarcar Seleção' : 'Selecionar Cards em Massa'}</span>
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMenuTopicoAbertoId(null);
                                              setTopicoParaTimers({
                                                topico,
                                                eixoTitulo: eixo.titulo,
                                                eixoId: eixo.id
                                              });
                                            }}
                                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                          >
                                            <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                                            <span>Personalizar Timers</span>
                                          </button>

                                          {topico.id !== 'top-geral' && onMoverTopico && eixos.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMenuTopicoAbertoId(null);
                                                const outrosEixos = eixos.filter(e => e.id !== eixo.id);
                                                setDestinoMoverEixoId(outrosEixos[0]?.id || '');
                                                setTopicoParaMover({ eixoOrigemId: eixo.id, topico });
                                              }}
                                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                            >
                                              <FolderInput className="w-4 h-4 text-indigo-600 shrink-0" />
                                              <span>Mover para outro Eixo</span>
                                            </button>
                                          )}

                                          {topico.id !== 'top-geral' && onEditarTopico && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMenuTopicoAbertoId(null);
                                                abrirEdicaoTopico(eixo.id, topico);
                                              }}
                                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                            >
                                              <Pencil className="w-4 h-4 text-blue-600 shrink-0" />
                                              <span>Editar Nome/Descrição</span>
                                            </button>
                                          )}

                                          {topico.id !== 'top-geral' && onExcluirTopico && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMenuTopicoAbertoId(null);
                                                setTopicoParaExcluir({ eixoId: eixo.id, topico });
                                              }}
                                              className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer text-rose-600 font-semibold border-t border-slate-100"
                                            >
                                              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                                              <span>Excluir Tópico</span>
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Flashcards dentro do Tópico */}
                            {isTopicoExpandido && (
                              <div className="bg-slate-50/80 p-2.5 sm:p-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                                {cardsDoTopico.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-slate-400 space-y-2 bg-white/60 rounded-xl border border-dashed border-slate-200">
                                    <p>Nenhum flashcard cadastrado neste tópico.</p>
                                    <button
                                      type="button"
                                      onClick={() => onAdicionarCardAoEixo(eixo.id, topico.id)}
                                      className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline cursor-pointer text-xs"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Criar primeiro flashcard aqui</span>
                                    </button>
                                  </div>
                                ) : (
                                  cardsDoTopico.map(card => {
                                    const isSelecionado = cardsSelecionados.has(card.id);

                                    return (
                                      <div
                                        key={card.id}
                                        onClick={() => onAbrirCard(card)}
                                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                          isSelecionado
                                            ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/30 shadow-xs'
                                            : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
                                        }`}
                                      >
                                        {/* Topo: Checkbox + Título ocupando 100% da largura útil sem quebrar em muitas linhas */}
                                        <div className="flex items-start gap-2.5 min-w-0">
                                          {/* Checkbox de Seleção */}
                                          <button
                                            type="button"
                                            onClick={(e) => handleToggleCardSelecionado(card.id, e)}
                                            className="mt-0.5 text-slate-400 hover:text-blue-600 p-0.5 shrink-0 cursor-pointer transition-colors"
                                            title={isSelecionado ? 'Desmarcar' : 'Selecionar'}
                                          >
                                            {isSelecionado ? (
                                              <CheckSquare className="w-4 h-4 text-blue-600" />
                                            ) : (
                                              <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                            )}
                                          </button>

                                          <h5 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words flex-1">
                                            {card.titulo}
                                          </h5>
                                        </div>

                                        {/* Linha Inferior: Badges à esquerda e Botões Minimalistas à direita */}
                                        <div 
                                          className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/90" 
                                          onClick={e => e.stopPropagation()}
                                        >
                                          {/* Badges de Tipo e Status: Sempre estritamente lado a lado, sem quebrar linha */}
                                          <div className="flex items-center gap-1.5 flex-nowrap shrink-0 min-w-0">
                                            {/* Tipo do Flashcard com Rótulo Otimizado */}
                                            <span 
                                              className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/90 text-slate-700 tracking-wider shrink-0 whitespace-nowrap"
                                              title={getBadgeTipoCardCompacto(card.tipoCard).desc}
                                            >
                                              {getBadgeTipoCardCompacto(card.tipoCard).label}
                                            </span>

                                            {/* Tag Pendente com micro-indicador pulsante sempre adjacente */}
                                            {isCardPendente(card) && (
                                              <span 
                                                className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 shrink-0 whitespace-nowrap"
                                                title="Flashcard pendente para revisão hoje"
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                                <span>Pendente</span>
                                              </span>
                                            )}
                                          </div>

                                          {/* Toolbar Minimalista e Sucinta: Apenas Ícones, Renomear sempre ao lado de Editar */}
                                          <div className="flex items-center gap-1 shrink-0">
                                            {/* Renomear (Pencil) */}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCardParaRenomear(card);
                                                setNovoTituloCard(card.titulo);
                                              }}
                                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer active:scale-95 shadow-3xs"
                                              title="Renomear título"
                                            >
                                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                            </button>

                                            {/* Editar (FilePenLine) */}
                                            {onEditarCard && (
                                              <button
                                                type="button"
                                                onClick={() => onEditarCard(card)}
                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-3xs"
                                                title="Editar conteúdo"
                                              >
                                                <FilePenLine className="w-3.5 h-3.5 text-emerald-600" />
                                              </button>
                                            )}

                                            {/* Revisar (Botão de ação principal, apenas ícone minimalista) */}
                                            <button
                                              type="button"
                                              onClick={() => onAbrirCard(card)}
                                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all cursor-pointer active:scale-95 shadow-3xs"
                                              title="Revisar flashcard"
                                            >
                                              <BookOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
                                            </button>

                                            {/* Menu '...' para Mover, Copiar, Excluir */}
                                            <div className="relative">
                                              <button
                                                type="button"
                                                onClick={() => setMenuCardAbertoId(prev => prev === card.id ? null : card.id)}
                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
                                                title="Mais opções do flashcard"
                                              >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                              </button>

                                            {menuCardAbertoId === card.id && (
                                              <>
                                                <div 
                                                  className="fixed inset-0 z-40" 
                                                  onClick={() => setMenuCardAbertoId(null)} 
                                                />
                                                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95">
                                                  {onEditarCard && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setMenuCardAbertoId(null);
                                                        onEditarCard(card);
                                                      }}
                                                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                                    >
                                                      <FilePenLine className="w-4 h-4 text-emerald-600 shrink-0" />
                                                      <span>Editar Flashcard</span>
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setMenuCardAbertoId(null);
                                                      setCardParaRenomear(card);
                                                      setNovoTituloCard(card.titulo);
                                                    }}
                                                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                                  >
                                                    <Pencil className="w-4 h-4 text-indigo-600 shrink-0" />
                                                    <span>Renomear Título</span>
                                                  </button>
                                                  {onMoverCard && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setMenuCardAbertoId(null);
                                                        setDestinoCardEixoId(card.eixoId);
                                                        setDestinoCardTopicoId(card.topicoId || 'top-geral');
                                                        setCardParaMover(card);
                                                      }}
                                                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                                    >
                                                      <FolderInput className="w-4 h-4 text-indigo-600 shrink-0" />
                                                      <span>Mover Flashcard</span>
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      setMenuCardAbertoId(null);
                                                      handleCopiarCard(card, e);
                                                    }}
                                                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-700 font-semibold"
                                                  >
                                                    <Copy className="w-4 h-4 text-blue-600 shrink-0" />
                                                    <span>Copiar em JSON</span>
                                                  </button>
                                                  {onExcluirCard && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setMenuCardAbertoId(null);
                                                        setCardParaExcluir(card);
                                                      }}
                                                      className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer text-rose-600 font-semibold border-t border-slate-100"
                                                    >
                                                      <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                                                      <span>Excluir Flashcard</span>
                                                    </button>
                                                  )}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
       * BARRA FLUTUANTE DE OPERAÇÕES EM MASSA (BATCH ACTIONS TOOLBAR)
       * ========================================================================= */}
      {cardsSelecionados.size > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg bg-slate-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pl-1">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
              {cardsSelecionados.size}
            </span>
            <span className="text-xs font-bold text-slate-200 truncate">
              {cardsSelecionados.size === 1 ? 'card selecionado' : 'cards selecionados'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEstudarCards && (
              <button
                type="button"
                onClick={handleEstudarSelecionados}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                title="Estudar cards selecionados"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Estudar ({cardsSelecionados.size})</span>
              </button>
            )}

            {onMoverVariosCards && (
              <button
                type="button"
                onClick={() => {
                  const primeiroEixo = eixos[0]?.id || '';
                  setDestinoVariosEixoId(primeiroEixo);
                  setDestinoVariosTopicoModo('__auto__');
                  setModalMoverVariosAberto(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="Mover cards selecionados para outro eixo/tópico"
              >
                <FolderInput className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mover</span>
              </button>
            )}

            {onExcluirVariosCards && (
              <button
                type="button"
                onClick={() => setModalExcluirVariosAberto(true)}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="Excluir cards selecionados"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLimparSelecao}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Desmarcar todos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODAIS DE SUPORTE
       * ===================================================================== */}

      {/* Modal para Mover Vários Cards em Massa */}
      {modalMoverVariosAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-indigo-600">
              <FolderInput className="w-5 h-5" />
              <h4 className="text-base font-extrabold text-slate-900">
                Mover {cardsSelecionados.size} Flashcards
              </h4>
            </div>

            <p className="text-xs text-slate-600">
              Selecione o Eixo Clínico e o Tópico de destino para os flashcards selecionados:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Eixo Clínico de Destino:
                </label>
                <select
                  value={destinoVariosEixoId}
                  onChange={(e) => setDestinoVariosEixoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20"
                >
                  {eixos.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.titulo} ({e.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tópico / Aula de Destino:
                </label>
                <select
                  value={destinoVariosTopicoModo}
                  onChange={(e) => setDestinoVariosTopicoModo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value="__auto__">✨ Manter nomes originais dos tópicos</option>
                  <option value="top-geral">📚 Conceitos Gerais</option>
                  {eixos.find(e => e.id === destinoVariosEixoId)?.topicos?.map(t => (
                    <option key={t.id} value={t.id}>
                      📚 {t.titulo}
                    </option>
                  ))}
                  <option value="__novo__">➕ Criar Novo Tópico neste Eixo...</option>
                </select>

                {destinoVariosTopicoModo === '__novo__' && (
                  <input
                    type="text"
                    value={destinoVariosNovoTopicoTitulo}
                    onChange={(e) => setDestinoVariosNovoTopicoTitulo(e.target.value)}
                    placeholder="Digite o nome do novo tópico..."
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-600/20"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMoverVariosAberto(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarMoverVarios}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Confirmar e Mover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Vários Cards em Massa */}
      {modalExcluirVariosAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-rose-100 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-base font-extrabold text-slate-900">Excluir Flashcards</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir <strong>{cardsSelecionados.size} flashcards</strong> selecionados? Esta ação não pode ser desfeita.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalExcluirVariosAberto(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExcluirVarios}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Sim, Excluir Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Novo Tópico */}
      {modalNovoTopicoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 border border-slate-100 shadow-xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Novo Tópico ou Aula</h4>
              <button 
                onClick={() => setModalNovoTopicoAberto(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCriarTopico} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nome do Tópico ou Aula *
                </label>
                <input
                  type="text"
                  required
                  value={novoTopicoTitulo}
                  onChange={e => setNovoTopicoTitulo(e.target.value)}
                  placeholder="Ex: Abdome Agudo Inflamatório"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Descrição ou Foco de Revisão
                </label>
                <textarea
                  rows={2}
                  value={novoTopicoDescricao}
                  onChange={e => setNovoTopicoDescricao(e.target.value)}
                  placeholder="Ex: Critérios de Alvarado, condutas e diagnóstico diferencial."
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalNovoTopicoAberto(false)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Criar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Tópico Existente */}
      {topicoEmEdicao && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 border border-slate-100 shadow-xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Editar Tópico / Aula</h4>
              <button 
                onClick={() => setTopicoEmEdicao(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoTopico} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nome do Tópico ou Aula *
                </label>
                <input
                  type="text"
                  required
                  value={editTopicoTitulo}
                  onChange={e => setEditTopicoTitulo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Descrição ou Foco de Revisão
                </label>
                <textarea
                  rows={2}
                  value={editTopicoDescricao}
                  onChange={e => setEditTopicoDescricao(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTopicoEmEdicao(null)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Excluir Tópico */}
      {topicoParaExcluir && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4.5 border border-rose-100 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Excluir Tópico</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja excluir o tópico <strong>"{topicoParaExcluir.topico.titulo}"</strong>?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onExcluirTopico) {
                    onExcluirTopico(topicoParaExcluir.eixoId, topicoParaExcluir.topico.id, false);
                  }
                  setTopicoParaExcluir(null);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Excluir apenas o tópico (manter flashcards)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onExcluirTopico) {
                    onExcluirTopico(topicoParaExcluir.eixoId, topicoParaExcluir.topico.id, true);
                  }
                  setTopicoParaExcluir(null);
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Excluir tópico e todos os seus flashcards
              </button>

              <button
                type="button"
                onClick={() => setTopicoParaExcluir(null)}
                className="w-full py-1.5 text-center text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Personalizar Timers do Tópico */}
      {topicoParaTimers && (
        <TopicTimersModal
          topico={topicoParaTimers.topico}
          eixoTitulo={topicoParaTimers.eixoTitulo}
          configGlobal={StorageService.getConfiguracaoTimers()}
          onClose={() => setTopicoParaTimers(null)}
          onSalvar={(customTimers) => {
            if (onSalvarTimersTopico) {
              onSalvarTimersTopico(topicoParaTimers.eixoId, topicoParaTimers.topico.id, customTimers);
            }
            setTopicoParaTimers(null);
            mostrarFeedback('Timers do tópico atualizados!');
          }}
          onResetarRodada1={() => {
            if (onResetarTopicoParaRodada1) {
              onResetarTopicoParaRodada1(topicoParaTimers.eixoId, topicoParaTimers.topico.id);
            }
            mostrarFeedback('Fila do tópico reiniciada para Rodada 1!');
          }}
        />
      )}

      {/* Modal de Mover Tópico para Outro Eixo */}
      {topicoParaMover && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4.5 border border-indigo-100 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-indigo-600">
              <FolderInput className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Mover Tópico de Eixo</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Você está movendo o tópico <strong>"{topicoParaMover.topico.titulo}"</strong> e todos os seus <strong>{cards.filter(c => c.eixoId === topicoParaMover.eixoOrigemId && (c.topicoId === topicoParaMover.topico.id || (c.topicoNome && c.topicoNome.toLowerCase() === topicoParaMover.topico.titulo.toLowerCase()))).length} flashcard(s)</strong> para outro Eixo Clínico.
            </p>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Selecione o Eixo de Destino:
              </label>
              <select
                value={destinoMoverEixoId}
                onChange={(e) => setDestinoMoverEixoId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {eixos
                  .filter(e => e.id !== topicoParaMover.eixoOrigemId)
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.icone ? `${e.icone} ` : ''}{e.titulo} ({e.especialidade})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTopicoParaMover(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!destinoMoverEixoId || destinoMoverEixoId === topicoParaMover.eixoOrigemId}
                onClick={() => {
                  if (onMoverTopico && destinoMoverEixoId) {
                    onMoverTopico(topicoParaMover.eixoOrigemId, destinoMoverEixoId, topicoParaMover.topico.id);
                  }
                  setTopicoParaMover(null);
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 shadow-xs cursor-pointer"
              >
                Mover Tópico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mover Flashcard Individual */}
      {cardParaMover && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4.5 border border-indigo-100 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-indigo-600">
              <FolderInput className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Mover Flashcard</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed truncate">
              Card: <strong>"{cardParaMover.titulo}"</strong>
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Eixo Clínico:
                </label>
                <select
                  value={destinoCardEixoId}
                  onChange={(e) => {
                    const novoEixoId = e.target.value;
                    setDestinoCardEixoId(novoEixoId);
                    const eixoSel = eixos.find(item => item.id === novoEixoId);
                    if (eixoSel && eixoSel.topicos && eixoSel.topicos.length > 0) {
                      setDestinoCardTopicoId(eixoSel.topicos[0].id);
                    } else {
                      setDestinoCardTopicoId('top-geral');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  {eixos.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.icone ? `${e.icone} ` : ''}{e.titulo} ({e.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Tópico / Aula:
                </label>
                {(() => {
                  const eixoAlvo = eixos.find(e => e.id === destinoCardEixoId);
                  const topicosAlvo = eixoAlvo?.topicos && eixoAlvo.topicos.length > 0
                    ? eixoAlvo.topicos
                    : [{ id: 'top-geral', eixoId: destinoCardEixoId, titulo: 'Conceitos Gerais' }];

                  return (
                    <select
                      value={destinoCardTopicoId}
                      onChange={(e) => setDestinoCardTopicoId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    >
                      {topicosAlvo.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.titulo}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCardParaMover(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!destinoCardEixoId}
                onClick={() => {
                  if (onMoverCard && destinoCardEixoId) {
                    onMoverCard(cardParaMover.id, destinoCardEixoId, destinoCardTopicoId);
                  }
                  setCardParaMover(null);
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 shadow-xs cursor-pointer"
              >
                Confirmar Mudança
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Card Individual */}
      {cardParaExcluir && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4.5 border border-rose-100 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Excluir Flashcard</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja realmente excluir o flashcard <strong>"{cardParaExcluir.titulo}"</strong>?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCardParaExcluir(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
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
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renomear Título de Card */}
      {cardParaRenomear && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 border border-indigo-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <Pencil className="w-5 h-5 shrink-0" />
                <h4 className="text-base font-extrabold text-slate-900">Renomear Flashcard</h4>
              </div>
              <button
                type="button"
                onClick={() => setCardParaRenomear(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Local:</span>
              <span className="font-semibold text-slate-800">
                {eixos.find(e => e.id === cardParaRenomear.eixoId)?.titulo || 'Eixo'}
              </span>
              <span>›</span>
              <span className="font-semibold text-slate-700">
                {cardParaRenomear.topicoNome?.replace(/^tópico:\s*/i, '') || 'Conceitos Gerais'}
              </span>
            </div>

            <form onSubmit={handleSalvarRenomearCard} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Título do Flashcard:
                </label>
                <textarea
                  rows={3}
                  required
                  value={novoTituloCard}
                  onChange={(e) => setNovoTituloCard(e.target.value)}
                  placeholder="Digite o título do flashcard..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden transition-all shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCardParaRenomear(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!novoTituloCard.trim() || novoTituloCard.trim() === cardParaRenomear.titulo}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                >
                  Salvar Título
                </button>
              </div>
            </form>

            {onEditarCard && (
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const c = cardParaRenomear;
                    setCardParaRenomear(null);
                    onEditarCard(c);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Deseja editar o conteúdo ? Clique aqui</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edição de Eixo */}
      {eixoEmEdicao && (
        <CreateEixoModal
          eixoParaEditar={eixoEmEdicao}
          totalCardsDoEixo={cards.filter(c => c.eixoId === eixoEmEdicao.id).length}
          onClose={() => setEixoEmEdicao(null)}
          onEixoAtualizado={(eixoAtualizado) => {
            if (onEditarEixo) {
              onEditarEixo(eixoAtualizado);
            }
            setEixoEmEdicao(null);
            mostrarFeedback('Eixo atualizado com sucesso!');
          }}
          onEixoExcluido={(eixoId, excluirCards) => {
            if (onExcluirEixo) {
              onExcluirEixo(eixoId, excluirCards);
            }
            setEixoEmEdicao(null);
            if (eixoAtivoId === eixoId) {
              setEixoAtivoId(null);
            }
            mostrarFeedback('Eixo excluído!');
          }}
        />
      )}
    </div>
  );
};
