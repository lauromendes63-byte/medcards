import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GitFork, 
  Sparkles, 
  CheckCircle2,
  Stethoscope, 
  Eye,
  ChevronUp,
  ChevronDown,
  Copy,
  Layers,
  ArrowDown,
  Activity,
  HeartPulse,
  ShieldAlert,
  Zap
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

const CATEGORIAS_ETAPA_RAPIDA = [
  { rotulo: 'Triagem & Sinais', icone: Activity, cor: 'text-blue-700 bg-blue-50 border-blue-200' },
  { rotulo: 'Exame / Investigação', icone: Stethoscope, cor: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { rotulo: 'Conduta & Fármaco', icone: HeartPulse, cor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { rotulo: 'Alerta Crítico', icone: ShieldAlert, cor: 'text-rose-700 bg-rose-50 border-rose-200' },
  { rotulo: 'Reavaliação / UTI', icone: Zap, cor: 'text-amber-700 bg-amber-50 border-amber-200' },
];

const PRESETS_FLUXOGRAMAS = [
  {
    nome: 'Sequência Rápida de Intubação (7 Ps)',
    descricao: 'Protocolo padrão de emergência da SRI para via aérea definitiva',
    blocos: [
      {
        id: 'sri-1',
        titulo: '1. Preparação (Equipamentos e Drogas)',
        condutaOuAcao: '• Testar laringoscópio e ==tubo orotraqueal (7.5 a 8.5)==\n• Fio guia pré-moldado\n• Aspirador funcionando e monitorização completa\n• [azul]Acesso venoso calibroso[/azul]',
      },
      {
        id: 'sri-2',
        titulo: '2. Pré-Oxigenação (Lavagem de Nitrogênio)',
        condutaOuAcao: '• FiO2 a 100% sob máscara com reservatório por ==3 a 5 minutos== (ou 8 respirações profundas de capacidade vital).\n• Meta: O2 alveolar > 90% sem ventilar com pressão positiva.',
      },
      {
        id: 'sri-3',
        titulo: '3. Pré-Tratamento / Otimização Hemodinâmica',
        condutaOuAcao: '• Corrigir hipotensão prévia com cristaloide ou vasopressor (evitar colapso peri-intubação).\n• [azul]Fentanil 1-3 mcg/kg[/azul] se coronariopatia, dissecção ou hipertensão intracraniana.',
      },
      {
        id: 'sri-4',
        titulo: '4. Paralisia com Indução Simultânea',
        condutaOuAcao: '• Hipnótico: [azul]Etomidato 0.3 mg/kg[/azul] (estável) ou [azul]Cetamina 1.5-2 mg/kg[/azul] (broncoespasmo/choque).\n• Bloqueador: [azul]Succinilcolina 1.5 mg/kg[/azul] ou [azul]Rocurônio 1.2 mg/kg[/azul].',
      },
      {
        id: 'sri-5',
        titulo: '5. Posicionamento e Passagem do Tubo',
        condutaOuAcao: '• Aguardar 45-60s de relaxamento completo.\n• Laringoscopia direta ou videolaringoscopia.\n• Inserção do tubo visualizando a passagem pelas cordas vocais.',
      },
      {
        id: 'sri-6',
        titulo: '6. Pós-Intubação e Fixação',
        condutaOuAcao: '• Insuflar balonete (cuff 20-30 cmH2O).\n• Confirmar posição com ==Capnografia em onda== + ausculta (epigástrio e ápices).\n• Sedoanalgesia contínua iniciada imediatamente.',
      }
    ]
  },
  {
    nome: 'IAM com Supra de ST (IAMCSST)',
    descricao: 'Algoritmo de dor torácica típica com reperfusão imediata',
    blocos: [
      {
        id: 'f1',
        titulo: 'Dor torácica típica + ECG no PS (< 10 min)',
        condutaOuAcao: '• [azul]AAS 200mg mastigado[/azul] + [azul]Ticagrelor 180mg[/azul] (ou Clopidogrel 300mg)\n• Heparina não fracionada IV\n• Avaliar tempo para Hemodinâmica (CATE)',
      },
      {
        id: 'f2',
        titulo: 'Tempo para hemodinâmica < 120 minutos',
        condutaOuAcao: '• Encaminhar IMEDIATAMENTE para Angioplastia Primária\n• Meta Porta-Balão < 90 minutos (ou < 120 min se transferência)',
      },
      {
        id: 'f3',
        titulo: 'Tempo para hemodinâmica > 120 minutos',
        condutaOuAcao: '• [vermelho]Trombólise química imediata[/vermelho] com [azul]Tenecteplase (TNK)[/azul] ou Alteplase\n• Meta Porta-Agulha < 30 minutos\n• Se falha de reperfusão em 90 min: CATE de Resgate',
      }
    ]
  },
  {
    nome: 'Manejo do Potássio na CAD',
    descricao: 'Reposição hidroeletrolítica e timing da insulinoterapia',
    blocos: [
      {
        id: 'f4',
        titulo: '1. Coleta de Gasometria e Eletrólitos na Cetoacidose',
        condutaOuAcao: '• Se [vermelho]K+ < 3.3 mEq/L[/vermelho]: NÃO iniciar insulina!\n• Repor KCl 20-30 mEq/h até potássio > 3.3 pelo risco de arritmia letal.',
      },
      {
        id: 'f5',
        titulo: '2. Potássio Normal (3.3 a 5.2 mEq/L)',
        condutaOuAcao: '• Iniciar [azul]Insulina Regular 0.1 UI/kg/h[/azul] em bomba de infusão.\n• Associar KCl 20-30 mEq por litro de soro para prevenir hipocalemia rápida.',
      },
      {
        id: 'f6',
        titulo: '3. Potássio Alto (> 5.2 mEq/L)',
        condutaOuAcao: '• Iniciar insulina regular normalmente.\n• Não repor potássio agora. Checar K+ a cada 2 horas.',
      }
    ]
  }
];

export const FlowchartBuilder: React.FC<FlowchartBuilderProps> = ({
  blocos,
  onChange,
}) => {
  const [mostrarPresets, setMostrarPresets] = useState(false);

  const handleAdicionarBlocoFinal = () => {
    const novo: BlocoFluxogramaItem = {
      id: `bloco-${Date.now()}`,
      titulo: '',
      condutaOuAcao: '',
    };
    onChange([...blocos, novo]);
  };

  const handleInserirBlocoApos = (index: number) => {
    const novo: BlocoFluxogramaItem = {
      id: `bloco-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      titulo: '',
      condutaOuAcao: '',
    };
    const copia = [...blocos];
    copia.splice(index + 1, 0, novo);
    onChange(copia);
  };

  const handleMoverBloco = (index: number, direcao: 'cima' | 'baixo') => {
    if (direcao === 'cima' && index === 0) return;
    if (direcao === 'baixo' && index === blocos.length - 1) return;

    const novoIndex = direcao === 'cima' ? index - 1 : index + 1;
    const copia = [...blocos];
    const item = copia[index];
    copia.splice(index, 1);
    copia.splice(novoIndex, 0, item);
    onChange(copia);
  };

  const handleDuplicarBloco = (bloco: BlocoFluxogramaItem, index: number) => {
    const duplicado: BlocoFluxogramaItem = {
      id: `bloco-${Date.now()}`,
      titulo: `${bloco.titulo} (Cópia)`,
      condutaOuAcao: bloco.condutaOuAcao,
    };
    const copia = [...blocos];
    copia.splice(index + 1, 0, duplicado);
    onChange(copia);
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
    <div className="space-y-3.5">
      {/* Cabeçalho do Construtor */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 p-3.5 sm:p-4 rounded-2xl border border-indigo-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-indigo-950">
                Passo a Passo Sequencial Clínico
              </span>
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {blocos.length} {blocos.length === 1 ? 'etapa' : 'etapas'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-indigo-800/80 mt-1">
            Construa o fluxo cronológico das condutas. Use o trilho visual para reordenar ou inserir passos intermediários.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarPresets(!mostrarPresets)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{mostrarPresets ? 'Ocultar Modelos' : 'Carregar Modelo Clínico'}</span>
          </button>

          <button
            type="button"
            onClick={handleAdicionarBlocoFinal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Etapa</span>
          </button>
        </div>
      </div>

      {/* Gaveta de Modelos Prontos */}
      {mostrarPresets && (
        <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-sm space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-indigo-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Selecione um Algoritmo de Referência:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Substitui as etapas atuais</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESETS_FLUXOGRAMAS.map((preset) => (
              <button
                key={preset.nome}
                type="button"
                onClick={() => handleAplicarPreset(preset.blocos)}
                className="p-3 rounded-2xl border border-indigo-100 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/80 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-indigo-950 group-hover:text-indigo-800">
                    {preset.nome}
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-0.5 line-clamp-2">
                    {preset.descricao}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    {preset.blocos.length} etapas
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                    Usar Exemplo →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Rail Sequencial */}
      <div className="space-y-0 relative">
        {blocos.map((bloco, idx) => {
          const ehPrimeiro = idx === 0;
          const ehUltimo = idx === blocos.length - 1;

          return (
            <div key={bloco.id} className="relative group">
              {/* Trilho Visual com Seta e Botão de Inserção Intermediária */}
              {!ehPrimeiro && (
                <div className="flex items-center justify-center my-2 relative">
                  <div className="absolute inset-x-0 h-px bg-indigo-100 pointer-events-none" />
                  <div className="relative z-10 flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded-full border border-indigo-200/60 shadow-3xs">
                    <ArrowDown className="w-3.5 h-3.5 text-indigo-500 stroke-[2.5]" />
                    <button
                      type="button"
                      onClick={() => handleInserirBlocoApos(idx - 1)}
                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Inserir nova etapa exatamente aqui"
                    >
                      <Plus className="w-3 h-3 text-indigo-600" />
                      <span>Inserir etapa aqui</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cartão da Etapa Clínica */}
              <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all space-y-3.5">
                {/* Linha Superior: Número da Etapa, Título Hierárquico e Ações */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {idx === 0 ? 'Ponto de Partida / Entrada Clínica' : `Etapa #${idx + 1}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {idx === 0 ? 'Primeiro passo do protocolo' : `Conduta subsequente à etapa #${idx}`}
                      </span>
                    </div>
                  </div>

                  {/* Ações Rápidas: Mover Cima/Baixo, Duplicar, Excluir */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={ehPrimeiro}
                      onClick={() => handleMoverBloco(idx, 'cima')}
                      className={`p-1.5 rounded-lg border transition-all ${
                        ehPrimeiro 
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer active:scale-95'
                      }`}
                      title="Mover etapa para cima"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={ehUltimo}
                      onClick={() => handleMoverBloco(idx, 'baixo')}
                      className={`p-1.5 rounded-lg border transition-all ${
                        ehUltimo 
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer active:scale-95'
                      }`}
                      title="Mover etapa para baixo"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicarBloco(bloco, idx)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer transition-colors active:scale-95"
                      title="Duplicar esta etapa"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {blocos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoverBloco(bloco.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer active:scale-95"
                        title="Excluir esta etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tags Rápidas de Classificação Clínica */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">Classificação rápida:</span>
                  {CATEGORIAS_ETAPA_RAPIDA.map((cat) => {
                    const Icone = cat.icone;
                    return (
                      <button
                        key={cat.rotulo}
                        type="button"
                        onClick={() => {
                          const prefixo = `${cat.rotulo}: `;
                          if (!bloco.titulo.startsWith(prefixo)) {
                            handleAtualizarBloco(bloco.id, { titulo: `${prefixo}${bloco.titulo.replace(/^[A-Za-z0-9\s/&]+:\s*/, '')}` });
                          }
                        }}
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${cat.cor}`}
                      >
                        <Icone className="w-2.5 h-2.5" />
                        <span>{cat.rotulo}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Campos da Etapa */}
                <div className="space-y-3">
                  {/* Título / Pergunta Gatilho da Etapa */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">
                      Título da Etapa ou Achado Clínico:
                    </label>
                    <input
                      type="text"
                      required
                      value={bloco.titulo}
                      onChange={(e) => handleAtualizarBloco(bloco.id, { titulo: e.target.value })}
                      placeholder="Ex: 2. ID e Separação de Materiais ou ECG com Supra de ST"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-[13px] font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Resposta / Condutas Detalhadas */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label 
                        htmlFor={`textarea-passo-resposta-${bloco.id}`}
                        className="text-xs font-bold text-emerald-950 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Conduta Médica / Resposta Esperada:</span>
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
                      placeholder={"Ex:\n• Laringoscópio completo testado\n• ==Tubo Orotraqueal nº 7.5 a 8.5== com cuff\n• [azul]Fio guia pré-moldado[/azul] sem ultrapassar a ponta"}
                      className="w-full p-3.5 rounded-2xl bg-white border border-emerald-300 text-xs sm:text-[13.5px] font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs leading-relaxed"
                    />

                    {/* Prévia ao Vivo da Resposta Formatada */}
                    {bloco.condutaOuAcao && (
                      <div className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 text-left space-y-1.5 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Prévia Formatada de Estudo:</span>
                        </div>
                        <div className="text-xs sm:text-[13.5px] leading-relaxed bg-white/95 p-3 rounded-xl border border-emerald-100 shadow-3xs">
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

      {/* Botão de Adição no Fim da Sequência */}
      <button
        type="button"
        onClick={handleAdicionarBlocoFinal}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/80 text-indigo-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-3xs active:scale-98"
      >
        <Plus className="w-4 h-4 text-indigo-600" />
        <span>Adicionar Próxima Etapa ao Algoritmo</span>
      </button>
    </div>
  );
};
