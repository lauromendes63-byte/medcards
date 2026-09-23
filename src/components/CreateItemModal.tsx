import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Layers, 
  FileText, 
  FolderPlus, 
  Sparkles, 
  Check, 
  Lightbulb,
  Stethoscope
} from 'lucide-react';
import { CardClinico, EixoClinico, EspecialidadeMedica } from '../types';

interface CreateItemModalProps {
  eixos: EixoClinico[];
  eixoPreselecionadoId?: string;
  onClose: () => void;
  onCardCriado: (card: CardClinico) => void;
  onEixoCriado: (eixo: EixoClinico) => void;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  eixos,
  eixoPreselecionadoId,
  onClose,
  onCardCriado,
  onEixoCriado,
}) => {
  const [tipoCriacao, setTipoCriacao] = useState<'card_rapido' | 'card_oclusao' | 'novo_eixo'>('card_rapido');

  // Form states para Card Rápido
  const [eixoId, setEixoId] = useState(eixoPreselecionadoId || eixos[0]?.id || '');
  const [titulo, setTitulo] = useState('');
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [perola, setPerola] = useState('');
  const [mnemonico, setMnemonico] = useState('');
  const [diretriz, setDiretriz] = useState('');

  // Form states para Oclusão
  const [passo1, setPasso1] = useState('');
  const [passo2, setPasso2] = useState('');
  const [passo3, setPasso3] = useState('');

  // Form states para Novo Eixo
  const [novoEixoTitulo, setNovoEixoTitulo] = useState('');
  const [novoEixoSubtitulo, setNovoEixoSubtitulo] = useState('');
  const [novoEixoEspecialidade, setNovoEixoEspecialidade] = useState<EspecialidadeMedica>('Neurologia');
  const [novoEixoDescricao, setNovoEixoDescricao] = useState('');

  const handleSalvarCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !resposta.trim()) return;

    const eixoSelecionado = eixos.find(ex => ex.id === eixoId) || eixos[0];

    if (tipoCriacao === 'card_rapido') {
      const novoCard: CardClinico = {
        id: `card-custom-${Date.now()}`,
        eixoId: eixoSelecionado.id,
        especialidade: eixoSelecionado.especialidade,
        titulo: titulo.trim(),
        perguntaGatilho: pergunta.trim() || titulo.trim(),
        resposta: resposta.trim(),
        perolaClinica: perola.trim() || 'Atenção aos critérios diagnósticos e condutas de emergência.',
        mnemonicoOuDica: mnemonico.trim() || undefined,
        diretrizReferencia: diretriz.trim() || 'Diretriz de Prática Médica 2024',
        repeticoes: 0,
        intervaloDias: 1,
        fatorFacilidade: 2.5,
        proximaRevisao: new Date().toISOString(),
        status: 'pendente',
        taxaAcerto: 0,
        historicoRespostas: [],
        tipoCard: 'conceito',
      };
      onCardCriado(novoCard);
    } else if (tipoCriacao === 'card_oclusao') {
      const blocos = [
        { id: `b-${Date.now()}-1`, posicao: { x: 10, y: 15, largura: 80, altura: 20 }, textoOculto: passo1.trim() || 'Conduta inicial prioritária', dica: 'Etapa 1' },
        { id: `b-${Date.now()}-2`, posicao: { x: 10, y: 45, largura: 80, altura: 20 }, textoOculto: passo2.trim() || 'Exame complementar confirmatório', dica: 'Etapa 2' },
        { id: `b-${Date.now()}-3`, posicao: { x: 10, y: 75, largura: 80, altura: 20 }, textoOculto: passo3.trim() || 'Terapia definitiva ou alta', dica: 'Etapa 3' },
      ];

      const novoCard: CardClinico = {
        id: `card-custom-${Date.now()}`,
        eixoId: eixoSelecionado.id,
        especialidade: eixoSelecionado.especialidade,
        titulo: titulo.trim(),
        perguntaGatilho: pergunta.trim() || 'Identifique as etapas críticas do fluxograma clínico.',
        resposta: `1. ${passo1}\n2. ${passo2}\n3. ${passo3}`,
        perolaClinica: perola.trim() || 'Fixe a ordem temporal e os critérios de intervenção imediata.',
        repeticoes: 0,
        intervaloDias: 1,
        fatorFacilidade: 2.5,
        proximaRevisao: new Date().toISOString(),
        status: 'pendente',
        taxaAcerto: 0,
        historicoRespostas: [],
        tipoCard: 'fluxograma_oclusao',
        blocosOclusao: blocos,
      };
      onCardCriado(novoCard);
    }

    onClose();
  };

  const handleSalvarEixo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEixoTitulo.trim()) return;

    const novoEixo: EixoClinico = {
      id: `eixo-custom-${Date.now()}`,
      titulo: novoEixoTitulo.trim(),
      subtitulo: novoEixoSubtitulo.trim() || 'Tópicos essenciais de alto rendimento',
      especialidade: novoEixoEspecialidade,
      descricao: novoEixoDescricao.trim() || 'Bloco de revisão clínica estruturado.',
      icone: 'Stethoscope',
      corTema: {
        bgTag: 'bg-blue-50',
        textTag: 'text-blue-700',
        borderTag: 'border-blue-200',
        accent: '#2563EB',
      },
      totalCards: 0,
      cardsDominados: 0,
      pendentesHoje: 0,
      ultimaAtividade: 'Criado agora',
    };

    onEixoCriado(novoEixo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Topo do Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
              Criação Descomplicada
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Novo Conteúdo de Estudo
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alternador de Tipo de Criação */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setTipoCriacao('card_rapido')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              tipoCriacao === 'card_rapido'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Card Rápido
          </button>
          <button
            type="button"
            onClick={() => setTipoCriacao('card_oclusao')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              tipoCriacao === 'card_oclusao'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Oclusão de Fluxo
          </button>
          <button
            type="button"
            onClick={() => setTipoCriacao('novo_eixo')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              tipoCriacao === 'novo_eixo'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Novo Eixo Clínico
          </button>
        </div>

        {/* Formulário */}
        <div className="flex-1 p-5 overflow-y-auto">
          {tipoCriacao === 'novo_eixo' ? (
            <form onSubmit={handleSalvarEixo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título do Eixo Clínico *
                </label>
                <input
                  type="text"
                  required
                  value={novoEixoTitulo}
                  onChange={e => setNovoEixoTitulo(e.target.value)}
                  placeholder="Ex: Pneumologia & Doenças Obstrutivas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Especialidade Médica
                </label>
                <select
                  value={novoEixoEspecialidade}
                  onChange={e => setNovoEixoEspecialidade(e.target.value as EspecialidadeMedica)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                >
                  <option value="Neurologia">Neurologia</option>
                  <option value="Cirurgia Geral">Cirurgia Geral</option>
                  <option value="Endocrinologia">Endocrinologia</option>
                  <option value="Psiquiatria">Psiquiatria</option>
                  <option value="Cardiologia">Cardiologia</option>
                  <option value="Infectologia">Infectologia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Subtítulo / Tópicos Chave
                </label>
                <input
                  type="text"
                  value={novoEixoSubtitulo}
                  onChange={e => setNovoEixoSubtitulo(e.target.value)}
                  placeholder="Ex: DPOC, Asma Aguda, TEP e Ventilação Mecânica"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição Curta
                </label>
                <textarea
                  rows={2}
                  value={novoEixoDescricao}
                  onChange={e => setNovoEixoDescricao(e.target.value)}
                  placeholder="Objetivos e critérios de revisão para este bloco."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all mt-4 cursor-pointer"
              >
                Criar Eixo Clínico
              </button>
            </form>
          ) : (
            <form onSubmit={handleSalvarCard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vincular ao Eixo Clínico
                </label>
                <select
                  value={eixoId}
                  onChange={e => setEixoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                >
                  {eixos.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.especialidade} • {ex.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tema / Título Principal *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Conduta no Tromboembolismo Pulmonar Maciço"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              {tipoCriacao === 'card_rapido' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Gatilho Clínico / Situação Problema
                    </label>
                    <textarea
                      rows={2}
                      value={pergunta}
                      onChange={e => setPergunta(e.target.value)}
                      placeholder="Ex: Paciente com TEP e choque hemodinâmico (instabilidade). Qual a terapia de reperfusão indicada?"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Resposta / Conduta Médica Direta *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={resposta}
                      onChange={e => setResposta(e.target.value)}
                      placeholder="Ex: Trombólise sistêmica imediata com Alteplase 100mg em 2 horas (ou em bólus se PCR iminente)."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                      Nota de Fixação (High-Yield)
                    </label>
                    <input
                      type="text"
                      value={perola}
                      onChange={e => setPerola(e.target.value)}
                      placeholder="Ex: Apenas 5% dos TEPs são maciços com choque; no TEP estável a conduta é anticoagulação isolada."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Mnemônico / Dica
                      </label>
                      <input
                        type="text"
                        value={mnemonico}
                        onChange={e => setMnemonico(e.target.value)}
                        placeholder="Ex: Choque = Trombolisa"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Diretriz Referência
                      </label>
                      <input
                        type="text"
                        value={diretriz}
                        onChange={e => setDiretriz(e.target.value)}
                        placeholder="Ex: ESC Guidelines 2024"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Card de Oclusão com 3 passos rápidos */
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <span className="text-xs font-bold text-purple-800 block">
                    Etapas do Fluxo para Oclusão Interativa:
                  </span>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Passo #1 (Oculto na revisão)
                    </label>
                    <input
                      type="text"
                      required
                      value={passo1}
                      onChange={e => setPasso1(e.target.value)}
                      placeholder="Ex: TC de Tórax com protocolo para TEP"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Passo #2 (Oculto na revisão)
                    </label>
                    <input
                      type="text"
                      required
                      value={passo2}
                      onChange={e => setPasso2(e.target.value)}
                      placeholder="Ex: Avaliação de disfunção de VD por Eco ou Biomarcadores"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Passo #3 (Oculto na revisão)
                    </label>
                    <input
                      type="text"
                      required
                      value={passo3}
                      onChange={e => setPasso3(e.target.value)}
                      placeholder="Ex: Iniciar Enoxaparina 1mg/kg 12/12h ou NOAC"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all mt-4 cursor-pointer"
              >
                Salvar e Ativar Card no Algoritmo
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
