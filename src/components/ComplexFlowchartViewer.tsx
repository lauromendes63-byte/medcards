import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  GitFork, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  Target, 
  Sparkles, 
  Info, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Sun, 
  Moon, 
  Compass,
  X,
  Clock,
  Lightbulb,
  LayoutGrid,
  Pencil,
  FilePenLine,
  ListTree,
  Stethoscope,
  Layers
} from 'lucide-react';
import { FluxogramaComplexoDados, NoFluxogramaComplexo, RamoFluxogramaComplexo, CardClinico, TopicoClinico } from '../types';
import { StorageService } from '../services/storage';
import { formatarTempoMinutos, obterInfoRodadaCard } from '../utils/timerUtils';
import { EixoEmojiBadge } from './EixoEmojiBadge';
import { FormattedClinicalText } from './FormattedClinicalText';
import { 
  CORES_RAMO, 
  calcularConexaoDinamica, 
  calcularLayoutHierarquicoFluxograma,
  obterDashArraySeta,
  obterStrokeWidthSeta,
  FLOWCHART_THEMES, 
  FlowchartThemeId, 
  getStoredFlowchartTheme, 
  setStoredFlowchartTheme 
} from '../utils/flowchartCurves';

interface ComplexFlowchartViewerProps {
  fluxograma: FluxogramaComplexoDados;
  onRegistrarConclusao?: () => void;
  // Modo de Resolução Imersiva de Flashcard
  initialFullScreen?: boolean;
  onAvaliarRevisao?: (avaliacao: 'errei' | 'dificil' | 'bom' | 'facil') => void;
  onClose?: () => void;
  tituloContexto?: string;
  perolaClinica?: string;
  perguntaGatilho?: string;
  tempoDecorridoSegundos?: number;
  progressoTexto?: string;
  badgeEspecialidade?: string;
  card?: CardClinico;
  topico?: TopicoClinico;
  onEditarCard?: (card: CardClinico) => void;
  onVoltarCard?: () => void;
  onPularCard?: () => void;
  canVoltar?: boolean;
}

export const ComplexFlowchartViewer: React.FC<ComplexFlowchartViewerProps> = ({
  fluxograma,
  onRegistrarConclusao,
  initialFullScreen = false,
  onAvaliarRevisao,
  onClose,
  tituloContexto,
  perolaClinica,
  perguntaGatilho,
  tempoDecorridoSegundos,
  progressoTexto,
  badgeEspecialidade,
  card,
  topico,
  onEditarCard,
  onVoltarCard,
  onPularCard,
  canVoltar = false,
}) => {
  // FIX #9: configTimers em useMemo ao invés de leitura direta no render (evita JSON.parse por re-render)
  const configTimers = useMemo(() => StorageService.getConfiguracaoTimers(), []);
  const infoRodada = useMemo(() => card
    ? obterInfoRodadaCard(card, topico, configTimers)
    : {
        rodada: 1,
        nomeRodada: 'Rodada 1 (Intensivo)',
        timers: configTimers.rodada1,
        ehCustomizadoTopico: false,
      }
  , [card, topico, configTimers]);
  const nosOriginais = Array.isArray(fluxograma?.nos) ? fluxograma.nos : [];
  const noInicialId = fluxograma?.noInicialId || nosOriginais[0]?.id || '';

  // O layout estruturado anti-colisão fica SEMPRE ATIVO por padrão (sem necessidade de ativar manualmente)
  const nos = useMemo(() => {
    if (!nosOriginais || nosOriginais.length === 0) return [];

    return calcularLayoutHierarquicoFluxograma(nosOriginais, noInicialId, {
      cardWidth: 260,
      cardHeight: 160,
      rankSep: 110,
      nodeSep: 100,
      startX: 520,
      startY: 50,
    });
  }, [nosOriginais, noInicialId]);

  // Estado de tela cheia (ocupa viewport total para máxima imersão)
  const [isFullScreen, setIsFullScreen] = useState(initialFullScreen);

  // Estados de navegação do Canvas
  const [zoom, setZoom] = useState(0.65);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [arrastandoCanvas, setArrastandoCanvas] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs síncronas para handlers de alta frequência (evitam closure desatualizado)
  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);
  const contentLayerRef = useRef<HTMLDivElement>(null);

  // Sincroniza refs imediatamente
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  // Feedback visual temporário de zoom durante pinça ou scroll
  const [indicadorZoomVisivel, setIndicadorZoomVisivel] = useState(false);
  const timeoutIndicadorZoomRef = useRef<NodeJS.Timeout | null>(null);

  const mostrarIndicadorZoom = useCallback(() => {
    setIndicadorZoomVisivel(true);
    if (timeoutIndicadorZoomRef.current) {
      clearTimeout(timeoutIndicadorZoomRef.current);
    }
    timeoutIndicadorZoomRef.current = setTimeout(() => {
      setIndicadorZoomVisivel(false);
    }, 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutIndicadorZoomRef.current) {
        clearTimeout(timeoutIndicadorZoomRef.current);
      }
    };
  }, []);

  // Ref de Pan contínuo com precisão absoluta (evita lags, engasgos e acelerações descontroladas)
  const panRef = useRef<{
    ativo: boolean;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
    rafId: number | null;
  }>({
    ativo: false,
    startX: 0,
    startY: 0,
    initialPanX: 20,
    initialPanY: 20,
    rafId: null,
  });

  // Estados do Treino Ativo / Revelação
  // O bloco originário (início) começa SEMPRE revelado!
  const [nosRevelados, setNosRevelados] = useState<Record<string, boolean>>(() => {
    const inicial: Record<string, boolean> = {};
    if (noInicialId) {
      inicial[noInicialId] = true;
    } else if (nos[0]?.id) {
      inicial[nos[0].id] = true;
    }
    return inicial;
  });

  const [noSelecionadoDetalheId, setNoSelecionadoDetalheId] = useState<string | null>(noInicialId || nos[0]?.id || null);
  const [mostrarGavetaDetalhes, setMostrarGavetaDetalhes] = useState(false);
  const [exibirDicas, setExibirDicas] = useState<boolean>(() => StorageService.getExibirDicas());

  const [bannerPerguntaRecolhido, setBannerPerguntaRecolhido] = useState(false);
  const [modoExibicao, setModoExibicao] = useState<'canvas' | 'lista'>('canvas');

  // Resolução da pergunta gatilho clínica (garante que NUNCA fique vazio ou sem pergunta)
  const textoPerguntaResolvido = useMemo(() => {
    if (perguntaGatilho && perguntaGatilho.trim()) return perguntaGatilho.trim();
    if (card?.perguntaGatilho && card.perguntaGatilho.trim()) return card.perguntaGatilho.trim();
    if ((card as any)?.pergunta && (card as any).pergunta.trim() && !(card as any).pergunta.startsWith('Navegue pelo algoritmo')) {
      return (card as any).pergunta.trim();
    }
    if (fluxograma?.descricao && fluxograma.descricao.trim()) return fluxograma.descricao.trim();
    return 'Deduza o algoritmo clínico e determine os desdobramentos e condutas a cada etapa:';
  }, [perguntaGatilho, card, fluxograma?.descricao]);

  // Sanitiza o texto da pergunta removendo jargões robóticos e comandos prolixos
  const textoPerguntaFormatado = useMemo(() => {
    let txt = textoPerguntaResolvido.trim();
    txt = txt.replace(/^(reconstrua|determine|analise|navegue pelo|complete|identifique)\s+o\s+algoritmo\s+(de\s+decisão\s+)?(propedêutica\s+)?(clínica\s+)?(por\s+imagem\s+)?frente\s+a\s+(um\s+)?paciente\s+com\s+/i, 'Paciente com ');
    txt = txt.replace(/^(reconstrua|navegue pelo|deduza|determine)\s+o\s+algoritmo\s+(clínico\s+e\s+determine\s+os\s+desdobramentos.*?:?)/i, 'Qual a conduta e desdobramento clínico indicado a cada etapa?');
    return txt;
  }, [textoPerguntaResolvido]);

  // Lista ordenada topologicamente a partir do noInicial para o modo Trilha Cascata
  const nosOrdenadosTrilha = useMemo(() => {
    if (!nos || nos.length === 0) return [];
    const resultado: NoFluxogramaComplexo[] = [];
    const visitados = new Set<string>();
    const fila: string[] = [];

    if (noInicialId) fila.push(noInicialId);
    else if (nos[0]) fila.push(nos[0].id);

    while (fila.length > 0) {
      const atualId = fila.shift()!;
      if (visitados.has(atualId)) continue;
      visitados.add(atualId);
      const no = nos.find(n => n.id === atualId);
      if (no) {
        resultado.push(no);
        if (Array.isArray(no.ramos)) {
          for (const ramo of no.ramos) {
            if (ramo.destinoNoId && !visitados.has(ramo.destinoNoId) && !fila.includes(ramo.destinoNoId)) {
              fila.push(ramo.destinoNoId);
            }
          }
        }
      }
    }

    for (const no of nos) {
      if (!visitados.has(no.id)) {
        resultado.push(no);
      }
    }

    return resultado;
  }, [nos, noInicialId]);

  const handleToggleExibirDicas = () => {
    setExibirDicas(prev => {
      const novo = !prev;
      StorageService.setExibirDicas(novo);
      return novo;
    });
  };

  // Redefinir quando o fluxograma mudar (ex: navegando entre cards numa sessão de revisão)
  useEffect(() => {
    const inicial: Record<string, boolean> = {};
    const root = fluxograma?.noInicialId || (fluxograma?.nos && fluxograma.nos[0]?.id) || '';
    if (root) inicial[root] = true;
    setNosRevelados(inicial);
    setNoSelecionadoDetalheId(root);
    setMostrarGavetaDetalhes(false);
    concluiuRef.current = false;
    jaCentralizouInicialmente.current = false;
  }, [fluxograma?.id, fluxograma?.noInicialId]);

  // Trilha ativa de decisões médicas (Pathfinder breadcrumb)
  const trilhaDecisao = useMemo(() => {
    if (!noSelecionadoDetalheId || nos.length === 0) return [];
    const caminho: { no: NoFluxogramaComplexo; ramoEntrada?: RamoFluxogramaComplexo }[] = [];
    let atualId: string | null = noSelecionadoDetalheId;
    const visitados = new Set<string>();

    while (atualId && !visitados.has(atualId)) {
      visitados.add(atualId);
      const noAtual = nos.find(n => n.id === atualId);
      if (!noAtual) break;

      let paiEncontrado: NoFluxogramaComplexo | undefined;
      let ramoEncontrado: RamoFluxogramaComplexo | undefined;

      for (const n of nos) {
        const r = n.ramos?.find(ramo => ramo.destinoNoId === atualId);
        if (r) {
          paiEncontrado = n;
          ramoEncontrado = r;
          break;
        }
      }

      caminho.unshift({ no: noAtual, ramoEntrada: ramoEncontrado });
      atualId = paiEncontrado ? paiEncontrado.id : null;
    }

    return caminho;
  }, [noSelecionadoDetalheId, nos]);

  // Tema visual dinâmico do Canvas (Dark, Light Confortável, Blueprint Moderno)
  const [themeId, setThemeId] = useState<FlowchartThemeId>(getStoredFlowchartTheme);
  const currentTheme = FLOWCHART_THEMES[themeId] || FLOWCHART_THEMES.dark;

  const handleTrocarTema = (novoTema: FlowchartThemeId) => {
    setThemeId(novoTema);
    setStoredFlowchartTheme(novoTema);
  };

  // Ciclo rápido de tema em 1 único botão compacto (Light -> Dark -> Blueprint)
  const ciclarTema = () => {
    const temas: FlowchartThemeId[] = ['light', 'dark', 'blueprint'];
    const proximo = temas[(temas.indexOf(themeId) + 1) % temas.length];
    handleTrocarTema(proximo);
  };

  // Efeito de centralização automática inicial apenas uma vez ao montar
  const jaCentralizouInicialmente = useRef(false);

  const centralizarNoOrigem = useCallback(() => {
    const raiz = nos.find(n => n.id === noInicialId) || nos[0];
    if (!raiz || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasW = rect.width || 800;
    const canvasH = rect.height || 560;

    const currentZoom = zoomRef.current;
    const isMobile = window.innerWidth < 640;
    const zoomEfetivo = isMobile ? Math.min(currentZoom, 0.58) : currentZoom;

    const raizCentroX = (raiz.posicaoX ?? 520) + 120;
    const raizCentroY = (raiz.posicaoY ?? 50) + 55;

    // Centraliza perfeitamente no eixo X e posiciona no terço superior no eixo Y
    const novoPanX = Math.round(canvasW / 2 - raizCentroX * zoomEfetivo);
    const novoPanY = Math.round((isMobile ? canvasH * 0.22 : canvasH / 3) - raizCentroY * zoomEfetivo);

    setPanOffset({ x: novoPanX, y: novoPanY });
    panOffsetRef.current = { x: novoPanX, y: novoPanY };
    panRef.current.initialPanX = novoPanX;
    panRef.current.initialPanY = novoPanY;
  }, [noInicialId, nos]);

  useEffect(() => {
    if (!jaCentralizouInicialmente.current && nos.length > 0) {
      if (window.innerWidth < 640) {
        setZoom(0.55);
      }
      const timer = setTimeout(() => {
        centralizarNoOrigem();
        jaCentralizouInicialmente.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nos, centralizarNoOrigem]);

  // Recalcula centralização ao alternar tela cheia
  useEffect(() => {
    const timer = setTimeout(() => {
      centralizarNoOrigem();
    }, 100);
    return () => clearTimeout(timer);
  }, [isFullScreen, centralizarNoOrigem]);

  // Listeners nativos de Touch para suporte fluido a gesto de pinça (Pinch to Zoom) e Pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isPinching = false;
    let wasPinching = false;
    let isTouchPanning = false;
    let lastPinchDist = 0;
    let lastFocalX = 0;
    let lastFocalY = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let initialTouchPanX = 0;
    let initialTouchPanY = 0;
    let rafId: number | null = null;
    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };

    const updateTransformDirect = (panX: number, panY: number, currentZoom: number) => {
      if (contentLayerRef.current) {
        contentLayerRef.current.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${currentZoom})`;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Gesto de Pinça com 2 dedos
        e.preventDefault();
        isPinching = true;
        wasPinching = true;
        isTouchPanning = false;
        setArrastandoCanvas(true);

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        lastFocalX = (t1.clientX + t2.clientX) / 2 - rect.left;
        lastFocalY = (t1.clientY + t2.clientY) / 2 - rect.top;
        lastPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        mostrarIndicadorZoom();
      } else if (e.touches.length === 1) {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('[data-no-id]') || target.closest('button');

        isPinching = false;
        wasPinching = false;
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        initialTouchPanX = panOffsetRef.current.x;
        initialTouchPanY = panOffsetRef.current.y;

        if (!isInteractive) {
          isTouchPanning = true;
          setArrastandoCanvas(true);

          // Detecção de Toque Duplo no fundo do canvas para centralizar
          const now = Date.now();
          const distFromLastTap = Math.hypot(t.clientX - lastTapPos.x, t.clientY - lastTapPos.y);
          if (now - lastTapTime < 300 && distFromLastTap < 30) {
            centralizarNoOrigem();
            lastTapTime = 0;
          } else {
            lastTapTime = now;
            lastTapPos = { x: t.clientX, y: t.clientY };
          }
        } else {
          isTouchPanning = false;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Movimento de Pinça Multi-touch: Ponto focal ancorado continuamente sem derivação
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        const currFocalX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const currFocalY = (t1.clientY + t2.clientY) / 2 - rect.top;
        const currDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        if (lastPinchDist > 0 && currDist > 0) {
          const scaleFactor = currDist / lastPinchDist;
          const prevZoom = zoomRef.current;
          const prevPan = panOffsetRef.current;

          // Limite seguro de zoom (25% até 220%)
          const nextZoom = Math.max(0.25, Math.min(2.2, prevZoom * scaleFactor));

          // Ponto no espaço do diagrama sob o centro dos dedos antes do zoom
          const worldX = (currFocalX - prevPan.x) / prevZoom;
          const worldY = (currFocalY - prevPan.y) / prevZoom;

          // Deslocamento que garante que o ponto focal permaneça 100% ancorado sob os dedos
          const nextPanX = currFocalX - worldX * nextZoom;
          const nextPanY = currFocalY - worldY * nextZoom;

          // Atualiza referências imediatamente em memória
          zoomRef.current = nextZoom;
          panOffsetRef.current = { x: nextPanX, y: nextPanY };
          lastPinchDist = currDist;
          lastFocalX = currFocalX;
          lastFocalY = currFocalY;

          // Atualização visual imediata
          updateTransformDirect(nextPanX, nextPanY, nextZoom);

          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            setZoom(Number(nextZoom.toFixed(3)));
            setPanOffset({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
          });

          mostrarIndicadorZoom();
        } else {
          lastPinchDist = currDist;
          lastFocalX = currFocalX;
          lastFocalY = currFocalY;
        }
      } else if (e.touches.length === 1 && isTouchPanning && !wasPinching) {
        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;

        e.preventDefault();
        const nextPanX = initialTouchPanX + dx;
        const nextPanY = initialTouchPanY + dy;

        panOffsetRef.current = { x: nextPanX, y: nextPanY };
        updateTransformDirect(nextPanX, nextPanY, zoomRef.current);

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setPanOffset({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        lastFocalX = (t1.clientX + t2.clientX) / 2 - rect.left;
        lastFocalY = (t1.clientY + t2.clientY) / 2 - rect.top;
        lastPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      } else if (e.touches.length === 1) {
        if (isPinching || wasPinching) {
          isPinching = false;
          isTouchPanning = false;
          lastPinchDist = 0;
        } else {
          isTouchPanning = true;
          const t = e.touches[0];
          touchStartX = t.clientX;
          touchStartY = t.clientY;
          initialTouchPanX = panOffsetRef.current.x;
          initialTouchPanY = panOffsetRef.current.y;
        }
      } else {
        isPinching = false;
        wasPinching = false;
        isTouchPanning = false;
        lastPinchDist = 0;
        setArrastandoCanvas(false);
        setZoom(Number(zoomRef.current.toFixed(3)));
        setPanOffset({ x: Math.round(panOffsetRef.current.x), y: Math.round(panOffsetRef.current.y) });
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const currentPan = panOffsetRef.current;
      const zoomFactor = e.ctrlKey ? Math.exp(-e.deltaY * 0.01) : Math.exp(-e.deltaY * 0.0015);
      const nextZoom = Math.max(0.25, Math.min(2.2, currentZoom * zoomFactor));

      const worldX = (mouseX - currentPan.x) / currentZoom;
      const worldY = (mouseY - currentPan.y) / currentZoom;

      const nextPanX = mouseX - worldX * nextZoom;
      const nextPanY = mouseY - worldY * nextZoom;

      zoomRef.current = nextZoom;
      panOffsetRef.current = { x: nextPanX, y: nextPanY };

      updateTransformDirect(nextPanX, nextPanY, nextZoom);

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setZoom(Number(nextZoom.toFixed(3)));
        setPanOffset({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
      });

      mostrarIndicadorZoom();
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [isFullScreen, centralizarNoOrigem]);

  // Handlers de Pan Ultrassuave com Pointer Events (Mouse Desktop) & RequestAnimationFrame
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Se for evento de toque, é tratado exclusivamente pelos listeners nativos multi-touch
    if (e.pointerType === 'touch') return;

    // Ignora se clicou em um nó ou elemento clicável
    if ((e.target as HTMLElement).closest('[data-no-id]') || (e.target as HTMLElement).closest('button')) {
      return;
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    setArrastandoCanvas(true);
    panRef.current = {
      ativo: true,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffsetRef.current.x,
      initialPanY: panOffsetRef.current.y,
      rafId: null,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!panRef.current.ativo) return;

    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;

    const nextPanX = Math.round(panRef.current.initialPanX + dx);
    const nextPanY = Math.round(panRef.current.initialPanY + dy);

    panOffsetRef.current = { x: nextPanX, y: nextPanY };

    if (contentLayerRef.current) {
      contentLayerRef.current.style.transform = `translate3d(${nextPanX}px, ${nextPanY}px, 0) scale(${zoomRef.current})`;
    }

    if (panRef.current.rafId) {
      cancelAnimationFrame(panRef.current.rafId);
    }

    panRef.current.rafId = requestAnimationFrame(() => {
      setPanOffset({ x: nextPanX, y: nextPanY });
    });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (panRef.current.ativo) {
      panRef.current.ativo = false;
      if (panRef.current.rafId) {
        cancelAnimationFrame(panRef.current.rafId);
      }
      setArrastandoCanvas(false);
      setPanOffset({ x: panOffsetRef.current.x, y: panOffsetRef.current.y });
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Revelação interativa ao clicar em um nó
  const handleRevelarNo = (noId: string) => {
    setNosRevelados(prev => {
      const novo = { ...prev, [noId]: true };
      return novo;
    });
    setNoSelecionadoDetalheId(noId);
  };

  // Revelação de Próximo Passo Sequencial (Estilo Flashcard de Fluxograma Passo a Passo)
  const handleRevelarProximoPasso = () => {
    // 1. Achar todos os nós já revelados
    const idsRevelados = Object.keys(nosRevelados).filter(k => nosRevelados[k]);
    
    // 2. Procurar nos ramos que saem dos nós revelados se há algum destino ainda não revelado
    let proximoNoId: string | null = null;
    for (const idRev of idsRevelados) {
      const noOrigem = nos.find(n => n.id === idRev);
      if (noOrigem && Array.isArray(noOrigem.ramos)) {
        for (const ramo of noOrigem.ramos) {
          if (ramo.destinoNoId && !nosRevelados[ramo.destinoNoId]) {
            proximoNoId = ramo.destinoNoId;
            break;
          }
        }
      }
      if (proximoNoId) break;
    }

    // 3. Fallback: se não encontrou via ramo direto, pega o próximo nó pendente na lista
    if (!proximoNoId) {
      const proximo = nos.find(n => !nosRevelados[n.id]);
      if (proximo) proximoNoId = proximo.id;
    }

    if (proximoNoId) {
      handleRevelarNo(proximoNoId);
      const noAlvo = nos.find(n => n.id === proximoNoId);
      if (noAlvo && canvasRef.current) {
        // Suavemente centraliza no nó revelado
        const rect = canvasRef.current.getBoundingClientRect();
        const canvasW = rect.width || 800;
        const canvasH = rect.height || 560;
        const noCentroX = (noAlvo.posicaoX ?? 520) + 120;
        const noCentroY = (noAlvo.posicaoY ?? 50) + 55;
        const novoPanX = Math.round(canvasW / 2 - noCentroX * zoom);
        const novoPanY = Math.round(canvasH / 2.5 - noCentroY * zoom);
        setPanOffset({ x: novoPanX, y: novoPanY });
        panRef.current.initialPanX = novoPanX;
        panRef.current.initialPanY = novoPanY;
      }
    }
  };

  const handleRevelarTodos = () => {
    const todos: Record<string, boolean> = {};
    nos.forEach(n => { todos[n.id] = true; });
    setNosRevelados(todos);
  };

  const handleReiniciarDesafio = () => {
    const apenasInicial: Record<string, boolean> = {};
    if (noInicialId) apenasInicial[noInicialId] = true;
    else if (nos[0]?.id) apenasInicial[nos[0].id] = true;
    setNosRevelados(apenasInicial);
    setNoSelecionadoDetalheId(noInicialId || nos[0]?.id || null);
    centralizarNoOrigem();
  };

  if (nos.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
        Nenhum bloco de fluxograma disponível neste card.
      </div>
    );
  }

  const noSelecionadoObj = nos.find(n => n.id === noSelecionadoDetalheId);
  const totalNos = nos.length;
  const nosReveladosCount = Object.keys(nosRevelados).filter(k => nosRevelados[k]).length;
  const todosCompletos = totalNos > 0 && nosReveladosCount >= totalNos;

  // Notifica automaticamente a conclusão quando todos os passos/nós forem revelados
  const concluiuRef = useRef(false);
  useEffect(() => {
    if (todosCompletos && !concluiuRef.current) {
      concluiuRef.current = true;
      if (onRegistrarConclusao) {
        onRegistrarConclusao();
      }
    } else if (!todosCompletos) {
      concluiuRef.current = false;
    }
  }, [todosCompletos, onRegistrarConclusao]);

  // Tecla Escape para sair de tela cheia com facilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  return (
    <div 
      ref={containerRef}
      className={`w-full transition-all select-none ${
        isFullScreen 
          ? 'fixed inset-0 z-50 w-screen h-screen flex flex-col p-1 sm:p-2.5 overflow-hidden select-none' 
          : 'relative space-y-2'
      }`}
      style={{
        backgroundColor: isFullScreen ? currentTheme.canvasBg : undefined
      }}
    >
      {/* =================================================================== */}
      {/* BARRA SUPERIOR DE CONTROLES FLUIDOS E DISCRETOS                     */}
      {/* =================================================================== */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs shadow-xs transition-colors shrink-0 ${
        currentTheme.id === 'dark'
          ? 'bg-slate-900/95 border-slate-800 text-white'
          : currentTheme.id === 'blueprint'
          ? 'bg-sky-950/95 border-sky-900 text-sky-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        {/* Linha 1: Identificação, progresso e botão fechar se aplicável */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Encerrar sessão"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-slate-200/80 dark:border-slate-700 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <GitFork className="w-3.5 h-3.5" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {(onVoltarCard || onPularCard) && (
                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300/80 dark:border-slate-700 shrink-0">
                  {onVoltarCard && (
                    <button
                      type="button"
                      onClick={onVoltarCard}
                      disabled={!canVoltar}
                      title={!canVoltar ? "Primeiro flashcard da sessão" : "Voltar ao flashcard anterior (←)"}
                      className={`p-1 rounded flex items-center transition-all ${
                        !canVoltar
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 active:scale-95 cursor-pointer shadow-3xs'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />
                  {onPularCard && (
                    <button
                      type="button"
                      onClick={onPularCard}
                      title="Pular para o próximo flashcard (→)"
                      className="p-1 rounded flex items-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 active:scale-95 cursor-pointer transition-all shadow-3xs"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              {progressoTexto && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0">
                  {progressoTexto}
                </span>
              )}
              {(badgeEspecialidade || card) && (
                <EixoEmojiBadge card={card} especialidade={badgeEspecialidade} size="sm" />
              )}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <h4 
                  title={tituloContexto || fluxograma.titulo || 'Árvore de Decisão'}
                  className={`text-xs font-bold leading-snug line-clamp-1 sm:line-clamp-2 min-w-0 flex-1 break-words ${currentTheme.id === 'light' ? 'text-slate-900' : 'text-slate-100'}`}
                >
                  {tituloContexto || fluxograma.titulo || 'Árvore de Decisão'}
                </h4>
              </div>
            </div>
          </div>

          {/* Status do lado direito no mobile (Cronômetro + Resolvido) */}
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            {tempoDecorridoSegundos !== undefined && (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {Math.floor(tempoDecorridoSegundos / 60).toString().padStart(2, '0')}:
                  {(tempoDecorridoSegundos % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {nosReveladosCount}/{totalNos}
            </span>
          </div>
        </div>

        {/* Linha 2 (ou Direita): Controles Rápidos compactos e acessíveis */}
        <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 shrink-0 overflow-x-auto py-0.5">
          {/* Status no desktop */}
          <div className="hidden sm:flex items-center gap-2 mr-1">
            <span className={`text-[10px] ${currentTheme.id === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Resolvido: <strong className="text-emerald-500 font-bold">{nosReveladosCount}</strong>/{totalNos}
            </span>
            {tempoDecorridoSegundos !== undefined && (
              <div className={`flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                currentTheme.id === 'light'
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {Math.floor(tempoDecorridoSegundos / 60).toString().padStart(2, '0')}:
                  {(tempoDecorridoSegundos % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Alternância Trilha Linear vs Canvas */}
          <button
            type="button"
            onClick={() => setModoExibicao(prev => prev === 'canvas' ? 'lista' : 'canvas')}
            title={modoExibicao === 'canvas' ? "Ver em Trilha Sequencial (cascata limpa sem sobreposição)" : "Ver em Canvas Interativo 2D"}
            className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10.5px] cursor-pointer active:scale-95 transition-all shrink-0 ${
              modoExibicao === 'lista'
                ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                : currentTheme.id === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {modoExibicao === 'canvas' ? (
              <>
                <ListTree className="w-3 h-3 text-emerald-500" />
                <span className="hidden sm:inline">Modo Trilha</span>
                <span className="sm:hidden">Trilha</span>
              </>
            ) : (
              <>
                <GitFork className="w-3 h-3 text-blue-400" />
                <span className="hidden sm:inline">Modo Canvas</span>
                <span className="sm:hidden">Canvas</span>
              </>
            )}
          </button>

          {/* Próximo Passo */}
          {!todosCompletos && (
            <button
              type="button"
              onClick={handleRevelarProximoPasso}
              title="Revelar o próximo passo do algoritmo clínico"
              className="flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Próximo Passo</span>
            </button>
          )}

          {/* Centralizar Início */}
          <button
            type="button"
            onClick={centralizarNoOrigem}
            title="Focar no Bloco Originário (Início)"
            className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10.5px] cursor-pointer active:scale-95 transition-all shrink-0 ${
              currentTheme.id === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700'
            }`}
          >
            <Target className="w-3 h-3 text-blue-500" />
            <span className="hidden md:inline">Início</span>
          </button>

          {/* Alternar Revelar Tudo / Reiniciar */}
          {nosReveladosCount < totalNos ? (
            <button
              type="button"
              onClick={handleRevelarTodos}
              title="Revelar toda a árvore"
              className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all shrink-0 ${
                currentTheme.id === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden md:inline">Tudo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReiniciarDesafio}
              title="Reiniciar Desafio"
              className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all shrink-0 ${
                currentTheme.id === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <RotateCcw className="w-3 h-3 text-amber-500" />
              <span className="hidden md:inline">Reiniciar</span>
            </button>
          )}

          {/* Botão de Dicas ON/OFF */}
          <button
            type="button"
            onClick={handleToggleExibirDicas}
            title={exibirDicas ? "Dicas ativadas (clique para ocultar 100% das dicas)" : "Dicas 100% ocultas (clique para exibir)"}
            className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all shrink-0 ${
              exibirDicas
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                : currentTheme.id === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300 line-through'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-500 border border-slate-700 line-through'
            }`}
          >
            <Lightbulb className={`w-3 h-3 ${exibirDicas ? 'text-amber-500 fill-amber-400' : 'text-slate-500'}`} />
            <span className="hidden md:inline">{exibirDicas ? 'Dicas: ON' : 'Dicas: OFF'}</span>
            <span className="md:hidden">{exibirDicas ? 'Dica' : 'S/Dica'}</span>
          </button>

          {/* Botão de Edição Rápida */}
          {onEditarCard && card && (
            <button
              type="button"
              onClick={() => onEditarCard(card)}
              title="Editar este flashcard"
              className="flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-all shrink-0 active:scale-95 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:border-emerald-300 shadow-3xs"
            >
              <FilePenLine className="w-3 h-3 text-emerald-600" />
              <span>Editar</span>
            </button>
          )}

          {/* Ciclar Tema (1 único botão compacto para alternar Claro / Escuro / Blueprint) */}
          <button
            type="button"
            onClick={ciclarTema}
            title={`Tema: ${themeId}. Toque para alternar`}
            className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all shrink-0 ${
              themeId === 'light'
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                : themeId === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-sky-900 hover:bg-sky-800 text-sky-200 border border-sky-800'
            }`}
          >
            {themeId === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> :
             themeId === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> :
             <Compass className="w-3.5 h-3.5 text-sky-400" />}
            <span className="hidden lg:inline capitalize">{themeId}</span>
          </button>

          {/* Tela Cheia Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen(prev => !prev)}
            title={isFullScreen ? "Restaurar visualização normal (Esc)" : "Expandir para Tela Cheia"}
            className={`flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10.5px] cursor-pointer transition-all active:scale-95 shadow-2xs shrink-0 ${
              isFullScreen
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/50'
                : currentTheme.id === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Restaurar</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BANNER CLÍNICO: CENÁRIO & PERGUNTA GATILHO                          */}
      {/* =================================================================== */}
      {/* =================================================================== */}
      {/* BANNER CLÍNICO COMPACTO: CENÁRIO & DESAFIO (SEM POLUIÇÃO VISUAL)    */}
      {/* =================================================================== */}
      <div className={`w-full rounded-xl sm:rounded-2xl border transition-all shrink-0 px-2.5 py-1.5 sm:px-3 sm:py-2 ${
        currentTheme.id === 'light'
          ? 'bg-emerald-50/90 border-emerald-200/90 text-slate-900 shadow-3xs'
          : currentTheme.id === 'blueprint'
          ? 'bg-sky-950/80 border-sky-800 text-sky-100 shadow-md'
          : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-md'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1 ${
              currentTheme.id === 'light'
                ? 'bg-emerald-200/90 text-emerald-950'
                : 'bg-emerald-900/70 text-emerald-300'
            }`}>
              <Stethoscope className="w-3 h-3" />
              <span>Desafio</span>
            </span>
            <div className={`text-[11.5px] sm:text-xs font-semibold truncate flex-1 ${
              currentTheme.id === 'light' ? 'text-slate-800' : 'text-slate-200'
            }`}>
              {bannerPerguntaRecolhido ? (
                <span className="truncate">{tituloContexto || fluxograma.titulo || textoPerguntaFormatado}</span>
              ) : (
                <span className="line-clamp-1 sm:line-clamp-2 leading-snug">{textoPerguntaFormatado}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setBannerPerguntaRecolhido(prev => !prev)}
            title={bannerPerguntaRecolhido ? "Expandir pergunta clínica" : "Recolher"}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
          >
            {bannerPerguntaRecolhido ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* TRILHA DECISÓRIA ATIVA (SOMENTE NO CANVAS - EVITA POLUIÇÃO NO MODO TRILHA) */}
      {modoExibicao === 'canvas' && trilhaDecisao.length > 0 && (
        <div className={`px-3 py-1 rounded-xl border text-[10.5px] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap shadow-3xs shrink-0 ${
          currentTheme.id === 'dark'
            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
            : currentTheme.id === 'blueprint'
            ? 'bg-sky-950/90 border-sky-900 text-sky-200'
            : 'bg-white/95 border-slate-200 text-slate-700 shadow-2xs'
        }`}>
          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Trilha:</span>
          </span>

          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto">
            {trilhaDecisao.map((step, idx) => {
              const ehUltimo = idx === trilhaDecisao.length - 1;
              return (
                <React.Fragment key={step.no.id}>
                  {step.ramoEntrada && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 shrink-0">
                      {step.ramoEntrada.rotulo} →
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setNoSelecionadoDetalheId(step.no.id);
                      if (!nosRevelados[step.no.id]) handleRevelarNo(step.no.id);
                    }}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer truncate max-w-[150px] shrink-0 ${
                      ehUltimo
                        ? 'bg-emerald-600 text-white shadow-2xs font-black ring-1 ring-emerald-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {step.no.titulo || `Etapa #${idx + 1}`}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VISUALIZAÇÃO CONDICIONAL: MODO TRILHA CASCATA OU CANVAS 2D          */}
      {/* =================================================================== */}
      {modoExibicao === 'lista' ? (
        <div 
          className={`flex-1 w-full min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-4 space-y-3 pb-36 touch-pan-y ${
            currentTheme.id === 'light'
              ? 'bg-slate-50/70 border-slate-200 text-slate-900'
              : currentTheme.id === 'blueprint'
              ? 'bg-sky-950/40 border-sky-900 text-sky-100'
              : 'bg-slate-900/60 border-slate-800 text-slate-100'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {nosOrdenadosTrilha.map((no, idx) => {
            const isInicial = no.id === noInicialId;
            const isRevelado = !!nosRevelados[no.id];
            const isSelecionado = no.id === noSelecionadoDetalheId;

            // Ramos que chegam neste nó
            const ramosEntrada = nos.flatMap(n => n.ramos).filter(r => r.destinoNoId === no.id);

            return (
              <div key={no.id} className="relative flex flex-col items-center w-full" style={{ touchAction: 'pan-y' }}>
                {/* Conector e Critério vindo do passo anterior */}
                {idx > 0 && (
                  <div className="flex flex-col items-center my-1 w-full max-w-md pointer-events-none">
                    <div className="w-0.5 h-2.5 bg-emerald-500/40" />
                    {ramosEntrada.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center py-0.5">
                        {ramosEntrada.map(r => (
                          <span
                            key={r.id}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-3xs"
                          >
                            ↓ {r.rotulo}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">↓ Próxima Etapa</span>
                    )}
                    <div className="w-0.5 h-2.5 bg-emerald-500/40" />
                  </div>
                )}

                {/* Card do Passo Clínico */}
                <div
                  onClick={() => {
                    if (!isRevelado) {
                      handleRevelarNo(no.id);
                    } else {
                      setNoSelecionadoDetalheId(no.id);
                    }
                  }}
                  style={{ touchAction: 'pan-y' }}
                  className={`w-full max-w-lg p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs ${
                    !isRevelado
                      ? `${currentTheme.hiddenCardBgClass} border-dashed ${currentTheme.hiddenCardBorderClass} shadow-md active:scale-98`
                      : `${currentTheme.cardBgClass} ${
                          isSelecionado
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                            : isInicial
                            ? 'border-amber-400 ring-1 ring-amber-400/30 shadow-md'
                            : `${currentTheme.cardBorderClass} shadow-xs`
                        }`
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isInicial
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : no.tipo === 'inicio' ? 'bg-blue-900/80 text-blue-300' :
                            no.tipo === 'alerta' ? 'bg-rose-900/80 text-rose-300' :
                            no.tipo === 'decisao' ? 'bg-amber-900/80 text-amber-300' :
                            no.tipo === 'diagnostico' ? 'bg-purple-900/80 text-purple-300' :
                            'bg-emerald-900/80 text-emerald-300'
                      }`}>
                        {isInicial ? '★ Bloco Originário' : `Passo ${idx + 1} • ${no.tipo}`}
                      </span>
                    </div>

                    {!isRevelado ? (
                      <span className="flex items-center gap-1 text-[9.5px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                        <HelpCircle className="w-3 h-3" />
                        Ocluso
                      </span>
                    ) : (
                      <span className="text-[9.5px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Revelado
                      </span>
                    )}
                  </div>

                  {!isRevelado ? (
                    <div className="pt-2 text-center space-y-1.5">
                      <p className={`text-xs font-bold ${currentTheme.hiddenCardTitleClass}`}>
                        {exibirDicas && no.dica ? `Dica: ${no.dica}` : 'Qual a conduta ou evento neste ponto?'}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevelarNo(no.id);
                        }}
                        className={`px-3 py-1 rounded-lg ${currentTheme.hiddenCardButtonClass} font-black text-xs shadow-sm cursor-pointer active:scale-95`}
                      >
                        Toque para Revelar
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 space-y-1.5 text-left">
                      <h5 className={`text-xs sm:text-[13px] font-bold ${currentTheme.cardTitleClass}`}>
                        {no.titulo || '(Etapa sem título)'}
                      </h5>
                      {no.descricao && (
                        <div className={`text-[11px] sm:text-xs leading-relaxed ${currentTheme.cardDescClass}`}>
                          <FormattedClinicalText text={no.descricao} />
                        </div>
                      )}
                      {no.ramos.length > 0 && (
                        <div className="pt-1.5 flex items-center gap-1.5 flex-wrap border-t border-slate-200/60 dark:border-slate-800/60 text-[10px]">
                          <span className="opacity-70 font-semibold">Desdobramentos:</span>
                          {no.ramos.map(r => (
                            <span key={r.id} className="px-2 py-0.5 rounded-full font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              ➔ {r.rotulo}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CANVAS GRÁFICO INTERATIVO DE RESOLUÇÃO (ULTRASSUAVE A 60/120 FPS) */
        <div 
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
        className={`relative w-full rounded-xl sm:rounded-2xl overflow-hidden border shadow-inner select-none cursor-grab active:cursor-grabbing transition-all ${
          currentTheme.canvasBorderClass
        } ${
          isFullScreen ? 'flex-1 h-full w-full min-h-0' : 'h-[520px] sm:h-[620px]'
        }`}
        style={{
          backgroundImage: `radial-gradient(${currentTheme.gridDotColor} 1.15px, transparent 1.15px)`,
          backgroundSize: currentTheme.gridSize,
          backgroundColor: currentTheme.canvasBg,
          touchAction: 'none',
          overscrollBehavior: 'contain',
        }}
      >

        {/* Camada Móvel e Transformável com Pan e Zoom Ultrafluidos */}
        <div
          ref={contentLayerRef}
          className="absolute inset-0"
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '3200px',
            height: '2600px',
            willChange: arrastandoCanvas ? 'transform' : 'auto',
          }}
        >
          {/* SVG com as Conexões e Setas Multidirecionais */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {CORES_RAMO.map(c => (
                <marker
                  key={c.id}
                  id={`view-seta-${c.id}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={c.hex} strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              ))}
            </defs>

            {nos.map(origem => {
              const ox = origem.posicaoX ?? 50;
              const oy = origem.posicaoY ?? 50;
              const origemRevelada = !!nosRevelados[origem.id];

              return origem.ramos.map((ramo, ramoIdx) => {
                const destino = nos.find(n => n.id === ramo.destinoNoId);
                if (!destino) return null;

                const dx = destino.posicaoX ?? 50;
                const dy = destino.posicaoY ?? 50;

                // O usuário pediu expressamente:
                // "o primeiro quadrado sempre revelado e as setas que saem desse quadrado sempre estarem reveladas também"
                // "é a seta que vai fazer a gente adivinhar qual é o próximo tapa daquele fluxograma"
                // Logo, a seta que sai de um nó revelado SEMPRE aparece para guiar a dedução clínica!
                if (!origemRevelada) return null;

                const ramosEntrandoDestino = nos.flatMap(n => n.ramos).filter(r => r.destinoNoId === destino.id);
                const entradaIdx = ramosEntrandoDestino.findIndex(r => r.id === ramo.id);
                const totalEntradas = ramosEntrandoDestino.length;

                const conexao = calcularConexaoDinamica(
                  ox,
                  oy,
                  dx,
                  dy,
                  260,
                  160,
                  ramoIdx,
                  origem.ramos.length,
                  entradaIdx >= 0 ? entradaIdx : 0,
                  totalEntradas
                );
                const corObj = CORES_RAMO.find(c => c.id === ramo.cor) || CORES_RAMO[0];
                const destinoRevelado = !!nosRevelados[destino.id];

                return (
                  <g key={ramo.id} className="pointer-events-auto">
                    {/* Linha da Seta com curvatura consistente e pontas arredondadas */}
                    <path
                      d={conexao.pathData}
                      fill="none"
                      stroke={corObj.hex}
                      strokeWidth={obterStrokeWidthSeta(ramo.espessura)}
                      strokeDasharray={destinoRevelado ? obterDashArraySeta(ramo.estilo) : (obterDashArraySeta(ramo.estilo) !== 'none' ? obterDashArraySeta(ramo.estilo) : '5,4')}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      markerEnd={`url(#view-seta-${ramo.cor || 'verde'})`}
                      className="transition-all"
                    />
                  </g>
                );
              });
            })}
          </svg>

          {/* Camada de Rótulos de Conexão com Quebra de Linha Automática (Multiline / Sem Truncamento) */}
          {nos.map(origem => {
            const ox = origem.posicaoX ?? 50;
            const oy = origem.posicaoY ?? 50;
            const origemRevelada = !!nosRevelados[origem.id];
            if (!origemRevelada) return null;

            return origem.ramos.map((ramo, ramoIdx) => {
              const destino = nos.find(n => n.id === ramo.destinoNoId);
              if (!destino) return null;

              const dx = destino.posicaoX ?? 50;
              const dy = destino.posicaoY ?? 50;

              const ramosEntrandoDestino = nos.flatMap(n => n.ramos).filter(r => r.destinoNoId === destino.id);
              const entradaIdx = ramosEntrandoDestino.findIndex(r => r.id === ramo.id);
              const totalEntradas = ramosEntrandoDestino.length;

              const conexao = calcularConexaoDinamica(
                ox,
                oy,
                dx,
                dy,
                260,
                160,
                ramoIdx,
                origem.ramos.length,
                entradaIdx >= 0 ? entradaIdx : 0,
                totalEntradas
              );
              const corObj = CORES_RAMO.find(c => c.id === ramo.cor) || CORES_RAMO[0];

              const labelTexto = ramo.rotulo || '';
              if (!labelTexto.trim()) return null;

              return (
                <div
                  key={`rotulo-ramo-${ramo.id}`}
                  style={{
                    position: 'absolute',
                    left: `${conexao.midX}px`,
                    top: `${conexao.midY}px`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '195px',
                    minWidth: '60px',
                    zIndex: 14,
                    backgroundColor: currentTheme.arrowPillFill,
                    borderColor: corObj.hex,
                    color: currentTheme.arrowPillTextFill,
                  }}
                  className="px-2.5 py-1 rounded-xl text-center text-[10.5px] font-bold leading-tight shadow-md border-2 break-words whitespace-normal pointer-events-auto select-none backdrop-blur-xs transition-transform hover:scale-105"
                  title={labelTexto}
                >
                  {labelTexto}
                </div>
              );
            });
          })}

          {/* Nós / Quadrados no Canvas com Suporte a Treino e Adivinhação */}
          {nos.map(no => {
            const isInicial = no.id === noInicialId;
            const isRevelado = !!nosRevelados[no.id];
            const isSelecionado = no.id === noSelecionadoDetalheId;

            // Determinar cores da borda de acordo com o tipo
            const corBorda = 
              no.tipo === 'inicio' ? 'border-blue-400' :
              no.tipo === 'alerta' ? 'border-rose-400' :
              no.tipo === 'decisao' ? 'border-amber-400' :
              no.tipo === 'diagnostico' ? 'border-purple-400' :
              'border-emerald-400';

            return (
              <div
                key={no.id}
                data-no-id={no.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRevelado) {
                    handleRevelarNo(no.id);
                  } else {
                    setNoSelecionadoDetalheId(no.id);
                    setMostrarGavetaDetalhes(true);
                  }
                }}
                style={{
                  left: `${no.posicaoX ?? 50}px`,
                  top: `${no.posicaoY ?? 50}px`,
                  width: '260px',
                  minHeight: '145px',
                }}
                className={`absolute p-3.5 rounded-2xl transition-all cursor-pointer select-none ${
                  !isRevelado
                    ? `${currentTheme.hiddenCardBgClass} border-2 border-dashed ${currentTheme.hiddenCardBorderClass} shadow-lg active:scale-98`
                    : `${currentTheme.cardBgClass} border-2 ${
                        isSelecionado 
                          ? `${corBorda} ring-4 ring-emerald-500/30 shadow-xl scale-102` 
                          : isInicial
                            ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                            : `${currentTheme.cardBorderClass} hover:border-slate-400 ${currentTheme.cardShadowClass}`
                      }`
                }`}
              >
                {/* Header do Card com Tag de Tipo e Indicador */}
                <div className={`flex items-center justify-between gap-1 pb-1.5 border-b ${currentTheme.cardDividerClass}`}>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isInicial
                      ? 'bg-amber-400 text-slate-950 font-black ring-1 ring-amber-300'
                      : no.tipo === 'inicio' ? 'bg-blue-900/80 text-blue-300' :
                        no.tipo === 'alerta' ? 'bg-rose-900/80 text-rose-300' :
                        no.tipo === 'decisao' ? 'bg-amber-900/80 text-amber-300' :
                        no.tipo === 'diagnostico' ? 'bg-purple-900/80 text-purple-300' :
                        'bg-emerald-900/80 text-emerald-300'
                  }`}>
                    {isInicial ? '★ Bloco Originário' : no.tipo}
                  </span>

                  {!isRevelado ? (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                      <HelpCircle className="w-2.5 h-2.5" />
                      Adivinhe
                    </span>
                  ) : (
                    <span className="text-[8.5px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Revelado
                    </span>
                  )}
                </div>

                {/* Corpo do Card: Modo Ocluso (Adivinhação) vs Modo Revelado */}
                {!isRevelado ? (
                  <div className="pt-2.5 pb-1 text-center space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center mx-auto">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className={`text-[11px] font-extrabold ${currentTheme.hiddenCardTitleClass}`}>
                      {exibirDicas && no.dica ? `Dica: ${no.dica}` : 'Qual a conduta neste ponto?'}
                    </div>
                    <p className={`text-[9.5px] ${currentTheme.hiddenCardDescClass}`}>
                      Observe a seta e toque para conferir a resposta.
                    </p>
                    <div className="pt-1">
                      <span className={`inline-block px-3 py-1 rounded-lg ${currentTheme.hiddenCardButtonClass} font-black text-[10px] shadow-sm transition-all`}>
                        Toque para Revelar
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 pb-1 space-y-1.5">
                    <h5 className={`text-[11.5px] font-bold ${currentTheme.cardTitleClass} line-clamp-2 leading-tight`}>
                      {no.titulo || '(Etapa sem título)'}
                    </h5>

                    {no.descricao ? (
                      <div className={`text-[10px] ${currentTheme.cardDescClass} line-clamp-3 leading-snug`}>
                        <FormattedClinicalText text={no.descricao} />
                      </div>
                    ) : null}

                    {/* Resumo de Saídas do Bloco */}
                    <div className={`pt-1.5 flex items-center justify-between border-t ${currentTheme.cardDividerClass} text-[9px] ${currentTheme.cardMutedClass}`}>
                      <span>
                        {no.ramos.length === 0 
                          ? 'Desfecho final' 
                          : `${no.ramos.length} ${no.ramos.length === 1 ? 'caminho' : 'caminhos'} saindo`}
                      </span>
                      <span className="text-emerald-500 font-bold">
                        Toque p/ Detalhes ➔
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* =================================================================== */}
          {/* DRAWER / PAINEL FLUTUANTE COM CONDUTA DETALHADA E LEITURA CLARA     */}
          {/* Posicionado estritamente DENTRO do canvas, sem nunca sobrepor a dica*/}
          {/* =================================================================== */}
          {noSelecionadoObj && mostrarGavetaDetalhes && (
            <div className={`absolute bottom-2.5 left-2 right-2 sm:left-4 sm:right-4 max-w-lg mx-auto p-3 rounded-2xl ${currentTheme.drawerBgClass} border ${currentTheme.drawerBorderClass} ${currentTheme.drawerTextClass} shadow-2xl z-30 transition-all backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150`}>
              <div className={`flex items-center justify-between pb-1.5 border-b ${currentTheme.cardDividerClass}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    noSelecionadoObj.id === noInicialId
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-emerald-900/80 text-emerald-300'
                  }`}>
                    {noSelecionadoObj.id === noInicialId ? '★ Bloco Originário' : noSelecionadoObj.tipo}
                  </span>
                  <h4 className={`text-xs font-bold ${currentTheme.drawerTitleClass} truncate`}>
                    {noSelecionadoObj.titulo || 'Detalhe do Bloco'}
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!nosRevelados[noSelecionadoObj.id] && (
                    <button
                      type="button"
                      onClick={() => handleRevelarNo(noSelecionadoObj.id)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] cursor-pointer active:scale-95"
                    >
                      Revelar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMostrarGavetaDetalhes(false)}
                    title="Minimizar painel"
                    className={`p-1 ${currentTheme.cardMutedClass} hover:text-white rounded cursor-pointer`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Conteúdo Clínico Completo e Legível para Mobile */}
              {nosRevelados[noSelecionadoObj.id] ? (
                <div className="mt-2 space-y-1.5 text-xs max-h-36 sm:max-h-44 overflow-y-auto pr-1">
                  {noSelecionadoObj.descricao ? (
                    <div className={`p-2 rounded-xl ${themeId === 'light' ? 'bg-slate-50 border border-slate-200 text-slate-800' : 'bg-slate-800/80 border border-slate-700 text-slate-200'} leading-relaxed text-[11px]`}>
                      <FormattedClinicalText text={noSelecionadoObj.descricao} />
                    </div>
                  ) : (
                    <p className={`text-[11px] ${currentTheme.cardMutedClass} italic`}>
                      Nenhuma anotação adicional informada para este bloco.
                    </p>
                  )}

                  {noSelecionadoObj.ramos.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9.5px] font-bold ${currentTheme.cardMutedClass}`}>Próximos passos clínicos:</span>
                      {noSelecionadoObj.ramos.map(r => (
                        <span 
                          key={r.id}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${themeId === 'light' ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}
                        >
                          {r.rotulo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 p-2 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-[11px] flex items-center justify-between gap-2">
                  <span className="text-[10.5px]">Este bloco ainda está ocluso para o seu treino ativo.</span>
                  <button
                    type="button"
                    onClick={() => handleRevelarNo(noSelecionadoObj.id)}
                    className="px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[10px] shrink-0 cursor-pointer"
                  >
                    Revelar Agora
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botão flutuante para reabrir detalhes se foram minimizados */}
          {!mostrarGavetaDetalhes && noSelecionadoObj && (
            <button
              type="button"
              onClick={() => setMostrarGavetaDetalhes(true)}
              className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white text-[10.5px] font-bold flex items-center gap-1.5 shadow-lg border border-slate-700/80 backdrop-blur-md cursor-pointer active:scale-95 transition-transform"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[160px] sm:max-w-[220px]">Detalhes: {noSelecionadoObj.titulo}</span>
            </button>
          )}
        </div>

        {/* Indicador Flutuante Discreto de Nível de Zoom (exibido durante o movimento de pinça ou scroll) */}
        {indicadorZoomVisivel && (
          <div className="absolute top-3 right-3 z-30 pointer-events-none transition-opacity duration-300">
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold shadow-lg backdrop-blur-md border flex items-center gap-1.5 ${
              currentTheme.id === 'light'
                ? 'bg-white/95 text-slate-800 border-slate-200 shadow-slate-300/60'
                : currentTheme.id === 'blueprint'
                ? 'bg-sky-950/95 text-sky-100 border-sky-700 shadow-sky-950/60'
                : 'bg-slate-900/95 text-slate-100 border-slate-700 shadow-black/60'
            }`}>
              <span className="text-[10px] uppercase tracking-wider opacity-70">Zoom</span>
              <span className="text-blue-500 font-black">{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    )}

      {/* =================================================================== */}
      {/* BARRA DE AVALIAÇÃO FSRS: SOMENTE APÓS EXPLORAR/REVELAR TODO O FLUXO */}
      {/* =================================================================== */}
      {onAvaliarRevisao && todosCompletos && (
        <div className={`w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border shadow-xl backdrop-blur-md shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 z-20 transition-all mt-1.5 ${
          currentTheme.id === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40'
            : currentTheme.id === 'blueprint'
            ? 'bg-sky-950/95 border-sky-800 text-sky-100 shadow-sky-950/80'
            : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/60'
        }`}>
          {/* Lado Esquerdo: Nota Clínica de Alto Contraste (Substituindo Pérola Clínica) */}
          <div className="flex-1 min-w-0 w-full">
            {exibirDicas && perolaClinica ? (
              <div className="flex items-start gap-2.5 p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-amber-100/95 border-2 border-amber-300/95 text-slate-950 text-xs sm:text-[12.5px] leading-relaxed font-medium shadow-2xs">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <div className="flex-1 min-w-0 whitespace-normal break-words">
                  <span className="font-black uppercase text-[10px] tracking-wider text-amber-900 block mb-0.5">
                    Dica:
                  </span>
                  <span className="text-slate-900 font-semibold leading-relaxed">
                    {perolaClinica}
                  </span>
                </div>
              </div>
            ) : perguntaGatilho ? (
              <div className="flex items-start gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs leading-relaxed font-medium">
                <HelpCircle className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                <div className="flex-1 min-w-0 whitespace-normal break-words text-slate-800 dark:text-slate-200">
                  <span className="font-black uppercase text-[9.5px] tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">
                    Pergunta Gatilho:
                  </span>
                  {perguntaGatilho}
                </div>
              </div>
            ) : (
              <span className={`text-[11px] sm:text-xs font-semibold ${
                currentTheme.id === 'light' ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Fluxograma concluído! Como foi sua retenção clínica neste caso?
              </span>
            )}
          </div>

          {/* Lado Direito: Os 4 Botões FSRS de Fixação com Timers Configuráveis */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onAvaliarRevisao('errei')}
              className="py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer min-h-[40px] sm:min-h-[44px]"
            >
              <span className="text-[11px] sm:text-xs leading-tight">Errei</span>
              <span className="text-[9px] font-semibold opacity-90">
                {formatarTempoMinutos(infoRodada.timers.erreiMinutos)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onAvaliarRevisao('dificil')}
              className="py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer min-h-[40px] sm:min-h-[44px]"
            >
              <span className="text-[11px] sm:text-xs leading-tight">Difícil</span>
              <span className="text-[9px] font-semibold opacity-90">
                {formatarTempoMinutos(infoRodada.timers.dificilMinutos)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onAvaliarRevisao('bom')}
              className="py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer min-h-[40px] sm:min-h-[44px]"
            >
              <span className="text-[11px] sm:text-xs leading-tight">Bom</span>
              <span className="text-[9px] font-semibold opacity-90">
                {formatarTempoMinutos(infoRodada.timers.bomMinutos)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onAvaliarRevisao('facil')}
              className="py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer min-h-[40px] sm:min-h-[44px]"
            >
              <span className="text-[11px] sm:text-xs leading-tight">Fácil</span>
              <span className="text-[9px] font-semibold opacity-90">
                {formatarTempoMinutos(infoRodada.timers.facilMinutos)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Desafio Ativo: enquanto houver nós pendentes a revelar */}
      {onAvaliarRevisao && !todosCompletos && (
        <div className={`w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 rounded-2xl border shadow-sm backdrop-blur-md shrink-0 flex items-center justify-between gap-2 z-20 transition-all mt-1.5 ${
          currentTheme.id === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-700'
            : currentTheme.id === 'blueprint'
            ? 'bg-sky-950/95 border-sky-900 text-sky-200'
            : 'bg-slate-900/95 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 min-w-0 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="truncate text-slate-800 dark:text-slate-200">
              Desvende os <strong>{totalNos - nosReveladosCount}</strong> nós pendentes para concluir o algoritmo
            </span>
          </div>

          <button
            type="button"
            onClick={handleRevelarTodos}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shrink-0 transition-colors cursor-pointer"
          >
            Revelar Tudo
          </button>
        </div>
      )}
    </div>
  );
};
