import React, { useState, useEffect } from 'react';
import { 
  Play, 
  BookOpen,
  CheckCircle2, 
  Search, 
  X, 
  Target, 
  Clock, 
  ChevronRight, 
  Brain, 
  Activity, 
  HeartPulse, 
  Zap, 
  ShieldAlert, 
  Stethoscope,
  Palette,
  Check,
  Calendar,
  SlidersHorizontal,
  Sparkles,
  Eye
} from 'lucide-react';
import { CardClinico, ProgressoDiario, EixoClinico, EspecialidadeMedica } from '../types';
import { EixoEmojiBadge } from './EixoEmojiBadge';

interface DashboardOverviewProps {
  progresso: ProgressoDiario;
  cardsPendentes: CardClinico[];
  cardsTotal?: CardClinico[];
  eixos: EixoClinico[];
  busca: string;
  onBuscaChange: (val: string) => void;
  onIniciarRevisao: (filtroCards?: CardClinico[]) => void;
  onAbrirCard: (card: CardClinico) => void;
  onCarregarExemplo?: () => void;
  onResetarDados?: () => void;
}

export type EstiloCardBoasVindas = 
  | 'navy_cirurgico'
  | 'grafite_carbono'
  | 'esmeralda_clinico'
  | 'ametista_real'
  | 'titanio_dark'
  | 'clean_executivo';

export interface TemaConfig {
  id: EstiloCardBoasVindas;
  nome: string;
  subtitulo: string;
  cardClasses: string;
  isDark: boolean;
  tituloCor: string;
  subtituloCor: string;
  pendenteCor: string;
  emDiaCor: string;
  progressoFundo: string;
  progressoBarra: string;
  metaTexto: string;
  metaValor: string;
  bordaDivisor: string;
  chipFundo: string;
  chipBorda: string;
  chipTextoPrimario: string;
  chipTextoSecundario: string;
  chipIconeCor: string;
  previewGradient: string;
}

export const TEMAS_CARD: TemaConfig[] = [
  {
    id: 'navy_cirurgico',
    nome: 'Safira Cirúrgico',
    subtitulo: 'Azul marinho profundo com acentos ciano e contraste cristalino',
    cardClasses: 'bg-gradient-to-br from-[#060f1e] via-[#09172e] to-[#040914] border border-blue-500/40 shadow-xl ring-1 ring-blue-500/20',
    isDark: true,
    tituloCor: 'text-white font-extrabold',
    subtituloCor: 'text-blue-100 font-medium',
    pendenteCor: 'text-rose-400 font-bold',
    emDiaCor: 'text-emerald-300 font-bold',
    progressoFundo: 'bg-blue-950/80 border border-blue-800/40',
    progressoBarra: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]',
    metaTexto: 'text-blue-100 font-bold',
    metaValor: 'text-blue-200/90 font-semibold',
    bordaDivisor: 'border-white/10',
    chipFundo: 'bg-blue-950/90 hover:bg-blue-900/90 backdrop-blur-xs',
    chipBorda: 'border-blue-400/40',
    chipTextoPrimario: 'text-cyan-200 font-black',
    chipTextoSecundario: 'text-blue-300 font-bold',
    chipIconeCor: 'text-cyan-400',
    previewGradient: 'from-[#060f1e] via-[#09172e] to-[#1e3a8a]',
  },
  {
    id: 'clean_executivo',
    nome: 'Branco Clínico Pro',
    subtitulo: 'Branco puro hospitalar com contraste profundo e zero tons lavados',
    cardClasses: 'bg-white border-2 border-slate-200/90 shadow-md ring-1 ring-slate-900/5',
    isDark: false,
    tituloCor: 'text-slate-950 font-extrabold',
    subtituloCor: 'text-slate-600 font-medium',
    pendenteCor: 'text-rose-600 font-bold',
    emDiaCor: 'text-emerald-600 font-bold',
    progressoFundo: 'bg-slate-100 border border-slate-200/80',
    progressoBarra: 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xs',
    metaTexto: 'text-slate-800 font-bold',
    metaValor: 'text-slate-600 font-semibold',
    bordaDivisor: 'border-slate-100',
    chipFundo: 'bg-slate-50 hover:bg-slate-100/90',
    chipBorda: 'border-slate-300',
    chipTextoPrimario: 'text-slate-950 font-black',
    chipTextoSecundario: 'text-slate-600 font-bold',
    chipIconeCor: 'text-slate-700',
    previewGradient: 'from-white via-slate-50 to-slate-200',
  },
  {
    id: 'grafite_carbono',
    nome: 'Obsidiana Noturno',
    subtitulo: 'Preto cirúrgico acetinado com tipografia níquel de alta nitidez',
    cardClasses: 'bg-gradient-to-br from-[#09090b] via-[#121216] to-[#050507] border border-zinc-700/80 shadow-xl ring-1 ring-white/10',
    isDark: true,
    tituloCor: 'text-white font-extrabold',
    subtituloCor: 'text-zinc-300 font-medium',
    pendenteCor: 'text-rose-400 font-bold',
    emDiaCor: 'text-emerald-400 font-bold',
    progressoFundo: 'bg-zinc-900 border border-zinc-800',
    progressoBarra: 'bg-gradient-to-r from-zinc-200 via-slate-100 to-zinc-400 shadow-[0_0_10px_rgba(255,255,255,0.2)]',
    metaTexto: 'text-zinc-200 font-bold',
    metaValor: 'text-zinc-400 font-semibold',
    bordaDivisor: 'border-zinc-800',
    chipFundo: 'bg-zinc-900/95 hover:bg-zinc-800/95',
    chipBorda: 'border-zinc-700',
    chipTextoPrimario: 'text-zinc-100 font-black',
    chipTextoSecundario: 'text-zinc-400 font-bold',
    chipIconeCor: 'text-zinc-200',
    previewGradient: 'from-[#09090b] via-[#18181b] to-[#27272a]',
  },
  {
    id: 'esmeralda_clinico',
    nome: 'Esmeralda Cirúrgico',
    subtitulo: 'Verde hospitalar escuro com iluminação menta de alto contraste',
    cardClasses: 'bg-gradient-to-br from-[#021f19] via-[#043329] to-[#011410] border border-emerald-500/40 shadow-xl ring-1 ring-emerald-500/20',
    isDark: true,
    tituloCor: 'text-white font-extrabold',
    subtituloCor: 'text-emerald-100 font-medium',
    pendenteCor: 'text-rose-400 font-bold',
    emDiaCor: 'text-emerald-300 font-bold',
    progressoFundo: 'bg-emerald-950/90 border border-emerald-900',
    progressoBarra: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]',
    metaTexto: 'text-emerald-100 font-bold',
    metaValor: 'text-emerald-200/90 font-semibold',
    bordaDivisor: 'border-emerald-900/70',
    chipFundo: 'bg-emerald-950/90 hover:bg-emerald-900/90',
    chipBorda: 'border-emerald-500/50',
    chipTextoPrimario: 'text-emerald-200 font-black',
    chipTextoSecundario: 'text-emerald-300 font-bold',
    chipIconeCor: 'text-emerald-300',
    previewGradient: 'from-[#021f19] via-[#043329] to-[#065f46]',
  },
  {
    id: 'ametista_real',
    nome: 'Ametista Imperial',
    subtitulo: 'Púrpura meia-noite nobre com iluminação neon violeta sofisticada',
    cardClasses: 'bg-gradient-to-br from-[#0f091f] via-[#1a1033] to-[#090514] border border-purple-500/40 shadow-xl ring-1 ring-purple-500/20',
    isDark: true,
    tituloCor: 'text-white font-extrabold',
    subtituloCor: 'text-purple-100 font-medium',
    pendenteCor: 'text-rose-400 font-bold',
    emDiaCor: 'text-emerald-300 font-bold',
    progressoFundo: 'bg-purple-950/90 border border-purple-900',
    progressoBarra: 'bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 shadow-[0_0_12px_rgba(192,132,252,0.4)]',
    metaTexto: 'text-purple-100 font-bold',
    metaValor: 'text-purple-200/90 font-semibold',
    bordaDivisor: 'border-purple-900/60',
    chipFundo: 'bg-purple-950/90 hover:bg-purple-900/90',
    chipBorda: 'border-purple-500/40',
    chipTextoPrimario: 'text-purple-200 font-black',
    chipTextoSecundario: 'text-purple-300 font-bold',
    chipIconeCor: 'text-purple-300',
    previewGradient: 'from-[#0f091f] via-[#1a1033] to-[#4c1d95]',
  },
  {
    id: 'titanio_dark',
    nome: 'Titânio Minimal',
    subtitulo: 'Chumbo acetinado clássico com contornos de precisão técnica',
    cardClasses: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-600/70 shadow-xl ring-1 ring-white/10',
    isDark: true,
    tituloCor: 'text-white font-extrabold',
    subtituloCor: 'text-slate-300 font-medium',
    pendenteCor: 'text-rose-400 font-bold',
    emDiaCor: 'text-emerald-400 font-bold',
    progressoFundo: 'bg-slate-950 border border-slate-800',
    progressoBarra: 'bg-gradient-to-r from-blue-400 to-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]',
    metaTexto: 'text-slate-200 font-bold',
    metaValor: 'text-slate-400 font-semibold',
    bordaDivisor: 'border-slate-800',
    chipFundo: 'bg-slate-900/90 hover:bg-slate-800/90',
    chipBorda: 'border-slate-700/80',
    chipTextoPrimario: 'text-slate-200 font-black',
    chipTextoSecundario: 'text-slate-400 font-bold',
    chipIconeCor: 'text-blue-400',
    previewGradient: 'from-slate-900 via-slate-800 to-slate-950',
  },
];

const SUGESTOES_FOCO = [
  'R1 • Clínica Médica',
  'Residência Médica',
  'Plantão de Emergência',
  'Cirurgia Geral',
  'Cardiologia',
  'Terapia Intensiva (UTI)',
  'Pediatria & GO'
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  progresso,
  cardsPendentes,
  cardsTotal = [],
  busca,
  onBuscaChange,
  onIniciarRevisao,
  onAbrirCard,
}) => {
  // Estado de personalização com persistência no localStorage
  const [temaId, setTemaId] = useState<EstiloCardBoasVindas>(() => {
    return (localStorage.getItem('card_estilo_tema') as EstiloCardBoasVindas) || 'navy_cirurgico';
  });

  const [nomeUsuario, setNomeUsuario] = useState<string>(() => {
    const salvo = localStorage.getItem('card_usuario_nome');
    if (!salvo || salvo.toLowerCase() === 'laurêncio' || salvo.toLowerCase() === 'laurencio') {
      return 'Lauro';
    }
    return salvo;
  });

  const [focoClinico, setFocoClinico] = useState<string>(() => {
    return localStorage.getItem('card_foco_clinico') || 'R1 • CLÍNICA MÉDICA';
  });

  const [modalAberto, setModalAberto] = useState(false);
  const [temaTemp, setTemaTemp] = useState<EstiloCardBoasVindas>(temaId);
  const [nomeTemp, setNomeTemp] = useState(nomeUsuario);
  const [focoTemp, setFocoTemp] = useState(focoClinico);

  useEffect(() => {
    localStorage.setItem('card_estilo_tema', temaId);
  }, [temaId]);

  const temaAtual = TEMAS_CARD.find(t => t.id === temaId) || TEMAS_CARD[0];
  const temaPreview = TEMAS_CARD.find(t => t.id === temaTemp) || temaAtual;

  const metaTotal = progresso.metaDiaria || 20;
  const revisadosHoje = progresso.cardsRevisadosHoje || 0;
  const percentualMeta = Math.min(100, Math.round((revisadosHoje / metaTotal) * 100));
  const restantesMeta = Math.max(0, metaTotal - revisadosHoje);
  const totalCards = cardsTotal.length;

  // Saudação personalizada baseada no horário local e no nome configurado
  const obterSaudacaoPersonalizada = () => {
    const hora = new Date().getHours();
    let saudacao = 'Bom dia';
    if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
    else if (hora >= 18 || hora < 5) saudacao = 'Boa noite';
    return `${saudacao}, ${nomeUsuario.trim() || 'Lauro'}`;
  };

  // Data atual em formato técnico executivo
  const dataHojeFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date()).replace('.', '').toUpperCase();

  const handleSalvarPersonalizacao = () => {
    const novoNome = nomeTemp.trim() || 'Lauro';
    const novoFoco = focoTemp.trim() || 'R1 • CLÍNICA MÉDICA';
    setTemaId(temaTemp);
    setNomeUsuario(novoNome);
    setFocoClinico(novoFoco);
    localStorage.setItem('card_estilo_tema', temaTemp);
    localStorage.setItem('card_usuario_nome', novoNome);
    localStorage.setItem('card_foco_clinico', novoFoco);
    setModalAberto(false);
  };

  const renderIconeEsp = (esp: EspecialidadeMedica) => {
    switch (esp) {
      case 'Neurologia': return <Brain className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Cardiologia': return <HeartPulse className="w-3.5 h-3.5 text-blue-600" />;
      case 'Cirurgia Geral': return <Activity className="w-3.5 h-3.5 text-rose-600" />;
      case 'Endocrinologia': return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'Infectologia': return <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Stethoscope className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // Cards prioritários para o bloco "O que estudar hoje" (máx 3 no mobile)
  const prioridadesHoje = cardsPendentes.slice(0, 3);

  return (
    <section className="w-full space-y-2.5 animate-in fade-in">
      {/* ===================================================================== */}
      {/* 1. CARTÃO RESUMO PRINCIPAL (MODERNO, PERSONALIZADO E ELEGANTE)         */}
      {/* ===================================================================== */}
      <div 
        id="card-boas-vindas-edtech"
        className={`rounded-2xl p-3.5 sm:p-4 transition-all duration-300 relative overflow-hidden space-y-3 ${temaAtual.cardClasses}`}
      >
        {/* Padrão decorativo sutil de fundo geométrico para acabamento executivo */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          {/* Lado Esquerdo: Status das Revisões e Saudação do Usuário */}
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {cardsPendentes.length > 0 ? (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${temaAtual.pendenteCor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {cardsPendentes.length} {cardsPendentes.length === 1 ? 'card pendente' : 'cards pendentes'}
                </span>
              ) : (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${temaAtual.emDiaCor}`}>
                  <CheckCircle2 className="w-3 h-3" />
                  Revisões em dia
                </span>
              )}
            </div>

            <h2 className={`text-base sm:text-lg font-bold tracking-tight truncate ${temaAtual.tituloCor}`}>
              {obterSaudacaoPersonalizada()}
            </h2>
            <p className={`text-[11px] leading-snug ${temaAtual.subtituloCor}`}>
              {restantesMeta > 0 
                ? `Faltam ${restantesMeta} cards para a meta de hoje.`
                : 'Meta diária concluída com sucesso!'}
            </p>
          </div>

          {/* Lado Direito: Módulo Clínico Técnico & Botão de Personalização de Fundo */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Tag Clínica Executiva */}
            <div 
              className={`flex flex-col text-right px-2.5 py-1 rounded-xl border transition-all select-none ${temaAtual.chipFundo} ${temaAtual.chipBorda}`}
              title="Data e módulo de estudo"
            >
              <span className={`text-[8.5px] font-extrabold uppercase tracking-wider ${temaAtual.chipTextoSecundario}`}>
                {dataHojeFormatada}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wide truncate max-w-[130px] ${temaAtual.chipTextoPrimario}`}>
                {focoClinico}
              </span>
            </div>

            {/* Botão de Personalização do Fundo */}
            <button
              type="button"
              onClick={() => {
                setTemaTemp(temaId);
                setNomeTemp(nomeUsuario);
                setFocoTemp(focoClinico);
                setModalAberto(true);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-3xs ${temaAtual.chipFundo} ${temaAtual.chipBorda} ${temaAtual.chipIconeCor}`}
              title="Personalizar visual e fundo do cartão"
              aria-label="Personalizar cartão"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso da Meta Diária + Total de Flashcards no Acervo */}
        <div className={`pt-2 border-t space-y-1.5 relative z-10 ${temaAtual.bordaDivisor}`}>
          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-semibold flex items-center gap-1 ${temaAtual.metaTexto}`}>
              <Target className="w-3 h-3 text-blue-500" />
              Meta diária: {revisadosHoje}/{metaTotal} cards
            </span>
            <span className={`font-medium ${temaAtual.metaValor}`}>
              {percentualMeta}% • {totalCards} {totalCards === 1 ? 'card no acervo' : 'cards no acervo'}
            </span>
          </div>

          <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaAtual.progressoFundo}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${temaAtual.progressoBarra}`}
              style={{ width: `${percentualMeta}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL DE PERSONALIZAÇÃO DO CARTÃO INICIAL                             */}
      {/* ===================================================================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Personalizar Cartão Inicial</h3>
                  <p className="text-[11px] text-slate-500">Escolha o visual hospitalar e seus dados de estudo</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Preview do Cartão em Tempo Real */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-blue-600" />
                  <span>Prévia em Tempo Real</span>
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  {temaPreview.nome}
                </span>
              </div>

              <div className={`rounded-2xl p-3 sm:p-3.5 transition-all duration-300 relative overflow-hidden space-y-2.5 ${temaPreview.cardClasses}`}>
                <div className="relative z-10 flex items-start justify-between gap-2.5">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className={`text-[9.5px] font-bold flex items-center gap-1 ${temaPreview.pendenteCor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {cardsPendentes.length} pendentes
                    </span>
                    <h4 className={`text-sm font-extrabold truncate ${temaPreview.tituloCor}`}>
                      Bom dia, {nomeTemp.trim() || 'Lauro'}
                    </h4>
                    <p className={`text-[10px] truncate ${temaPreview.subtituloCor}`}>
                      Faltam {restantesMeta} cards para a meta de hoje
                    </p>
                  </div>

                  <div className={`flex flex-col text-right px-2 py-0.5 rounded-xl border text-[9px] font-black uppercase tracking-wide truncate max-w-[120px] ${temaPreview.chipFundo} ${temaPreview.chipBorda} ${temaPreview.chipTextoPrimario}`}>
                    {focoTemp.trim() || 'R1 • CLÍNICA MÉDICA'}
                  </div>
                </div>

                <div className={`pt-1.5 border-t space-y-1 ${temaPreview.bordaDivisor}`}>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/20">
                    <div 
                      className={`h-full rounded-full ${temaPreview.progressoBarra}`}
                      style={{ width: `${percentualMeta}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seletor de Temas de Fundo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Escolha o Tema de Cor
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEMAS_CARD.map((tema) => {
                  const isSelecionado = temaTemp === tema.id;
                  return (
                    <button
                      key={tema.id}
                      type="button"
                      onClick={() => setTemaTemp(tema.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelecionado
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${tema.previewGradient} border border-black/10 shrink-0 shadow-2xs`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {tema.nome}
                          </span>
                          {isSelecionado && (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {tema.isDark ? 'Alto Contraste Escuro' : 'Alto Contraste Claro'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campo: Nome do Usuário */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Seu Nome na Saudação
              </label>
              <input
                type="text"
                value={nomeTemp}
                onChange={e => setNomeTemp(e.target.value)}
                placeholder="Ex: Lauro, Dr. Lauro"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Campo: Foco Clínico / Etiqueta Superior */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Tag de Foco Clínico (Topo Direito)
              </label>
              <input
                type="text"
                value={focoTemp}
                onChange={e => setFocoTemp(e.target.value)}
                placeholder="Ex: R1 • CLÍNICA MÉDICA, PLANTÃO, RESIDÊNCIA"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase font-semibold"
              />

              {/* Sugestões rápidas de foco */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {SUGESTOES_FOCO.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => setFocoTemp(sugestao.toUpperCase())}
                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 cursor-pointer transition-colors"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarPersonalizacao}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs cursor-pointer transition-all active:scale-95"
              >
                Salvar Preferências
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SEÇÃO: "O QUE ESTUDAR HOJE" (COMPACTA)                             */}
      {/* ===================================================================== */}
      {prioridadesHoje.length > 0 && (
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>O que estudar hoje</span>
            </h3>

            <button
              onClick={() => onIniciarRevisao()}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
            >
              Ver fila ({cardsPendentes.length})
            </button>
          </div>

          <div className="space-y-1">
            {prioridadesHoje.map((card) => (
              <div
                key={card.id}
                onClick={() => onAbrirCard(card)}
                className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 flex items-center justify-between gap-2 transition-transform duration-100 ease-out active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <EixoEmojiBadge card={card} size="sm" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      {card.tipoCard === 'caso_clinico' && (
                        <span className="text-[8.5px] font-bold text-purple-600 bg-purple-50 px-1 rounded border border-purple-200">Caso</span>
                      )}
                      {card.tipoCard === 'fluxograma_oclusao' && (
                        <span className="text-[8.5px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">Fluxo</span>
                      )}
                    </div>
                    <h4 className="text-[11px] font-semibold text-slate-900 truncate">
                      {card.titulo}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0 text-blue-600 font-bold text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  <span>Praticar</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. BARRA DE BUSCA GLOBAL INTEGRADA & COMPACTA                         */}
      {/* ===================================================================== */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="input-busca-dashboard"
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar tema clínico, conduta ou nota..."
          className="w-full pl-8 pr-8 py-1.5 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
        />
        {busca && (
          <button
            onClick={() => onBuscaChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
};
