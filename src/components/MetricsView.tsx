import React, { useRef } from 'react';
import { 
  Download, 
  Upload, 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Award,
  BookCheck,
  Target
} from 'lucide-react';
import { ProgressoDiario, CardClinico, EixoClinico } from '../types';

interface MetricsViewProps {
  progresso: ProgressoDiario;
  cards: CardClinico[];
  eixos: EixoClinico[];
  onExportar: () => void;
  onImportar: (jsonStr: string) => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  progresso,
  cards,
  onExportar,
  onImportar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCards = cards.length;
  const dominados = cards.filter(c => c.status === 'dominado').length;
  const emTreino = cards.filter(c => c.status === 'em_revisao').length;
  const pendentes = cards.filter(c => c.status === 'pendente').length;

  const percentualDominados = totalCards > 0 ? Math.round((dominados / totalCards) * 100) : 0;

  // Distribuição por Especialidade
  const especialidadesMap: Record<string, { total: number; dominados: number }> = {};
  cards.forEach(c => {
    if (!especialidadesMap[c.especialidade]) {
      especialidadesMap[c.especialidade] = { total: 0, dominados: 0 };
    }
    especialidadesMap[c.especialidade].total += 1;
    if (c.status === 'dominado') {
      especialidadesMap[c.especialidade].dominados += 1;
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportar(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full space-y-3 pb-6 animate-in fade-in">
      {/* Topo do Painel de Métricas (Escala Mobile Compacta) */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 block">
              Analytics de Aprendizado
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Domínio & Consistência Clínica
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Consolidação de memória e ritmo diário
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-exportar-metricas"
              onClick={onExportar}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Salvar backup JSON"
            >
              <Download className="w-3 h-3" />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer"
              title="Restaurar backup JSON"
            >
              <Upload className="w-3 h-3" />
              <span>Importar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* 4 Cards de Métricas Compactos para Celular */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-tight">Sequência</span>
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {progresso.sequenciaDias} {progresso.sequenciaDias === 1 ? 'dia' : 'dias'}
            </span>
            <span className="text-[9px] text-emerald-600 font-medium mt-0.5">Estudo contínuo</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-tight">Revisados Hoje</span>
              <Target className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {progresso.cardsRevisadosHoje || 0}
            </span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">Meta: {progresso.metaDiaria || 20} cards</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-tight">Dominados</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {dominados}
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-0.5">{percentualDominados}% do acervo</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-tight">Tempo Ativo</span>
              <Clock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {progresso.tempoEstudadoMinutos} min
            </span>
            <span className="text-[9px] text-slate-400 font-medium mt-0.5">Foco dedicado</span>
          </div>
        </div>
      </div>

      {/* Distribuição por Especialidade Médica */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <BookCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Domínio por Especialidade Médica</span>
        </h3>

        <div className="space-y-2 pt-0.5">
          {Object.entries(especialidadesMap).map(([esp, dados]) => {
            const perc = dados.total > 0 ? Math.round((dados.dominados / dados.total) * 100) : 0;
            return (
              <div key={esp} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800">{esp}</span>
                  <span className="text-slate-400">
                    <strong className="text-slate-700">{dados.dominados}</strong>/{dados.total} ({perc}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${perc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curva de Retenção e Algoritmo SRS */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fases da Memória Espaçada</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">SRS</span>
        </div>

        <p className="text-[11px] text-slate-500 leading-snug">
          Avaliações positivas expandem os intervalos de fixação antes do esquecimento. Erros reiniciam o ciclo imediato sem punir o histórico.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
            <span className="text-xs font-bold text-emerald-800 block">{dominados}</span>
            <span className="text-[8.5px] text-emerald-700 uppercase font-bold tracking-tight">Consolidados (&gt;7d)</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
            <span className="text-xs font-bold text-blue-800 block">{emTreino}</span>
            <span className="text-[8.5px] text-blue-700 uppercase font-bold tracking-tight">Fixação (1-6d)</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 text-center">
            <span className="text-xs font-bold text-rose-800 block">{pendentes}</span>
            <span className="text-[8.5px] text-rose-700 uppercase font-bold tracking-tight">Fila Imediata</span>
          </div>
        </div>
      </div>
    </div>
  );
};
