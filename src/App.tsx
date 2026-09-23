/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CheckCircle2, FilePenLine, BookOpen } from 'lucide-react';
import { StorageService } from './services/storage';
import { CardClinico, EixoClinico, ProgressoDiario, TabNavegacao, EspecialidadeMedica, ModoVisualizacaoEixos } from './types';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { EixosView } from './components/EixosView';
import { SimulationTrainingView } from './components/SimulationTrainingView';
import { MetricsView } from './components/MetricsView';
import { BottomNavBar } from './components/BottomNavBar';
import { ReviewSessionModal } from './components/ReviewSessionModal';
import { VisualOcclusionModal } from './components/VisualOcclusionModal';
import { ClinicalCaseModal } from './components/ClinicalCaseModal';
import { CreateEixoModal } from './components/CreateEixoModal';
import { CreateFlashcardView } from './components/CreateFlashcardView';
import { ImportExportModal } from './components/ImportExportModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { SettingsModal } from './components/SettingsModal';
import { EixoEmojiBadge } from './components/EixoEmojiBadge';
import { UpdateNotificationToast } from './components/UpdateNotificationToast';
import { ResultadoImportacao } from './services/ankiService';
import { isCardPendente } from './utils/timerUtils';

export default function App() {
  // Inicialização reativa a partir do LocalStorage e IndexedDB
  const [cards, setCards] = useState<CardClinico[]>([]);
  const [eixos, setEixos] = useState<EixoClinico[]>([]);
  const [progresso, setProgresso] = useState<ProgressoDiario>({
    data: new Date().toISOString().split('T')[0],
    cardsRevisadosHoje: 0,
    metaDiaria: 35,
    sequenciaDias: 0,
    taxaRetencaoMedia: 0,
    tempoEstudadoMinutos: 0,
  });

  // Navegação Principal e Filtros
  const [tabAtiva, setTabAtiva] = useState<TabNavegacao>('eixos');
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState<EspecialidadeMedica | 'Todas'>('Todas');
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [eixoAtivoId, setEixoAtivoId] = useState<string | null>(null);

  // Modais de Estudo e Revisão
  const [reviewCards, setReviewCards] = useState<CardClinico[] | null>(null);
  const [reviewInitialIndex, setReviewInitialIndex] = useState<number>(0);
  const [occlusionCard, setOcclusionCard] = useState<CardClinico | null>(null);
  const [caseCard, setCaseCard] = useState<CardClinico | null>(null);
  const [simulationState, setSimulationState] = useState<{
    fase: 'config' | 'ativo' | 'resultado';
    questoes?: CardClinico[];
    indice?: number;
  }>({
    fase: 'config',
  });
  const [sessaoOrigem, setSessaoOrigem] = useState<{
    tipo: 'review' | 'occlusion' | 'case' | 'simulation';
    cards?: CardClinico[];
    currentIndex?: number;
    card?: CardClinico;
  } | null>(null);

  // Modais de Criação e Portabilidade
  const [isCreateEixoOpen, setIsCreateEixoOpen] = useState(false);
  const [createPreselectedEixoId, setCreatePreselectedEixoId] = useState<string | undefined>(undefined);
  const [createPreselectedTopicoId, setCreatePreselectedTopicoId] = useState<string | undefined>(undefined);
  const [cardEmEdicao, setCardEmEdicao] = useState<CardClinico | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [importExportConfig, setImportExportConfig] = useState<{
    tab?: 'importar' | 'exportar';
    eixoId?: string;
    cardId?: string;
  } | undefined>(undefined);

  const handleAbrirImportExport = (options?: { tab?: 'importar' | 'exportar'; eixoId?: string; cardId?: string }) => {
    setImportExportConfig(options);
    setIsImportExportOpen(true);
  };
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modoVisualizacaoEixos, setModoVisualizacaoEixos] = useState<ModoVisualizacaoEixos>(() => StorageService.getModoVisualizacaoEixos());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificacaoFeedback, setNotificacaoFeedback] = useState<string | null>(null);
  const timerNotificacaoRef = useRef<NodeJS.Timeout | null>(null);

  // Escuta evento de instalação de PWA no celular/navegador
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setIsInstallModalOpen(false);
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Carregar dados na inicialização com sincronização reativa ao IndexedDB
  useEffect(() => {
    const dadosIniciais = StorageService.init();
    setCards(dadosIniciais.cards);
    setEixos(dadosIniciais.eixos);
    setProgresso(dadosIniciais.progresso);

    // Escuta evento customizado caso IndexedDB restaure dados em segundo plano
    const handleIdbAtualizado = () => {
      setCards(StorageService.getCards());
      setEixos(StorageService.getEixos());
      setProgresso(StorageService.getProgresso());
    };
    window.addEventListener('medcards_storage_synced', handleIdbAtualizado);

    // FIX #3: exibe aviso visível ao atingir a cota do localStorage (antes era silencioso)
    const handleQuotaExceeded = () => {
      mostrarFeedback('⚠️ Armazenamento local cheio! Dados seguros via IndexedDB. Exporte um backup para liberar espaço.');
    };
    window.addEventListener('medcards_storage_quota_exceeded', handleQuotaExceeded);

    return () => {
      window.removeEventListener('medcards_storage_synced', handleIdbAtualizado);
      window.removeEventListener('medcards_storage_quota_exceeded', handleQuotaExceeded);
    };
  }, []);

  // Suporte a Botão Voltar do Android (popstate) e Tecla Escape
  const fecharTopoModalOuSubnivel = useCallback((): boolean => {
    if (isInstallModalOpen) {
      setIsInstallModalOpen(false);
      return true;
    }
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return true;
    }
    if (reviewCards) {
      setReviewCards(null);
      return true;
    }
    if (occlusionCard) {
      setOcclusionCard(null);
      return true;
    }
    if (caseCard) {
      setCaseCard(null);
      return true;
    }
    if (isCreateEixoOpen) {
      setIsCreateEixoOpen(false);
      return true;
    }
    if (isImportExportOpen) {
      setIsImportExportOpen(false);
      return true;
    }
    if (eixoAtivoId !== null) {
      setEixoAtivoId(null);
      return true;
    }
    if (tabAtiva !== 'eixos') {
      setTabAtiva('eixos');
      return true;
    }
    return false;
  }, [
    isInstallModalOpen,
    isSettingsOpen,
    reviewCards,
    occlusionCard,
    caseCard,
    isCreateEixoOpen,
    isImportExportOpen,
    eixoAtivoId,
    tabAtiva,
  ]);

  // Push state no histórico para que o botão 'Voltar' do celular funcione nativamente
  useEffect(() => {
    const algumModalAberto = !!(isInstallModalOpen || isSettingsOpen || reviewCards || occlusionCard || caseCard || isCreateEixoOpen || isImportExportOpen || eixoAtivoId !== null || tabAtiva === 'criar_card');
    if (algumModalAberto) {
      window.history.pushState({ modalAtivo: true }, '');
    }
  }, [isInstallModalOpen, isSettingsOpen, reviewCards, occlusionCard, caseCard, isCreateEixoOpen, isImportExportOpen, eixoAtivoId, tabAtiva]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const fechou = fecharTopoModalOuSubnivel();
      if (fechou) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fecharTopoModalOuSubnivel();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fecharTopoModalOuSubnivel]);

  // Ticker de 30 segundos para atualizar cards pendentes intradiários com base no relógio do dispositivo
  const [tickerRelogio, setTickerRelogio] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTickerRelogio(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Cards pendentes para hoje (unificado e sincronizado)
  const cardsPendentes = useMemo(() => {
    const hoje = new Date();
    return cards.filter(c => isCardPendente(c, hoje));
  }, [cards, tickerRelogio]);

  // Filtro de busca global
  const cardsFiltradosBusca = useMemo(() => {
    if (!buscaGlobal.trim()) return cards;
    const q = buscaGlobal.toLowerCase();
    return cards.filter(c => 
      c.titulo.toLowerCase().includes(q) ||
      c.perguntaGatilho.toLowerCase().includes(q) ||
      c.resposta.toLowerCase().includes(q) ||
      c.especialidade.toLowerCase().includes(q) ||
      (c.perolaClinica && c.perolaClinica.toLowerCase().includes(q))
    );
  }, [cards, buscaGlobal]);

  // Handler de processamento de SRS (Spaced Repetition System)
  const handleRegistrarRevisao = (
    cardId: string, 
    avaliacao: 'errei' | 'dificil' | 'bom' | 'facil', 
    tempoSegundos: number
  ) => {
    const { cardsAtualizados, progressoAtualizado } = StorageService.processarRevisao(
      cardId,
      avaliacao,
      tempoSegundos
    );
    setCards(cardsAtualizados);
    setProgresso(progressoAtualizado);
    setEixos(StorageService.getEixos());
  };

  // Reset de fila / Revisar agora (zera os timers de um eixo ou tópico para revisão imediata)
  const handleResetarFila = (eixoId?: string, topicoId?: string) => {
    const cardsAtualizados = StorageService.resetarFilaRevisao(eixoId, topicoId);
    setCards(cardsAtualizados);
    setEixos(StorageService.getEixos());

    let cardsParaRevisar: CardClinico[] = [];
    if (eixoId && topicoId) {
      cardsParaRevisar = cardsAtualizados.filter(c => c.eixoId === eixoId && c.topicoId === topicoId);
    } else if (eixoId) {
      cardsParaRevisar = cardsAtualizados.filter(c => c.eixoId === eixoId);
    }
    if (cardsParaRevisar.length > 0) {
      setReviewCards(cardsParaRevisar);
    }
  };

  // Abrir sessão de revisão de cards
  const handleIniciarRevisao = (filtroCards?: CardClinico[]) => {
    if (filtroCards && filtroCards.length > 0) {
      setReviewCards(filtroCards);
    } else if (cardsPendentes.length > 0) {
      setReviewCards(cardsPendentes);
    } else if (cards.length > 0) {
      setReviewCards(cards.slice(0, 10));
    }
  };

  // Abrir estudo de um eixo específico
  const handleEstudarEixo = (eixoId: string, apenasPendentes: boolean = false) => {
    const cardsDoEixo = cards.filter(c => c.eixoId === eixoId);
    if (apenasPendentes) {
      const pendentesDoEixo = cardsDoEixo.filter(c => isCardPendente(c));
      if (pendentesDoEixo.length > 0) {
        setReviewCards(pendentesDoEixo);
        return;
      }
    }
    if (cardsDoEixo.length > 0) {
      setReviewCards(cardsDoEixo);
    }
  };

  // Abrir card com a visualização interativa e oficial de revisão/estudo
  const handleAbrirCard = (card: CardClinico) => {
    setReviewInitialIndex(0);
    setReviewCards([card]);
  };

  // Abrir editor para alterar um card existente dentro da Revisão Espaçada
  const handleEditarCardReview = (card: CardClinico, indice = 0) => {
    setReviewInitialIndex(indice);
    setSessaoOrigem({
      tipo: 'review',
      cards: reviewCards || [card],
      currentIndex: indice,
      card,
    });
    setReviewCards(null);
    setOcclusionCard(null);
    setCaseCard(null);
    setCardEmEdicao(card);
    setCreatePreselectedEixoId(card.eixoId);
    setCreatePreselectedTopicoId(card.topicoId);
    setTabAtiva('criar_card');
  };

  // Abrir editor para alterar um card existente dentro do Modo de Estudo / Provas / Treino
  const handleEditarCardSimulation = (card: CardClinico, indice: number, questoes: CardClinico[]) => {
    setSimulationState({
      fase: 'ativo',
      questoes,
      indice,
    });
    setSessaoOrigem({
      tipo: 'simulation',
      cards: questoes,
      currentIndex: indice,
      card,
    });
    setReviewCards(null);
    setOcclusionCard(null);
    setCaseCard(null);
    setCardEmEdicao(card);
    setCreatePreselectedEixoId(card.eixoId);
    setCreatePreselectedTopicoId(card.topicoId);
    setTabAtiva('criar_card');
  };

  const handleEditarCardOcclusion = (card: CardClinico) => {
    setSessaoOrigem({
      tipo: 'occlusion',
      card,
    });
    setReviewCards(null);
    setOcclusionCard(null);
    setCaseCard(null);
    setCardEmEdicao(card);
    setCreatePreselectedEixoId(card.eixoId);
    setCreatePreselectedTopicoId(card.topicoId);
    setTabAtiva('criar_card');
  };

  const handleEditarCardCase = (card: CardClinico) => {
    setSessaoOrigem({
      tipo: 'case',
      card,
    });
    setReviewCards(null);
    setOcclusionCard(null);
    setCaseCard(null);
    setCardEmEdicao(card);
    setCreatePreselectedEixoId(card.eixoId);
    setCreatePreselectedTopicoId(card.topicoId);
    setTabAtiva('criar_card');
  };

  const handleEditarCard = (card: CardClinico) => {
    setSessaoOrigem(null);
    setReviewCards(null);
    setOcclusionCard(null);
    setCaseCard(null);
    setCardEmEdicao(card);
    setCreatePreselectedEixoId(card.eixoId);
    setCreatePreselectedTopicoId(card.topicoId);
    setTabAtiva('criar_card');
  };

  const restaurarSessaoOrigem = () => {
    const origem = sessaoOrigem;
    setCardEmEdicao(null);

    if (!origem) {
      setTabAtiva('eixos');
      return;
    }

    const cardsAtuais = StorageService.getCards();

    if (origem.tipo === 'review' && origem.cards) {
      const idsOriginais = origem.cards.map(c => c.id);
      const cardsAtualizadosFila = idsOriginais.map(id => cardsAtuais.find(c => c.id === id)).filter(Boolean) as CardClinico[];
      const filaFinal = cardsAtualizadosFila.length > 0 ? cardsAtualizadosFila : origem.cards;
      const targetIndex = origem.currentIndex !== undefined ? Math.min(origem.currentIndex, Math.max(0, filaFinal.length - 1)) : 0;
      setReviewInitialIndex(targetIndex);
      setReviewCards(filaFinal);
      setSessaoOrigem(null);
    } else if (origem.tipo === 'simulation' && origem.cards) {
      const idsOriginais = origem.cards.map(c => c.id);
      const cardsAtualizadosQuestoes = idsOriginais.map(id => cardsAtuais.find(c => c.id === id)).filter(Boolean) as CardClinico[];
      const questoesFinais = cardsAtualizadosQuestoes.length > 0 ? cardsAtualizadosQuestoes : origem.cards;
      const targetIndex = origem.currentIndex !== undefined ? Math.min(origem.currentIndex, Math.max(0, questoesFinais.length - 1)) : 0;
      setSimulationState({
        fase: 'ativo',
        questoes: questoesFinais,
        indice: targetIndex,
      });
      setTabAtiva('provas');
      setSessaoOrigem(null);
    } else if (origem.tipo === 'occlusion' && origem.card) {
      const cardAtualizado = cardsAtuais.find(c => c.id === origem.card?.id) || origem.card;
      setOcclusionCard(cardAtualizado);
      setSessaoOrigem(null);
    } else if (origem.tipo === 'case' && origem.card) {
      const cardAtualizado = cardsAtuais.find(c => c.id === origem.card?.id) || origem.card;
      setCaseCard(cardAtualizado);
      setSessaoOrigem(null);
    } else {
      setSessaoOrigem(null);
      setTabAtiva('eixos');
    }
  };

  // Atualização de card existente
  const handleCardAtualizado = (cardAtualizado: CardClinico) => {
    const atualizados = StorageService.atualizarCard(cardAtualizado);
    setCards(atualizados);
    setEixos(StorageService.getEixos());
    mostrarFeedback(`Flashcard "${cardAtualizado.titulo}" atualizado com sucesso!`);
    restaurarSessaoOrigem();
  };

  // Criação de novo card
  const handleCardCriado = (novoCard: CardClinico) => {
    const atualizados = StorageService.adicionarCard(novoCard);
    setCards(atualizados);
    setEixos(StorageService.getEixos());
    setCardEmEdicao(null);
    setTabAtiva('eixos');
    mostrarFeedback(`Flashcard "${novoCard.titulo}" criado com sucesso!`);
  };

  // Criação de novo eixo
  const handleEixoCriado = (novoEixo: EixoClinico) => {
    const atualizados = StorageService.adicionarEixo(novoEixo);
    setEixos(atualizados);
    mostrarFeedback(`Eixo "${novoEixo.titulo}" criado!`);
  };

  // Atualização de eixo
  const handleEixoAtualizado = (eixoAtualizado: EixoClinico) => {
    const res = StorageService.atualizarEixo(eixoAtualizado);
    setEixos(res.eixos);
    setCards(res.cards);
    mostrarFeedback(`Eixo "${eixoAtualizado.titulo}" atualizado!`);
  };

  // Exclusão de eixo
  const handleEixoExcluido = (eixoId: string, excluirCards: boolean) => {
    const res = StorageService.excluirEixo(eixoId, excluirCards);
    setEixos(res.eixos);
    setCards(res.cards);
    if (eixoAtivoId === eixoId) {
      setEixoAtivoId(null);
    }
    mostrarFeedback('Eixo excluído com sucesso!');
  };

  // Adicionar tópico a um eixo
  const handleAdicionarTopico = (eixoId: string, titulo: string, descricao?: string) => {
    const atualizados = StorageService.adicionarTopico(eixoId, titulo, descricao);
    setEixos(atualizados);
    mostrarFeedback(`Tópico "${titulo}" adicionado!`);
  };

  // Editar tópico de um eixo
  const handleTopicoEditado = (eixoId: string, topicoId: string, novoTitulo: string, novaDescricao?: string) => {
    const res = StorageService.editarTopico(eixoId, topicoId, novoTitulo, novaDescricao);
    setEixos(res.eixos);
    setCards(res.cards);
    mostrarFeedback(`Tópico "${novoTitulo}" atualizado!`);
  };

  // Excluir tópico de um eixo
  const handleTopicoExcluido = (eixoId: string, topicoId: string, excluirCards: boolean) => {
    const res = StorageService.excluirTopico(eixoId, topicoId, excluirCards);
    setEixos(res.eixos);
    setCards(res.cards);
    mostrarFeedback('Tópico excluído com sucesso!');
  };

  // Excluir um card específico
  const handleCardExcluido = (cardId: string) => {
    const atualizados = StorageService.excluirCard(cardId);
    setCards(atualizados);
    setEixos(StorageService.getEixos());
    mostrarFeedback('Flashcard excluído!');
  };

  // Zerar todos os dados
  const handleZerarDados = () => {
    const limpo = StorageService.zerarTodosDados();
    setCards(limpo.cards);
    setEixos(limpo.eixos);
    setProgresso(limpo.progresso);
    setEixoAtivoId(null);
    mostrarFeedback('Aplicativo zerado com sucesso! Comece do zero.');
  };

  // Carregar dados de exemplo
  const handleCarregarExemplo = () => {
    const dadosExemplo = StorageService.carregarDadosExemplo();
    setCards(dadosExemplo.cards);
    setEixos(dadosExemplo.eixos);
    setProgresso(dadosExemplo.progresso);
    mostrarFeedback('Dados médicos de exemplo carregados!');
  };

  const handleSalvarTimersTopico = (eixoId: string, topicoId: string, customTimers?: any) => {
    StorageService.salvarTimersTopico(eixoId, topicoId, customTimers);
    setEixos(StorageService.getEixos());
    mostrarFeedback(customTimers ? 'Timers customizados do tópico salvos!' : 'Tópico restaurado para os timers globais.');
  };

  const handleResetarTopicoParaRodada1 = (eixoId: string, topicoId: string) => {
    const cardsAtualizados = StorageService.resetarTopicoParaRodada1(eixoId, topicoId);
    setCards(cardsAtualizados);
    mostrarFeedback('Cards do tópico reiniciados para a Rodada 1!');
  };

  const handleMoverCard = (cardId: string, novoEixoId: string, novoTopicoId?: string) => {
    const { cards: novosCards, eixos: novosEixos } = StorageService.moverCard(cardId, novoEixoId, novoTopicoId);
    setCards(novosCards);
    setEixos(novosEixos);
    mostrarFeedback('Flashcard movido com sucesso!');
  };

  const handleMoverTopico = (eixoOrigemId: string, eixoDestinoId: string, topicoId: string) => {
    const { cards: novosCards, eixos: novosEixos } = StorageService.moverTopico(eixoOrigemId, eixoDestinoId, topicoId);
    setCards(novosCards);
    setEixos(novosEixos);
    mostrarFeedback('Tópico e todos os seus flashcards movidos com sucesso!');
  };

  const handleMoverVariosCards = (cardIds: string[], novoEixoId: string, novoTopicoId?: string, novoTopicoTitulo?: string) => {
    const { cards: novosCards, eixos: novosEixos } = StorageService.moverVariosCards(cardIds, novoEixoId, novoTopicoId, novoTopicoTitulo);
    setCards(novosCards);
    setEixos(novosEixos);
    mostrarFeedback(`${cardIds.length} flashcards movidos com sucesso!`);
  };

  const handleExcluirVariosCards = (cardIds: string[]) => {
    const { cards: novosCards, eixos: novosEixos } = StorageService.excluirVariosCards(cardIds);
    setCards(novosCards);
    setEixos(novosEixos);
    mostrarFeedback(`${cardIds.length} flashcards excluídos com sucesso!`);
  };

  // Feedback após importar Anki / Gemini / Backups
  const handleImportarConcluido = (resultado: ResultadoImportacao) => {
    if (resultado.totalCards > 0 || resultado.cardsImportados.length > 0) {
      const { eixos: novosEixos, cards: novosCards } = StorageService.importarEixosECards(
        resultado.eixosCriados || [],
        resultado.cardsImportados || []
      );

      setCards(novosCards);
      setEixos(novosEixos);
      mostrarFeedback(resultado.mensagem);
    } else {
      mostrarFeedback(resultado.mensagem);
    }
  };

  const mostrarFeedback = (msg: string) => {
    if (timerNotificacaoRef.current) {
      clearTimeout(timerNotificacaoRef.current);
    }
    setNotificacaoFeedback(msg);
    timerNotificacaoRef.current = setTimeout(() => {
      setNotificacaoFeedback(null);
      timerNotificacaoRef.current = null;
    }, 4000);
  };

  // Exportar backup JSON
  const handleExportarJson = () => {
    const jsonStr = StorageService.exportarDados();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medcards_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 pb-28 text-sm selection:bg-blue-100">
      {/* Toast de Notificação Mobile-First Acima da Barra Inferior */}
      {notificacaoFeedback && (
        <div 
          id="toast-notificacao-global"
          className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-50 p-2.5 px-3.5 bg-slate-900/95 text-white rounded-2xl shadow-xl border border-slate-700/60 backdrop-blur-md flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium leading-snug break-words">
              {notificacaoFeedback}
            </span>
          </div>
          <button 
            onClick={() => {
              if (timerNotificacaoRef.current) clearTimeout(timerNotificacaoRef.current);
              setNotificacaoFeedback(null);
            }} 
            className="p-1 text-slate-400 hover:text-white shrink-0 cursor-pointer"
            title="Dispensar notificação"
          >
            ✕
          </button>
        </div>
      )}

      {/* Notificação Inteligente de Atualizações Vercel em Tempo Real */}
      <UpdateNotificationToast />

      {/* Cabeçalho Compacto Mobile */}
      <Header
        progresso={progresso}
        onExportar={handleExportarJson}
        onResetar={handleZerarDados}
        onAbrirImportExport={() => setIsImportExportOpen(true)}
        onAbrirConfiguracoes={() => setIsSettingsOpen(true)}
        onInstalarApp={handleInstallPwa}
      />

      {/* Conteúdo Principal com Escala Mobile Proporcional */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 space-y-3">
        
        {/* Resumo Estilo EdTech Médica (Visível na aba Eixos) */}
        {tabAtiva === 'eixos' && (
          <DashboardOverview
            progresso={progresso}
            cardsPendentes={cardsPendentes}
            cardsTotal={cards}
            eixos={eixos}
            busca={buscaGlobal}
            onBuscaChange={setBuscaGlobal}
            onIniciarRevisao={handleIniciarRevisao}
            onAbrirCard={handleAbrirCard}
            onCarregarExemplo={handleCarregarExemplo}
            onResetarDados={handleZerarDados}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 1: EIXOS CLÍNICOS (Hierarquia em 2 Níveis: Eixos ➔ Tópicos)  */}
        {/* ================================================================= */}
        {tabAtiva === 'eixos' && (
          <EixosView
            eixos={eixos}
            cards={cardsFiltradosBusca}
            especialidadeFiltro={especialidadeFiltro}
            onFiltroChange={setEspecialidadeFiltro}
            onEstudarEixo={handleEstudarEixo}
            onEstudarCards={(cardsTopico) => setReviewCards(cardsTopico)}
            onAdicionarCardAoEixo={(eixoId, topicoId) => {
              setCreatePreselectedEixoId(eixoId);
              setCreatePreselectedTopicoId(topicoId);
              setTabAtiva('criar_card');
            }}
            onAdicionarTopicoAoEixo={handleAdicionarTopico}
            onEditarEixo={handleEixoAtualizado}
            onExcluirEixo={handleEixoExcluido}
            onEditarTopico={handleTopicoEditado}
            onExcluirTopico={handleTopicoExcluido}
            onExcluirCard={handleCardExcluido}
            onEditarCard={handleEditarCard}
            onCardAtualizado={handleCardAtualizado}
            onAbrirCard={handleAbrirCard}
            onCriarNovoEixo={() => setIsCreateEixoOpen(true)}
            onCriarNovoCard={() => {
              setCardEmEdicao(null);
              setCreatePreselectedEixoId(undefined);
              setCreatePreselectedTopicoId(undefined);
              setTabAtiva('criar_card');
            }}
            onResetarFila={handleResetarFila}
            onAbrirImportExport={handleAbrirImportExport}
            eixoAtivoId={eixoAtivoId}
            onSelecionarEixo={setEixoAtivoId}
            onSalvarTimersTopico={handleSalvarTimersTopico}
            onResetarTopicoParaRodada1={handleResetarTopicoParaRodada1}
            onMoverCard={handleMoverCard}
            onMoverTopico={handleMoverTopico}
            onMoverVariosCards={handleMoverVariosCards}
            onExcluirVariosCards={handleExcluirVariosCards}
            modoVisualizacao={modoVisualizacaoEixos}
            onModoVisualizacaoChange={setModoVisualizacaoEixos}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 2: REVISÕES (Fila Prioritária do Dia)                         */}
        {/* ================================================================= */}
        {tabAtiva === 'revisoes' && (
          <div className="space-y-2.5 animate-in fade-in">
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 block">
                    Fila Espaçada do Dia
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Revisões Pendentes ({cardsPendentes.length})
                  </h3>
                </div>

                <button
                  id="btn-iniciar-fila-completa"
                  onClick={() => handleIniciarRevisao()}
                  disabled={cardsPendentes.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-200 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                >
                  Estudar Fila
                </button>
              </div>

              {cardsPendentes.length === 0 ? (
                <div className="p-6 text-center bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xs font-bold">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-emerald-800">Todas as revisões estão em dia!</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Excelente trabalho! Novos flashcards retornarão conforme a curva de esquecimento.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 pt-0.5">
                  {cardsPendentes.map(card => (
                    <div
                      key={card.id}
                      onClick={() => handleAbrirCard(card)}
                      className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-all cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <EixoEmojiBadge card={card} size="sm" />
                          {card.tipoCard === 'caso_clinico' && (
                            <span className="text-[8.5px] font-bold text-purple-600 bg-purple-50 px-1 rounded border border-purple-200">Caso</span>
                          )}
                          {card.tipoCard === 'image_occlusion' && (
                            <span className="text-[8.5px] font-bold text-sky-600">Oclusão</span>
                          )}
                          {card.tipoCard === 'fluxograma_complexo' && (
                            <span className="text-[8.5px] font-bold text-emerald-600">Fluxo Ramificado</span>
                          )}
                          {card.tipoCard === 'fluxograma_oclusao' && (
                            <span className="text-[8.5px] font-bold text-indigo-600">Passo a Passo</span>
                          )}
                        </div>
                        <h4 className="text-[11px] font-semibold text-slate-800 truncate mt-0.5">
                          {card.titulo}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {card.perguntaGatilho}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleEditarCard(card)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 transition-all cursor-pointer active:scale-95 shadow-3xs"
                          title="Editar conteúdo"
                        >
                          <FilePenLine className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAbrirCard(card)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all cursor-pointer active:scale-95 shadow-3xs"
                          title="Revisar flashcard"
                        >
                          <BookOpen className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CRIAR FLASHCARD (ABA DEDICADA EM TELA CHEIA)               */}
        {/* ================================================================= */}
        {tabAtiva === 'criar_card' && (
          <CreateFlashcardView
            eixos={eixos}
            eixoPreselecionadoId={createPreselectedEixoId}
            topicoPreselecionadoId={createPreselectedTopicoId}
            cardEmEdicao={cardEmEdicao}
            onVoltar={restaurarSessaoOrigem}
            onCardCriado={handleCardCriado}
            onCardAtualizado={handleCardAtualizado}
            onAbrirImportExport={handleAbrirImportExport}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 4: PROVAS / TREINO (Simulador de Rodízios e Provas)           */}
        {/* ================================================================= */}
        {tabAtiva === 'provas' && (
          <SimulationTrainingView
            cards={cards}
            eixos={eixos}
            onRegistrarRevisao={handleRegistrarRevisao}
            onEditarCard={handleEditarCardSimulation}
            initialFase={simulationState.fase}
            initialQuestoes={simulationState.questoes}
            initialIndice={simulationState.indice}
          />
        )}

        {/* ================================================================= */}
        {/* TAB 5: MÉTRICAS (Desempenho Clínico, Retenção & Curva SRS)        */}
        {/* ================================================================= */}
        {tabAtiva === 'metricas' && (
          <MetricsView
            progresso={progresso}
            cards={cards}
            eixos={eixos}
          />
        )}

      </main>

      {/* Barra de Navegação Inferior Fixa Acessível pelo Polegar */}
      <BottomNavBar
        tabAtiva={tabAtiva}
        onTabChange={(tab) => {
          if (tab === 'criar_card') {
            setCardEmEdicao(null);
            setCreatePreselectedEixoId(undefined);
            setCreatePreselectedTopicoId(undefined);
          }
          setTabAtiva(tab);
        }}
        pendentesHojeCount={cardsPendentes.length}
      />

      {/* Modal de Sessão de Revisão Espaçada (SRS) */}
      {reviewCards && reviewCards.length > 0 && (
        <ReviewSessionModal
          cards={reviewCards}
          onClose={() => { setReviewCards(null); setSessaoOrigem(null); }}
          onRegistrarRevisao={handleRegistrarRevisao}
          onEditarCard={handleEditarCardReview}
          initialIndex={reviewInitialIndex}
          onIndexChange={(novoIdx) => setReviewInitialIndex(novoIdx)}
        />
      )}

      {/* Modal de Oclusão Visual (Oclusão de Imagem e Fluxogramas) */}
      {occlusionCard && (
        <VisualOcclusionModal
          card={occlusionCard}
          onClose={() => { setOcclusionCard(null); setSessaoOrigem(null); }}
          onRegistrarRevisao={handleRegistrarRevisao}
          onEditarCard={handleEditarCardOcclusion}
        />
      )}

      {/* Modal de Caso Clínico Interativo */}
      {caseCard && (
        <ClinicalCaseModal
          card={caseCard}
          onClose={() => { setCaseCard(null); setSessaoOrigem(null); }}
          onRegistrarRevisao={handleRegistrarRevisao}
          onEditarCard={handleEditarCardCase}
        />
      )}

      {/* Modal: Criar Eixo Clínico */}
      {isCreateEixoOpen && (
        <CreateEixoModal
          onClose={() => setIsCreateEixoOpen(false)}
          onEixoCriado={handleEixoCriado}
        />
      )}

      {/* Modal: Importação APKG Anki / Exportação & Colar do Gemini */}
      {isImportExportOpen && (
        <ImportExportModal
          cards={cards}
          eixos={eixos}
          progresso={progresso}
          initialTab={importExportConfig?.tab}
          initialEixoId={importExportConfig?.eixoId}
          initialCardId={importExportConfig?.cardId}
          onClose={() => {
            setIsImportExportOpen(false);
            setImportExportConfig(undefined);
          }}
          onImportarConcluido={handleImportarConcluido}
          onExportarJson={handleExportarJson}
          onAbrirCriacaoManual={() => {
            setIsImportExportOpen(false);
            setTabAtiva('criar_card');
          }}
          onEixoCriado={handleEixoCriado}
          onNavegarParaEixo={(eixoId) => {
            setIsImportExportOpen(false);
            setTabAtiva('eixos');
            setEixoAtivoId(eixoId);
          }}
          onEstudarCardsImportados={(cardsParaEstudo) => {
            setIsImportExportOpen(false);
            setReviewCards(cardsParaEstudo);
          }}
        />
      )}

      {/* Modal: Instalação PWA no Celular */}
      {isInstallModalOpen && (
        <InstallPwaModal
          onClose={() => setIsInstallModalOpen(false)}
          onInstallClick={handleInstallPwa}
          canInstallDirectly={!!deferredPrompt}
        />
      )}

      {/* Modal: Configurações & Dados */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          cards={cards}
          eixos={eixos}
          progresso={progresso}
          onZerarDados={handleZerarDados}
          onCarregarExemplo={handleCarregarExemplo}
          onAbrirImportExport={() => {
            setIsSettingsOpen(false);
            setIsImportExportOpen(true);
          }}
          modoVisualizacao={modoVisualizacaoEixos}
          onModoVisualizacaoChange={setModoVisualizacaoEixos}
        />
      )}
    </div>
  );
}
