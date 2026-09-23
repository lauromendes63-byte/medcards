import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  GitFork, 
  HelpCircle, 
  Stethoscope, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Split, 
  Eye, 
  EyeOff,
  ChevronDown,
  Layers,
  Activity,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Move,
  ClipboardPaste,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Compass,
  Target,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { FluxogramaComplexoDados, NoFluxogramaComplexo, RamoFluxogramaComplexo } from '../types';
import { ClinicalFormatToolbar } from './ClinicalFormatToolbar';
import { FormattedClinicalText } from './FormattedClinicalText';

interface ComplexFlowchartBuilderProps {
  dados: FluxogramaComplexoDados;
  onChange: (novosDados: FluxogramaComplexoDados) => void;
}

export const PRESETS_FLUXOGRAMAS_COMPLEXOS: {
  nome: string;
  descricao: string;
  dados: FluxogramaComplexoDados;
}[] = [
  {
    nome: 'Dor Torácica no PS (SCA com/sem Supra ST)',
    descricao: 'Algoritmo com ECG em 10 min, Delta T e reperfusão imediata',
    dados: {
      id: 'fluxo-sca',
      titulo: 'Abordagem da Dor Torácica Aguda no PS',
      descricao: 'Protocolo de Dor Torácica com estratificação por ECG e marcadores de necrose miocárdica',
      noInicialId: 'no-1',
      nos: [
        {
          id: 'no-1',
          titulo: 'Paciente com Dor Torácica no PS: ECG em < 10 minutos',
          descricao: 'Monitorização multiparamétrica, acesso calibroso, saturação e história clínica direcionada.',
          tipo: 'inicio',
          posicaoX: 520,
          posicaoY: 50,
          ramos: [
            { id: 'r1', rotulo: 'Supra de ST em ≥ 2 derivações contíguas', destinoNoId: 'no-2', cor: 'vermelho' },
            { id: 'r2', rotulo: 'Sem Supra de ST (Normal ou Infradesnivelamento)', destinoNoId: 'no-3', cor: 'azul' }
          ]
        },
        {
          id: 'no-2',
          titulo: 'IAM com Supra de ST (IAMCSST)',
          descricao: 'AAS 200mg mastigado + Clopidogrel 300mg + Heparina. Avaliar tempo para Hemodinâmica.',
          tipo: 'alerta',
          posicaoX: 240,
          posicaoY: 230,
          oculto: true,
          dica: 'Conduta de Reperfusão Imediata',
          ramos: [
            { id: 'r3', rotulo: 'Tempo até CATE < 120 min', destinoNoId: 'no-4', cor: 'verde' },
            { id: 'r4', rotulo: 'Tempo até CATE > 120 min', destinoNoId: 'no-5', cor: 'amber' }
          ]
        },
        {
          id: 'no-4',
          titulo: 'Angioplastia Primária Imediata',
          descricao: 'Transferência imediata para laboratório de hemodinâmica. Meta Porta-Balão < 90 min.',
          tipo: 'conduta',
          posicaoX: 100,
          posicaoY: 420,
          oculto: true,
          ramos: []
        },
        {
          id: 'no-5',
          titulo: 'Fibrinólise Química na Sala de Emergência',
          descricao: 'Tenecteplase (TNK) ou Alteplase (rtPA) em até 30 min (Porta-Agulha). Se falha: CATE de Resgate.',
          tipo: 'conduta',
          posicaoX: 380,
          posicaoY: 420,
          oculto: true,
          ramos: []
        },
        {
          id: 'no-3',
          titulo: 'Troponina Ultrassensível e Escore HEART',
          descricao: 'Coletar troponina na admissão (0h) e após 1-2h (protocolo de descarte rápido).',
          tipo: 'decisao',
          posicaoX: 800,
          posicaoY: 230,
          ramos: [
            { id: 'r5', rotulo: 'Troponina Positiva / Delta positivo', destinoNoId: 'no-6', cor: 'vermelho' },
            { id: 'r6', rotulo: 'Troponina Negativa e HEART Baixo (≤3)', destinoNoId: 'no-7', cor: 'verde' }
          ]
        },
        {
          id: 'no-6',
          titulo: 'IAM sem Supra de ST / Angina Instável',
          descricao: 'Internação em UTI Coronariana + Dupla Antiagregação + Anticoagulação + CATE precoce (<24h).',
          tipo: 'conduta',
          posicaoX: 660,
          posicaoY: 420,
          oculto: true,
          ramos: []
        },
        {
          id: 'no-7',
          titulo: 'Dor Não Cardíaca / Baixa Probabilidade',
          descricao: 'Investigação ambulatorial, teste provocativo de isquemia ou alta segura.',
          tipo: 'diagnostico',
          posicaoX: 940,
          posicaoY: 420,
          ramos: []
        }
      ]
    }
  },
  {
    nome: 'Cetoacidose Diabética (Manejo de K+ e Insulina)',
    descricao: 'Algoritmo crítico: checagem de K+ sérico antes da insulinoterapia',
    dados: {
      id: 'fluxo-cad',
      titulo: 'Manejo Inicial do Potássio e Insulina na CAD',
      descricao: 'Protocolo de emergência endócrina: reposição volêmica e segurança hidroeletrolítica',
      noInicialId: 'no-cad-1',
      nos: [
        {
          id: 'no-cad-1',
          titulo: 'Suspeita de CAD: Glicemia > 250, pH < 7.3, Cetonúria/Cetonemia',
          descricao: 'Iniciar expansão volêmica com SF 0.9% 1000 mL/h e coletar gasometria e potássio sérico.',
          tipo: 'inicio',
          posicaoX: 520,
          posicaoY: 50,
          ramos: [
            { id: 'rcad-1', rotulo: 'K+ < 3.3 mEq/L', destinoNoId: 'no-cad-k-baixo', cor: 'vermelho' },
            { id: 'rcad-2', rotulo: 'K+ entre 3.3 e 5.3 mEq/L', destinoNoId: 'no-cad-k-normal', cor: 'verde' },
            { id: 'rcad-3', rotulo: 'K+ > 5.3 mEq/L', destinoNoId: 'no-cad-k-alto', cor: 'amber' }
          ]
        },
        {
          id: 'no-cad-k-baixo',
          titulo: 'NÃO Iniciar Insulina! Repor Potássio Imediatamente',
          descricao: 'Adiar insulina! Repor KCl 20-30 mEq/h até que o potássio sérico ultrapasse 3.3 mEq/L para evitar arritmias ventriculares fatais.',
          tipo: 'alerta',
          posicaoX: 200,
          posicaoY: 250,
          oculto: true,
          dica: 'Risco de PCR por hipocalemia aguda se der insulina',
          ramos: []
        },
        {
          id: 'no-cad-k-normal',
          titulo: 'Iniciar Insulina Regular + Reposição de Manutenção de K+',
          descricao: 'Insulina Regular IV (0.1 UI/kg bolus + 0.1 UI/kg/h em bomba) associando 20-30 mEq de KCl por litro de soro de hidratação.',
          tipo: 'conduta',
          posicaoX: 520,
          posicaoY: 250,
          oculto: true,
          ramos: []
        },
        {
          id: 'no-cad-k-alto',
          titulo: 'Iniciar Insulina Regular sem reposição de K+',
          descricao: 'Insulina Regular 0.1 UI/kg/h. NÃO adicionar potássio ao soro. Monitorar K+ a cada 2 horas.',
          tipo: 'conduta',
          posicaoX: 840,
          posicaoY: 250,
          oculto: true,
          ramos: []
        }
      ]
    }
  },
  {
    nome: 'Parada Cardiorrespiratória no Adulto (ACLS)',
    descricao: 'Ritmos Chocáveis (FV/TV sem pulso) versus Não Chocáveis (AESP/Assistolia)',
    dados: {
      id: 'fluxo-pcr',
      titulo: 'Algoritmo de Parada Cardiorrespiratória no Adulto (ACLS)',
      descricao: 'Abordagem sistemática com ênfase em RCP de alta qualidade e desfibrilação precoce',
      noInicialId: 'no-pcr-1',
      nos: [
        {
          id: 'no-pcr-1',
          titulo: 'Início da RCP de alta qualidade + Monitor/Desfibrilador colocado',
          descricao: 'Checar ritmo cardíaco no monitor.',
          tipo: 'inicio',
          posicaoX: 520,
          posicaoY: 50,
          ramos: [
            { id: 'rpcr-1', rotulo: 'Ritmo Chocável (FV / TVSP)', destinoNoId: 'no-pcr-chocavel', cor: 'vermelho' },
            { id: 'rpcr-2', rotulo: 'Ritmo Não Chocável (Assistolia / AESP)', destinoNoId: 'no-pcr-nao-chocavel', cor: 'azul' }
          ]
        },
        {
          id: 'no-pcr-chocavel',
          titulo: '1º Choque (Bifásico 200J) + Retorno Imediato da RCP por 2 min',
          descricao: 'Obter acesso venoso/intraósseo. Não interromper massagem.',
          tipo: 'conduta',
          posicaoX: 300,
          posicaoY: 240,
          oculto: true,
          ramos: [
            { id: 'rpcr-3', rotulo: 'Ritmo persiste chocável após 2 min', destinoNoId: 'no-pcr-choc-persiste', cor: 'vermelho' }
          ]
        },
        {
          id: 'no-pcr-choc-persiste',
          titulo: '2º Choque + Adrenalina 1mg IV a cada 3-5 min + Amiodarona 300mg no 3º choque',
          descricao: 'Tratar causas reversíveis (5H e 5T) e considerar via aérea avançada.',
          tipo: 'conduta',
          posicaoX: 300,
          posicaoY: 430,
          oculto: true,
          ramos: []
        },
        {
          id: 'no-pcr-nao-chocavel',
          titulo: 'Adrenalina 1mg IV Imediata + RCP contínua 2 minutos',
          descricao: 'NÃO chocar! Foco em Adrenalina o mais rápido possível e busca ativa das causas (5H e 5T).',
          tipo: 'alerta',
          posicaoX: 740,
          posicaoY: 240,
          oculto: true,
          ramos: []
        }
      ]
    }
  }
];

import { 
  CORES_RAMO, 
  calcularConexaoDinamica, 
  obterDashArraySeta,
  obterStrokeWidthSeta,
  FLOWCHART_THEMES, 
  FlowchartThemeId, 
  getStoredFlowchartTheme, 
  setStoredFlowchartTheme 
} from '../utils/flowchartCurves';
export { CORES_RAMO, calcularConexaoDinamica };

export const ComplexFlowchartBuilder: React.FC<ComplexFlowchartBuilderProps> = ({
  dados,
  onChange,
}) => {
  const [modoVisualizacao, setModoVisualizacao] = useState<'canvas' | 'lista' | 'json'>('canvas');
  const [noSelecionadoId, setNoSelecionadoId] = useState<string>(dados.noInicialId || dados.nos[0]?.id || '');
  const [mostrarModelos, setMostrarModelos] = useState(false);
  const [jsonColarTexto, setJsonColarTexto] = useState('');
  const [jsonErro, setJsonErro] = useState<string | null>(null);
  const [copiadoPrompt, setCopiadoPrompt] = useState(false);

  // Tema visual dinâmico do Canvas (Dark, Light Confortável, Blueprint Moderno)
  const [themeId, setThemeId] = useState<FlowchartThemeId>(getStoredFlowchartTheme);
  const currentTheme = FLOWCHART_THEMES[themeId] || FLOWCHART_THEMES.dark;

  const handleTrocarTema = (novoTema: FlowchartThemeId) => {
    setThemeId(novoTema);
    setStoredFlowchartTheme(novoTema);
  };

  // Modo Tela Cheia para edição imersiva
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Estados do Canvas: Zoom padrão em 60% (0.60) para excelente visão panorâmica no mobile
  const [zoom, setZoom] = useState(0.60);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [arrastandoCanvas, setArrastandoCanvas] = useState(false);
  const [arrastandoNoId, setArrastandoNoId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentLayerRef = useRef<HTMLDivElement>(null);
  const jaCentralizouInicialmente = useRef(false);

  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  // Refs de Pan contínuo e Drag com precisão 1:1 absoluta e alta performance
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

  const nodeDragRef = useRef<{
    ativo: boolean;
    noId: string | null;
    startX: number;
    startY: number;
    initialNodeX: number;
    initialNodeY: number;
    ultimoX: number;
    ultimoY: number;
    rafId: number | null;
  }>({
    ativo: false,
    noId: null,
    startX: 0,
    startY: 0,
    initialNodeX: 0,
    initialNodeY: 0,
    ultimoX: 0,
    ultimoY: 0,
    rafId: null,
  });

  const dadosNosRef = useRef(dados.nos);
  dadosNosRef.current = dados.nos;

  /**
   * Centraliza a visão do canvas exatamente no bloco originário (início do algoritmo).
   * O usuário tem liberdade total: os nós NÃO são travados nem forçados de volta.
   */
  const centralizarNoOrigem = useCallback((listaNos?: typeof dados.nos) => {
    const lista = listaNos || dadosNosRef.current;
    const raiz = lista.find(n => n.id === dados.noInicialId) || lista[0];
    if (!raiz || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasW = rect.width || 800;
    const canvasH = rect.height || 560;

    const currentZoom = zoomRef.current;
    const raizCentroX = (raiz.posicaoX ?? 520) + 120;
    const raizCentroY = (raiz.posicaoY ?? 50) + 55;

    // Fórmula 1:1 exata para translate3d(panX, panY, 0) scale(zoom)
    const novoPanX = Math.round(canvasW / 2 - raizCentroX * currentZoom);
    const novoPanY = Math.round(canvasH / 3 - raizCentroY * currentZoom);

    setPanOffset({ x: novoPanX, y: novoPanY });
    panOffsetRef.current = { x: novoPanX, y: novoPanY };
    panRef.current.initialPanX = novoPanX;
    panRef.current.initialPanY = novoPanY;
  }, [dados.noInicialId]);

  // Centraliza a visão no Bloco Originário UMA ÚNICA VEZ ao entrar no Canvas
  useEffect(() => {
    if (modoVisualizacao === 'canvas' && !jaCentralizouInicialmente.current) {
      const timer = setTimeout(() => {
        centralizarNoOrigem();
        jaCentralizouInicialmente.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [modoVisualizacao, centralizarNoOrigem]);

  // Estado do Modal de Unificação (Conectar a Bloco Existente)
  const [modalUnificar, setModalUnificar] = useState<{
    origemId: string;
    destinoId: string;
    rotulo: string;
    cor: RamoFluxogramaComplexo['cor'];
    estilo: RamoFluxogramaComplexo['estilo'];
  } | null>(null);

  // Helpers para identificação limpa e direta das caixas (Caixa 1, Caixa 2, Caixa 3...)
  const getIndiceNo = (noId: string) => {
    const idx = dados.nos.findIndex(n => n.id === noId);
    return idx >= 0 ? idx + 1 : 1;
  };

  const getRotuloResumidoNo = (no: NoFluxogramaComplexo) => {
    const idx = getIndiceNo(no.id);
    const tit = no.titulo.trim();
    return tit ? `Caixa ${idx}: ${tit}` : `Caixa ${idx}`;
  };

  // Função inteligente para calcular cor distinta garantindo que caminhos antagônicos ou unificados nunca fiquem da mesma cor
  const obterProximaCorDistinta = (origemId: string, destinoId?: string): RamoFluxogramaComplexo['cor'] => {
    const noOrigem = dados.nos.find(n => n.id === origemId);
    const coresUsadasOrigem = new Set(noOrigem?.ramos.map(r => r.cor) || []);

    // Se houver destino, checar cores de setas que já convergem nele
    const coresChegamDestino = new Set<string>();
    if (destinoId) {
      dados.nos.forEach(n => {
        n.ramos.forEach(r => {
          if (r.destinoNoId === destinoId) {
            coresChegamDestino.add(r.cor);
          }
        });
      });
    }

    // Regra clínica clássica:
    // Se o 1º ramo foi verde ("Sim"), o próximo DEVE ser vermelho ("Não")
    if (coresUsadasOrigem.has('verde') && !coresUsadasOrigem.has('vermelho')) {
      return 'vermelho';
    }
    if (coresUsadasOrigem.has('vermelho') && !coresUsadasOrigem.has('verde')) {
      return 'verde';
    }

    // Ordem de preferência de contraste
    const paletaPreferencial: RamoFluxogramaComplexo['cor'][] = [
      'verde', 'vermelho', 'azul', 'amber', 'purple', 'indigo', 'teal', 'slate'
    ];

    // Busca cor que não esteja nem na origem nem chegue no destino
    const corTotalmenteLivre = paletaPreferencial.find(c => !coresUsadasOrigem.has(c) && !coresChegamDestino.has(c));
    if (corTotalmenteLivre) return corTotalmenteLivre;

    // Se não, pelo menos uma cor não usada na origem
    const corLivreOrigem = paletaPreferencial.find(c => !coresUsadasOrigem.has(c));
    return corLivreOrigem || 'azul';
  };

  // Auto-posicionar nós se não tiverem coordenadas
  useEffect(() => {
    let precisaAtualizar = false;
    const novosNos = dados.nos.map((no, idx) => {
      if (typeof no.posicaoX !== 'number' || typeof no.posicaoY !== 'number') {
        precisaAtualizar = true;
        const coluna = Math.floor(idx / 3);
        const linha = idx % 3;
        return {
          ...no,
          posicaoX: 50 + coluna * 320,
          posicaoY: 40 + linha * 160,
        };
      }
      return no;
    });

    if (precisaAtualizar) {
      onChange({ ...dados, nos: novosNos });
    }
  }, []);

  const noAtual = dados.nos.find(n => n.id === noSelecionadoId) || dados.nos[0];

  // Adicionar novo nó com campos limpos (sem textos pré-preenchidos a apagar)
  const handleAdicionarNo = (tipo: NoFluxogramaComplexo['tipo'] = 'decisao') => {
    const novoId = `no-${Date.now()}`;
    const count = dados.nos.length;
    const novoNo: NoFluxogramaComplexo = {
      id: novoId,
      titulo: '',
      descricao: '',
      tipo,
      posicaoX: 80 + (count % 3) * 260,
      posicaoY: 60 + Math.floor(count / 3) * 160,
      oculto: tipo === 'conduta' || tipo === 'alerta',
      ramos: []
    };

    onChange({
      ...dados,
      nos: [...dados.nos, novoNo]
    });
    setNoSelecionadoId(novoId);
  };

  // Atualizar nó
  const handleAtualizarNo = (id: string, campos: Partial<NoFluxogramaComplexo>) => {
    const novosNos = dados.nos.map(n => n.id === id ? { ...n, ...campos } : n);
    onChange({
      ...dados,
      nos: novosNos
    });
  };

  // Remover nó
  const handleRemoverNo = (id: string) => {
    if (dados.nos.length <= 1) return;
    
    const novosNos = dados.nos
      .filter(n => n.id !== id)
      .map(n => ({
        ...n,
        ramos: n.ramos.filter(r => r.destinoNoId !== id)
      }));

    let novoInicial = dados.noInicialId;
    if (novoInicial === id) {
      novoInicial = novosNos[0]?.id || '';
    }

    onChange({
      ...dados,
      noInicialId: novoInicial,
      nos: novosNos
    });

    if (noSelecionadoId === id) {
      setNoSelecionadoId(novosNos[0]?.id || '');
    }
  };

  // Adicionar ramificação com criação rápida de nó filho limpo
  const handleAdicionarRamo = (
    origemId: string, 
    rotulo?: string, 
    cor?: RamoFluxogramaComplexo['cor'],
    estilo?: RamoFluxogramaComplexo['estilo']
  ) => {
    const origemNo = dados.nos.find(n => n.id === origemId);
    
    // Calcula rótulo e cor inteligente contrastante
    const rotuloFinal = rotulo || (origemNo?.ramos.length === 0 ? 'Sim' : origemNo?.ramos.length === 1 ? 'Não' : `Caminho ${origemNo?.ramos.length! + 1}`);
    const corFinal = cor || obterProximaCorDistinta(origemId);

    // Cria novo nó filho conectado, distribuindo simetricamente abaixo e dos lados do pai
    const indexRamo = origemNo?.ramos.length || 0;
    const offsetX = indexRamo === 0 ? -160 : indexRamo === 1 ? 160 : (indexRamo - 1) * 260;
    const novoDestinoId = `no-${Date.now()}`;
    const novoX = Math.max(30, (origemNo?.posicaoX || 520) + offsetX);
    const novoY = (origemNo?.posicaoY || 50) + 180;

    const novoDestino: NoFluxogramaComplexo = {
      id: novoDestinoId,
      titulo: '',
      descricao: '',
      tipo: 'conduta',
      posicaoX: novoX,
      posicaoY: novoY,
      oculto: true,
      ramos: []
    };

    const novoRamo: RamoFluxogramaComplexo = {
      id: `ramo-${Date.now()}`,
      rotulo: rotuloFinal,
      destinoNoId: novoDestinoId,
      cor: corFinal,
      estilo: estilo || 'solida',
      espessura: 'media'
    };

    const novosNos = dados.nos.map(n => n.id === origemId ? { ...n, ramos: [...n.ramos, novoRamo] } : n);
    novosNos.push(novoDestino);

    onChange({
      ...dados,
      nos: novosNos
    });
    setNoSelecionadoId(novoDestinoId);
  };

  // Abrir Modal de Unificação (Conectar nó de origem a um nó existente com cor garantidamente diferente)
  const handleAbrirUnificar = (origemId: string) => {
    const outrosNos = dados.nos.filter(n => n.id !== origemId);
    if (outrosNos.length === 0) return;

    const primeiroDestino = outrosNos[0].id;
    const corSugerida = obterProximaCorDistinta(origemId, primeiroDestino);
    const origemNo = dados.nos.find(n => n.id === origemId);
    const rotuloSugerido = origemNo?.ramos.length === 0 ? 'Sim' : origemNo?.ramos.length === 1 ? 'Não' : 'Unificação';

    setModalUnificar({
      origemId,
      destinoId: primeiroDestino,
      rotulo: rotuloSugerido,
      cor: corSugerida,
      estilo: 'solida'
    });
  };

  // Confirmar conexão de unificação
  const handleConfirmarUnificar = () => {
    if (!modalUnificar) return;
    const { origemId, destinoId, rotulo, cor, estilo } = modalUnificar;

    const novoRamo: RamoFluxogramaComplexo = {
      id: `ramo-${Date.now()}`,
      rotulo: rotulo.trim() || 'Caminho',
      destinoNoId: destinoId,
      cor: cor || 'azul',
      estilo: estilo || 'solida',
      espessura: 'media'
    };

    const novosNos = dados.nos.map(n => {
      if (n.id === origemId) {
        return {
          ...n,
          ramos: [...n.ramos, novoRamo]
        };
      }
      return n;
    });

    onChange({
      ...dados,
      nos: novosNos
    });
    setModalUnificar(null);
  };

  // Remover ramificação
  const handleRemoverRamo = (origemId: string, ramoId: string) => {
    const novosNos = dados.nos.map(n => {
      if (n.id === origemId) {
        return {
          ...n,
          ramos: n.ramos.filter(r => r.id !== ramoId)
        };
      }
      return n;
    });

    onChange({
      ...dados,
      nos: novosNos
    });
  };

  // Atualizar ramificação
  const handleAtualizarRamo = (origemId: string, ramoId: string, campos: Partial<RamoFluxogramaComplexo>) => {
    const novosNos = dados.nos.map(n => {
      if (n.id === origemId) {
        return {
          ...n,
          ramos: n.ramos.map(r => r.id === ramoId ? { ...r, ...campos } : r)
        };
      }
      return n;
    });

    onChange({
      ...dados,
      nos: novosNos
    });
  };

  // Auto-organizar em Árvore com Bloco Originário Centralizado no Topo
  const handleAutoOrganizar = () => {
    const raizId = dados.noInicialId || dados.nos[0]?.id;
    if (!raizId) return;

    const visitados = new Set<string>();
    const posicoes: Record<string, { x: number; y: number }> = {};
    
    // BFS para calcular níveis a partir da raiz (Bloco Originário)
    let niveis: string[][] = [];
    let fila: { id: string; nivel: number }[] = [{ id: raizId, nivel: 0 }];
    visitados.add(raizId);

    while (fila.length > 0) {
      const item = fila.shift()!;
      if (!niveis[item.nivel]) niveis[item.nivel] = [];
      niveis[item.nivel].push(item.id);

      const no = dados.nos.find(n => n.id === item.id);
      if (no) {
        no.ramos.forEach(r => {
          if (r.destinoNoId && !visitados.has(r.destinoNoId)) {
            visitados.add(r.destinoNoId);
            fila.push({ id: r.destinoNoId, nivel: item.nivel + 1 });
          }
        });
      }
    }

    // Adicionar nós órfãos no final
    dados.nos.forEach(n => {
      if (!visitados.has(n.id)) {
        if (!niveis[niveis.length - 1]) niveis[niveis.length - 1] = [];
        niveis[niveis.length - 1].push(n.id);
      }
    });

    const centroX = 600;

    // Distribuir cada nível simetricamente em torno do eixo central do Bloco Originário
    niveis.forEach((linha, nivelIdx) => {
      const y = 50 + nivelIdx * 190;
      const qtd = linha.length;
      const espacamento = 290;
      const larguraNivel = (qtd - 1) * espacamento;
      const startX = centroX - larguraNivel / 2;

      linha.forEach((id, idx) => {
        posicoes[id] = {
          x: Math.round(startX + idx * espacamento),
          y: y,
        };
      });
    });

    const novosNos = dados.nos.map(n => ({
      ...n,
      posicaoX: posicoes[n.id]?.x ?? n.posicaoX ?? 100,
      posicaoY: posicoes[n.id]?.y ?? n.posicaoY ?? 100,
    }));

    onChange({ ...dados, nos: novosNos });
    centralizarNoOrigem(novosNos);
  };

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

  // Listeners nativos de Touch e Wheel para suporte fluido a gesto de pinça (Pinch to Zoom), Pan e Roda do Mouse
  useEffect(() => {
    if (modoVisualizacao !== 'canvas') return;
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
      } else if (e.touches.length === 1) {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('[data-no-id]') || target.closest('button') || target.closest('input');

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

          const nextZoom = Math.max(0.25, Math.min(2.2, prevZoom * scaleFactor));

          const worldX = (currFocalX - prevPan.x) / prevZoom;
          const worldY = (currFocalY - prevPan.y) / prevZoom;

          const nextPanX = currFocalX - worldX * nextZoom;
          const nextPanY = currFocalY - worldY * nextZoom;

          zoomRef.current = nextZoom;
          panOffsetRef.current = { x: nextPanX, y: nextPanY };
          lastPinchDist = currDist;
          lastFocalX = currFocalX;
          lastFocalY = currFocalY;

          updateTransformDirect(nextPanX, nextPanY, nextZoom);

          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            setZoom(Number(nextZoom.toFixed(3)));
            setPanOffset({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
          });
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
  }, [modoVisualizacao, isFullScreen, centralizarNoOrigem]);

  // Arraste do fundo do Canvas (Pan Ultrassuave 60/120 FPS Desktop)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;

    // Ignora cliques que atingiram caixas de nós ou botões
    if (
      (e.target as HTMLElement).closest('[data-no-id]') ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('input')
    ) {
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

  // Arraste de Caixas de Nós no Canvas (Ultrafluido 1:1 sem deltas cumulativos)
  const handleNodePointerDown = (e: React.PointerEvent, no: NoFluxogramaComplexo) => {
    e.stopPropagation();
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    setArrastandoNoId(no.id);
    setNoSelecionadoId(no.id);
    nodeDragRef.current = {
      ativo: true,
      noId: no.id,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: no.posicaoX ?? 50,
      initialNodeY: no.posicaoY ?? 50,
      ultimoX: no.posicaoX ?? 50,
      ultimoY: no.posicaoY ?? 50,
      rafId: null,
    };
  };

  const handleNodePointerMove = (e: React.PointerEvent) => {
    if (!nodeDragRef.current.ativo || !nodeDragRef.current.noId) return;

    const dx = (e.clientX - nodeDragRef.current.startX) / zoom;
    const dy = (e.clientY - nodeDragRef.current.startY) / zoom;
    const novoX = Math.max(10, Math.round(nodeDragRef.current.initialNodeX + dx));
    const novoY = Math.max(10, Math.round(nodeDragRef.current.initialNodeY + dy));

    nodeDragRef.current.ultimoX = novoX;
    nodeDragRef.current.ultimoY = novoY;

    if (nodeDragRef.current.rafId) {
      cancelAnimationFrame(nodeDragRef.current.rafId);
    }

    nodeDragRef.current.rafId = requestAnimationFrame(() => {
      const alvoId = nodeDragRef.current.noId;
      if (!alvoId) return;
      const novosNos = dados.nos.map(n => n.id === alvoId ? { ...n, posicaoX: novoX, posicaoY: novoY } : n);
      onChange({ ...dados, nos: novosNos });
    });
  };

  const handleNodePointerUp = (e: React.PointerEvent) => {
    if (nodeDragRef.current.ativo) {
      if (nodeDragRef.current.rafId) {
        cancelAnimationFrame(nodeDragRef.current.rafId);
      }
      const alvoId = nodeDragRef.current.noId;
      const finalX = nodeDragRef.current.ultimoX;
      const finalY = nodeDragRef.current.ultimoY;
      if (alvoId) {
        const novosNos = dados.nos.map(n => n.id === alvoId ? { ...n, posicaoX: finalX, posicaoY: finalY } : n);
        onChange({ ...dados, nos: novosNos });
      }
      nodeDragRef.current.ativo = false;
      nodeDragRef.current.noId = null;
      setArrastandoNoId(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Parser do JSON Colado
  const handleAplicarJson = () => {
    setJsonErro(null);
    try {
      const parsed = JSON.parse(jsonColarTexto);
      const data = parsed.fluxogramaComplexo || parsed.fluxograma || parsed;
      if (!Array.isArray(data.nos) || data.nos.length === 0) {
        throw new Error('O JSON precisa conter um array "nos" com os blocos do algoritmo.');
      }

      const novosDados: FluxogramaComplexoDados = {
        id: data.id || `fluxo-${Date.now()}`,
        titulo: data.titulo || dados.titulo || 'Fluxograma Clínico',
        descricao: data.descricao || dados.descricao,
        noInicialId: data.noInicialId || data.nos[0]?.id || 'no-1',
        nos: data.nos.map((n: any, idx: number) => ({
          id: n.id || `no-${idx + 1}`,
          titulo: n.titulo || `Etapa ${idx + 1}`,
          descricao: n.descricao || '',
          tipo: n.tipo || 'conduta',
          posicaoX: typeof n.posicaoX === 'number' ? n.posicaoX : 50 + (idx % 3) * 320,
          posicaoY: typeof n.posicaoY === 'number' ? n.posicaoY : 40 + Math.floor(idx / 3) * 160,
          oculto: n.oculto !== undefined ? !!n.oculto : (n.tipo === 'conduta' || n.tipo === 'alerta'),
          dica: n.dica,
          ramos: Array.isArray(n.ramos) ? n.ramos.map((r: any, rIdx: number) => ({
            id: r.id || `r-${idx}-${rIdx}`,
            rotulo: r.rotulo || r.criterio || 'Sim',
            destinoNoId: r.destinoNoId || r.destinoId || '',
            cor: r.cor || 'verde',
          })) : []
        }))
      };

      onChange(novosDados);
      setModoVisualizacao('canvas');
      setJsonColarTexto('');
    } catch (err: any) {
      setJsonErro(err.message || 'JSON inválido');
    }
  };

  const promptExemploGemini = `Você é um preceptor médico. Crie um FLUXOGRAMA MÉDICO COMPLEXO COM RAMIFICAÇÕES E ÁRVORE DE DECISÃO sobre: "[TEMA DA CONDUTA]".
Retorne APENAS um objeto JSON no formato:
{
  "titulo": "Título do Algoritmo Clínico",
  "descricao": "Resumo do protocolo",
  "noInicialId": "no-1",
  "nos": [
    {
      "id": "no-1",
      "titulo": "Triagem ou pergunta inicial?",
      "descricao": "Exames imediatos e conduta",
      "tipo": "inicio",
      "ramos": [
        { "id": "r1", "rotulo": "Sim / Positivo", "destinoNoId": "no-2", "cor": "vermelho" },
        { "id": "r2", "rotulo": "Não / Negativo", "destinoNoId": "no-3", "cor": "verde" }
      ]
    },
    {
      "id": "no-2",
      "titulo": "Conduta de Emergência",
      "descricao": "Dose de drogas e medidas prioritárias",
      "tipo": "alerta",
      "oculto": true,
      "ramos": []
    },
    {
      "id": "no-3",
      "titulo": "Investigação Ambulatorial",
      "descricao": "Estratificação e seguimento",
      "tipo": "conduta",
      "oculto": true,
      "ramos": []
    }
  ]
}`;

  return (
    <div 
      className={`transition-all ${
        isFullScreen 
          ? 'fixed inset-0 z-50 w-screen h-screen flex flex-col p-2 sm:p-3 overflow-hidden select-none' 
          : 'space-y-3'
      }`}
      style={{
        backgroundColor: isFullScreen ? currentTheme.canvasBg : undefined
      }}
    >
      {/* =================================================================== */}
      {/* BARRA SUPERIOR DO CONSTRUTOR: MODOS & FERRAMENTAS CENTRALIZADAS     */}
      {/* =================================================================== */}
      <div className={`w-full flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-xs shadow-xs transition-all shrink-0 ${
        currentTheme.id === 'dark' 
          ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/40' 
          : currentTheme.id === 'blueprint'
          ? 'bg-sky-950/95 border-sky-900 text-sky-100 shadow-sky-950/40'
          : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-200/50'
      }`}>
        {/* Grupo 1: Seletor de Modo (Canvas vs Árvore vs JSON) */}
        <div className="flex items-center gap-0.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setModoVisualizacao('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              modoVisualizacao === 'canvas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVisualizacao('lista')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              modoVisualizacao === 'lista'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Árvore</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVisualizacao('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              modoVisualizacao === 'json'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>

        {/* Grupo 2: Ferramentas do Canvas (Centralizar, Auto-Organizar, Zoom e Temas) */}
        {modoVisualizacao === 'canvas' && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 shrink-0">
            {/* Botão de Alvo: Recentralizar Visão na Caixa 1 / Bloco Inicial */}
            <button
              type="button"
              onClick={() => centralizarNoOrigem()}
              title="Recentralizar tela no Bloco Inicial (Caixa 1)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 font-bold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Recentralizar</span>
            </button>

            {/* Auto-Organizar nós */}
            <button
              type="button"
              onClick={handleAutoOrganizar}
              title="Auto-organizar layout das caixas em cascata limpa"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 font-bold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden md:inline">Auto-Organizar</span>
            </button>

            {/* Controle de Zoom */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.35, +(z - 0.1).toFixed(2)))}
                title="Diminuir Zoom (-10%)"
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer active:scale-90 transition-all"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.60)}
                title="Toque para redefinir para 60% (Panorâmico)"
                className="text-[10px] font-bold px-2 py-0.5 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-md cursor-pointer transition-all"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(2)))}
                title="Aumentar Zoom (+10%)"
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer active:scale-90 transition-all"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Seletor de Tema Visual: Claro, Escuro, Blueprint */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] shadow-2xs">
              <button
                type="button"
                onClick={() => handleTrocarTema('light')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  themeId === 'light' 
                    ? 'bg-amber-100 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tema Claro"
              >
                <Sun className="w-3 h-3 text-amber-600" />
                <span className="hidden lg:inline">Claro</span>
              </button>
              <button
                type="button"
                onClick={() => handleTrocarTema('dark')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  themeId === 'dark' 
                    ? 'bg-slate-700 text-white font-bold shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tema Escuro"
              >
                <Moon className="w-3 h-3 text-indigo-400" />
                <span className="hidden lg:inline">Escuro</span>
              </button>
              <button
                type="button"
                onClick={() => handleTrocarTema('blueprint')}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  themeId === 'blueprint' 
                    ? 'bg-blue-900 text-cyan-200 font-bold shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tema Blueprint"
              >
                <Compass className="w-3 h-3 text-sky-500" />
                <span className="hidden lg:inline">Blueprint</span>
              </button>
            </div>
          </div>
        )}

        {/* Grupo 3: Ações Principais (+ Novo Bloco e Tela Cheia) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleAdicionarNo('decisao')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Bloco</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreen(prev => !prev)}
            title={isFullScreen ? "Restaurar visualização normal (Esc)" : "Expandir para Tela Cheia (Foco Total)"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer active:scale-95 shadow-2xs ${
              isFullScreen
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/50'
                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span>Restaurar</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* DRAWER / MODAL DE MODELOS PRONTOS                                    */}
      {/* =================================================================== */}
      {mostrarModelos && (
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Selecione um Algoritmo Clínico de Exemplo:
            </span>
            <button
              type="button"
              onClick={() => setMostrarModelos(false)}
              className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS_FLUXOGRAMAS_COMPLEXOS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange({ ...preset.dados, id: `fluxo-${Date.now()}` });
                  setNoSelecionadoId(preset.dados.noInicialId || preset.dados.nos[0]?.id || '');
                  setMostrarModelos(false);
                }}
                className="p-2.5 rounded-lg bg-white border border-amber-200 hover:border-emerald-500 hover:shadow-xs text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-slate-800 text-[11px] group-hover:text-emerald-700">
                  {preset.nome}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                  {preset.descricao}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODO 1: CANVAS INTERATIVO DE BRAINSTORMING (ARRASSO + SETAS SVG)   */}
      {/* =================================================================== */}
      {modoVisualizacao === 'canvas' && (
        <div className={`w-full ${isFullScreen ? 'flex-1 min-h-0 flex flex-col' : 'space-y-2'}`}>
          {/* O Canvas propriamente dito (Ultrafluido e Amplo) */}
          <div 
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            className={`relative w-full rounded-xl sm:rounded-2xl overflow-hidden border shadow-inner select-none cursor-grab active:cursor-grabbing transition-all ${
              currentTheme.canvasBorderClass
            } ${
              isFullScreen ? 'flex-1 h-full w-full min-h-0' : 'h-[580px] sm:h-[660px]'
            }`}
            style={{
              backgroundImage: `radial-gradient(${currentTheme.gridDotColor} 1.15px, transparent 1.15px)`,
              backgroundSize: currentTheme.gridSize,
              backgroundColor: currentTheme.canvasBg,
              touchAction: 'none',
              overscrollBehavior: 'contain',
            }}
          >
            {/* Contêiner transformável por Zoom e Pan com alta taxa de quadros */}
            <div
              ref={contentLayerRef}
              className="absolute inset-0"
              style={{
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom})`,
                transformOrigin: '0 0',
                width: '3200px',
                height: '2600px',
                willChange: arrastandoCanvas || !!arrastandoNoId ? 'transform' : 'auto',
              }}
            >
              {/* Camada SVG para desenhar as setas conectando os nós */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  {CORES_RAMO.map(c => (
                    <marker
                      key={c.id}
                      id={`seta-${c.id}`}
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

                {dados.nos.map(origem => {
                  const ox = origem.posicaoX ?? 50;
                  const oy = origem.posicaoY ?? 50;

                  return origem.ramos.map((ramo, ramoIdx) => {
                    const destino = dados.nos.find(n => n.id === ramo.destinoNoId);
                    if (!destino) return null;

                    const dx = destino.posicaoX ?? 50;
                    const dy = destino.posicaoY ?? 50;

                    // Mapeamento de concorrência de conexões entrando no mesmo destino
                    const ramosEntrandoDestino = dados.nos.flatMap(n => n.ramos).filter(r => r.destinoNoId === destino.id);
                    const entradaIdx = ramosEntrandoDestino.findIndex(r => r.id === ramo.id);
                    const totalEntradas = ramosEntrandoDestino.length;

                    // Conexão dinâmica calculada com distribuição anti-sobreposição
                    const conexao = calcularConexaoDinamica(
                      ox,
                      oy,
                      dx,
                      dy,
                      240,
                      125,
                      ramoIdx,
                      origem.ramos.length,
                      entradaIdx >= 0 ? entradaIdx : 0,
                      totalEntradas
                    );
                    const corObj = CORES_RAMO.find(c => c.id === ramo.cor) || CORES_RAMO[0];

                    const labelTexto = ramo.rotulo || '';
                    const textoExibicao = labelTexto.length > 24 ? labelTexto.substring(0, 22) + '...' : labelTexto;
                    const larguraPill = Math.max(50, Math.min(150, Math.round(textoExibicao.length * 7.5 + 24)));
                    const pillX = -larguraPill / 2;

                    return (
                      <g key={ramo.id} className="pointer-events-auto">
                        {/* Linha da Seta Dinâmica com Bézier ortogonal e bordas arredondadas */}
                        <path
                          d={conexao.pathData}
                          fill="none"
                          stroke={corObj.hex}
                          strokeWidth={obterStrokeWidthSeta(ramo.espessura)}
                          strokeDasharray={obterDashArraySeta(ramo.estilo)}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          markerEnd={`url(#seta-${ramo.cor || 'verde'})`}
                          className="transition-all hover:stroke-[4]"
                        />

                        {/* Rótulo da Seta em Pílula Centralizada no Trajeto adaptado ao tema */}
                        {labelTexto.trim() && (
                          <g 
                            transform={`translate(${conexao.midX}, ${conexao.midY})`}
                            onClick={() => setNoSelecionadoId(origem.id)}
                            className="cursor-pointer"
                          >
                            <rect
                              x={pillX}
                              y="-11"
                              width={larguraPill}
                              height="22"
                              rx="11"
                              fill={currentTheme.arrowPillFill}
                              stroke={corObj.hex}
                              strokeWidth="1.5"
                              className="shadow-sm"
                            />
                            <text
                              x="0"
                              y="3.5"
                              textAnchor="middle"
                              fill={currentTheme.arrowPillTextFill}
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {textoExibicao}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  });
                })}
              </svg>

              {/* Nós Renderizados como Cards no Canvas */}
              {dados.nos.map(no => {
                const isSelected = no.id === noSelecionadoId;
                const isInicial = no.id === dados.noInicialId;
                const indiceNo = getIndiceNo(no.id);

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
                    onPointerDown={(e) => handleNodePointerDown(e, no)}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    onPointerCancel={handleNodePointerUp}
                    onClick={() => setNoSelecionadoId(no.id)}
                    style={{
                      left: `${no.posicaoX ?? 50}px`,
                      top: `${no.posicaoY ?? 50}px`,
                      width: '240px',
                    }}
                    className={`absolute p-3 rounded-xl ${currentTheme.cardBgClass} border-2 transition-shadow ${currentTheme.cardShadowClass} cursor-grab active:cursor-grabbing select-none ${
                      isInicial ? 'ring-2 ring-amber-400 shadow-amber-500/20' : ''
                    } ${
                      isSelected ? `${corBorda} ring-4 ring-emerald-500/30 shadow-lg scale-102` : `${currentTheme.cardBorderClass} hover:border-slate-400`
                    }`}
                  >
                    {/* Header do Card com Caixa N, Tipo e Badge de Oclusão */}
                    <div className={`flex items-center justify-between gap-1 pb-1.5 border-b ${currentTheme.cardDividerClass}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isInicial ? 'bg-amber-400 text-slate-950 font-black shadow-2xs' : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}>
                          {isInicial ? `★ Caixa ${indiceNo}` : `Caixa ${indiceNo}`}
                        </span>

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          no.tipo === 'inicio' ? 'bg-blue-950 text-blue-300 border border-blue-800/60' :
                          no.tipo === 'alerta' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' :
                          no.tipo === 'decisao' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                          no.tipo === 'diagnostico' ? 'bg-purple-950 text-purple-300 border border-purple-800/60' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        }`}>
                          {no.tipo === 'inicio' ? 'Início' :
                           no.tipo === 'decisao' ? 'Decisão' :
                           no.tipo === 'conduta' ? 'Conduta' :
                           no.tipo === 'alerta' ? 'Alerta' : 'Final'}
                        </span>

                        {no.oculto && (
                          <span className="text-[8.5px] px-1 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 flex items-center gap-0.5">
                            <EyeOff className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Botão de Excluir Bloco */}
                      {dados.nos.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoverNo(no.id);
                          }}
                          title="Excluir esta caixa"
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Título e Descrição */}
                    <div className="pt-2 pb-1 space-y-1">
                      <div className={`text-[11px] font-bold ${currentTheme.cardTitleClass} line-clamp-2 leading-tight`}>
                        {no.titulo || <span className={`${currentTheme.cardMutedClass} italic font-normal`}>(Toque para dar um título)</span>}
                      </div>
                      {no.descricao ? (
                        <div className={`text-[9.5px] ${currentTheme.cardDescClass} leading-snug`}>
                          <FormattedClinicalText text={no.descricao} />
                        </div>
                      ) : null}
                    </div>

                    {/* Botões Rápidos de Ação no Bloco: Unificar e Ramificar */}
                    <div className={`pt-2 flex items-center justify-between border-t ${currentTheme.cardDividerClass} gap-1`}>
                      <span className={`text-[9px] ${currentTheme.cardMutedClass}`}>
                        {no.ramos.length} {no.ramos.length === 1 ? 'saída' : 'saídas'}
                      </span>

                      <div className="flex items-center gap-1">
                        {dados.nos.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAbrirUnificar(no.id);
                            }}
                            title="Ligar esta caixa a outra existente"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950/90 hover:bg-sky-900 border border-sky-600/50 text-sky-200 text-[9px] font-bold transition-all cursor-pointer active:scale-95"
                          >
                            <GitFork className="w-2.5 h-2.5 text-sky-400" />
                            <span>Ligar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdicionarRamo(no.id);
                          }}
                          title="Criar nova caixa conectada por seta"
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/90 hover:bg-emerald-600 text-white text-[9.5px] font-bold transition-all cursor-pointer active:scale-95"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Seta</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODO 2: ÁRVORE ESTRUTURADA (LISTA RESPONSIVA PARA MOBILE)          */}
      {/* =================================================================== */}
      {modoVisualizacao === 'lista' && (
        <div className="space-y-2.5 animate-in fade-in">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Sequência de Blocos & Decisões ({dados.nos.length})
              </span>
              <button
                type="button"
                onClick={() => handleAdicionarNo('decisao')}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Bloco</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {dados.nos.map((no, idx) => {
                const isSelected = no.id === noSelecionadoId;

                return (
                  <div
                    key={no.id}
                    onClick={() => setNoSelecionadoId(no.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          {no.titulo || 'Bloco sem título'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          no.tipo === 'inicio' ? 'bg-blue-100 text-blue-800' :
                          no.tipo === 'alerta' ? 'bg-rose-100 text-rose-800' :
                          no.tipo === 'decisao' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {no.tipo}
                        </span>
                        {dados.nos.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoverNo(no.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {no.descricao && (
                      <div className="text-[10.5px] text-slate-600 mt-1 leading-relaxed">
                        <FormattedClinicalText text={no.descricao} />
                      </div>
                    )}

                    {/* Ramificações deste Nó */}
                    {no.ramos.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9.5px] font-semibold text-slate-400">
                          Caminhos:
                        </span>
                        {no.ramos.map(r => {
                          const destino = dados.nos.find(n => n.id === r.destinoNoId);
                          return (
                            <span 
                              key={r.id} 
                              className="text-[9.5px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1 shadow-2xs"
                            >
                              <span>{r.rotulo}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                              <span className="font-bold text-slate-900">{destino?.titulo || 'Próximo'}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODO 3: COLAR JSON DO GEMINI / CHATGPT                             */}
      {/* =================================================================== */}
      {modoVisualizacao === 'json' && (
        <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in">
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Colar Algoritmo Gerado pela IA (Gemini / Claude / ChatGPT)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cole o objeto JSON gerado pelo seu Gemini externo para criar instantaneamente toda a árvore de decisão ramificada.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await navigator.clipboard?.writeText(promptExemploGemini);
                setCopiadoPrompt(true);
                setTimeout(() => setCopiadoPrompt(false), 3000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px] hover:bg-indigo-100 cursor-pointer"
            >
              {copiadoPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiadoPrompt ? 'Prompt Copiado!' : 'Copiar Prompt para o Gemini'}</span>
            </button>
          </div>

          <textarea
            value={jsonColarTexto}
            onChange={(e) => setJsonColarTexto(e.target.value)}
            placeholder='Cole aqui o JSON gerado pelo Gemini... ex: { "titulo": "...", "nos": [...] }'
            rows={8}
            className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[11px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {jsonErro && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{jsonErro}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleAplicarJson}
              disabled={!jsonColarTexto.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-200 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              Aplicar ao Fluxograma
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* INSPETOR / PAINEL DE EDIÇÃO COMPACTO E MODERNO                      */}
      {/* =================================================================== */}
      {noAtual && (
        <div className={`p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-md space-y-3.5 ${
          isFullScreen 
            ? 'absolute bottom-2 left-2 right-2 sm:left-auto sm:right-3 sm:w-[540px] z-30 max-h-[80vh] overflow-y-auto shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2' 
            : ''
        }`}>
          {/* Navegação Rápida entre Caixas (Tabs Horizontais) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider pl-0.5">Caixas:</span>
            {dados.nos.map((n, idx) => {
              const isActive = n.id === noAtual.id;
              const isIni = n.id === dados.noInicialId;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNoSelecionadoId(n.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                  }`}
                >
                  <span>{isIni ? `★ Caixa ${idx + 1}` : `Caixa ${idx + 1}`}</span>
                  {n.titulo ? (
                    <span className="max-w-[70px] truncate opacity-70 font-normal text-[10px]">
                      ({n.titulo})
                    </span>
                  ) : null}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleAdicionarNo('decisao')}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shrink-0 transition-all flex items-center gap-1 cursor-pointer"
              title="Criar nova caixa"
            >
              <Plus className="w-3 h-3" />
              <span>Caixa</span>
            </button>
          </div>

          {/* Cabeçalho da Caixa Selecionada com Ações Rápidas */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                noAtual.id === dados.noInicialId ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'bg-slate-800 text-slate-200'
              }`}>
                {noAtual.id === dados.noInicialId ? `★ Caixa ${getIndiceNo(noAtual.id)}` : `Caixa ${getIndiceNo(noAtual.id)}`}
              </span>
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {noAtual.titulo || <span className="text-slate-400 italic font-normal">Sem título</span>}
              </h4>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Definir como Bloco Inicial */}
              <button
                type="button"
                onClick={() => onChange({ ...dados, noInicialId: noAtual.id })}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                  noAtual.id === dados.noInicialId
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={noAtual.id === dados.noInicialId ? 'Esta é a caixa inicial' : 'Definir como caixa inicial'}
              >
                <Target className={`w-3 h-3 ${noAtual.id === dados.noInicialId ? 'text-amber-600' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">{noAtual.id === dados.noInicialId ? 'Inicial' : 'Definir Início'}</span>
              </button>

              {/* Ocultar no Treino */}
              <button
                type="button"
                onClick={() => handleAtualizarNo(noAtual.id, { oculto: !noAtual.oculto })}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                  noAtual.oculto
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={noAtual.oculto ? 'Oculto para treino ativo' : 'Visível'}
              >
                {noAtual.oculto ? <EyeOff className="w-3 h-3 text-rose-600" /> : <Eye className="w-3 h-3 text-slate-500" />}
                <span className="hidden sm:inline">{noAtual.oculto ? 'Oculto' : 'Visível'}</span>
              </button>

              {/* Excluir Caixa */}
              {dados.nos.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoverNo(noAtual.id)}
                  title="Excluir esta caixa"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Fechar Inspetor */}
              <button
                type="button"
                onClick={() => setNoSelecionadoId('')}
                title="Fechar painel"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tipo da Caixa (Seletor Segmentado Compacto) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Tipo da Caixa:
            </label>
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              {[
                { id: 'inicio', rotulo: 'Início', dot: '🔵', bgActive: 'bg-blue-600 text-white' },
                { id: 'decisao', rotulo: 'Decisão', dot: '🟡', bgActive: 'bg-amber-500 text-white' },
                { id: 'conduta', rotulo: 'Conduta', dot: '🟢', bgActive: 'bg-emerald-600 text-white' },
                { id: 'alerta', rotulo: 'Alerta', dot: '🔴', bgActive: 'bg-rose-600 text-white' },
                { id: 'diagnostico', rotulo: 'Final', dot: '🟣', bgActive: 'bg-purple-600 text-white' },
              ].map(t => {
                const isSelected = noAtual.tipo === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleAtualizarNo(noAtual.id, { tipo: t.id as any })}
                    className={`py-1 px-1 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? `${t.bgActive} shadow-xs scale-102`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="text-[9px]">{t.dot}</span>
                    <span className="truncate">{t.rotulo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título e Conduta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Título da Caixa */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-700 block">
                Título da Caixa:
              </label>
              <input
                type="text"
                value={noAtual.titulo}
                onChange={(e) => handleAtualizarNo(noAtual.id, { titulo: e.target.value })}
                placeholder="Ex: ECG com Supra ST? / Paciente Instável?"
                className="w-full p-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Resposta / Conteúdo Detalhado da Caixa */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label 
                  htmlFor={`textarea-no-descricao-${noAtual.id}`}
                  className="text-[10.5px] font-bold text-slate-700 block"
                >
                  Resposta / Conteúdo Detalhado:
                </label>
                <ClinicalFormatToolbar
                  targetInputId={`textarea-no-descricao-${noAtual.id}`}
                  valorAtual={noAtual.descricao}
                  onValorChange={(val) => handleAtualizarNo(noAtual.id, { descricao: val })}
                  compacto={true}
                  mostrarTopico={true}
                />
              </div>
              <textarea
                id={`textarea-no-descricao-${noAtual.id}`}
                value={noAtual.descricao}
                onChange={(e) => handleAtualizarNo(noAtual.id, { descricao: e.target.value })}
                rows={3}
                placeholder="Ex: • AAS 200mg mastigado&#10;• ==Clopidogrel 300mg==&#10;• Heparina não fracionada IV"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white leading-relaxed"
              />
              {noAtual.descricao && (
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-800 leading-relaxed">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Prévia:</div>
                  <FormattedClinicalText text={noAtual.descricao} />
                </div>
              )}
            </div>
          </div>

          {/* Setas e Saídas Conectadas */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5 text-emerald-600" />
                Setas de Saída ({noAtual.ramos.length})
              </span>

              <div className="flex items-center gap-1">
                {dados.nos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleAbrirUnificar(noAtual.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-[10.5px] cursor-pointer transition-all"
                    title="Ligar esta caixa a outra existente"
                  >
                    <GitFork className="w-3 h-3 text-sky-600" />
                    <span>Ligar a Caixa</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleAdicionarRamo(noAtual.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] cursor-pointer shadow-xs transition-all"
                  title="Criar nova caixa conectada por seta"
                >
                  <Plus className="w-3 h-3" />
                  <span>Seta</span>
                </button>
              </div>
            </div>

            {noAtual.ramos.length === 0 ? (
              <div className="p-2.5 text-center bg-slate-50 rounded-xl border border-slate-200/70 text-[10.5px] text-slate-500">
                Esta caixa não possui saídas. Clique em <strong>"Seta"</strong> para ramificar ou <strong>"Ligar a Caixa"</strong> para conectar a uma existente.
              </div>
            ) : (
              <div className="space-y-2">
                {noAtual.ramos.map((ramo) => {
                  const corAtualObj = CORES_RAMO.find(c => c.id === ramo.cor) || CORES_RAMO[0];

                  return (
                    <div
                      key={ramo.id}
                      className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs space-y-2"
                    >
                      {/* Linha 1: Texto na Seta + Leva para Caixa + Botão Excluir */}
                      <div className="flex items-center gap-2">
                        {/* Texto na Seta */}
                        <div className="flex-1 space-y-0.5">
                          <span className="text-[9.5px] font-bold text-slate-600">Texto na Seta:</span>
                          <input
                            type="text"
                            value={ramo.rotulo}
                            onChange={(e) => handleAtualizarRamo(noAtual.id, ramo.id, { rotulo: e.target.value })}
                            placeholder="Ex: Sim / Não / K+ < 3.5"
                            className="w-full p-1.5 px-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Leva para Caixa */}
                        <div className="flex-1 space-y-0.5">
                          <span className="text-[9.5px] font-bold text-slate-600">Leva para:</span>
                          <select
                            value={ramo.destinoNoId}
                            onChange={(e) => handleAtualizarRamo(noAtual.id, ramo.id, { destinoNoId: e.target.value })}
                            className="w-full p-1.5 px-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          >
                            {dados.nos.filter(n => n.id !== noAtual.id).map(n => (
                              <option key={n.id} value={n.id}>
                                {getRotuloResumidoNo(n)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Excluir Seta */}
                        <button
                          type="button"
                          onClick={() => handleRemoverRamo(noAtual.id, ramo.id)}
                          className="p-1.5 mt-3.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Excluir seta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Linha 2: Customização da Seta (Estilo da Linha + Cores Circulares sem poluição de texto) */}
                      <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                        {/* Seletor de Estilo da Linha (Sólida, Tracejada, Pontilhada) */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9.5px] font-bold text-slate-500 mr-1">Estilo:</span>
                          {[
                            { id: 'solida', rotulo: '─ Sólida' },
                            { id: 'tracejada', rotulo: '╌ Tracejada' },
                            { id: 'pontilhada', rotulo: '┈ Pontilhada' },
                          ].map(st => {
                            const isSelected = (ramo.estilo || 'solida') === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleAtualizarRamo(noAtual.id, ramo.id, { estilo: st.id as any })}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-800 text-white shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {st.rotulo}
                              </button>
                            );
                          })}
                        </div>

                        {/* Seletor de Cores Apenas Círculos (Sem nomes poluindo a tela) */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9.5px] font-bold text-slate-500 mr-1">Cor:</span>
                          <div className="flex items-center gap-1 bg-white p-0.5 px-1 rounded-full border border-slate-200">
                            {CORES_RAMO.map(c => {
                              const isSelected = (ramo.cor || 'verde') === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleAtualizarRamo(noAtual.id, ramo.id, { cor: c.id })}
                                  title={c.rotulo}
                                  className={`w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                                    isSelected
                                      ? 'ring-2 ring-slate-900 scale-110 shadow-xs'
                                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL SUSPENSO: UNIFICAR / LIGAR A CAIXA EXISTENTE                 */}
      {/* =================================================================== */}
      {modalUnificar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 border border-slate-200 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ligar a Caixa Existente</h3>
                  <p className="text-[10.5px] text-slate-500">Conecte a caixa atual a outra sem duplicar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalUnificar(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Escolha da Caixa de Destino */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Escolha a Caixa de Destino:
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-1.5 bg-slate-50/50">
                {dados.nos
                  .filter(n => n.id !== modalUnificar.origemId)
                  .map(noDestino => {
                    const selecionado = modalUnificar.destinoId === noDestino.id;
                    return (
                      <button
                        key={noDestino.id}
                        type="button"
                        onClick={() => {
                          const novaCor = obterProximaCorDistinta(modalUnificar.origemId, noDestino.id);
                          setModalUnificar({
                            ...modalUnificar,
                            destinoId: noDestino.id,
                            cor: novaCor
                          });
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                          selecionado
                            ? 'bg-sky-600 text-white font-bold shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/60'
                        }`}
                      >
                        <span className="truncate flex-1 mr-2">
                          {getRotuloResumidoNo(noDestino)}
                        </span>
                        {selecionado && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Texto na Seta */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Texto na Seta:
                </label>
                <div className="flex items-center gap-1">
                  {['Sim', 'Não', 'Refratário', 'Alternativa'].map(sugestao => (
                    <button
                      key={sugestao}
                      type="button"
                      onClick={() => setModalUnificar({ ...modalUnificar, rotulo: sugestao })}
                      className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={modalUnificar.rotulo}
                onChange={(e) => setModalUnificar({ ...modalUnificar, rotulo: e.target.value })}
                placeholder="Ex: Não / Falha terapêutica / Se instável"
                className="w-full p-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Estilo da Seta no Modal */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Estilo da Seta:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'solida', rotulo: '─ Sólida' },
                  { id: 'tracejada', rotulo: '╌ Tracejada' },
                  { id: 'pontilhada', rotulo: '┈ Pontilhada' },
                ].map(st => {
                  const isSelected = (modalUnificar.estilo || 'solida') === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setModalUnificar({ ...modalUnificar, estilo: st.id as any })}
                      className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {st.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cor da Seta (Círculos sem poluição de nomes) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Cor da Seta:
              </label>
              <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50">
                {CORES_RAMO.map(c => {
                  const isSelected = modalUnificar.cor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setModalUnificar({ ...modalUnificar, cor: c.id })}
                      title={c.rotulo}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'ring-3 ring-slate-900 scale-110 shadow-xs'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalUnificar(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarUnificar}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Confirmar Ligação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
