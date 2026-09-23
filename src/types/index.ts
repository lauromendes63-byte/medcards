export type EspecialidadeMedica = 
  | 'Clínica Médica'
  | 'Cirurgia Geral'
  | 'Ginecologia e Obstetrícia'
  | 'Pediatria'
  | 'Medicina Preventiva e Social'
  | 'Medicina de Família e Comunidade'
  | 'Cardiologia'
  | 'Neurologia'
  | 'Medicina de Emergência'
  | 'Terapia Intensiva'
  | 'Endocrinologia'
  | 'Gastroenterologia'
  | 'Nefrologia'
  | 'Pneumologia'
  | 'Infectologia'
  | 'Hematologia'
  | 'Reumatologia'
  | 'Psiquiatria'
  | 'Ortopedia e Traumatologia'
  | 'Dermatologia'
  | 'Oftalmologia'
  | 'Otorrinolaringologia'
  | 'Urologia'
  | 'Anestesiologia'
  | 'Radiologia'
  | 'Oncologia'
  | 'Geriatria'
  | 'Neurocirurgia'
  | 'Cirurgia Vascular'
  | 'Geral / Outros'
  | (string & {});

export const TODAS_ESPECIALIDADES_MEDICAS: string[] = [
  'Clínica Médica',
  'Cirurgia Geral',
  'Ginecologia e Obstetrícia',
  'Pediatria',
  'Medicina Preventiva e Social',
  'Medicina de Família e Comunidade',
  'Cardiologia',
  'Neurologia',
  'Medicina de Emergência',
  'Terapia Intensiva',
  'Endocrinologia',
  'Gastroenterologia',
  'Nefrologia',
  'Pneumologia',
  'Infectologia',
  'Hematologia',
  'Reumatologia',
  'Psiquiatria',
  'Ortopedia e Traumatologia',
  'Dermatologia',
  'Oftalmologia',
  'Otorrinolaringologia',
  'Urologia',
  'Anestesiologia',
  'Radiologia',
  'Oncologia',
  'Geriatria',
  'Neurocirurgia',
  'Cirurgia Vascular',
  'Geral / Outros',
];

export type PrioridadeClinica = 'alta' | 'media' | 'normal';

export type StatusRevisao = 'pendente' | 'em_revisao' | 'dominado' | 'atrasado';

export type ModoVisualizacaoEixos = 'lista' | 'grade';

export interface BlocoOclusao {
  id: string;
  posicao: { x: number; y: number; largura: number; altura: number };
  textoOculto: string;
  dica?: string;
  revelado?: boolean;
}

export interface MascaraImagem {
  id: string;
  numero: number;
  tipoForma?: 'retangulo' | 'livre'; // 'retangulo' ou 'livre' (brush/caminho livre)
  pontos?: { x: number; y: number }[]; // Lista de pontos % (0-100) para formas livres / caneta
  x: number; // % da largura da imagem (0-100)
  y: number; // % da altura da imagem (0-100)
  largura: number; // % da largura (0-100)
  altura: number; // % da altura (0-100)
  textoOculto: string;
  dica?: string;
  revelado?: boolean;
}

export type TipoCard = 
  | 'conceito'             // Básico: Frente / Verso
  | 'image_occlusion'      // Oclusão de Imagem (Image Occlusion)
  | 'cloze'                // Oclusão de Texto / Lacuna (Cloze Deletion)
  | 'fluxograma_oclusao'   // Fluxograma Linear / Passo a Passo
  | 'fluxograma_complexo'  // Fluxograma Complexo / Árvore de Decisão Ramificada (Sim/Não, Critérios nas Setas)
  | 'caso_clinico';        // Múltipla Escolha

export interface RamoFluxogramaComplexo {
  id: string;
  rotulo: string; // Ex: "Sim", "Não", "Refratário", "Se SatO2 < 92%", "Glicemia > 250", "> 48h", "Leve", "Grave"
  destinoNoId: string; // ID do nó de destino
  cor?: 'verde' | 'vermelho' | 'azul' | 'amber' | 'indigo' | 'purple' | 'teal' | 'slate';
  estilo?: 'solida' | 'tracejada' | 'pontilhada'; // Estilo da linha da seta
  espessura?: 'fina' | 'media' | 'grossa'; // Espessura da linha
  observacao?: string; // Dica ou nota do caminho
}

export interface NoFluxogramaComplexo {
  id: string;
  titulo: string; // Ex: "Paciente instável (PAS < 90 ou FC > 130)?", "Cardioversão Elétrica Sincronizada"
  descricao?: string; // Detalhes da conduta, dosagens, justificativa
  tipo: 'inicio' | 'decisao' | 'conduta' | 'diagnostico' | 'alerta'; // Tipo de nó visual
  oculto?: boolean; // Se o nó começa ocluso para estudo ativo
  respostaOculta?: string; // Texto específico da conduta revelada
  dica?: string;
  ramos: RamoFluxogramaComplexo[]; // Conexões saindo deste nó
  posicaoX?: number; // Opcional para canvas
  posicaoY?: number;
}

export interface FluxogramaComplexoDados {
  id: string;
  titulo: string;
  descricao?: string;
  noInicialId: string; // Raiz da árvore de decisão
  nos: NoFluxogramaComplexo[];
}

export interface EtapaFluxograma {
  id: string;
  titulo: string;
  conteudoOculto: string;
  dica?: string;
}

export interface RamificacaoFluxo {
  id: string;
  origemId: string;
  destinoId: string;
  criterioCondicional: string; // ex: "Glicemia > 200 mg/dL", "ECG com Supra ST", "Lactato > 2.0"
}

export interface BlocoFluxogramaDecisao {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: 'inicio' | 'decisao' | 'conduta' | 'alerta';
  criterioEntrada?: string;
}

export interface AlgoritmoDecisao {
  id: string;
  cardId?: string;
  titulo: string;
  descricao?: string;
  especialidade: EspecialidadeMedica;
  eixoId: string;
  topicoId?: string;
  blocos: BlocoFluxogramaDecisao[];
  ramificacoes: RamificacaoFluxo[];
}

export interface TimersRodada {
  erreiMinutos: number;
  dificilMinutos: number;
  bomMinutos: number;
  facilMinutos: number;
}

export interface ConfiguracaoTimers {
  rodada1: TimersRodada;
  rodada2: TimersRodada;
  rodada3Plus: TimersRodada;
}

export interface TopicoClinico {
  id: string;
  eixoId: string;
  titulo: string; // ex: Cefaleias, Abdome Agudo, AVC
  descricao?: string;
  totalCards?: number;
  customTimers?: ConfiguracaoTimers;
}

export interface CardClinico {
  id: string;
  eixoId: string;
  topicoId?: string;
  topicoNome?: string;
  especialidade: EspecialidadeMedica;
  titulo: string;
  perguntaGatilho: string; // Frente
  resposta: string;        // Verso
  perolaClinica: string;   // High-Yield Pearl / Destaque de Fixação
  mnemonicoOuDica?: string;
  diretrizReferencia?: string; // ex: SBC 2024, UpToDate, ATLS 10ª Ed
  
  // SRS (Spaced Repetition System) Fields Intradiários
  rodadaAtual?: number;    // 1 (novo/revisão 1), 2 (consolidação), 3+ (fixação)
  repeticoes: number;
  intervaloDias: number;   // Equivalente em fração de dia para compatibilidade
  fatorFacilidade: number; // SM-2 standard ~2.5
  proximaRevisao: string;  // ISO date string
  ultimaRevisao?: string;
  status: StatusRevisao;
  taxaAcerto: number;      // 0 a 100%
  historicoRespostas: ('errei' | 'dificil' | 'bom' | 'facil')[];
  
  tipoCard: TipoCard;

  // Imagem e Oclusão Segmentar de Imagem (Image Occlusion)
  imagemUrl?: string;
  mascarasImagem?: MascaraImagem[];

  // Oclusão de Texto / Lacuna (Cloze)
  textoCloze?: string; // ex: O tratamento inicial do choque anafilático é {{c1::Adrenalina IM}} no vasto lateral.

  // Fluxograma estruturado em etapas dinâmicas e Algoritmo de Decisão
  etapasFluxograma?: EtapaFluxograma[];
  blocosOclusao?: BlocoOclusao[];
  algoritmoDecisao?: AlgoritmoDecisao;
  fluxogramaComplexo?: FluxogramaComplexoDados;

  // Caso Clínico / Questão
  casoClinicoDados?: {
    historiaClinica: string;
    exameFisicoSinais: string;
    opcoes: string[];
    indiceCorreto: number;
    justificativaDetalhada: string;
  };

  // Origem da importação (se veio de .apkg ou anki)
  origemAnki?: boolean;
}

export interface EixoClinico {
  id: string;
  titulo: string;
  subtitulo: string;
  especialidade: EspecialidadeMedica;
  descricao: string;
  icone: string; // Nome do Lucide Icon
  corTema: {
    bgTag: string;
    textTag: string;
    borderTag: string;
    accent: string;
  };
  totalCards: number;
  cardsDominados: number;
  pendentesHoje: number;
  ultimaAtividade: string;
  topicos?: TopicoClinico[];
}

export interface ProgressoDiario {
  data: string;
  cardsRevisadosHoje: number;
  metaDiaria: number;
  sequenciaDias: number; // Streak
  taxaRetencaoMedia: number; // %
  tempoEstudadoMinutos: number;
  ultimoSalvamentoDispositivo?: string;
}

export type TabNavegacao = 'eixos' | 'revisoes' | 'criar_card' | 'provas' | 'metricas';

export type ModoVisualizacao = 'lista' | 'grade';
