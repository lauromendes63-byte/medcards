import React, { useState } from 'react';
import { 
  Trash2, 
  Sparkles, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  UploadCloud, 
  Download, 
  HardDrive,
  Info,
  ShieldCheck,
  FolderTree,
  Clock,
  RotateCcw,
  Sliders,
  Check,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { EixoClinico, CardClinico, ProgressoDiario, ConfiguracaoTimers, ModoVisualizacaoEixos } from '../types';
import { DEFAULT_CONFIG_TIMERS, formatarTempoMinutos } from '../utils/timerUtils';
import { StorageService } from '../services/storage';

interface SettingsViewProps {
  cards: CardClinico[];
  eixos: EixoClinico[];
  progresso: ProgressoDiario;
  onZerarDados: () => void;
  onCarregarExemplo: () => void;
  onAbrirImportExport: () => void;
  onTimersAtualizados?: () => void;
  modoVisualizacao?: ModoVisualizacaoEixos;
  onModoVisualizacaoChange?: (modo: ModoVisualizacaoEixos) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cards,
  eixos,
  onZerarDados,
  onCarregarExemplo,
  onAbrirImportExport,
  onTimersAtualizados,
  modoVisualizacao: propModoVisualizacao,
  onModoVisualizacaoChange,
}) => {
  const [mostrarConfirmacaoZerar, setMostrarConfirmacaoZerar] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [configTimers, setConfigTimers] = useState<ConfiguracaoTimers>(() => StorageService.getConfiguracaoTimers());
  const [modoVisualizacaoLocal, setModoVisualizacaoLocal] = useState<ModoVisualizacaoEixos>(() => StorageService.getModoVisualizacaoEixos());

  const modoVisualizacao = propModoVisualizacao !== undefined ? propModoVisualizacao : modoVisualizacaoLocal;

  const handleAlterarModoVisualizacao = (novoModo: ModoVisualizacaoEixos) => {
    StorageService.setModoVisualizacaoEixos(novoModo);
    setModoVisualizacaoLocal(novoModo);
    if (onModoVisualizacaoChange) {
      onModoVisualizacaoChange(novoModo);
    }
    setMensagemSucesso(`Layout alterado para: ${novoModo === 'lista' ? 'Lista Expandida' : 'Grade Compacta (2 Colunas)'}`);
    setTimeout(() => setMensagemSucesso(null), 2500);
  };

  const handleCarregarExemplo = () => {
    onCarregarExemplo();
    setMensagemSucesso('Dados médicos de exemplo carregados com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleZerarConfirmado = () => {
    onZerarDados();
    setMostrarConfirmacaoZerar(false);
    setMensagemSucesso('Todos os dados foram zerados. Aplicativo pronto para novos estudos!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const atualizarTimer = (
    rodada: 'rodada1' | 'rodada2' | 'rodada3Plus',
    campo: 'erreiMinutos' | 'dificilMinutos' | 'bomMinutos' | 'facilMinutos',
    valor: number
  ) => {
    setConfigTimers(prev => ({
      ...prev,
      [rodada]: {
        ...prev[rodada],
        [campo]: Math.max(1, valor),
      },
    }));
  };

  const handleSalvarTimers = () => {
    StorageService.salvarConfiguracaoTimers(configTimers);
    if (onTimersAtualizados) onTimersAtualizados();
    setMensagemSucesso('Configuração de timers intradiários salva com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleRestaurarPadraoTimers = () => {
    setConfigTimers(JSON.parse(JSON.stringify(DEFAULT_CONFIG_TIMERS)));
    StorageService.salvarConfiguracaoTimers(DEFAULT_CONFIG_TIMERS);
    if (onTimersAtualizados) onTimersAtualizados();
    setMensagemSucesso('Timers restaurados para os valores padrão base!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleResetarTodosParaRodada1 = () => {
    StorageService.resetarTodosCardsParaRodada1();
    if (onTimersAtualizados) onTimersAtualizados();
    setMensagemSucesso('Todos os cards foram reiniciados para a Rodada 1 e estão pendentes agora!');
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  return (
    <div className="w-full space-y-3 pb-6">
      {/* Notificação de Sucesso */}
      {mensagemSucesso && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-emerald-800 flex items-center gap-2 text-[11px] font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Bloco: Modos de Visualização dos Eixos & Interface */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Visualização & Layout dos Eixos
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {modoVisualizacao === 'lista' ? 'Modo Lista' : 'Modo Grade'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Opção 1: Lista Expandida (Padrão) */}
          <button
            type="button"
            id="btn-settings-layout-lista"
            onClick={() => handleAlterarModoVisualizacao('lista')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
              modoVisualizacao === 'lista'
                ? 'bg-blue-50/60 border-blue-400/80 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <LayoutList className={`w-4 h-4 ${modoVisualizacao === 'lista' ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>Lista Expandida (Padrão)</span>
              </div>
              {modoVisualizacao === 'lista' && (
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Cards completos com barra de ação, progresso e expansão rápida de tópicos via seta (dropdown).
            </p>
          </button>

          {/* Opção 2: Grade Compacta (2 Colunas) */}
          <button
            type="button"
            id="btn-settings-layout-grade"
            onClick={() => handleAlterarModoVisualizacao('grade')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
              modoVisualizacao === 'grade'
                ? 'bg-blue-50/60 border-blue-400/80 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <LayoutGrid className={`w-4 h-4 ${modoVisualizacao === 'grade' ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>Grade Compacta (2 Colunas)</span>
              </div>
              {modoVisualizacao === 'grade' && (
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Cards menores lado a lado, mostrando ícone, especialidade e contadores, otimizando o espaço vertical no celular.
            </p>
          </button>
        </div>
      </div>

      {/* Bloco 1: Ações Principais de Dados */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Gerenciamento de Dados
        </h3>

        {/* Opção 1: Carregar Dados de Exemplo */}
        <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900">Carregar dados de exemplo</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Popula com casos clínicos, eixos, tópicos e algoritmos de decisão para você testar todas as funções.
            </p>
          </div>

          <button
            id="btn-carregar-dados-exemplo"
            onClick={handleCarregarExemplo}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>Carregar</span>
          </button>
        </div>

        {/* Opção 2: Zerar Todos os Dados */}
        <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-950">Zerar todos os dados</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Limpa o aplicativo por completo (0 cards, 0 eixos, 0 histórico) para começar seus estudos do zero.
            </p>
          </div>

          <button
            id="btn-abrir-confirmacao-zerar"
            onClick={() => setMostrarConfirmacaoZerar(true)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            <span>Zerar Tudo</span>
          </button>
        </div>
      </div>

      {/* Bloco 2: Sistema de Timers Intradiários Dinâmico */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Repetição Intradiária Médica
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Alta rotação focada em minutos e horas. À meia-noite todos os cards resetam para a Rodada 1.
            </p>
          </div>

          <button
            onClick={handleResetarTodosParaRodada1}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Zera a rodada de todos os cards para 1 e coloca todos pendentes agora"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Resetar para Rodada 1 Agora</span>
          </button>
        </div>

        {/* Rodada 1 */}
        <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">
              Rodada 1 • Cards Novos / 1ª Revisão
            </span>
            <span className="text-[10px] text-rose-600 font-semibold bg-rose-100/60 px-2 py-0.5 rounded-full">
              Errei: {formatarTempoMinutos(configTimers.rodada1.erreiMinutos)} | Difícil: {formatarTempoMinutos(configTimers.rodada1.dificilMinutos)} | Bom: {formatarTempoMinutos(configTimers.rodada1.bomMinutos)} | Fácil: {formatarTempoMinutos(configTimers.rodada1.facilMinutos)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Errei (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada1.erreiMinutos}
                onChange={e => atualizarTimer('rodada1', 'erreiMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Difícil (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada1.dificilMinutos}
                onChange={e => atualizarTimer('rodada1', 'dificilMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Bom (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada1.bomMinutos}
                onChange={e => atualizarTimer('rodada1', 'bomMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Fácil (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada1.facilMinutos}
                onChange={e => atualizarTimer('rodada1', 'facilMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
          </div>
        </div>

        {/* Rodada 2 */}
        <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">
              Rodada 2 • Consolidação
            </span>
            <span className="text-[10px] text-amber-600 font-semibold bg-amber-100/60 px-2 py-0.5 rounded-full">
              Errei: {formatarTempoMinutos(configTimers.rodada2.erreiMinutos)} | Difícil: {formatarTempoMinutos(configTimers.rodada2.dificilMinutos)} | Bom: {formatarTempoMinutos(configTimers.rodada2.bomMinutos)} | Fácil: {formatarTempoMinutos(configTimers.rodada2.facilMinutos)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Errei (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada2.erreiMinutos}
                onChange={e => atualizarTimer('rodada2', 'erreiMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Difícil (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada2.dificilMinutos}
                onChange={e => atualizarTimer('rodada2', 'dificilMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Bom (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada2.bomMinutos}
                onChange={e => atualizarTimer('rodada2', 'bomMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Fácil (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada2.facilMinutos}
                onChange={e => atualizarTimer('rodada2', 'facilMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
          </div>
        </div>

        {/* Rodada 3+ */}
        <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">
              Rodada 3+ • Fixação Estendida (Plantão)
            </span>
            <span className="text-[10px] text-blue-600 font-semibold bg-blue-100/60 px-2 py-0.5 rounded-full">
              Errei: {formatarTempoMinutos(configTimers.rodada3Plus.erreiMinutos)} | Difícil: {formatarTempoMinutos(configTimers.rodada3Plus.dificilMinutos)} | Bom: {formatarTempoMinutos(configTimers.rodada3Plus.bomMinutos)} | Fácil: {formatarTempoMinutos(configTimers.rodada3Plus.facilMinutos)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Errei (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada3Plus.erreiMinutos}
                onChange={e => atualizarTimer('rodada3Plus', 'erreiMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Difícil (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada3Plus.dificilMinutos}
                onChange={e => atualizarTimer('rodada3Plus', 'dificilMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Bom (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada3Plus.bomMinutos}
                onChange={e => atualizarTimer('rodada3Plus', 'bomMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">Fácil (minutos)</label>
              <input
                type="number"
                min={1}
                value={configTimers.rodada3Plus.facilMinutos}
                onChange={e => atualizarTimer('rodada3Plus', 'facilMinutos', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 text-center"
              />
            </div>
          </div>
        </div>

        {/* Botões de Salvar e Restaurar */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleRestaurarPadraoTimers}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold underline cursor-pointer"
          >
            Restaurar padrão base
          </button>
          <button
            type="button"
            onClick={handleSalvarTimers}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Timers Globais</span>
          </button>
        </div>
      </div>

      {/* Bloco 3: Importação e Exportação (APKG / Anki / JSON) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Importação e Backup
        </h3>

        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <UploadCloud className="w-4 h-4 text-slate-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Importar Baralhos Anki (.apkg)</p>
              <p className="text-[11px] text-slate-500">Aceita arquivos .apkg com imagens e notas</p>
            </div>
          </div>

          <button
            onClick={onAbrirImportExport}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Abrir Importador
          </button>
        </div>
      </div>

      {/* Bloco 3: Estatísticas de Armazenamento Local */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Diagnóstico do Dispositivo
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Eixos Cadastrados</span>
            <strong className="text-slate-800 text-sm">{eixos.length}</strong>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Flashcards / Casos</span>
            <strong className="text-slate-800 text-sm">{cards.length}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Dados salvos localmente no navegador (LocalStorage + IndexedDB). Sem envio para servidores externos.</span>
        </div>
      </div>

      {/* Modal de Confirmação de Zerar Dados */}
      {mostrarConfirmacaoZerar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Zerar todos os dados?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta ação apagará todos os seus eixos, tópicos, cards e histórico de revisões. O aplicativo voltará ao estado inicial totalmente limpo.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarConfirmacaoZerar(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-zerar-dados"
                onClick={handleZerarConfirmado}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-xs"
              >
                Sim, Zerar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
