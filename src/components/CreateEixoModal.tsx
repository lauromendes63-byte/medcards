import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Stethoscope, 
  Brain, 
  Heart, 
  Activity, 
  Syringe, 
  ShieldCheck,
  Pill,
  Check
} from 'lucide-react';
import { EixoClinico, EspecialidadeMedica } from '../types';

export interface CreateEixoModalProps {
  eixoParaEditar?: EixoClinico | null;
  totalCardsDoEixo?: number;
  onClose: () => void;
  onEixoCriado?: (eixo: EixoClinico) => void;
  onEixoAtualizado?: (eixo: EixoClinico) => void;
  onEixoExcluido?: (eixoId: string, excluirCards: boolean) => void;
}

export const CORES_DISPONIVEIS = [
  { nome: 'Azul Safira', bgTag: 'bg-blue-100', textTag: 'text-blue-950', borderTag: 'border-blue-300', accent: '#1D4ED8' },
  { nome: 'Roxo Cerebral', bgTag: 'bg-purple-100', textTag: 'text-purple-950', borderTag: 'border-purple-300', accent: '#7E22CE' },
  { nome: 'Esmeralda Cirúrgico', bgTag: 'bg-emerald-100', textTag: 'text-emerald-950', borderTag: 'border-emerald-300', accent: '#047857' },
  { nome: 'Rubi Cardíaco', bgTag: 'bg-rose-100', textTag: 'text-rose-950', borderTag: 'border-rose-300', accent: '#BE123C' },
  { nome: 'Âmbar Endócrino', bgTag: 'bg-amber-100', textTag: 'text-amber-950', borderTag: 'border-amber-300', accent: '#B45309' },
  { nome: 'Índigo Neuro', bgTag: 'bg-indigo-100', textTag: 'text-indigo-950', borderTag: 'border-indigo-300', accent: '#4338CA' },
  { nome: 'Ciano Pneumo', bgTag: 'bg-cyan-100', textTag: 'text-cyan-950', borderTag: 'border-cyan-300', accent: '#0E7490' },
  { nome: 'Coral Trauma', bgTag: 'bg-orange-100', textTag: 'text-orange-950', borderTag: 'border-orange-300', accent: '#C2410C' },
  { nome: 'Teal Pediatria', bgTag: 'bg-teal-100', textTag: 'text-teal-950', borderTag: 'border-teal-300', accent: '#0F766E' },
  { nome: 'Fúcsia Gineco', bgTag: 'bg-fuchsia-100', textTag: 'text-fuchsia-950', borderTag: 'border-fuchsia-300', accent: '#A21CAF' },
];

const ICONES_DISPONIVEIS = [
  { id: '🧠', rotulo: 'Cérebro' },
  { id: '🫀', rotulo: 'Coração' },
  { id: '🫁', rotulo: 'Pulmão' },
  { id: '🩺', rotulo: 'Esteto' },
  { id: '💊', rotulo: 'Fármaco' },
  { id: '💉', rotulo: 'Injeção' },
  { id: '🔬', rotulo: 'Microscópio' },
  { id: '🧬', rotulo: 'Genética' },
  { id: '⚡', rotulo: 'Emergência' },
  { id: '🩸', rotulo: 'Hematologia' },
  { id: '🦴', rotulo: 'Ortopedia' },
  { id: '👁️', rotulo: 'Oftalmo' },
  { id: '👶', rotulo: 'Pediatria' },
  { id: '🤰', rotulo: 'Gineco / Obstetrícia' },
  { id: 'Brain', rotulo: 'Neuro', lucide: Brain },
  { id: 'Heart', rotulo: 'Cardio', lucide: Heart },
  { id: 'Activity', rotulo: 'Monitor', lucide: Activity },
  { id: 'Stethoscope', rotulo: 'Clínica', lucide: Stethoscope },
  { id: 'ShieldCheck', rotulo: 'Prevenção', lucide: ShieldCheck },
  { id: 'Pill', rotulo: 'Farmácia', lucide: Pill },
];

export const CreateEixoModal: React.FC<CreateEixoModalProps> = ({
  eixoParaEditar,
  totalCardsDoEixo = 0,
  onClose,
  onEixoCriado,
  onEixoAtualizado,
  onEixoExcluido,
}) => {
  const isEdicao = !!eixoParaEditar;

  const [titulo, setTitulo] = useState(eixoParaEditar?.titulo || '');
  const [subtitulo, setSubtitulo] = useState(eixoParaEditar?.subtitulo || '');
  const [especialidade, setEspecialidade] = useState<EspecialidadeMedica>(eixoParaEditar?.especialidade || 'Neurologia');
  const [descricao, setDescricao] = useState(eixoParaEditar?.descricao || '');
  const [corSelecionada, setCorSelecionada] = useState(eixoParaEditar?.corTema || CORES_DISPONIVEIS[0]);
  const [iconeSelecionado, setIconeSelecionado] = useState(eixoParaEditar?.icone || 'Brain');

  // Estado para confirmação de exclusão
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluirCardsJunto, setExcluirCardsJunto] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    if (isEdicao && eixoParaEditar && onEixoAtualizado) {
      const eixoAtualizado: EixoClinico = {
        ...eixoParaEditar,
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || 'Tópicos essenciais de alto rendimento',
        especialidade,
        descricao: descricao.trim() || 'Baralho e bloco estruturado de revisão clínica.',
        icone: iconeSelecionado,
        corTema: corSelecionada,
      };
      onEixoAtualizado(eixoAtualizado);
      onClose();
      return;
    }

    if (onEixoCriado) {
      const novoEixo: EixoClinico = {
        id: `eixo-custom-${Date.now()}`,
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || 'Tópicos essenciais de alto rendimento',
        especialidade,
        descricao: descricao.trim() || 'Baralho e bloco estruturado de revisão clínica.',
        icone: iconeSelecionado,
        corTema: corSelecionada,
        totalCards: 0,
        cardsDominados: 0,
        pendentesHoje: 0,
        ultimaAtividade: 'Criado agora',
      };
      onEixoCriado(novoEixo);
      onClose();
    }
  };

  const handleConfirmarExclusao = () => {
    if (!eixoParaEditar || !onEixoExcluido) return;
    onEixoExcluido(eixoParaEditar.id, excluirCardsJunto);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isEdicao ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {isEdicao ? <Pencil className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </span>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isEdicao ? 'text-amber-600' : 'text-blue-600'}`}>
                {isEdicao ? 'Personalização do Eixo' : 'Novo Eixo / Baralho'}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {isEdicao ? 'Editar Eixo Clínico' : 'Criar Bloco de Especialidade'}
              </h3>
            </div>
          </div>

          <button
            id="btn-fechar-modal-eixo"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diálogo de Confirmação de Exclusão (se ativado) */}
        {confirmandoExclusao ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Excluir Eixo Definitivamente?</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Você está prestes a remover o eixo <strong>"{titulo}"</strong>. Esta ação não poderá ser desfeita.
              </p>
              {totalCardsDoEixo > 0 && (
                <div className="pt-2 border-t border-rose-200/80">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={excluirCardsJunto}
                      onChange={e => setExcluirCardsJunto(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs text-rose-900 font-medium">
                      Excluir também todos os <strong>{totalCardsDoEixo}</strong> flashcards e oclusões associados a este eixo.
                    </span>
                  </label>
                  {!excluirCardsJunto && (
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      (Os cards serão mantidos e reatribuídos para o primeiro eixo disponível)
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-exclusao-eixo"
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Eixo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Criação / Edição */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome do Eixo / Baralho *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Pneumologia & Terapia Intensiva"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Especialidade Médica
              </label>
              <select
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value as EspecialidadeMedica)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
              >
                <option value="Neurologia">Neurologia</option>
                <option value="Cirurgia Geral">Cirurgia Geral</option>
                <option value="Endocrinologia">Endocrinologia</option>
                <option value="Psiquiatria">Psiquiatria</option>
                <option value="Cardiologia">Cardiologia</option>
                <option value="Infectologia">Infectologia</option>
                <option value="Geral / Outros">Geral / Outros</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Subtítulo / Palavras-chave
              </label>
              <input
                type="text"
                value={subtitulo}
                onChange={e => setSubtitulo(e.target.value)}
                placeholder="Ex: Insuficiência respiratória, ventilação mecânica, TEP"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Descrição do Bloco
              </label>
              <textarea
                rows={2}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Objetivos e rotinas de revisão para este eixo."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            {/* Seletor de Ícone / Emoji Médico */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Ícone ou Emoji do Eixo
              </label>
              <div className="grid grid-cols-7 sm:grid-cols-7 gap-1.5 p-2 rounded-2xl bg-slate-100/70 border border-slate-200">
                {ICONES_DISPONIVEIS.map((item) => {
                  const ativo = iconeSelecionado === item.id;
                  const LucideComp = (item as any).lucide;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIconeSelecionado(item.id)}
                      title={item.rotulo}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        ativo
                          ? 'bg-white border-2 border-blue-600 ring-2 ring-blue-100 shadow-xs scale-105'
                          : 'bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-3xs'
                      }`}
                    >
                      {LucideComp ? (
                        <LucideComp className={`w-4 h-4 ${ativo ? 'text-blue-600' : 'text-slate-600'}`} />
                      ) : (
                        <span className="text-xl leading-none select-none filter drop-shadow-xs">{item.id}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paleta de Cores Minimalista */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Identidade Visual & Cor de Destaque
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {CORES_DISPONIVEIS.map((cor) => {
                  const ativo = cor.accent === corSelecionada.accent;
                  return (
                    <button
                      key={cor.accent}
                      type="button"
                      onClick={() => setCorSelecionada(cor)}
                      title={cor.nome}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-90 ${
                        ativo
                          ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: cor.accent }}
                    >
                      {ativo && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pré-visualização do Eixo */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pré-visualização do Eixo
              </span>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white border-2 shadow-xs"
                  style={{ borderColor: corSelecionada.accent }}
                >
                  {/\p{Extended_Pictographic}/u.test(iconeSelecionado) ? (
                    <span className="text-xl leading-none select-none filter drop-shadow-xs">{iconeSelecionado}</span>
                  ) : (() => {
                    const found = ICONES_DISPONIVEIS.find(i => i.id === iconeSelecionado);
                    const Comp = found && (found as any).lucide ? (found as any).lucide : Stethoscope;
                    return <Comp className="w-4 h-4" style={{ color: corSelecionada.accent }} />;
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <span 
                    className="text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider border inline-block mb-0.5"
                    style={{ 
                      backgroundColor: `${corSelecionada.accent}15`, 
                      borderColor: `${corSelecionada.accent}40`,
                      color: corSelecionada.accent
                    }}
                  >
                    {especialidade}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {titulo.trim() || 'Nome do Eixo'}
                  </h4>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="pt-3 flex flex-col gap-2">
              <button
                type="submit"
                id="btn-salvar-eixo"
                className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                {isEdicao ? 'Salvar Alterações do Eixo' : 'Criar Eixo Clínico'}
              </button>

              {isEdicao && onEixoExcluido && (
                <button
                  type="button"
                  id="btn-abrir-confirmacao-exclusao-eixo"
                  onClick={() => setConfirmandoExclusao(true)}
                  className="w-full py-2.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Eixo Clínico</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
