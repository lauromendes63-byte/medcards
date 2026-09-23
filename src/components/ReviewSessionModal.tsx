import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  RotateCcw, 
  AlertCircle, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Lightbulb, 
  ChevronRight, 
  PartyPopper, 
  Image as ImageIcon, 
  FileText, 
  Scissors, 
  GitFork, 
  Eye, 
  EyeOff, 
  ArrowDown, 
  Brain,
  Pencil,
  FilePenLine,
  Activity,
  XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CardClinico, MascaraImagem, BlocoOclusao, FluxogramaComplexoDados } from '../types';
import { formatarTempoMinutos, obterInfoRodadaCard } from '../utils/timerUtils';
import { StorageService } from '../services/storage';
import { ComplexFlowchartViewer } from './ComplexFlowchartViewer';
import { FormattedClinicalText } from './FormattedClinicalText';
import { extrairPerguntaObjetiva } from '../utils/clinicalTextUtils';
import { EixoEmojiBadge } from './EixoEmojiBadge';

interface ReviewSessionModalProps {
  cards: CardClinico[];
  onClose: () => void;
  onRegistrarRevisao: (cardId: string, avaliacao: 'errei' | 'dificil' | 'bom' | 'facil', tempoSegundos: number) => void;
  onEditarCard?: (card: CardClinico, indice: number) => void;
  initialIndex?: number;
  onIndexChange?: (indice: number) => void;
}

export const ReviewSessionModal: React.FC<ReviewSessionModalProps> = ({
  cards,
  onClose,
  onRegistrarRevisao,
  onEditarCard,
  initialIndex = 0,
  onIndexChange,
}) => {
  const [filaCards, setFilaCards] = useState<CardClinico[]>(cards);
  const [indiceAtual, setIndiceAtual] = useState(initialIndex);
  const [mostrarVerso, setMostrarVerso] = useState(false);
  const [tempoInicioCard, setTempoInicioCard] = useState<number>(Date.now());
  const [tempoDecorridoSegundos, setTempoDecorridoSegundos] = useState<number>(0);
  const [sessaoFinalizada, setSessaoFinalizada] = useState(false);
  const [exibirDicas, setExibirDicas] = useState<boolean>(() => StorageService.getExibirDicas());

  // Sincronizar quando os cards forem atualizados externamente (ex: edição)
  useEffect(() => {
    setFilaCards(cards);
  }, [cards]);

  // Sincronizar índice inicial se fornecido
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < cards.length) {
      setIndiceAtual(initialIndex);
    }
  }, [initialIndex, cards.length]);

  // Notificar o pai sobre mudança de questão
  useEffect(() => {
    onIndexChange?.(indiceAtual);
  }, [indiceAtual, onIndexChange]);

  const handleToggleExibirDicas = () => {
    setExibirDicas(prev => {
      const novo = !prev;
      StorageService.setExibirDicas(novo);
      return novo;
    });
  };

  // Estados interativos por card (idênticos aos de Provas e Simulados)
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mascarasReveladas, setMascarasReveladas] = useState<Record<string, boolean>>({});
  const [clozesRevelados, setClozesRevelados] = useState<Record<number, boolean>>({});
  const [blocosFluxoRevelados, setBlocosFluxoRevelados] = useState<Record<string, boolean>>({});

  const [estatisticasSessao, setEstatisticasSessao] = useState({
    errei: 0,
    dificil: 0,
    bom: 0,
    facil: 0,
    totalSegundos: 0,
  });

  const cardAtual = filaCards[indiceAtual];
  const totalCards = filaCards.length;

  // Timers intradiários do card atual
  const configTimers = StorageService.getConfiguracaoTimers();
  const eixos = StorageService.getEixos();
  const eixoDoCard = eixos.find(e => e.id === cardAtual?.eixoId);
  const topicoDoCard = eixoDoCard?.topicos?.find(t => t.id === cardAtual?.topicoId);
  const infoRodada = cardAtual ? obterInfoRodadaCard(cardAtual, topicoDoCard, configTimers) : null;

  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickPergunta, setQuickPergunta] = useState('');
  const [quickResposta, setQuickResposta] = useState('');
  const [quickDica, setQuickDica] = useState('');
  const [quickToast, setQuickToast] = useState<string | null>(null);

  const handleOpenQuickEdit = () => {
    if (!cardAtual) return;
    setQuickPergunta(cardAtual.perguntaGatilho || cardAtual.titulo || '');
    setQuickResposta(cardAtual.resposta || (cardAtual.casoClinicoDados ? cardAtual.casoClinicoDados.opcoes[cardAtual.casoClinicoDados.indiceCorreto] : ''));
    setQuickDica(cardAtual.perolaClinica || '');
    setIsQuickEditOpen(true);
  };

  const handleSaveQuickEdit = () => {
    if (!cardAtual) return;
    const cardAtualizado: CardClinico = {
      ...cardAtual,
      perguntaGatilho: quickPergunta.trim() || cardAtual.perguntaGatilho,
      titulo: quickPergunta.trim().length > 50 ? quickPergunta.trim().substring(0, 47) + '...' : (quickPergunta.trim() || cardAtual.titulo),
      resposta: quickResposta.trim(),
      perolaClinica: quickDica.trim() || 'Ponto essencial para fixação e retenção.',
    };

    if (cardAtualizado.casoClinicoDados) {
      cardAtualizado.casoClinicoDados = {
        ...cardAtualizado.casoClinicoDados,
        historiaClinica: quickPergunta.trim() || cardAtualizado.casoClinicoDados.historiaClinica,
        justificativaDetalhada: quickDica.trim() || cardAtualizado.casoClinicoDados.justificativaDetalhada,
      };
    }

    StorageService.atualizarCard(cardAtualizado);
    setFilaCards(prev => prev.map((c, i) => i === indiceAtual ? cardAtualizado : c));
    setQuickToast('Card atualizado com sucesso!');
    setTimeout(() => setQuickToast(null), 2200);
    setIsQuickEditOpen(false);
  };

  // Resetar estados interativos e cronômetro a cada novo card
  useEffect(() => {
    setTempoInicioCard(Date.now());
    setTempoDecorridoSegundos(0);
    setMostrarVerso(false);
    setRespostaSelecionada(null);
    setMascarasReveladas({});
    setClozesRevelados({});
    setBlocosFluxoRevelados({});
  }, [indiceAtual]);

  // Cronômetro progressivo em tempo real por questão
  useEffect(() => {
    if (sessaoFinalizada) return;
    const interval = setInterval(() => {
      setTempoDecorridoSegundos(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [indiceAtual, sessaoFinalizada]);

  // Teclas de atalho para estudo veloz (Espaço = Virar/Revelar, 1-4 = SRS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessaoFinalizada || isQuickEditOpen) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setMostrarVerso(prev => !prev);
      } else if (mostrarVerso || respostaSelecionada !== null) {
        if (e.key === '1') responder('errei');
        else if (e.key === '2') responder('dificil');
        else if (e.key === '3') responder('bom');
        else if (e.key === '4') responder('facil');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mostrarVerso, respostaSelecionada, indiceAtual, sessaoFinalizada]);

  // Interações de Oclusão de Imagem
  const toggleMascaraOclusao = (mascaraId: string) => {
    setMascarasReveladas(prev => {
      const novo = { ...prev, [mascaraId]: !prev[mascaraId] };
      if (!prev[mascaraId] && cardAtual?.mascarasImagem && cardAtual.mascarasImagem.length > 0) {
        const todasReveladas = cardAtual.mascarasImagem.every(m => novo[m.id]);
        if (todasReveladas) {
          setMostrarVerso(true);
        }
      }
      return novo;
    });
  };

  const revelarTodasMascaras = () => {
    if (cardAtual?.mascarasImagem) {
      const all: Record<string, boolean> = {};
      cardAtual.mascarasImagem.forEach(m => { all[m.id] = true; });
      setMascarasReveladas(all);
    }
    setMostrarVerso(true);
  };

  // Interações de Cloze (Lacunas Clicáveis)
  const toggleClozeIndividual = (clozeIdx: number) => {
    setClozesRevelados(prev => {
      const novo = { ...prev, [clozeIdx]: !prev[clozeIdx] };
      if (!prev[clozeIdx] && cardAtual?.textoCloze) {
        const matches = Array.from(cardAtual.textoCloze.matchAll(/\{\{c(\d+)::/g)).map(m => parseInt(m[1], 10));
        const todasReveladas = matches.length > 0 && matches.every(num => novo[num]);
        if (todasReveladas) {
          setMostrarVerso(true);
        }
      }
      return novo;
    });
  };

  const revelarTodosClozes = () => {
    const all: Record<number, boolean> = {};
    for (let i = 0; i < 20; i++) {
      all[i] = true;
    }
    setClozesRevelados(all);
    setMostrarVerso(true);
  };

  // Interações de Fluxograma / Algoritmo de Decisão
  const toggleBlocoFluxo = (blocoId: string) => {
    setBlocosFluxoRevelados(prev => {
      const novo = { ...prev, [blocoId]: !prev[blocoId] };
      if (!prev[blocoId]) {
        const blocos = (cardAtual?.algoritmoDecisao?.blocos && Array.isArray(cardAtual.algoritmoDecisao.blocos))
          ? cardAtual.algoritmoDecisao.blocos
          : (cardAtual?.blocosOclusao && Array.isArray(cardAtual.blocosOclusao))
            ? cardAtual.blocosOclusao
            : (cardAtual?.etapasFluxograma && Array.isArray(cardAtual.etapasFluxograma))
              ? cardAtual.etapasFluxograma
              : [];
        if (blocos.length > 0 && blocos.every(b => b?.id && novo[b.id])) {
          setMostrarVerso(true);
        }
      }
      return novo;
    });
  };

  const revelarTodosBlocosFluxo = () => {
    const all: Record<string, boolean> = {};
    if (cardAtual?.algoritmoDecisao?.blocos && Array.isArray(cardAtual.algoritmoDecisao.blocos)) {
      cardAtual.algoritmoDecisao.blocos.forEach(b => { if (b?.id) all[b.id] = true; });
    }
    if (cardAtual?.blocosOclusao && Array.isArray(cardAtual.blocosOclusao)) {
      cardAtual.blocosOclusao.forEach(b => { if (b?.id) all[b.id] = true; });
    }
    if (cardAtual?.etapasFluxograma && Array.isArray(cardAtual.etapasFluxograma)) {
      cardAtual.etapasFluxograma.forEach(b => { if (b?.id) all[b.id] = true; });
    }
    setBlocosFluxoRevelados(all);
    setMostrarVerso(true);
  };

  const revelarProximoBlocoFluxo = () => {
    const blocos = (cardAtual?.algoritmoDecisao?.blocos && Array.isArray(cardAtual.algoritmoDecisao.blocos))
      ? cardAtual.algoritmoDecisao.blocos
      : (cardAtual?.blocosOclusao && Array.isArray(cardAtual.blocosOclusao))
        ? cardAtual.blocosOclusao
        : (cardAtual?.etapasFluxograma && Array.isArray(cardAtual.etapasFluxograma))
          ? cardAtual.etapasFluxograma
          : [];
    const proximo = blocos.find(b => b?.id && !blocosFluxoRevelados[b.id]);
    if (proximo?.id) {
      toggleBlocoFluxo(proximo.id);
    }
  };

  // Interação de Caso Clínico (Múltipla Escolha)
  const handleSelecionarAlternativa = (index: number) => {
    if (respostaSelecionada !== null || !cardAtual?.casoClinicoDados) return;
    setRespostaSelecionada(index);
    setMostrarVerso(true);
  };

  // Resposta SRS
  const responder = (avaliacao: 'errei' | 'dificil' | 'bom' | 'facil') => {
    if (!cardAtual) return;

    const tempoGasto = Math.max(1, Math.round((Date.now() - tempoInicioCard) / 1000));
    onRegistrarRevisao(cardAtual.id, avaliacao, tempoGasto);

    setEstatisticasSessao(prev => ({
      ...prev,
      [avaliacao]: prev[avaliacao] + 1,
      totalSegundos: prev.totalSegundos + tempoGasto,
    }));

    // Se errou em uma fila de revisão, re-enfileira no fim para fixação imediata
    if (avaliacao === 'errei' && filaCards.length > 1) {
      setFilaCards(prev => [...prev, cardAtual]);
    }

    if (indiceAtual + 1 < filaCards.length + (avaliacao === 'errei' && filaCards.length > 1 ? 1 : 0)) {
      setIndiceAtual(prev => prev + 1);
    } else {
      // Concluiu todos os cards
      setSessaoFinalizada(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Fallback caso canvas não esteja disponível
      }
    }
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!cardAtual && !sessaoFinalizada) {
    return null;
  }

  // =========================================================================
  // TELA DE CONCLUSÃO DA SESSÃO
  // =========================================================================
  if (sessaoFinalizada) {
    const total = estatisticasSessao.errei + estatisticasSessao.dificil + estatisticasSessao.bom + estatisticasSessao.facil;
    const acertos = estatisticasSessao.bom + estatisticasSessao.facil;
    const percentual = total > 0 ? Math.round((acertos / total) * 100) : 100;
    const tempoGastoMinutos = Math.max(1, Math.round(estatisticasSessao.totalSegundos / 60));

    return (
      <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto min-h-screen flex items-center justify-center p-3 sm:p-4 text-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-7 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <PartyPopper className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Sessão Concluída!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aproveitamento de <strong>{percentual}%</strong> nas revisões ({tempoGastoMinutos} min)
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentual >= 80 ? 'bg-emerald-500' : percentual >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${percentual}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-lg font-bold text-rose-700 block">{estatisticasSessao.errei}</span>
              <span className="text-[10px] font-bold text-rose-600 uppercase">Errei</span>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-lg font-bold text-amber-700 block">{estatisticasSessao.dificil}</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Difícil</span>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-lg font-bold text-blue-700 block">{estatisticasSessao.bom}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Bom</span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-lg font-bold text-emerald-700 block">{estatisticasSessao.facil}</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Fácil</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Voltar ao Aplicativo
          </button>
        </div>
      </div>
    );
  }

  // Identificação do Formato do Card
  const isCaso = cardAtual?.tipoCard === 'caso_clinico' && !!cardAtual?.casoClinicoDados;
  const isImageOcclusion = cardAtual?.tipoCard === 'image_occlusion' && !!cardAtual?.imagemUrl;
  const isCloze = cardAtual?.tipoCard === 'cloze' && !!cardAtual?.textoCloze;
  const isFluxogramaComplexo = cardAtual?.tipoCard === 'fluxograma_complexo' || !!cardAtual?.fluxogramaComplexo;
  const isFluxograma = !isFluxogramaComplexo && (cardAtual?.tipoCard === 'fluxograma_oclusao' || (cardAtual as any)?.tipoCard === 'fluxograma' || !!cardAtual?.algoritmoDecisao || (cardAtual?.blocosOclusao && cardAtual.blocosOclusao.length > 0) || (cardAtual?.etapasFluxograma && cardAtual.etapasFluxograma.length > 0));

  // =========================================================================
  // RESOLUÇÃO IMERSIVA DEDICADA PARA FLUXOGRAMA COMPLEXO (TELA CHEIA TOTAL)
  // O usuário navega pela árvore visual personalizada, com blocos ocluídos
  // exceto o primeiro, clicando diretamente nas caixas para revelar.
  // =========================================================================
  if (isFluxogramaComplexo && cardAtual) {
    const complexData: FluxogramaComplexoDados = cardAtual.fluxogramaComplexo || {
      id: cardAtual.id,
      titulo: cardAtual.titulo,
      descricao: cardAtual.perolaClinica,
      noInicialId: 'no-1',
      nos: [
        {
          id: 'no-1',
          titulo: cardAtual.perguntaGatilho || cardAtual.titulo,
          descricao: cardAtual.resposta,
          tipo: 'inicio',
          posicaoX: 450,
          posicaoY: 100,
          ramos: []
        }
      ]
    };

    return (
      <ComplexFlowchartViewer
        fluxograma={complexData}
        initialFullScreen={true}
        onAvaliarRevisao={responder}
        onClose={onClose}
        tituloContexto={cardAtual.titulo}
        perolaClinica={cardAtual.perolaClinica}
        perguntaGatilho={cardAtual.perguntaGatilho}
        tempoDecorridoSegundos={tempoDecorridoSegundos}
        progressoTexto={totalCards > 1 ? `Questão ${indiceAtual + 1}/${totalCards}` : 'Flashcard 1/1'}
        badgeEspecialidade={cardAtual.especialidade}
        card={cardAtual}
        onEditarCard={onEditarCard}
      />
    );
  }

  // =========================================================================
  // TELA DEDICADA PADRÃO UNIFICADA (VISUALIZAÇÃO DE PROVAS & QUESTÕES MÉDICAS)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-slate-100/90 backdrop-blur-xs overflow-y-auto min-h-screen text-left flex flex-col justify-start touch-pan-y overscroll-y-contain">
      <div className="w-full max-w-2xl mx-auto px-1.5 sm:px-4 py-2 sm:py-3 space-y-2 flex-1 flex flex-col pb-[max(2.5rem,env(safe-area-inset-bottom))] animate-in fade-in duration-150">
        
        {/* Barra Superior da Questão / Flashcard (Compacta, elegante e centralizada) */}
        <div className="bg-white rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 shrink-0">
          {/* Esquerda: Número da Questão + Especialidade + Tópico */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-black text-slate-900 whitespace-nowrap">
              {totalCards > 1 ? `Questão ${indiceAtual + 1}/${totalCards}` : 'Questão 1/1'}
            </span>
            <EixoEmojiBadge card={cardAtual} size="sm" />
            {cardAtual.topicoNome && (
              <span className="text-[10.5px] text-slate-600 font-medium truncate max-w-[120px] sm:max-w-[200px] hidden md:inline">
                • {cardAtual.topicoNome.replace(/^tópico:\s*/i, '')}
              </span>
            )}
          </div>

          {/* Centro: Cronômetro + Botão Editar + Botão Dica */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{formatarTempo(tempoDecorridoSegundos)}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenQuickEdit}
              title="Edição rápida deste flashcard"
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all cursor-pointer shadow-3xs active:scale-95"
            >
              <FilePenLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={handleToggleExibirDicas}
              title={exibirDicas ? "Dicas ativadas" : "Dicas ocultas"}
              className={`flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                exibirDicas
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-500 border-slate-300 line-through'
              }`}
            >
              <Lightbulb className={`w-3.5 h-3.5 ${exibirDicas ? 'text-amber-600 fill-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{exibirDicas ? 'Dica' : 'S/ Dica'}</span>
            </button>
          </div>

          {/* Direita: Botão X para Encerrar */}
          <div className="flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              title="Encerrar sessão"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Card Principal da Questão / Flashcard */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5 text-left flex-1 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Título da Questão / Caso e Tópico com Tipografia Aprimorada e Alto Contraste */}
            <div className="text-center space-y-1.5 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {cardAtual.titulo}
                </h3>
              </div>
              {cardAtual.topicoNome && (
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300/80 text-xs font-bold shadow-3xs">
                  {cardAtual.topicoNome.replace(/^tópico:\s*/i, '')}
                </div>
              )}
            </div>

          {/* =============================================================== */}
          {/* FORMATO 1: CASO CLÍNICO COM MÚLTIPLA ESCOLHA                     */}
          {/* =============================================================== */}
          {isCaso && (
            <div className="space-y-3 sm:space-y-3.5 text-left">
              {/* Vinheta Médica do Paciente */}
              <div className="bg-gradient-to-br from-blue-50/60 via-slate-50/80 to-indigo-50/30 p-3 sm:p-4 rounded-2xl border border-blue-100/90 space-y-2 shadow-3xs text-left">
                <div className="flex items-center justify-between pb-1 border-b border-blue-100/60">
                  <span className="text-[10px] sm:text-[10.5px] font-black tracking-wider uppercase text-blue-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Quadro Clínico
                  </span>
                  <span className="text-[9.5px] text-blue-600 font-semibold">Cenário Real</span>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-950 leading-relaxed font-medium text-left">
                  {cardAtual.casoClinicoDados!.historiaClinica}
                </p>

                {cardAtual.casoClinicoDados!.exameFisicoSinais && (
                  <div className="mt-1.5 p-2.5 bg-white/95 rounded-xl border border-blue-100/80 shadow-3xs text-left space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1">
                      🩺 Exame Físico & Sinais Vitais
                    </span>
                    <p className="text-xs sm:text-[12px] text-slate-700 font-normal leading-relaxed">
                      {cardAtual.casoClinicoDados!.exameFisicoSinais}
                    </p>
                  </div>
                )}
              </div>

              {/* Pergunta de Decisão com tipografia normal e legível idêntica ao quadro clínico */}
              <div className="pt-0.5 text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal flex items-start gap-1.5 text-left">
                <span className="text-blue-600 font-bold shrink-0 mt-0.5 select-none text-sm">➔</span>
                <div className="flex-1">
                  <FormattedClinicalText 
                    text={extrairPerguntaObjetiva(
                      cardAtual.perguntaGatilho,
                      cardAtual.casoClinicoDados?.historiaClinica
                    ) || 'Qual a conduta diagnóstica ou terapêutica imediata mais apropriada?'} 
                  />
                </div>
              </div>

              {/* Alternativas de Escolha Única */}
              <div className="space-y-2">
                {cardAtual.casoClinicoDados!.opcoes.map((opcao, idx) => {
                  const letras = ['A', 'B', 'C', 'D', 'E'];
                  const foiRespondido = respostaSelecionada !== null;
                  const eCorreta = idx === cardAtual.casoClinicoDados!.indiceCorreto;
                  const foiEscolhida = idx === respostaSelecionada;
                  const textoLimpo = opcao.replace(/^[A-Ea-e][\)\.\-]\s*/, '');

                  let styleClass = 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-900 shadow-3xs';
                  if (foiRespondido) {
                    if (eCorreta) {
                      styleClass = 'bg-emerald-50/90 border-2 border-emerald-500 text-emerald-950 font-semibold shadow-2xs';
                    } else if (foiEscolhida && !eCorreta) {
                      styleClass = 'bg-rose-50/90 border-2 border-rose-400 text-rose-950 font-semibold shadow-2xs';
                    } else {
                      styleClass = 'bg-slate-50/60 border-slate-200/40 text-slate-400 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={foiRespondido}
                      onClick={() => handleSelecionarAlternativa(idx)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left text-xs sm:text-[13px] transition-all duration-100 ease-out flex items-start gap-2.5 cursor-pointer ${styleClass} ${
                        !foiRespondido ? 'active:scale-[0.99]' : ''
                      }`}
                    >
                      <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl font-bold flex items-center justify-center shrink-0 text-xs transition-all mt-0.5 ${
                        foiRespondido && eCorreta 
                          ? 'bg-emerald-600 text-white shadow-2xs' 
                          : foiRespondido && foiEscolhida 
                            ? 'bg-rose-600 text-white shadow-2xs' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {foiRespondido && eCorreta ? (
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.2} />
                        ) : foiRespondido && foiEscolhida ? (
                          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.2} />
                        ) : (
                          letras[idx]
                        )}
                      </span>
                      <span className="flex-1 leading-relaxed pt-0.5 font-medium">
                        <FormattedClinicalText text={textoLimpo} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {respostaSelecionada !== null && (
                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/60 border border-emerald-300 text-slate-950 space-y-2 animate-in fade-in text-left">
                  <div className="flex items-center justify-between pb-1 border-b border-black/5">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Gabarito & Justificativa Detalhada:</span>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                      Gabarito: {['A', 'B', 'C', 'D', 'E'][cardAtual.casoClinicoDados!.indiceCorreto]}
                    </span>
                  </div>
                  <div className="text-slate-950 text-xs sm:text-[13px] leading-relaxed font-medium">
                    <FormattedClinicalText text={cardAtual.casoClinicoDados!.justificativaDetalhada} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* FORMATO 2: OCLUSÃO DE IMAGEM (SVG POLÍGONOS + RETÂNGULOS)        */}
          {/* =============================================================== */}
          {isImageOcclusion && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-800">
                {cardAtual.perguntaGatilho || 'Identifique as estruturas ocluídas na imagem:'}
              </p>

              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 select-none shadow-inner">
                <img
                  src={cardAtual.imagemUrl}
                  alt={cardAtual.titulo}
                  className="w-full h-auto object-contain block mx-auto max-h-[300px]"
                  referrerPolicy="no-referrer"
                />

                {/* Camada SVG para Máscaras Livres com Polígonos */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  {(cardAtual.mascarasImagem || [])
                    .filter(m => m.tipoForma === 'livre' && m.pontos && m.pontos.length > 2)
                    .map((m) => {
                      const revelado = mascarasReveladas[m.id];
                      const pontosString = m.pontos!.map(p => `${p.x},${p.y}`).join(' ');

                      return (
                        <g
                          key={m.id}
                          className="pointer-events-auto cursor-pointer"
                          onClick={() => toggleMascaraOclusao(m.id)}
                        >
                          <polygon
                            points={pontosString}
                            fill={revelado ? 'transparent' : '#4f46e5'}
                            fillOpacity={revelado ? 0 : 1}
                            stroke={revelado ? 'rgba(16, 185, 129, 0.7)' : '#c7d2fe'}
                            strokeWidth={revelado ? '1' : '1.2'}
                            strokeDasharray={revelado ? '2,2' : undefined}
                            className="transition-all hover:brightness-110 active:scale-98"
                          />
                          {!revelado && (
                            <text
                              x={m.x + m.largura / 2}
                              y={m.y + m.altura / 2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#ffffff"
                              fontSize="3.8"
                              fontWeight="bold"
                              className="select-none pointer-events-none drop-shadow-sm"
                            >
                              [ #{m.numero} ]
                            </text>
                          )}
                        </g>
                      );
                    })}
                </svg>

                {/* Máscaras Retangulares */}
                {(cardAtual.mascarasImagem || [])
                  .filter(m => m.tipoForma !== 'livre' || !m.pontos || m.pontos.length <= 2)
                  .map((m) => {
                    const revelado = mascarasReveladas[m.id];

                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMascaraOclusao(m.id)}
                        className={`absolute rounded-md transition-all flex items-center justify-center text-center p-1 text-xs cursor-pointer select-none active:scale-95 ${
                          revelado
                            ? 'bg-transparent border-2 border-dashed border-emerald-500/70 hover:bg-emerald-500/10'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold border border-indigo-300 shadow-md hover:scale-[1.02] opacity-100'
                        }`}
                        style={{
                          left: `${m.x}%`,
                          top: `${m.y}%`,
                          width: `${m.largura}%`,
                          height: `${m.altura}%`,
                          opacity: revelado ? undefined : 1,
                        }}
                        title={revelado ? `Estrutura revelada: ${m.textoOculto} (toque para ocultar)` : `Toque para revelar estrutura #${m.numero}`}
                      >
                        {!revelado && (
                          <span className="text-[10px] font-black bg-white/20 px-1 py-0.2 rounded-sm">
                            #{m.numero}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Botões de Ação e Status */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={revelarTodasMascaras}
                  className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Revelar Todas as Estruturas</span>
                </button>
                <span className="text-[10px] text-slate-400 font-medium">
                  Toque na oclusão ou no quadrado abaixo para revelar
                </span>
              </div>

              {/* Quadrados a parte com os nomes/respostas de cada estrutura abaixo da imagem */}
              {(cardAtual.mascarasImagem || []).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Gabarito das Estruturas (Toque para revelar individualmente):</span>
                    <span className="text-[9px] font-semibold text-slate-400">
                      {(cardAtual.mascarasImagem || []).filter(m => mascarasReveladas[m.id]).length} de {(cardAtual.mascarasImagem || []).length} revelados
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(cardAtual.mascarasImagem || []).map((m) => {
                      const revelado = mascarasReveladas[m.id];
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMascaraOclusao(m.id)}
                          className={`w-full p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] ${
                            revelado
                              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`shrink-0 w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center transition-colors ${
                              revelado
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{m.numero}
                          </span>
                          <div className="flex-1 min-w-0">
                            {revelado ? (
                              <div className="text-xs sm:text-[13px] leading-snug break-words">
                                <FormattedClinicalText text={m.textoOculto} />
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 italic">
                                [ Toque para revelar resposta #{m.numero} ]
                              </span>
                            )}
                            {exibirDicas && m.dica && (
                              <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                                Dica: {m.dica}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* FORMATO 3A: FLUXOGRAMA COMPLEXO (ÁRVORE DE DECISÃO RAMIFICADA)   */}
          {/* =============================================================== */}
          {isFluxogramaComplexo && (
            <div className="space-y-2.5 -mx-2 sm:-mx-4">
              {cardAtual.perguntaGatilho && (
                <p className="text-[11px] font-semibold text-slate-800 px-2 sm:px-4">
                  {cardAtual.perguntaGatilho}
                </p>
              )}

              <ComplexFlowchartViewer
                fluxograma={cardAtual.fluxogramaComplexo || {
                  id: cardAtual.id,
                  titulo: cardAtual.titulo,
                  descricao: cardAtual.perolaClinica,
                  noInicialId: 'no-1',
                  nos: [
                    {
                      id: 'no-1',
                      titulo: cardAtual.perguntaGatilho || cardAtual.titulo,
                      descricao: cardAtual.resposta,
                      tipo: 'inicio',
                      ramos: []
                    }
                  ]
                }}
                onRegistrarConclusao={() => setMostrarVerso(true)}
              />
            </div>
          )}

          {/* =============================================================== */}
          {/* FORMATO 3B: FLUXOGRAMA & ALGORITMO DE DECISÃO PASSO A PASSO      */}
          {/* =============================================================== */}
          {isFluxograma && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-800">
                {cardAtual.perguntaGatilho || 'Identifique as etapas e condutas do algoritmo clínico:'}
              </p>

              {cardAtual.algoritmoDecisao && Array.isArray(cardAtual.algoritmoDecisao.blocos) && cardAtual.algoritmoDecisao.blocos.length > 0 ? (
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <GitFork className="w-4 h-4" />
                      <span>{cardAtual.algoritmoDecisao.titulo || 'Algoritmo de Conduta'}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={revelarProximoBlocoFluxo}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95 shadow-3xs"
                      >
                        + Próximo Passo
                      </button>
                      <button
                        type="button"
                        onClick={revelarTodosBlocosFluxo}
                        className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95 shadow-3xs"
                      >
                        Revelar Tudo
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {cardAtual.algoritmoDecisao.blocos.map((bloco, idx) => {
                      const revelado = blocosFluxoRevelados[bloco.id] || mostrarVerso;
                      const ramificacao = (cardAtual.algoritmoDecisao?.ramificacoes || []).find(r => r?.destinoId === bloco.id);

                      return (
                        <div key={bloco.id || `bloco-${idx}`} className="space-y-1">
                          {idx > 0 && (
                            <div className="flex items-center justify-center py-1 select-none">
                              <div className="flex items-center gap-1.5 text-indigo-500 bg-indigo-50/60 px-2 py-0.5 rounded-full border border-indigo-200/50">
                                <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                                {ramificacao?.criterioCondicional && ramificacao.criterioCondicional.trim() ? (
                                  <span className="text-[9.5px] font-bold text-indigo-900">
                                    {ramificacao.criterioCondicional}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                                    Próxima Etapa
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div
                            onClick={() => toggleBlocoFluxo(bloco.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer select-none active:scale-[0.99] ${
                              bloco.tipo === 'inicio'
                                ? 'bg-blue-50/80 border-blue-200 text-blue-950 shadow-2xs'
                                : revelado
                                  ? 'bg-white border-emerald-300 shadow-2xs'
                                  : 'bg-indigo-600 border-indigo-700 text-white shadow-xs hover:bg-indigo-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className={`text-[9.5px] font-bold uppercase tracking-wider ${
                                bloco.tipo === 'inicio' 
                                  ? 'text-blue-600' 
                                  : revelado 
                                    ? 'text-emerald-700' 
                                    : 'text-indigo-200'
                              }`}>
                                Etapa #{idx + 1} • {(bloco.tipo || 'conduta').toUpperCase()}
                              </span>
                              {bloco.tipo !== 'inicio' && (
                                <span className="text-[9.5px] opacity-80 font-medium">
                                  {revelado ? 'Toque p/ ocultar' : 'Toque p/ revelar'}
                                </span>
                              )}
                            </div>

                            <div className="mt-1">
                              {bloco.tipo === 'inicio' || revelado ? (
                                <div className="space-y-1.5">
                                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                    {bloco.titulo}
                                  </p>
                                  {bloco.descricao && (
                                    <div className="pt-1.5 border-t border-slate-100/90 text-xs sm:text-[13px] text-slate-700 font-normal leading-relaxed">
                                      <FormattedClinicalText text={bloco.descricao} />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1 py-0.5">
                                  <p className="text-xs sm:text-sm font-bold text-white/95 leading-snug">
                                    {bloco.titulo}
                                  </p>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
                                    <span className="text-xs font-bold text-indigo-100 tracking-wide">
                                      [ Resposta Oculta - Toque para Revelar ]
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : cardAtual.etapasFluxograma && Array.isArray(cardAtual.etapasFluxograma) && cardAtual.etapasFluxograma.length > 0 ? (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Etapas do Fluxo Clínico
                    </span>
                    <button
                      onClick={revelarTodosBlocosFluxo}
                      className="text-[9.5px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded bg-white border border-slate-200 cursor-pointer"
                    >
                      Revelar Todos
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {cardAtual.etapasFluxograma.map((etapa, idx) => {
                      const revelado = blocosFluxoRevelados[etapa.id] || mostrarVerso;
                      return (
                        <div
                          key={etapa.id || `etapa-${idx}`}
                          onClick={() => toggleBlocoFluxo(etapa.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-[0.99] ${
                            revelado
                              ? 'bg-white border-emerald-300 shadow-2xs'
                              : 'bg-indigo-600 border-indigo-700 text-white shadow-xs hover:bg-indigo-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold uppercase ${revelado ? 'text-emerald-700' : 'text-indigo-200'}`}>
                              Etapa #{idx + 1} {etapa.titulo && `• ${etapa.titulo}`} {etapa.dica && `(${etapa.dica})`}
                            </span>
                            <span className="text-[9px] opacity-80">
                              {revelado ? 'Toque p/ ocultar' : 'Toque p/ revelar'}
                            </span>
                          </div>
                          <div className="mt-1">
                            {revelado ? (
                              <div className="text-xs sm:text-[13px] text-slate-700 font-normal leading-relaxed">
                                <FormattedClinicalText text={etapa.conteudoOculto || etapa.titulo} />
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-white tracking-wide">
                                [ Resposta Oculta - Toque para Revelar ]
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Etapas do Fluxo Clínico
                    </span>
                    <button
                      onClick={revelarTodosBlocosFluxo}
                      className="text-[9.5px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded bg-white border border-slate-200 cursor-pointer"
                    >
                      Revelar Todos
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(cardAtual.blocosOclusao || []).map((bloco, idx) => {
                      const revelado = blocosFluxoRevelados[bloco.id] || mostrarVerso;
                      return (
                        <div
                          key={bloco.id || `bloco-oc-${idx}`}
                          onClick={() => toggleBlocoFluxo(bloco.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none active:scale-[0.99] ${
                            revelado
                              ? 'bg-white border-emerald-300 shadow-2xs'
                              : 'bg-indigo-600 border-indigo-700 text-white shadow-xs hover:bg-indigo-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold uppercase ${revelado ? 'text-emerald-700' : 'text-indigo-200'}`}>
                              Etapa #{idx + 1} {exibirDicas && bloco.dica && `• ${bloco.dica}`}
                            </span>
                            <span className="text-[9px] opacity-80">
                              {revelado ? 'Toque p/ ocultar' : 'Toque p/ revelar'}
                            </span>
                          </div>
                          <div className="mt-1">
                            {revelado ? (
                              <div className="text-xs sm:text-[13px] leading-snug">
                                <FormattedClinicalText text={bloco.textoOculto} />
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-white tracking-wide">
                                [ Etapa Oculta - Toque para Revelar ]
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* FORMATO 4: CLOZE (LACUNAS CLICÁVEIS PARTE A PARTE)                */}
          {/* =============================================================== */}
          {isCloze && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-800">
                {cardAtual.perguntaGatilho || 'Complete as lacunas do texto clínico:'}
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                {cardAtual.textoCloze!.split(/(\{\{c\d+::[^\}]+\}\})/).map((part, i) => {
                  const match = part.match(/\{\{c(\d+)::([^:\}]+)(?:::([^\}]+))?\}\}/);
                  if (match) {
                    const clozeNumero = parseInt(match[1], 10);
                    const termoOculto = match[2];
                    const dicaOpcional = match[3];
                    const revelado = clozesRevelados[clozeNumero] || mostrarVerso;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleClozeIndividual(clozeNumero)}
                        className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                          revelado
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 underline decoration-emerald-500 decoration-2'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        }`}
                        title={revelado ? 'Clique para ocultar esta lacuna' : 'Clique para revelar esta lacuna'}
                      >
                        {revelado ? termoOculto : (exibirDicas && dicaOpcional ? `[ ${dicaOpcional} ]` : `[...]`)}
                      </button>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={revelarTodosClozes}
                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Revelar Todas as Lacunas</span>
                </button>
                <span className="text-[9px] text-slate-400">
                  Toque na lacuna para revelar parte a parte
                </span>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* FORMATO 5: CONCEITO / PERGUNTA DIRETA GERAL                      */}
          {/* =============================================================== */}
          {!isCaso && !isImageOcclusion && !isCloze && !isFluxograma && (
            <div className="space-y-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 min-h-16 flex items-center justify-center text-center">
                <div className="text-xs sm:text-[13.5px] font-medium text-slate-800 leading-relaxed max-w-xl mx-auto">
                  <FormattedClinicalText text={cardAtual.perguntaGatilho} />
                </div>
              </div>
            </div>
          )}

          </div>

          {/* =============================================================== */}
          {/* RESPOSTA COMPLETA & PÉROLA CLÍNICA REVELADA                      */}
          {/* =============================================================== */}
          {!isCaso && !mostrarVerso && (
            <div className="pt-2">
              <button
                onClick={() => setMostrarVerso(true)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-transform duration-100 ease-out active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Eye className="w-4 h-4" strokeWidth={2} />
                <span>Ver Resposta Esperada (Espaço)</span>
              </button>
            </div>
          )}

          {mostrarVerso && !isCaso && (
            <div className="space-y-2.5 animate-in fade-in pt-1">
              <div className="-mx-3 sm:-mx-5 px-3 sm:px-5 py-3 sm:py-3.5 bg-blue-50/20 border-t-2 border-b border-blue-200/80 text-slate-900 space-y-2.5">
                <div className="text-center pb-1.5 border-b border-blue-100/90">
                  <span className="text-blue-900 text-xs sm:text-[13px] uppercase font-bold tracking-wider inline-block">
                    Resposta Esperada
                  </span>
                </div>
                <FormattedClinicalText text={cardAtual.resposta} />
                {cardAtual.perolaClinica && (
                  <div className="mt-2.5 p-2.5 sm:p-3 bg-amber-100/90 rounded-xl border-2 border-amber-300/90 text-slate-950 flex items-start gap-2 shadow-3xs">
                    <span className="text-amber-700 font-bold shrink-0 select-none text-sm mt-0.5">💡</span>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-black text-amber-900 uppercase tracking-wider text-[10px] sm:text-[10.5px] mr-1.5 inline-block">
                        Dica:
                      </span>
                      <span className="font-semibold text-slate-900 text-xs sm:text-[12.5px] leading-relaxed">
                        {cardAtual.perolaClinica}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {((exibirDicas && cardAtual.mnemonicoOuDica) || cardAtual.diretrizReferencia) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[10px] text-slate-500">
                  {exibirDicas && cardAtual.mnemonicoOuDica && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 text-amber-900 border border-amber-200/70 font-sans text-[10px] font-medium leading-relaxed">
                      <span>💡</span>
                      <span>{cardAtual.mnemonicoOuDica}</span>
                    </span>
                  )}
                  {cardAtual.diretrizReferencia && (
                    <span className="text-[10px] text-slate-400 font-sans ml-auto">
                      Ref: {cardAtual.diretrizReferencia}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* AVALIAÇÃO SRS (ESPAÇO / 1, 2, 3, 4)                             */}
          {/* =============================================================== */}
          {(mostrarVerso || respostaSelecionada !== null) && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                <span>Avaliação de Retenção (SRS):</span>
                <span className="hidden sm:inline">Atalhos: 1, 2, 3, 4</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <button
                  id="btn-srs-errei"
                  onClick={() => responder('errei')}
                  className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold transition-transform duration-100 ease-out shadow-3xs active:scale-[0.98] cursor-pointer min-h-[48px]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500 mb-0.5" strokeWidth={1.75} />
                  <span className="text-[11px] sm:text-xs">Errei</span>
                  <span className="text-[9.5px] text-rose-500 font-semibold">
                    {infoRodada ? formatarTempoMinutos(infoRodada.timers.erreiMinutos) : '2m'}
                  </span>
                </button>

                <button
                  id="btn-srs-dificil"
                  onClick={() => responder('dificil')}
                  className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold transition-transform duration-100 ease-out shadow-3xs active:scale-[0.98] cursor-pointer min-h-[48px]"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 mb-0.5" strokeWidth={1.75} />
                  <span className="text-[11px] sm:text-xs">Difícil</span>
                  <span className="text-[9.5px] text-amber-500 font-semibold">
                    {infoRodada ? formatarTempoMinutos(infoRodada.timers.dificilMinutos) : '5m'}
                  </span>
                </button>

                <button
                  id="btn-srs-bom"
                  onClick={() => responder('bom')}
                  className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold transition-transform duration-100 ease-out shadow-3xs active:scale-[0.98] cursor-pointer min-h-[48px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mb-0.5" strokeWidth={1.75} />
                  <span className="text-[11px] sm:text-xs">Bom</span>
                  <span className="text-[9.5px] text-blue-600 font-semibold">
                    {infoRodada ? formatarTempoMinutos(infoRodada.timers.bomMinutos) : '15m'}
                  </span>
                </button>

                <button
                  id="btn-srs-facil"
                  onClick={() => responder('facil')}
                  className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold transition-transform duration-100 ease-out shadow-3xs active:scale-[0.98] cursor-pointer min-h-[48px]"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-500 mb-0.5" strokeWidth={1.75} />
                  <span className="text-[11px] sm:text-xs">Fácil</span>
                  <span className="text-[9.5px] text-emerald-600 font-semibold">
                    {infoRodada ? formatarTempoMinutos(infoRodada.timers.facilMinutos) : '30m'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast de Atualização Rápida */}
      {quickToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-70 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{quickToast}</span>
        </div>
      )}

      {/* Modal de Edição Rápida Embutida na Sessão */}
      {isQuickEditOpen && cardAtual && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 border border-slate-200 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FilePenLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Edição Rápida
                  </h3>
                  <p className="text-[10.5px] text-slate-500">
                    Questão {indiceAtual + 1} de {totalCards} • Sem sair da revisão
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Pergunta / Enunciado (Frente):
                </label>
                <textarea
                  rows={3}
                  value={quickPergunta}
                  onChange={e => setQuickPergunta(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-y"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Resposta Esperada (Verso):
                </label>
                <textarea
                  rows={4}
                  value={quickResposta}
                  onChange={e => setQuickResposta(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-y"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <span>💡</span>
                  <span>Dica (Ponto-Chave):</span>
                </label>
                <input
                  type="text"
                  value={quickDica}
                  onChange={e => setQuickDica(e.target.value)}
                  placeholder="Ponto de virada da conduta ou pegadinha..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              {onEditarCard ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickEditOpen(false);
                    onEditarCard(cardAtual, indiceAtual);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Editor completo ↗
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickEdit}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
