import { CardClinico, EixoClinico, ProgressoDiario, ConfiguracaoTimers, TopicoClinico } from '../types';
import { INITIAL_CARDS, INITIAL_EIXOS, INITIAL_PROGRESS } from '../data/mockData';
import { IndexedDbService } from './indexedDbStorage';
import { DEFAULT_CONFIG_TIMERS, obterInfoRodadaCard, isCardPendente } from '../utils/timerUtils';

const STORAGE_KEYS = {
  CARDS: 'medspaced_cards_v1',
  EIXOS: 'medspaced_eixos_v1',
  PROGRESSO: 'medspaced_progresso_v1',
  INICIALIZADO: 'medspaced_inicializado_v2',
  TIMERS_CONFIG: 'medspaced_timers_config_v1',
  DATA_ULTIMO_RESET: 'medspaced_data_ultimo_reset_v1',
  MODO_VISUALIZACAO_EIXOS: 'medspaced_modo_vis_eixos_v1',
  EXIBIR_DICAS: 'medspaced_exibir_dicas_v1',
};

const defaultZeroProgresso: ProgressoDiario = {
  data: new Date().toISOString().split('T')[0],
  cardsRevisadosHoje: 0,
  metaDiaria: 35,
  sequenciaDias: 0,
  taxaRetencaoMedia: 0,
  tempoEstudadoMinutos: 0,
};

const normalizarCorTemaVibrante = (cor?: EixoClinico['corTema']): EixoClinico['corTema'] => {
  if (!cor) return { bgTag: 'bg-blue-100', textTag: 'text-blue-950', borderTag: 'border-blue-300', accent: '#1D4ED8' };
  
  let bgTag = cor.bgTag || 'bg-blue-100';
  let textTag = cor.textTag || 'text-blue-950';
  let borderTag = cor.borderTag || 'border-blue-300';
  const accent = cor.accent || '#1D4ED8';

  if (bgTag.endsWith('-50')) {
    bgTag = bgTag.replace('-50', '-100');
  }
  if (borderTag.endsWith('-200')) {
    borderTag = borderTag.replace('-200', '-300');
  }
  if (textTag.endsWith('-700') || textTag.endsWith('-600') || textTag.endsWith('-800')) {
    textTag = textTag.replace(/-[678]00$/, '-950');
  }

  return { bgTag, textTag, borderTag, accent };
};

export const StorageService = {
  // Inicialização: Por padrão começa sem nada (limpo) a menos que o usuário já tenha criado dados ou carregado exemplo
  init(): { cards: CardClinico[]; eixos: EixoClinico[]; progresso: ProgressoDiario } {
    const rawInicializado = localStorage.getItem(STORAGE_KEYS.INICIALIZADO);
    const rawCards = localStorage.getItem(STORAGE_KEYS.CARDS);
    const rawEixos = localStorage.getItem(STORAGE_KEYS.EIXOS);
    const rawProgresso = localStorage.getItem(STORAGE_KEYS.PROGRESSO);

    let cards: CardClinico[] = [];
    let eixos: EixoClinico[] = [];
    let progresso: ProgressoDiario = defaultZeroProgresso;

    if (!rawInicializado) {
      // Primeira vez abrindo o app: começa limpo conforme solicitado pelo usuário
      this.safeLocalStorageSet(STORAGE_KEYS.INICIALIZADO, 'true');
      this.safeLocalStorageSet(STORAGE_KEYS.CARDS, JSON.stringify([]));
      this.safeLocalStorageSet(STORAGE_KEYS.EIXOS, JSON.stringify([]));
      this.safeLocalStorageSet(STORAGE_KEYS.PROGRESSO, JSON.stringify(defaultZeroProgresso));
      IndexedDbService.salvar([], [], defaultZeroProgresso);
      return { cards: [], eixos: [], progresso: defaultZeroProgresso };
    }

    if (rawCards) {
      try {
        cards = JSON.parse(rawCards);
      } catch (e) {
        console.error('Erro ao ler cards do localStorage', e);
      }
    }

    if (rawEixos) {
      try {
        const parsed = JSON.parse(rawEixos);
        eixos = Array.isArray(parsed) ? parsed.map((e: EixoClinico) => ({
          ...e,
          corTema: normalizarCorTemaVibrante(e.corTema),
        })) : [];
      } catch (e) {
        console.error('Erro ao ler eixos do localStorage', e);
      }
    }

    if (rawProgresso) {
      try {
        progresso = JSON.parse(rawProgresso);
      } catch (e) {
        console.error('Erro ao ler progresso do localStorage', e);
      }
    }

    // Tenta sincronizar com IndexedDB em segundo plano
    IndexedDbService.carregar().then(dadosIdb => {
      if (dadosIdb && dadosIdb.cards && dadosIdb.cards.length > cards.length) {
        this.safeLocalStorageSet(STORAGE_KEYS.CARDS, JSON.stringify(dadosIdb.cards));
        this.safeLocalStorageSet(STORAGE_KEYS.EIXOS, JSON.stringify(dadosIdb.eixos));
        this.safeLocalStorageSet(STORAGE_KEYS.PROGRESSO, JSON.stringify(dadosIdb.progresso));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('medcards_storage_synced'));
        }
      }
    }).catch(() => {});

    // Verifica virada do dia (reset automático para Rodada 1 à meia-noite)
    const resReset = this.verificarResetDiarioAutomatico();
    if (resReset.resetou) {
      cards = resReset.cards;
      progresso = resReset.progresso;
    }

    // Substituição garantida dos dados de exemplo antigos pelo novo conjunto de Ortopedia (1 Eixo, 1 Tópico, 6 Flashcards)
    const migradoOrtopedia = localStorage.getItem('medspaced_ortopedia_eixo_v1');
    const temCardsAntigos = cards.some(c => c.eixoId === 'eixo-neuro' || c.eixoId === 'eixo-cardio' || c.id.startsWith('card-exemplo-'));
    const temEixosAntigos = eixos.some(e => e.id === 'eixo-neuro' || e.id === 'eixo-cardio');

    if (!migradoOrtopedia || temCardsAntigos || temEixosAntigos || (cards.length === 0 && eixos.length === 0)) {
      const cardsManuais = cards.filter(c => c.eixoId !== 'eixo-neuro' && c.eixoId !== 'eixo-cardio' && !c.id.startsWith('card-exemplo-'));
      const eixosManuais = eixos.filter(e => e.id !== 'eixo-neuro' && e.id !== 'eixo-cardio');

      cards = [...INITIAL_CARDS, ...cardsManuais];
      eixos = [...INITIAL_EIXOS, ...eixosManuais];

      this.safeLocalStorageSet(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      this.safeLocalStorageSet(STORAGE_KEYS.EIXOS, JSON.stringify(eixos));
      this.safeLocalStorageSet(STORAGE_KEYS.INICIALIZADO, 'true');
      this.safeLocalStorageSet('medspaced_ortopedia_eixo_v1', 'true');
      IndexedDbService.salvar(cards, eixos, progresso);
    }

    // Atualiza automaticamente posições espaçadas do card de fluxograma ortopédico se estiver com coordenadas antigas
    const cardFluxoAtual = cards.find(c => c.id === 'card-ortop-fluxo-complexo');
    if (cardFluxoAtual?.fluxogramaComplexo?.nos?.some(n => n.id === 'no-ortop-1' && (n.posicaoX === 450 || (n.posicaoX ?? 0) < 500))) {
      const cardAtualizado = INITIAL_CARDS.find(c => c.id === 'card-ortop-fluxo-complexo');
      if (cardAtualizado) {
        cards = cards.map(c => c.id === 'card-ortop-fluxo-complexo' ? cardAtualizado : c);
        this.safeLocalStorageSet(STORAGE_KEYS.CARDS, JSON.stringify(cards));
        IndexedDbService.salvar(cards, eixos, progresso);
      }
    }

    // Garante sincronização exata do cálculo de pendentes hoje
    const eixosSincronizados = this.getEixos().map(eixo => {
      const cardsDoEixo = cards.filter(c => c.eixoId === eixo.id);
      const dominados = cardsDoEixo.filter(c => c.status === 'dominado').length;
      const pendentesHoje = cardsDoEixo.filter(c => isCardPendente(c)).length;
      return {
        ...eixo,
        totalCards: cardsDoEixo.length,
        cardsDominados: dominados,
        pendentesHoje,
      };
    });
    this.saveEixos(eixosSincronizados);

    return { cards, eixos: eixosSincronizados, progresso };
  },

  // Obtém configuração global de timers intradiários
  getConfiguracaoTimers(): ConfiguracaoTimers {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMERS_CONFIG);
    if (!raw) return DEFAULT_CONFIG_TIMERS;
    try {
      return { ...DEFAULT_CONFIG_TIMERS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG_TIMERS;
    }
  },

  // Salva configuração global de timers intradiários
  salvarConfiguracaoTimers(config: ConfiguracaoTimers): void {
    this.safeLocalStorageSet(STORAGE_KEYS.TIMERS_CONFIG, JSON.stringify(config));
  },

  // Reset Diário Automático (à meia-noite todos os cards resetam para Rodada 1)
  verificarResetDiarioAutomatico(): { resetou: boolean; cards: CardClinico[]; progresso: ProgressoDiario } {
    const hoje = new Date().toISOString().split('T')[0];
    const ultimoReset = localStorage.getItem(STORAGE_KEYS.DATA_ULTIMO_RESET);

    if (ultimoReset !== hoje) {
      this.safeLocalStorageSet(STORAGE_KEYS.DATA_ULTIMO_RESET, hoje);
      const cards = this.getCards();
      const progresso = this.getProgresso();

      // Reseta todos os cards para Rodada 1 e status pendente para o novo dia
      const cardsResetados = cards.map(c => ({
        ...c,
        rodadaAtual: 1,
        proximaRevisao: new Date().toISOString(),
        status: 'pendente' as const,
      }));

      const progressoNovoDia: ProgressoDiario = {
        ...progresso,
        data: hoje,
        cardsRevisadosHoje: 0,
        tempoEstudadoMinutos: 0,
      };

      this.saveCards(cardsResetados);
      this.saveProgresso(progressoNovoDia);
      this.sincronizarEixos(cardsResetados);

      return { resetou: true, cards: cardsResetados, progresso: progressoNovoDia };
    }

    return { resetou: false, cards: this.getCards(), progresso: this.getProgresso() };
  },

  // Resetar todos os cards do aplicativo para a Rodada 1 imediatamente
  resetarTodosCardsParaRodada1(): { cardsAtualizados: CardClinico[]; progressoAtualizado: ProgressoDiario } {
    const cards = this.getCards();
    const progresso = this.getProgresso();
    const dataImediata = new Date().toISOString();

    const cardsAtualizados = cards.map(c => ({
      ...c,
      rodadaAtual: 1,
      proximaRevisao: dataImediata,
      status: 'pendente' as const,
    }));

    this.saveCards(cardsAtualizados);
    this.sincronizarEixos(cardsAtualizados);
    return { cardsAtualizados, progressoAtualizado: progresso };
  },

  // Resetar cards de um tópico específico para a Rodada 1
  resetarTopicoParaRodada1(eixoId: string, topicoId: string): CardClinico[] {
    const cards = this.getCards();
    const dataImediata = new Date().toISOString();

    const cardsAtualizados = cards.map(c => {
      const pertence = c.eixoId === eixoId && (c.topicoId === topicoId || (!c.topicoId && topicoId === 'top-geral'));
      if (pertence) {
        return {
          ...c,
          rodadaAtual: 1,
          proximaRevisao: dataImediata,
          status: 'pendente' as const,
        };
      }
      return c;
    });

    this.saveCards(cardsAtualizados);
    this.sincronizarEixos(cardsAtualizados);
    return cardsAtualizados;
  },

  // Salva ou remove timers customizados de um tópico específico
  salvarTimersTopico(eixoId: string, topicoId: string, customTimers?: ConfiguracaoTimers): EixoClinico[] {
    const eixos = this.getEixos();
    const eixosAtualizados = eixos.map(e => {
      if (e.id === eixoId && e.topicos) {
        const topicosAtualizados = e.topicos.map(t => {
          if (t.id === topicoId) {
            return {
              ...t,
              customTimers: customTimers || undefined,
            };
          }
          return t;
        });
        return { ...e, topicos: topicosAtualizados };
      }
      return e;
    });

    this.saveEixos(eixosAtualizados);
    return eixosAtualizados;
  },

  // Zerar todos os dados (Começar do zero absoluto)
  zerarTodosDados(): { cards: CardClinico[]; eixos: EixoClinico[]; progresso: ProgressoDiario } {
    const cardsVazios: CardClinico[] = [];
    const eixosVazios: EixoClinico[] = [];
    const progressoZero: ProgressoDiario = {
      ...defaultZeroProgresso,
      data: new Date().toISOString().split('T')[0],
    };

    this.safeLocalStorageSet(STORAGE_KEYS.CARDS, JSON.stringify(cardsVazios));
    this.safeLocalStorageSet(STORAGE_KEYS.EIXOS, JSON.stringify(eixosVazios));
    this.safeLocalStorageSet(STORAGE_KEYS.PROGRESSO, JSON.stringify(progressoZero));
    this.safeLocalStorageSet(STORAGE_KEYS.INICIALIZADO, 'true');

    IndexedDbService.salvar(cardsVazios, eixosVazios, progressoZero);

    return { cards: cardsVazios, eixos: eixosVazios, progresso: progressoZero };
  },

  // Carregar dados médicos de exemplo completos (Cards, Imagens, Oclusões, Fluxogramas)
  carregarDadosExemplo(): { cards: CardClinico[]; eixos: EixoClinico[]; progresso: ProgressoDiario } {
    this.safeLocalStorageSet(STORAGE_KEYS.CARDS, JSON.stringify(INITIAL_CARDS));
    this.safeLocalStorageSet(STORAGE_KEYS.EIXOS, JSON.stringify(INITIAL_EIXOS));
    this.safeLocalStorageSet(STORAGE_KEYS.PROGRESSO, JSON.stringify(INITIAL_PROGRESS));
    this.safeLocalStorageSet(STORAGE_KEYS.INICIALIZADO, 'true');

    IndexedDbService.salvar(INITIAL_CARDS, INITIAL_EIXOS, INITIAL_PROGRESS);

    return { cards: INITIAL_CARDS, eixos: INITIAL_EIXOS, progresso: INITIAL_PROGRESS };
  },

  // Modo de visualização dos Eixos Clínicos: 'lista' (expandida com chevron) ou 'grade' (2 colunas compactas)
  getModoVisualizacaoEixos(): 'lista' | 'grade' {
    const raw = localStorage.getItem(STORAGE_KEYS.MODO_VISUALIZACAO_EIXOS);
    if (raw === 'grade' || raw === 'lista') {
      return raw;
    }
    return 'lista';
  },

  setModoVisualizacaoEixos(modo: 'lista' | 'grade'): void {
    this.safeLocalStorageSet(STORAGE_KEYS.MODO_VISUALIZACAO_EIXOS, modo);
  },

  // Adicionar Tópico/Aula a um Eixo Clínico
  adicionarTopico(
    eixoId: string, 
    titulo: string, 
    descricao?: string, 
    customId?: string
  ): { eixos: EixoClinico[]; topico?: TopicoClinico } {
    const eixos = this.getEixos();
    const index = eixos.findIndex(e => e.id === eixoId);
    if (index === -1) return { eixos };

    const topicosAtuais = eixos[index].topicos || [];
    const novoTopico: TopicoClinico = {
      id: customId || `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eixoId,
      titulo: titulo.trim(),
      descricao: descricao?.trim(),
      totalCards: 0,
    };

    eixos[index] = {
      ...eixos[index],
      topicos: [...topicosAtuais, novoTopico],
    };

    this.saveEixos(eixos);
    return { eixos, topico: novoTopico };
  },

  // Garante que um tópico exista no eixo: se já existir pelo nome, retorna ele; se não, cria e salva
  garantirTopico(eixoId: string, titulo: string, descricao?: string): { topicoId: string; topicoNome: string } {
    const eixos = this.getEixos();
    const eixo = eixos.find(e => e.id === eixoId);
    if (!eixo) {
      return { topicoId: 'top-geral', topicoNome: 'Conceitos Gerais' };
    }

    const topicoTituloLimpo = titulo.trim();
    if (!topicoTituloLimpo) {
      return { topicoId: 'top-geral', topicoNome: 'Conceitos Gerais' };
    }

    const topicoExistente = (eixo.topicos || []).find(
      t => t.titulo.toLowerCase() === topicoTituloLimpo.toLowerCase()
    );

    if (topicoExistente) {
      return { topicoId: topicoExistente.id, topicoNome: topicoExistente.titulo };
    }

    const novoId = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.adicionarTopico(eixoId, topicoTituloLimpo, descricao, novoId);
    return { topicoId: novoId, topicoNome: topicoTituloLimpo };
  },

  safeLocalStorageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`LocalStorage cota atingida ao salvar ${key}. O progresso permanece seguro via IndexedDB.`, e);
    }
  },

  getCards(): CardClinico[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    return raw ? JSON.parse(raw) : INITIAL_CARDS;
  },

  saveCards(cards: CardClinico[]): void {
    this.safeLocalStorageSet(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    IndexedDbService.salvar(cards, this.getEixos(), this.getProgresso());
  },

  getEixos(): EixoClinico[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EIXOS);
    const lista: EixoClinico[] = raw ? JSON.parse(raw) : INITIAL_EIXOS;
    return lista.map(e => ({
      ...e,
      corTema: normalizarCorTemaVibrante(e.corTema),
    }));
  },

  saveEixos(eixos: EixoClinico[]): void {
    this.safeLocalStorageSet(STORAGE_KEYS.EIXOS, JSON.stringify(eixos));
    IndexedDbService.salvar(this.getCards(), eixos, this.getProgresso());
  },

  getProgresso(): ProgressoDiario {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESSO);
    return raw ? JSON.parse(raw) : INITIAL_PROGRESS;
  },

  saveProgresso(progresso: ProgressoDiario): void {
    const comHorario = {
      ...progresso,
      ultimoSalvamentoDispositivo: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    this.safeLocalStorageSet(STORAGE_KEYS.PROGRESSO, JSON.stringify(comHorario));
    IndexedDbService.salvar(this.getCards(), this.getEixos(), comHorario);
  },

  // Algoritmo de Revisão Intradiária Médica (Minutos e Horas dinâmicos, sem dias)
  processarRevisao(
    cardId: string,
    avaliacao: 'errei' | 'dificil' | 'bom' | 'facil',
    tempoGastoSegundos: number = 20
  ): { cardsAtualizados: CardClinico[]; progressoAtualizado: ProgressoDiario } {
    const cards = this.getCards();
    const progresso = this.getProgresso();
    const cardIndex = cards.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
      return { cardsAtualizados: cards, progressoAtualizado: progresso };
    }

    const card = { ...cards[cardIndex] };
    const now = new Date();

    // Recupera configurações de timers aplicáveis (tópico ou global)
    const eixos = this.getEixos();
    const eixoDoCard = eixos.find(e => e.id === card.eixoId);
    const topicoDoCard = eixoDoCard?.topicos?.find(t => t.id === card.topicoId);
    const configTimers = this.getConfiguracaoTimers();
    const infoRodada = obterInfoRodadaCard(card, topicoDoCard, configTimers);

    const rodadaAtual = infoRodada.rodada;
    const timers = infoRodada.timers;

    let minutosAdicionais = 5;
    let novaRodada = rodadaAtual;
    let novoStatus: 'pendente' | 'em_revisao' | 'dominado' = 'em_revisao';

    if (avaliacao === 'errei') {
      // Erro: reinicia para a Rodada 1 para fixação imediata
      minutosAdicionais = timers.erreiMinutos;
      novaRodada = 1;
      novoStatus = 'pendente';
    } else if (avaliacao === 'dificil') {
      // Difícil: mantém na rodada atual
      minutosAdicionais = timers.dificilMinutos;
      novaRodada = rodadaAtual;
      novoStatus = 'em_revisao';
    } else if (avaliacao === 'bom') {
      // Bom: avança para a próxima rodada (máximo 3)
      minutosAdicionais = timers.bomMinutos;
      novaRodada = Math.min(3, rodadaAtual + 1);
      novoStatus = novaRodada >= 3 ? 'dominado' : 'em_revisao';
    } else if (avaliacao === 'facil') {
      // Fácil: avança de rodada (ou salta direto para 3 se estava em 1)
      minutosAdicionais = timers.facilMinutos;
      novaRodada = Math.min(3, rodadaAtual + (rodadaAtual === 1 ? 2 : 1));
      novoStatus = 'dominado';
    }

    const proximaData = new Date(now.getTime() + minutosAdicionais * 60 * 1000);
    const novoIntervaloDias = Number((minutosAdicionais / (24 * 60)).toFixed(4));
    const novasRepeticoes = card.repeticoes + 1;

    // Atualizar histórico de respostas
    const novoHistorico = [...card.historicoRespostas, avaliacao];
    const acertos = novoHistorico.filter(h => h === 'bom' || h === 'facil').length;
    const novaTaxa = Math.round((acertos / novoHistorico.length) * 100);

    card.rodadaAtual = novaRodada;
    card.intervaloDias = novoIntervaloDias;
    card.repeticoes = novasRepeticoes;
    card.proximaRevisao = proximaData.toISOString();
    card.ultimaRevisao = now.toISOString();
    card.status = novoStatus;
    card.historicoRespostas = novoHistorico;
    card.taxaAcerto = novaTaxa;

    cards[cardIndex] = card;
    this.saveCards(cards);

    // Atualizar Progresso Diário
    const progressoAtualizado: ProgressoDiario = {
      ...progresso,
      cardsRevisadosHoje: progresso.cardsRevisadosHoje + 1,
      tempoEstudadoMinutos: progresso.tempoEstudadoMinutos + Math.max(1, Math.round(tempoGastoSegundos / 60)),
      taxaRetencaoMedia: Math.round(
        cards.reduce((acc, c) => acc + c.taxaAcerto, 0) / (cards.length || 1)
      ),
    };
    this.saveProgresso(progressoAtualizado);

    // Atualizar contadores no Eixo correspondente
    this.sincronizarEixos(cards);

    return { cardsAtualizados: cards, progressoAtualizado };
  },

  // Reset de Intervalos: zera os timers e força revisão imediata de todos os cards de um Eixo ou Tópico
  resetarFilaRevisao(eixoId?: string, topicoId?: string): CardClinico[] {
    const cards = this.getCards();
    const now = new Date();
    // Coloca a data no passado recente para disponibilizar imediatamente para revisão
    const dataImediata = new Date(now.getTime() - 60 * 1000).toISOString();

    const cardsAtualizados = cards.map(c => {
      let deveResetar = false;

      if (eixoId && topicoId) {
        deveResetar = c.eixoId === eixoId && c.topicoId === topicoId;
      } else if (eixoId) {
        deveResetar = c.eixoId === eixoId;
      } else if (topicoId) {
        deveResetar = c.topicoId === topicoId;
      } else {
        deveResetar = true;
      }

      if (deveResetar) {
        return {
          ...c,
          proximaRevisao: dataImediata,
          status: 'pendente' as const,
        };
      }
      return c;
    });

    this.saveCards(cardsAtualizados);
    this.sincronizarEixos(cardsAtualizados);
    return cardsAtualizados;
  },

  sincronizarEixos(cards: CardClinico[]): void {
    const eixos = this.getEixos();
    const hoje = new Date();

    const eixosAtualizados = eixos.map(eixo => {
      const cardsDoEixo = cards.filter(c => c.eixoId === eixo.id);
      const dominados = cardsDoEixo.filter(c => c.status === 'dominado').length;
      const pendentesHoje = cardsDoEixo.filter(c => isCardPendente(c, hoje)).length;

      // Reconciliar tópicos existentes com tópicos presentes nos cards do eixo
      const topicosAtuais = [...(eixo.topicos || [])];
      const topicosMapPorTitulo = new Map<string, TopicoClinico>();
      const topicosMapPorId = new Map<string, TopicoClinico>();

      topicosAtuais.forEach(t => {
        topicosMapPorTitulo.set(t.titulo.toLowerCase(), t);
        topicosMapPorId.set(t.id, t);
      });

      // Verificar se algum card tem tópico que não está na lista de tópicos do eixo
      cardsDoEixo.forEach(c => {
        const nomeTopico = (c.topicoNome || (c as any).topico || '').trim();
        if (nomeTopico && nomeTopico !== 'Conceitos Gerais') {
          const chaveNome = nomeTopico.toLowerCase();
          if (!topicosMapPorTitulo.has(chaveNome)) {
            const novoId = c.topicoId || `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const novoTopico: TopicoClinico = {
              id: novoId,
              titulo: nomeTopico,
              descricao: 'Tópico de estudo',
              eixoId: eixo.id,
              totalCards: 0,
            };
            topicosAtuais.push(novoTopico);
            topicosMapPorTitulo.set(chaveNome, novoTopico);
            topicosMapPorId.set(novoId, novoTopico);
          }
        }
      });

      // Atualizar contagem real de cards de cada tópico
      const topicosComContagem = topicosAtuais.map(t => {
        const count = cardsDoEixo.filter(c => {
          if (c.topicoId === t.id) return true;
          if (c.topicoNome && c.topicoNome.toLowerCase() === t.titulo.toLowerCase()) return true;
          return false;
        }).length;
        return { ...t, totalCards: count };
      });

      return {
        ...eixo,
        totalCards: cardsDoEixo.length,
        cardsDominados: dominados,
        pendentesHoje,
        topicos: topicosComContagem,
      };
    });

    this.saveEixos(eixosAtualizados);
  },

  // Mesclar múltiplos Eixos e Cards importados com sincronização automática de tópicos
  importarEixosECards(eixosNovos: EixoClinico[], cardsNovos: CardClinico[]): { eixos: EixoClinico[]; cards: CardClinico[] } {
    let eixosAtuais = this.getEixos();
    let cardsAtuais = this.getCards();

    // 1. Processar e mesclar eixos novos
    if (eixosNovos && eixosNovos.length > 0) {
      eixosNovos.forEach(novoEixo => {
        const idxExistente = eixosAtuais.findIndex(
          e => e.id === novoEixo.id || e.titulo.toLowerCase() === novoEixo.titulo.toLowerCase()
        );
        if (idxExistente >= 0) {
          const eixoExistente = eixosAtuais[idxExistente];
          const topicosMesclados = [...(eixoExistente.topicos || [])];
          (novoEixo.topicos || []).forEach(nt => {
            const jaExiste = topicosMesclados.some(
              t => t.id === nt.id || t.titulo.toLowerCase() === nt.titulo.toLowerCase()
            );
            if (!jaExiste) {
              topicosMesclados.push({ ...nt, eixoId: eixoExistente.id });
            }
          });
          eixosAtuais[idxExistente] = {
            ...eixoExistente,
            topicos: topicosMesclados,
          };
        } else {
          eixosAtuais.push(novoEixo);
        }
      });
      this.saveEixos(eixosAtuais);
    }

    // 2. Normalizar e vincular cards aos tópicos
    const cardsMap = new Map<string, CardClinico>();
    cardsAtuais.forEach(c => cardsMap.set(c.id, c));

    cardsNovos.forEach(c => {
      let finalEixoId = c.eixoId;
      let finalEixo = eixosAtuais.find(e => e.id === finalEixoId);
      if (!finalEixo) {
        finalEixo = eixosAtuais.find(e => e.especialidade === c.especialidade) || eixosAtuais[0];
        if (finalEixo) finalEixoId = finalEixo.id;
      }

      let finalTopicoId = c.topicoId;
      let finalTopicoNome = c.topicoNome || (c as any).topico || (c as any).aula;

      if (finalEixo && finalTopicoNome && finalTopicoNome !== 'Conceitos Gerais') {
        const topEncontrado = (finalEixo.topicos || []).find(
          t => (finalTopicoId && t.id === finalTopicoId) || t.titulo.toLowerCase() === finalTopicoNome.toLowerCase()
        );
        if (topEncontrado) {
          finalTopicoId = topEncontrado.id;
          finalTopicoNome = topEncontrado.titulo;
        } else {
          const { topicoId, topicoNome } = this.garantirTopico(finalEixo.id, finalTopicoNome);
          finalTopicoId = topicoId;
          finalTopicoNome = topicoNome;
          eixosAtuais = this.getEixos();
        }
      }

      const cardNormalizado: CardClinico = {
        ...c,
        eixoId: finalEixoId || eixosAtuais[0]?.id || 'eixo-1',
        topicoId: finalTopicoId || undefined,
        topicoNome: finalTopicoNome || undefined,
        especialidade: finalEixo ? finalEixo.especialidade : c.especialidade,
      };

      cardsMap.set(cardNormalizado.id, cardNormalizado);
    });

    const cardsFinal = Array.from(cardsMap.values());
    this.saveCards(cardsFinal);
    this.sincronizarEixos(cardsFinal);

    return { eixos: this.getEixos(), cards: this.getCards() };
  },

  adicionarCard(novoCard: CardClinico): CardClinico[] {
    const cards = this.getCards();
    const atualizados = [novoCard, ...cards];
    this.saveCards(atualizados);
    this.sincronizarEixos(atualizados);
    return atualizados;
  },

  adicionarEixo(novoEixo: EixoClinico): EixoClinico[] {
    const eixos = this.getEixos();
    const atualizados = [...eixos, novoEixo];
    this.saveEixos(atualizados);
    return atualizados;
  },

  // Atualizar/Personalizar Eixo existente
  atualizarEixo(eixoAtualizado: EixoClinico): { eixos: EixoClinico[]; cards: CardClinico[] } {
    const eixos = this.getEixos();
    const index = eixos.findIndex(e => e.id === eixoAtualizado.id);
    if (index === -1) {
      return { eixos, cards: this.getCards() };
    }

    // Preserva contadores caso não tenham sido passados
    const eixoAnterior = eixos[index];
    const eixoSalvo: EixoClinico = {
      ...eixoAnterior,
      ...eixoAtualizado,
      topicos: eixoAtualizado.topicos || eixoAnterior.topicos,
    };

    eixos[index] = eixoSalvo;
    this.saveEixos(eixos);

    // Se a especialidade mudou, sincroniza nos cards pertencentes a esse eixo
    let cards = this.getCards();
    let cardsModificados = false;
    if (eixoAnterior.especialidade !== eixoAtualizado.especialidade) {
      cards = cards.map(c => {
        if (c.eixoId === eixoAtualizado.id) {
          cardsModificados = true;
          return { ...c, especialidade: eixoAtualizado.especialidade };
        }
        return c;
      });
      if (cardsModificados) {
        this.saveCards(cards);
      }
    }

    this.sincronizarEixos(cards);
    return { eixos: this.getEixos(), cards };
  },

  // Excluir Eixo Clínico
  excluirEixo(eixoId: string, excluirCards: boolean = true): { eixos: EixoClinico[]; cards: CardClinico[] } {
    const eixos = this.getEixos();
    const eixosAtualizados = eixos.filter(e => e.id !== eixoId);
    this.saveEixos(eixosAtualizados);

    let cards = this.getCards();
    if (excluirCards) {
      cards = cards.filter(c => c.eixoId !== eixoId);
      this.saveCards(cards);
    } else {
      // Se não excluir, reatribui os cards para o primeiro eixo disponível ou remove o vínculo
      const primeiroOutroEixo = eixosAtualizados[0];
      if (primeiroOutroEixo) {
        cards = cards.map(c => {
          if (c.eixoId === eixoId) {
            return {
              ...c,
              eixoId: primeiroOutroEixo.id,
              especialidade: primeiroOutroEixo.especialidade,
              topicoId: undefined,
              topicoNome: undefined,
            };
          }
          return c;
        });
        this.saveCards(cards);
      }
    }

    this.sincronizarEixos(cards);
    return { eixos: this.getEixos(), cards };
  },

  // Editar Tópico existente
  editarTopico(eixoId: string, topicoId: string, novoTitulo: string, novaDescricao?: string): { eixos: EixoClinico[]; cards: CardClinico[] } {
    const eixos = this.getEixos();
    const index = eixos.findIndex(e => e.id === eixoId);
    if (index === -1) return { eixos, cards: this.getCards() };

    const topicos = eixos[index].topicos || [];
    const topicosAtualizados = topicos.map(t => {
      if (t.id === topicoId) {
        return {
          ...t,
          titulo: novoTitulo.trim(),
          descricao: novaDescricao !== undefined ? novaDescricao.trim() : t.descricao,
        };
      }
      return t;
    });

    eixos[index] = {
      ...eixos[index],
      topicos: topicosAtualizados,
    };
    this.saveEixos(eixos);

    // Atualiza o nome do tópico nos cards correspondentes
    let cards = this.getCards();
    let alterouCard = false;
    cards = cards.map(c => {
      if (c.eixoId === eixoId && c.topicoId === topicoId) {
        alterouCard = true;
        return { ...c, topicoNome: novoTitulo.trim() };
      }
      return c;
    });

    if (alterouCard) {
      this.saveCards(cards);
    }

    return { eixos: this.getEixos(), cards };
  },

  // Excluir Tópico de um Eixo (com opção de mover cards para o geral ou excluir tudo)
  excluirTopico(eixoId: string, topicoId: string, excluirCards: boolean = false): { eixos: EixoClinico[]; cards: CardClinico[] } {
    const eixos = this.getEixos();
    const index = eixos.findIndex(e => e.id === eixoId);
    if (index === -1) return { eixos, cards: this.getCards() };

    const topicoAlvo = eixos[index].topicos?.find(t => t.id === topicoId);
    const topicoTituloLower = topicoAlvo?.titulo ? topicoAlvo.titulo.trim().toLowerCase() : undefined;

    const topicos = eixos[index].topicos || [];
    const topicosAtualizados = topicos.filter(t => t.id !== topicoId && (!topicoTituloLower || t.titulo.trim().toLowerCase() !== topicoTituloLower));

    eixos[index] = {
      ...eixos[index],
      topicos: topicosAtualizados,
    };
    this.saveEixos(eixos);

    let cards = this.getCards();
    if (excluirCards) {
      cards = cards.filter(c => {
        if (c.eixoId !== eixoId) return true;
        const matchId = c.topicoId === topicoId;
        const matchTitulo = topicoTituloLower && (
          (c.topicoNome && c.topicoNome.trim().toLowerCase() === topicoTituloLower) ||
          ((c as any).topico && String((c as any).topico).trim().toLowerCase() === topicoTituloLower)
        );
        return !(matchId || matchTitulo);
      });
    } else {
      cards = cards.map(c => {
        if (c.eixoId === eixoId) {
          const matchId = c.topicoId === topicoId;
          const matchTitulo = topicoTituloLower && (
            (c.topicoNome && c.topicoNome.trim().toLowerCase() === topicoTituloLower) ||
            ((c as any).topico && String((c as any).topico).trim().toLowerCase() === topicoTituloLower)
          );
          if (matchId || matchTitulo) {
            const cardLimpo = { ...c };
            cardLimpo.topicoId = undefined;
            cardLimpo.topicoNome = undefined;
            delete (cardLimpo as any).topico;
            return cardLimpo;
          }
        }
        return c;
      });
    }

    this.saveCards(cards);
    this.sincronizarEixos(cards);
    return { eixos: this.getEixos(), cards: this.getCards() };
  },

  // Excluir um Card específico
  excluirCard(cardId: string): CardClinico[] {
    const cards = this.getCards();
    const filtrados = cards.filter(c => c.id !== cardId);
    this.saveCards(filtrados);
    this.sincronizarEixos(filtrados);
    return filtrados;
  },

  // Excluir múltiplos Cards em lote
  excluirVariosCards(cardIds: string[]): { cards: CardClinico[]; eixos: EixoClinico[] } {
    const cards = this.getCards();
    const setIds = new Set(cardIds);
    const filtrados = cards.filter(c => !setIds.has(c.id));
    this.saveCards(filtrados);
    this.sincronizarEixos(filtrados);
    return { cards: this.getCards(), eixos: this.getEixos() };
  },

  // Mover múltiplos Flashcards em lote para outro Eixo e/ou Tópico
  moverVariosCards(
    cardIds: string[],
    novoEixoId: string,
    novoTopicoId?: string,
    novoTopicoNome?: string
  ): { cards: CardClinico[]; eixos: EixoClinico[] } {
    if (cardIds.length === 0) return { cards: this.getCards(), eixos: this.getEixos() };

    let cards = this.getCards();
    const eixos = this.getEixos();
    const eixoDestino = eixos.find(e => e.id === novoEixoId);
    if (!eixoDestino) return { cards, eixos };

    let topicoFinalId = novoTopicoId;
    let topicoFinalNome = novoTopicoNome;

    if (novoTopicoNome && (!novoTopicoId || novoTopicoId === '__novo__')) {
      const topicoExistente = eixoDestino.topicos?.find(
        t => t.titulo.toLowerCase() === novoTopicoNome.trim().toLowerCase()
      );
      if (topicoExistente) {
        topicoFinalId = topicoExistente.id;
        topicoFinalNome = topicoExistente.titulo;
      } else {
        const topId = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.adicionarTopico(novoEixoId, novoTopicoNome.trim(), undefined, topId);
        topicoFinalId = topId;
        topicoFinalNome = novoTopicoNome.trim();
      }
    } else if (novoTopicoId && !novoTopicoNome) {
      const topEncontrado = eixoDestino.topicos?.find(t => t.id === novoTopicoId);
      if (topEncontrado) {
        topicoFinalNome = topEncontrado.titulo;
      }
    }

    const setIds = new Set(cardIds);
    cards = cards.map(c => {
      if (setIds.has(c.id)) {
        return {
          ...c,
          eixoId: novoEixoId,
          especialidade: eixoDestino.especialidade,
          topicoId: topicoFinalId || undefined,
          topicoNome: topicoFinalNome || undefined,
        };
      }
      return c;
    });

    this.saveCards(cards);
    this.sincronizarEixos(cards);
    return { cards: this.getCards(), eixos: this.getEixos() };
  },

  // Mover um Flashcard para outro Eixo e/ou Tópico
  moverCard(
    cardId: string, 
    novoEixoId: string, 
    novoTopicoId?: string, 
    novoTopicoNome?: string
  ): { cards: CardClinico[]; eixos: EixoClinico[] } {
    let cards = this.getCards();
    const eixos = this.getEixos();
    const eixoDestino = eixos.find(e => e.id === novoEixoId);
    if (!eixoDestino) return { cards, eixos };

    // Se o usuário digitou um novo tópico que não existe ainda no eixo de destino, cria ele
    let topicoFinalId = novoTopicoId;
    let topicoFinalNome = novoTopicoNome;

    if (novoTopicoNome && (!novoTopicoId || novoTopicoId === '__novo__')) {
      const topicoExistente = eixoDestino.topicos?.find(
        t => t.titulo.toLowerCase() === novoTopicoNome.trim().toLowerCase()
      );
      if (topicoExistente) {
        topicoFinalId = topicoExistente.id;
        topicoFinalNome = topicoExistente.titulo;
      } else {
        const topId = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.adicionarTopico(novoEixoId, novoTopicoNome.trim());
        topicoFinalId = topId;
        topicoFinalNome = novoTopicoNome.trim();
      }
    } else if (novoTopicoId && !novoTopicoNome) {
      const topEncontrado = eixoDestino.topicos?.find(t => t.id === novoTopicoId);
      if (topEncontrado) {
        topicoFinalNome = topEncontrado.titulo;
      }
    }

    cards = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          eixoId: novoEixoId,
          especialidade: eixoDestino.especialidade,
          topicoId: topicoFinalId || undefined,
          topicoNome: topicoFinalNome || undefined,
        };
      }
      return c;
    });

    this.saveCards(cards);
    this.sincronizarEixos(cards);
    return { cards: this.getCards(), eixos: this.getEixos() };
  },

  // Mover um Tópico Inteiro (com todos os seus flashcards) para outro Eixo
  moverTopico(
    origemEixoId: string, 
    destinoEixoId: string, 
    topicoId: string
  ): { cards: CardClinico[]; eixos: EixoClinico[] } {
    let eixos = this.getEixos();
    const idxOrigem = eixos.findIndex(e => e.id === origemEixoId);
    const idxDestino = eixos.findIndex(e => e.id === destinoEixoId);
    if (idxOrigem === -1 || idxDestino === -1) return { cards: this.getCards(), eixos };

    const topicoOrigem = eixos[idxOrigem].topicos?.find(t => t.id === topicoId);
    if (!topicoOrigem) return { cards: this.getCards(), eixos };

    const topicoTitulo = topicoOrigem.titulo.trim();
    const topicoTituloLower = topicoTitulo.toLowerCase();

    // Remove do eixo de origem (por ID e por título para evitar resíduos)
    eixos[idxOrigem] = {
      ...eixos[idxOrigem],
      topicos: (eixos[idxOrigem].topicos || []).filter(
        t => t.id !== topicoId && t.titulo.trim().toLowerCase() !== topicoTituloLower
      ),
    };

    // Adiciona ou mescla no eixo de destino
    const topicosDestino = eixos[idxDestino].topicos || [];
    const topicoExistenteNoDestino = topicosDestino.find(
      t => t.id === topicoId || t.titulo.trim().toLowerCase() === topicoTituloLower
    );

    let novoTopicoId = topicoOrigem.id;
    if (topicoExistenteNoDestino) {
      novoTopicoId = topicoExistenteNoDestino.id;
    } else {
      const topicoMovido: TopicoClinico = {
        ...topicoOrigem,
        eixoId: destinoEixoId,
      };
      eixos[idxDestino] = {
        ...eixos[idxDestino],
        topicos: [...topicosDestino, topicoMovido],
      };
    }

    this.saveEixos(eixos);

    // Atualiza todos os cards desse tópico para o novo eixo e nova especialidade
    const especialidadeDestino = eixos[idxDestino].especialidade;
    let cards = this.getCards();
    cards = cards.map(c => {
      const matchOrigem = c.eixoId === origemEixoId;
      const matchId = c.topicoId === topicoId;
      const matchTitulo = (
        (c.topicoNome && c.topicoNome.trim().toLowerCase() === topicoTituloLower) ||
        ((c as any).topico && String((c as any).topico).trim().toLowerCase() === topicoTituloLower)
      );

      if (matchOrigem && (matchId || matchTitulo)) {
        return {
          ...c,
          eixoId: destinoEixoId,
          topicoId: novoTopicoId,
          topicoNome: topicoTitulo,
          topico: topicoTitulo,
          especialidade: especialidadeDestino,
        };
      }
      return c;
    });

    this.saveCards(cards);
    this.sincronizarEixos(cards);
    return { cards: this.getCards(), eixos: this.getEixos() };
  },

  // Atualizar um Card específico
  atualizarCard(cardAtualizado: CardClinico): CardClinico[] {
    const cards = this.getCards();
    const index = cards.findIndex(c => c.id === cardAtualizado.id);
    if (index === -1) return cards;
    cards[index] = cardAtualizado;
    this.saveCards(cards);
    this.sincronizarEixos(cards);
    return cards;
  },

  exportarDados(): string {
    const payload = {
      versao: '1.0.0',
      dataExportacao: new Date().toISOString(),
      progresso: this.getProgresso(),
      eixos: this.getEixos(),
      cards: this.getCards(),
    };
    return JSON.stringify(payload, null, 2);
  },

  importarDados(jsonString: string): boolean {
    try {
      const dados = JSON.parse(jsonString);
      if (dados.cards && Array.isArray(dados.cards)) {
        this.saveCards(dados.cards);
      }
      if (dados.eixos && Array.isArray(dados.eixos)) {
        this.saveEixos(dados.eixos);
      }
      if (dados.progresso) {
        this.saveProgresso(dados.progresso);
      }
      return true;
    } catch (e) {
      console.error('Falha ao importar backup', e);
      return false;
    }
  },

  resetarBanco(): void {
    localStorage.removeItem(STORAGE_KEYS.CARDS);
    localStorage.removeItem(STORAGE_KEYS.EIXOS);
    localStorage.removeItem(STORAGE_KEYS.PROGRESSO);
    this.init();
  },

  getExibirDicas(): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.EXIBIR_DICAS);
    if (raw === null) return true; // padrão: dicas ativadas
    return raw === 'true';
  },

  setExibirDicas(habilitado: boolean): void {
    this.safeLocalStorageSet(STORAGE_KEYS.EXIBIR_DICAS, habilitado ? 'true' : 'false');
  },
};
