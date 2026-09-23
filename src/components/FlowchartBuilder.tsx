import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GitFork, 
  Sparkles, 
  CheckCircle2,
  Stethoscope,
  HelpCircle,
  Eye
} from 'lucide-react';
import { ClinicalFormatToolbar } from './ClinicalFormatToolbar';
import { FormattedClinicalText } from './FormattedClinicalText';

export interface BlocoFluxogramaItem {
  id: string;
  titulo: string;
  criterioSeta?: string;
  condutaOuAcao: string;
}

interface FlowchartBuilderProps {
  blocos: BlocoFluxogramaItem[];
  onChange: (novosBlocos: BlocoFluxogramaItem[]) => void;
}

const PRESETS_FLUXOGRAMAS = [
  {
    nome: 'IAM com Supra de ST',
    blocos: [
      {
        id: 'f1',
        titulo: 'Dor torácica típica + ECG no PS',
        condutaOuAcao: 'AAS 200mg mastigado + Clopidogrel 300mg + Heparina + Encaminhar para CATE imediato (<120 min)',
      },
      {
        id: 'f2',
        titulo: 'Tempo para hemodinâmica indisponível (>120m)',
        condutaOuAcao: 'Trombólise química imediata com Alteplase ou Tenecteplase em até 30 minutos (Porta-Agulha)',
      }
    ]
  },
  {
    nome: 'Manejo do Potássio na CAD',
    blocos: [
      {
        id: 'f3',
        titulo: 'Coleta de Gasometria e Eletrólitos na Cetoacidose',
        condutaOuAcao: 'NÃO iniciar insulina! Repor KCl (20-30 mEq/h) até K+ > 3.3 mEq/L pelo alto risco de arritmia letal.',
      },
      {
        id: 'f4',
        titulo: 'Reavaliação de Potássio após reposição',
        condutaOuAcao: 'Iniciar Insulina Regular em bomba (0.1 UI/kg/h) associando KCl 20-30 mEq por litro de soro para manutenção.',
      }
    ]
  }
];

export const FlowchartBuilder: React.FC<FlowchartBuilderProps> = ({
  blocos,
  onChange,
}) => {
  const [mostrarPresets, setMostrarPresets] = useState(false);

  const handleAdicionarBloco = () => {
    const novo: BlocoFluxogramaItem = {
      id: `bloco-${Date.now()}`,
      titulo: '',
      condutaOuAcao: '',
    };
    onChange([...blocos, novo]);
  };

  const handleAtualizarBloco = (id: string, campos: Partial<BlocoFluxogramaItem>) => {
    const atualizados = blocos.map(b => b.id === id ? { ...b, ...campos } : b);
    onChange(atualizados);
  };

  const handleRemoverBloco = (id: string) => {
    if (blocos.length <= 1) return;
    onChange(blocos.filter(b => b.id !== id));
  };

  const handleAplicarPreset = (presetBlocos: BlocoFluxogramaItem[]) => {
    onChange(presetBlocos);
    setMostrarPresets(false);
  };

  return (
    <div className="space-y-3">
      {/* Cabeçalho do Construtor */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-indigo-50/80 p-3 rounded-xl border border-indigo-100">
        <div>
          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-indigo-600" />
            <span>Passo a Passo Sequencial</span>
          </span>
          <p className="text-[11px] text-indigo-800/75 mt-0.5">
            Defina as etapas sequenciais e a conduta que deve ser tomada em cada ponto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarPresets(!mostrarPresets)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>{mostrarPresets ? 'Fechar Modelos' : 'Carregar Exemplo'}</span>
          </button>

          <button
            type="button"
            onClick={handleAdicionarBloco}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Etapa</span>
          </button>
        </div>
      </div>

      {/* Modelos Médicos Prontos */}
      {mostrarPresets && (
        <div className="p-3 bg-white rounded-2xl border border-indigo-200 shadow-sm space-y-2 animate-in fade-in">
          <span className="text-[11px] font-bold text-slate-700 block">
            Selecione um exemplo clínico para preencher automaticamente:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS_FLUXOGRAMAS.map((preset) => (
              <button
                key={preset.nome}
                type="button"
                onClick={() => handleAplicarPreset(preset.blocos)}
                className="p-2.5 rounded-xl border border-indigo-100 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 text-left text-xs font-semibold text-indigo-950 transition-all flex items-center justify-between cursor-pointer"
              >
                <span>{preset.nome}</span>
                <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                  {preset.blocos.length} etapas
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sequência Visual de Nós e Conexões */}
      <div className="space-y-2">
        {blocos.map((bloco, idx) => {
          const ehPrimeiro = idx === 0;
          const ehUltimo = idx === blocos.length - 1;

          return (
            <div key={bloco.id} className="relative group">
              {/* Conector Visual de Seta Superior (para nós a partir do 2º) */}
              {!ehPrimeiro && (
                <div className="flex flex-col items-center justify-center my-1.5">
                  <div className="w-0.5 h-3 bg-indigo-300"></div>
                  <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-500 rotate-45 -mt-1.5"></div>
                </div>
              )}

              {/* Cartão do Nó Clínico */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all space-y-3">
                {/* Cabeçalho do Bloco */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {idx === 0 ? 'Ponto de Partida / Investigação Inicial' : `Decisão / Ramificação #${idx + 1}`}
                    </span>
                  </div>

                  {blocos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoverBloco(bloco.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Excluir este ponto do fluxograma"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Campos da Etapa */}
                <div className="space-y-3">
                  {/* Ponto de Partida ou Achado Clínico */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Achado Clínico / Pergunta / Título da Etapa:
                    </label>
                    <input
                      type="text"
                      required
                      value={bloco.titulo}
                      onChange={(e) => handleAtualizarBloco(bloco.id, { titulo: e.target.value })}
                      placeholder="Ex: 2. ID e Separação de Materiais ou Paciente com Dor Torácica"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-[13px] font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Resposta / Conteúdo da Etapa */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label 
                        htmlFor={`textarea-passo-resposta-${bloco.id}`}
                        className="text-xs font-bold text-emerald-900 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Resposta:</span>
                      </label>

                      {/* Barra de Ferramentas de Formatação Clínica */}
                      <ClinicalFormatToolbar
                        targetInputId={`textarea-passo-resposta-${bloco.id}`}
                        valorAtual={bloco.condutaOuAcao}
                        onValorChange={(val) => handleAtualizarBloco(bloco.id, { condutaOuAcao: val })}
                        compacto={true}
                        mostrarTopico={true}
                      />
                    </div>

                    <textarea
                      id={`textarea-passo-resposta-${bloco.id}`}
                      rows={4}
                      required
                      value={bloco.condutaOuAcao}
                      onChange={(e) => handleAtualizarBloco(bloco.id, { condutaOuAcao: e.target.value })}
                      placeholder={"Ex:\n• Laringoscópio completo testado\n• ==Tubo Orotraqueal nº 7.5 a 8.5== com cuff\n• Fio guia pré-moldado sem ultrapassar a ponta"}
                      className="w-full p-3 rounded-xl bg-white border border-emerald-300/80 text-xs sm:text-[13.5px] font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs leading-relaxed"
                    />

                    {/* Prévia ao Vivo da Resposta Formatada */}
                    {bloco.condutaOuAcao && (
                      <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/80 text-left space-y-1.5 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Prévia da Resposta Formatada:</span>
                        </div>
                        <div className="text-xs sm:text-[13.5px] leading-relaxed bg-white/90 p-3 rounded-xl border border-emerald-100/90 shadow-3xs">
                          <FormattedClinicalText text={bloco.condutaOuAcao} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão para estender o algoritmo */}
      <button
        type="button"
        onClick={handleAdicionarBloco}
        className="w-full py-2.5 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Adicionar Próxima Ramificação ao Algoritmo</span>
      </button>
    </div>
  );
};
