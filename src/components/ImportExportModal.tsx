import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileText, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles, 
  Copy, 
  ClipboardCheck, 
  Stethoscope, 
  GitFork, 
  HelpCircle, 
  Search, 
  Plus, 
  BookOpen,
  ArrowRight,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { CardClinico, EixoClinico, ProgressoDiario, EspecialidadeMedica, TODAS_ESPECIALIDADES_MEDICAS } from '../types';
import { AnkiService, ResultadoImportacao } from '../services/ankiService';
import { StorageService } from '../services/storage';
import { CORES_DISPONIVEIS } from './CreateEixoModal';

interface ImportExportModalProps {
  cards: CardClinico[];
  eixos: EixoClinico[];
  progresso: ProgressoDiario;
  onClose: () => void;
  onImportarConcluido: (resultado: ResultadoImportacao) => void;
  onExportarJson: () => void;
  initialTab?: 'importar' | 'exportar';
  initialEixoId?: string;
  initialCardId?: string;
  onAbrirCriacaoManual?: () => void;
  onEixoCriado?: (eixo: EixoClinico) => void;
  onNavegarParaEixo?: (eixoId: string) => void;
  onEstudarCardsImportados?: (cards: CardClinico[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  cards,
  eixos,
  progresso,
  onClose,
  onImportarConcluido,
  onExportarJson,
  initialTab = 'importar',
  initialEixoId,
  initialCardId,
  onAbrirCriacaoManual,
  onEixoCriado,
  onNavegarParaEixo,
  onEstudarCardsImportados,
}) => {
  const [tabAtiva, setTabAtiva] = useState<'importar' | 'exportar'>(initialTab);
  
  // Submodos de importação
  const [modoImportacao, setModoImportacao] = useState<'texto' | 'arquivo'>('texto');
  const [textoColado, setTextoColado] = useState('');
  const [promptCopiado, setPromptCopiado] = useState(false);
  const [jsonCardCopiado, setJsonCardCopiado] = useState(false);
  const [jsonEixoCopiado, setJsonEixoCopiado] = useState(false);
  const [jsonColecaoCopiado, setJsonColecaoCopiado] = useState(false);
  
  // Eixo selecionado para importar/exportar
  const [eixoDestinoId, setEixoDestinoId] = useState<string>(
    initialEixoId && eixos.some(e => e.id === initialEixoId) 
      ? initialEixoId 
      : (eixos[0]?.id || '__novo_eixo__')
  );

  // Criar novo eixo inline na importação
  const [novoEixoTitulo, setNovoEixoTitulo] = useState('');
  const [novoEixoEspecialidade, setNovoEixoEspecialidade] = useState<EspecialidadeMedica>('Clínica Médica');

  // Seleção e criação de Tópico na importação
  const [topicoSelecionadoModo, setTopicoSelecionadoModo] = useState<string>('__auto__');
  const [novoTopicoTitulo, setNovoTopicoTitulo] = useState('');

  // Submodos de exportação: 'eixo' | 'conjunto' | 'individual'
  const [modoExportacao, setModoExportacao] = useState<'eixo' | 'conjunto' | 'individual'>('eixo');
  const [cardSelecionadoId, setCardSelecionadoId] = useState<string>(
    initialCardId && cards.some(c => c.id === initialCardId)
      ? initialCardId
      : (cards[0]?.id || '')
  );
  const [filtroBuscaCard, setFiltroBuscaCard] = useState('');
  const [verPromptDetalhado, setVerPromptDetalhado] = useState(false);

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  // Pré-visualização interativa com seleção antes de salvar
  const [cardsPrevia, setCardsPrevia] = useState<CardClinico[]>([]);
  const [idsSelecionados, setIdsSelecionados] = useState<Set<string>>(new Set());

  // Pop-up detalhado pós-importação
  const [sucessoPopUp, setSucessoPopUp] = useState<{
    totalCards: number;
    eixoId: string;
    eixoNome: string;
    especialidade: string;
    topicoNome: string;
    tiposContagem: Record<string, number>;
    cardsCriados: CardClinico[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // PROMPT MODELO GEMINI REFINADO COM DIRETRIZES E FOCO NAS PROVAS DA UFPA
  // =========================================================================
  const promptModeloGemini = `Você é um preceptor médico especialista em elaboração de flashcards de alto rendimento para o MedCards, com FOCO PRINCIPAL NAS PROVAS DA FACULDADE DE MEDICINA DA UFPA (Universidade Federal do Pará), módulos acadêmicos, internato e residência médica.
Com base no material médico, transcrições de aulas, slides de professores da UFPA, casos clínicos, apostilas, PDFs ou fotos fornecidos, elabore flashcards rigorosamente estruturados no formato JSON para o aplicativo MedCards.

REGRA DE OURO CRÍTICA — FIDELIDADE ESTRITA AO CONTEÚDO FORNECIDO (FOCO PROVAS UFPA):
1. ESTRITA ADERÊNCIA AO CONTEÚDO ENVIADO:
   - Seu foco primário e mandatório são as cobranças das provas e módulos da Faculdade de Medicina da UFPA.
   - Os flashcards devem se ater ESTRITAMENTE e EXCLUSIVAMENTE ao conteúdo que o aluno passar junto ao prompt (transcrições de aulas, slides de professores da UFPA, discussões clínicas de enfermaria/ambulatório, apostilas e resumos enviados).
   - NUNCA invente condutas, parâmetros ou diretrizes conflitantes com os slides ou materiais fornecidos pelo aluno. Se o professor da UFPA destacou uma conduta, dosagem, classificação ou pegadinha específica no material, essa informação TEM PRIORIDADE ABSOLUTA nos cartões.
   - NUNCA omita, resuma superficialmente, corte ou descarte informações presentes nos materiais enviados. Todos os dados, dosagens exatas de medicamentos, valores de corte laboratoriais, achados de imagem, sinais clínicos, condutas e contraindicações fornecidos são essenciais e devem ser integralmente aproveitados e distribuídos nos flashcards gerados.

REGRAS DE FORMATAÇÃO E TIPOGRAFIA MÉDICA:
1. PROIBIÇÃO ABSOLUTA DE COLCHETES PARA SEPARAR ITENS:
   - NUNCA use colchetes [...] para separar itens, títulos, categorias, etapas ou termos nas perguntas ou respostas.
   - Use colchetes APENAS se for a sintaxe obrigatória de cloze do MedCards {{c1::termo}} ou a sintaxe de array JSON [].
   - Para listar ou separar elementos no texto clínico, use marcadores visuais (•), hífens (-), numeração (1., 2.) ou setas (➔).

2. EVITAR PARÊNTESES AO MÁXIMO:
   - Evite o uso de parênteses (...) nas perguntas, respostas e justificativas.
   - Use parênteses APENAS quando a situação for estritamente necessária (exemplo: indicar que uma conduta ou droga é opcional, como "(opcional)", ou para unidades de dosagem e siglas médicas indispensáveis). No restante, integre o texto de forma fluida e direta sem poluição de parênteses desnecessários.

3. PREENCHIMENTO OBRIGATÓRIO DO CAMPO "topico":
   - Em cada flashcard gerado, SEMPRE preencha o campo "topico" com o nome específico do assunto/aula da faculdade (ex: "topico": "Manejo da Sepse no Idoso" ou "topico": "Semiologia Respiratória UFPA").
   - Isso permite que o MedCards identifique e crie automaticamente os tópicos correspondentes e organize tudo por Eixos e Tópicos no celular e no computador de forma sincronizada.

4. ARQUITETURA VISUAL E PALETA DE DESTAQUES MÉDICOS DE ALTO CONTRASTE (CRÍTICO):
   - NUNCA GERAR "TEXTÃO" OU PARÁGRAFO CONTÍNUO: É terminantemente proibido devolver o campo "resposta" ou "justificativaDetalhada" como um bloco denso e ininterrupto de texto.
   - SEPARAÇÃO POR QUEBRAS DE LINHA DUPLAS (\\n\\n): Separe tópicos e seções por quebras de linha duplas ("enter") para garantir respiro visual e leitura rápida no celular.
   - SUBTÍTULOS ESTRUTURADOS:
     • Quando houver etapas ou categorias na conduta, inicie a seção com um subtítulo em maiúsculas terminado em dois-pontos (ex: "ANTIBIOTICOTERAPIA IMEDIATA (1ª HORA):" ou "CRITÉRIOS DE INDICAÇÃO CIRÚRGICA:").
   - PALETA DE CORES E DESTAQUES DE FIXAÇÃO:
     • [azul]termo[/azul]: Use para FÁRMACOS DE 1ª ESCOLHA, CONDUTAS IMEDIATAS e EXAMES PADRÃO-OURO (ex: [azul]Noradrenalina IV[/azul], [azul]Angioplastia Primária[/azul]). Fica num azul vívido de alto contraste visual.
     • [vermelho]termo[/vermelho]: Use para RED FLAGS, CONTRAINDICAÇÕES FORMAIS, RISCO DE MORTE e PEGADINHAS CLÁSSICAS DE PROVA DA UFPA (ex: [vermelho]Beta-bloqueador contraindicado se congestão ou choque[/vermelho]). Fica num vermelho marcante.
     • ==termo==: Marca-texto AMARELO VIVO para metas de tempo e valores de corte definitivos (ex: ==Porta-Balão < 90 min==, ==Lactato sérico > 2 mmol/L==).
     • **termo**: Negrito refinado para títulos de tópicos, dosagens e parâmetros clínicos.
     • <u>termo</u>: Sublinhado para faixas etárias ou subgrupos de risco.
   - HIERARQUIA DE TÓPICOS:
     • Início de cada tópico (•): Inicie sempre com a palavra-chave ou conduta destacada (ex: "• **Cefazolina 2g IV**: Cefalosporina de 1ª geração...").
   - EMOJIS ESTRATÉGICOS DE FIXAÇÃO:
     • ⚠️ no início de linhas com Red Flags ou alertas graves.
     • ⭐ no início de linhas com Regra de Ouro da conduta.
     • 💡 para mnemônicos e dicas de prova da UFPA.
   - DICA PRÁTICA / PONTO-CHAVE ("dica" ou "perolaClinica"):
     • Deve ser curta, direta e objetiva (1 a 2 frases no máximo) com o ponto de virada da conduta médica ou da questão de prova da faculdade (UFPA) / residência médica.

GRANDE TUTORIAL DOS FORMATOS DO MEDCARDS (COMO O ESTUDANTE VISUALIZA E RESOLVE):

1. CONCEITO DIRETO (tipoCard: "conceito"):
   - Como o estudante vê: O estudante visualiza a "perguntaGatilho" na frente do cartão. Ao clicar, o cartão gira e exibe a "resposta" detalhada e a "dica".
   - Como resolver: Evocação ativa rápida (Active Recall) de critérios diagnósticos, valores de corte e indicações terapêuticas.
   - Estrutura: "tipoCard": "conceito", "titulo", "topico", "especialidade", "perguntaGatilho", "resposta", "dica" (ou "perolaClinica").

2. FLUXOGRAMA COMPLEXO / ÁRVORE DE DECISÃO RAMIFICADA (tipoCard: "fluxograma_complexo"):
   - Como o estudante vê: Uma árvore de decisão com nós e ramificações conectadas por setas. O primeiro nó ("inicio") é visível com a condição clínica. Os nós seguintes ("decisao", "alerta", "conduta", "diagnostico") começam OCLUÍDOS ("oculto": true). As setas entre os nós contêm os critérios de decisão (ex: "rotulo": "Supra de ST presente" ou "rotulo": "Tempo para hemodinâmica < 120 min").
   - Como resolver: O estudante analisa o cenário, lê os critérios das setas ramificadas, raciocina mentalmente sobre qual conduta deve vir a seguir e clica no nó para desocultar e verificar a conduta médica correta.
   - Estrutura: "tipoCard": "fluxograma_complexo", com "fluxogramaComplexo" contendo "noInicialId", "nos" (com "id", "titulo", "descricao", "tipo", "oculto": true, "ramos" apontando para "destinoNoId" com "rotulo" e "cor": "verde"|"vermelho"|"azul"|"amber"|"roxo").

3. FLUXOGRAMA LINEAR PASSO A PASSO (tipoCard: "fluxograma_oclusao"):
   - Como o estudante vê: Uma linha do tempo sequencial (ex: Protocolo de Intubação em Sequência Rápida, Manejo de PCR). O primeiro bloco fica visível e os blocos seguintes ficam com as ações ocultas.
   - Como resolver: O estudante lê o critério de entrada na seta ("criterioEntrada"), deduz mentalmente qual é o próximo passo de intervenção e clica para revelar o bloco.
   - Estrutura: "tipoCard": "fluxograma_oclusao", com "algoritmoDecisao" contendo "blocos" ordenados (com "id", "titulo", "criterioEntrada", "descricao", "tipo": "inicio"|"conduta"|"decisao"|"alerta").

4. OCLUSÃO DE TEXTO / CLOZE (tipoCard: "cloze"):
   - Como o estudante vê: Um texto clínico contendo lacunas interativas nos termos-chave.
   - Como resolver: O estudante tenta recordar o valor numérico exato, medicamento ou critério oculto e clica na lacuna para desocultar.
   - Estrutura: "tipoCard": "cloze", com campo "textoCloze" contendo marcações no padrão {{c1::termo_oculto}}, {{c2::outro_termo}}.

5. CASO CLÍNICO COM MÚLTIPLA ESCOLHA (tipoCard: "caso_clinico"):
   - Como o estudante vê: Uma vinheta clínica realista ("historiaClinica" com idade, sintomas e tempo de evolução), achados de exame físico ("exameFisicoSinais") e a "perguntaGatilho". Apresenta 4 alternativas clínicas de conduta ("opcoes").
   - Como resolver: O estudante clica na alternativa que considera correta; o MedCards valida instantaneamente e abre a "justificativaDetalhada" explicando por que a opção está certa e o erro das demais.
   - Estrutura: "tipoCard": "caso_clinico", com "casoClinicoDados" contendo "historiaClinica", "exameFisicoSinais", "opcoes" (array com 4 strings), "indiceCorreto" (0 a 3) e "justificativaDetalhada".

DISTRIBUIÇÃO SUGERIDA POR TEMA (TOTAL DE 12 A 14 FLASHCARDS):
- 6 Flashcards "conceito" (Critérios diagnósticos e tratamento)
- 2 a 3 Flashcards "fluxograma_complexo" (Árvores ramificadas de conduta)
- 2 Flashcards "fluxograma_oclusao" (Protocolos lineares passo a passo)
- 2 a 3 Flashcards "cloze" ou "caso_clinico" (Fixação de doses, lacunas e tomada de decisão)

ESTRUTURA JSON EXATA (Retorne APENAS o JSON válido sem nenhum texto explicativo fora dele):
[
  {
    "tipoCard": "conceito",
    "topico": "Síndrome Coronariana Aguda",
    "titulo": "Critérios Eletrocardiográficos de Reperfusão no IAMCSST",
    "especialidade": "Cardiologia",
    "perguntaGatilho": "Quais são os critérios eletrocardiográficos para definir Supra de ST e indicar reperfusão imediata?",
    "resposta": "**Critérios de Supra de ST no Ponto J (em 2 ou mais derivações contíguas):**\\n\\n• **Derivações em geral:** ==Elevação ≥ 1 mm== em todas derivações (exceto V2-V3).\\n\\n• <u>Nas derivações V2-V3</u>:\\n  - Homens < 40 anos: **≥ 2,5 mm**\\n  - Homens ≥ 40 anos: **≥ 2,0 mm**\\n  - Mulheres (qualquer idade): **≥ 1,5 mm**\\n\\n• **Bloqueio de Ramo:** BRE novo ou presumivelmente novo com clínica isquêmica típica.\\n\\n⚠️ **Alerta Clínico:** Sempre solicitar derivações direitas (V3R, V4R) e posteriores (V7, V8) em caso de infarto de parede inferior!\\n\\n⭐ **Regra de Ouro:** Tempo porta-balão meta: ==< 90 minutos== (ou < 120 min se transferido).",
    "perolaClinica": "Tempo porta-agulha para trombólise química: meta menos de 30 minutos quando a angioplastia primária não for alcançável em até 120 minutos."
  },
  {
    "tipoCard": "fluxograma_complexo",
    "topico": "Dor Torácica & Coronariopatias",
    "titulo": "Abordagem da Dor Torácica Aguda na Sala de Emergência",
    "especialidade": "Cardiologia",
    "perguntaGatilho": "Reconstrua o algoritmo de triagem e conduta inicial na suspeita de Síndrome Coronariana Aguda:",
    "resposta": "ECG em menos de 10 min. Se Supra ST ➔ Reperfusão imediata. Se sem Supra ST ➔ Troponina ultrassensível e Escore HEART.",
    "fluxogramaComplexo": {
      "titulo": "Algoritmo de Dor Torácica no Pronto-Socorro",
      "descricao": "Triagem e condutas com estratificação por ECG e marcadores",
      "noInicialId": "no-1",
      "nos": [
        {
          "id": "no-1",
          "titulo": "Paciente com Dor Torácica no PS: ECG em menos de 10 minutos",
          "descricao": "Monitorização multiparamétrica, acesso venoso calibroso e oximetria.",
          "tipo": "inicio",
          "ramos": [
            { "id": "r1", "rotulo": "Supra de ST em 2 ou mais derivações", "destinoNoId": "no-2", "cor": "vermelho" },
            { "id": "r2", "rotulo": "Sem Supra de ST", "destinoNoId": "no-3", "cor": "azul" }
          ]
        },
        {
          "id": "no-2",
          "titulo": "IAM com Supra de ST",
          "descricao": "AAS 200mg mastigado + Clopidogrel 300mg + Heparina. Estratificar tempo para hemodinâmica.",
          "tipo": "alerta",
          "oculto": true,
          "dica": "Critério de Reperfusão Imediata",
          "ramos": [
            { "id": "r3", "rotulo": "Tempo para hemodinâmica menos de 120 min", "destinoNoId": "no-4", "cor": "verde" },
            { "id": "r4", "rotulo": "Tempo para hemodinâmica mais de 120 min", "destinoNoId": "no-5", "cor": "amber" }
          ]
        },
        {
          "id": "no-4",
          "titulo": "Angioplastia Primária Imediata",
          "descricao": "Transferência imediata para laboratório de hemodinâmica. Meta Porta-Balão menos de 90 min.",
          "tipo": "conduta",
          "oculto": true,
          "ramos": []
        },
        {
          "id": "no-5",
          "titulo": "Fibrinólise Química na Sala de Emergência",
          "descricao": "Tenecteplase ou Alteplase em até 30 min (Porta-Agulha).",
          "tipo": "conduta",
          "oculto": true,
          "ramos": []
        },
        {
          "id": "no-3",
          "titulo": "Troponina Ultrassensível e Escore HEART",
          "descricao": "Coletar troponina na admissão e seriar conforme protocolo institucional.",
          "tipo": "decisao",
          "ramos": [
            { "id": "r5", "rotulo": "Troponina Positiva ou HEART Alto", "destinoNoId": "no-6", "cor": "vermelho" },
            { "id": "r6", "rotulo": "Troponina Negativa e HEART Baixo", "destinoNoId": "no-7", "cor": "verde" }
          ]
        },
        {
          "id": "no-6",
          "titulo": "IAM sem Supra de ST ou Angina Instável",
          "descricao": "Internação em UTI Coronariana + Dupla Antiagregação + Anticoagulação + Cateterismo precoce.",
          "tipo": "conduta",
          "oculto": true,
          "ramos": []
        },
        {
          "id": "no-7",
          "titulo": "Dor Não Cardíaca ou Baixa Probabilidade",
          "descricao": "Investigação ambulatorial com teste provocativo de isquemia ou alta assistida.",
          "tipo": "diagnostico",
          "ramos": []
        }
      ]
    },
    "perolaClinica": "No IAM com Supra de ST o tempo é músculo: meta porta-balão menos de 90 minutos e porta-agulha menos de 30 minutos."
  },
  {
    "tipoCard": "fluxograma_oclusao",
    "topico": "Taquicardias & Arritmias",
    "titulo": "Taquicardia Supraventricular Regular - Braço: Paciente Estável",
    "especialidade": "Cardiologia",
    "perguntaGatilho": "Reconstrua o algoritmo sequencial de condutas na Taquicardia Supraventricular em paciente clinicamente estável:",
    "resposta": "1. Manobra vagal modificada ➔ 2. Adenosina 6mg IV bolus ➔ 3. Adenosina 12mg se persistir ➔ 4. Bloqueador de Canal de Cálcio ou Betabloqueador.",
    "algoritmoDecisao": {
      "titulo": "Manejo da Taquicardia Regular no Paciente Estável",
      "blocos": [
        {
          "id": "b1",
          "titulo": "1. Avaliação de Critérios de Estabilidade",
          "descricao": "Confirmar ausência dos 4Ds: sem dor precordial anginosa, sem dispneia ou edema agudo de pulmão, sem rebaixamento de consciência e sem choque.",
          "tipo": "inicio",
          "criterioEntrada": "ECG com QRS estreito e regular"
        },
        {
          "id": "b2",
          "titulo": "2. Manobra Vagal Modificada",
          "descricao": "Expiração forçada em seringa de 10mL por 15 segundos seguida de elevação passiva dos membros inferiores a 45 graus.",
          "tipo": "conduta",
          "criterioEntrada": "Paciente estável confirmado"
        },
        {
          "id": "b3",
          "titulo": "3. Adenosina 6 mg IV em Bolus Rápido",
          "descricao": "Adenosina 6 mg IV em veia antecubital calibrosa acompanhada de flush imediato de 20 mL de soro fisiológico 0,9% com elevação do membro.",
          "tipo": "conduta",
          "criterioEntrada": "Falha da manobra vagal"
        },
        {
          "id": "b4",
          "titulo": "4. Adenosina 12 mg IV",
          "descricao": "Se refratário em 1 a 2 minutos, aplicar segunda dose de 12 mg IV com flush.",
          "tipo": "conduta",
          "criterioEntrada": "Manutenção da arritmia"
        },
        {
          "id": "b5",
          "titulo": "5. Bloqueador de Canal de Cálcio ou Betabloqueador",
          "descricao": "Diltiazem ou Verapamil IV se persistir sem reversão após 2 doses de adenosina.",
          "tipo": "alerta",
          "criterioEntrada": "Taquicardia refratária à adenosina"
        }
      ]
    },
    "perolaClinica": "A meia-vida da adenosina é inferior a 10 segundos. A administração exige veia calibrosa, flush imediato e elevação do membro."
  },
  {
    "tipoCard": "cloze",
    "topico": "Emergências Alérgicas",
    "titulo": "Choque Anafilático - Critérios de Tratamento Imediato",
    "especialidade": "Medicina de Emergência",
    "perguntaGatilho": "Qual a dose, concentração e via da adrenalina no choque anafilático em adultos?",
    "resposta": "Adrenalina 1:1.000 (1 mg/mL) na dose de 0,3 a 0,5 mg IM na face anterolateral da coxa.",
    "textoCloze": "No choque anafilático adulto, administrar {{c1::Adrenalina 1:1.000}} na dose de {{c2::0,3 a 0,5 mg}} por via {{c3::Intramuscular}} no {{c4::vasto lateral da coxa}} a cada {{c5::5 a 15 minutos}} conforme resposta clínica.",
    "perolaClinica": "Nunca faça subcutâneo no choque e nunca aguarde efeito de corticoide ou anti-histamínico para aplicar a adrenalina."
  },
  {
    "tipoCard": "caso_clinico",
    "topico": "Sepse & Choque Séptico",
    "titulo": "Reconhecimento e Ressuscitação Volêmica Inicial na Sepse",
    "especialidade": "Terapia Intensiva",
    "perguntaGatilho": "Qual a conduta inicial prioritária quanto à ressuscitação volêmica?",
    "resposta": "Cristaloide balanceado ou SF 0,9% na dose de 30 mL/kg nas primeiras 3 horas.",
    "casoClinicoDados": {
      "historiaClinica": "Paciente de 68 anos, admitido com confusão mental, tosse produtiva há 3 dias e febre.",
      "exameFisicoSinais": "PA 82x50 mmHg, FC 124 bpm, FR 28 irpm, Tax 38,9°C, SatO2 91% em ar ambiente. Tempo de enchimento capilar de 4 segundos e lactato arterial de 3,8 mmol/L.",
      "opcoes": [
        "Iniciar cristaloides na dose de 30 mL/kg IV nas primeiras 3 horas associado a coleta de culturas e antibiótico na 1ª hora",
        "Iniciar Noradrenalina imediatamente em acesso periférico antes de qualquer expansão volêmica",
        "Administrar 500 mL de albumina a 20% em bólus e aguardar resultado do raio-x de tórax",
        "Prescrever Furosemida 40 mg IV devido ao risco de sobrecarga hídrica no paciente idoso"
      ],
      "indiceCorreto": 0,
      "justificativaDetalhada": "De acordo com as diretrizes da Surviving Sepsis Campaign, pacientes com hipotensão induzida por sepse ou lactato maior ou igual a 4 mmol/L devem receber pelo menos 30 mL/kg de cristaloides nas primeiras 3 horas de ressuscitação."
    },
    "perolaClinica": "Na sepse, a ressuscitação volêmica precoce restaura a perfusão tecidual e reduz a mortalidade."
  }
]

MATERIAL / AULA / DIRETRIZ / PRINT PARA CONVERTER:
[COLE AQUI SEU TEXTO, RESUMO OU TRANSCRIÇÃO]`;

  const handleCopiarPrompt = async () => {
    const ok = await AnkiService.copiarParaClipboard(promptModeloGemini);
    if (ok) {
      setPromptCopiado(true);
      setTimeout(() => setPromptCopiado(false), 3000);
    }
  };

  // =========================================================================
  // ANÁLISE EM TEMPO REAL DEBOUNCED DO TEXTO COLADO (PREVINE TRAVAMENTOS NO CELULAR)
  // =========================================================================
  const [analiseTextoColado, setAnaliseTextoColado] = useState<any | null>(null);
  const [analisandoTexto, setAnalisandoTexto] = useState(false);

  React.useEffect(() => {
    const raw = textoColado.trim();
    if (!raw) {
      setAnaliseTextoColado(null);
      setCardsPrevia([]);
      setIdsSelecionados(new Set());
      setAnalisandoTexto(false);
      return;
    }

    setAnalisandoTexto(true);
    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const targetEixo = eixoDestinoId && eixoDestinoId !== '__novo_eixo__' ? eixoDestinoId : (eixos[0]?.id || 'eixo-1');
        // Processamento 100% local e assíncrono (fatiado em lotes de 15 cards, mantendo 60fps)
        const res = await AnkiService.processarTextoAssincrono(raw, targetEixo, 'Gemini / MedCards');

        if (isCancelled) return;

        if (res.cardsImportados.length > 0) {
          const tiposContagem: Record<string, number> = {
            caso_clinico: 0,
            fluxograma_complexo: 0,
            fluxograma_oclusao: 0,
            cloze: 0,
            conceito: 0,
          };
          const topicosDetectados = new Set<string>();

          res.cardsImportados.forEach(c => {
            tiposContagem[c.tipoCard] = (tiposContagem[c.tipoCard] || 0) + 1;
            const top = c.topicoNome || (c as any).topico;
            if (top && typeof top === 'string' && top.trim()) {
              topicosDetectados.add(top.trim());
            }
          });

          setAnaliseTextoColado({
            valido: true,
            formato: res.eixosCriados.length > 0 ? 'Pacote MedCards (Eixos + Tópicos)' : (raw.startsWith('[') || raw.startsWith('{') || raw.includes('```') ? 'JSON Estruturado (Gemini / UFPA)' : 'Texto Tabulado / Anki'),
            totalCards: res.cardsImportados.length,
            tiposContagem,
            topicos: Array.from(topicosDetectados),
            eixosCount: res.eixosCriados.length,
          });
          setCardsPrevia(res.cardsImportados);
          setIdsSelecionados(new Set(res.cardsImportados.map(c => c.id)));
          setAnalisandoTexto(false);
          return;
        }

        if (!isCancelled) {
          setAnaliseTextoColado({
            valido: false,
            erroJson: true,
            mensagem: 'Aguardando formato JSON válido ou texto tabulado...',
          });
          setCardsPrevia([]);
          setIdsSelecionados(new Set());
        }
      } catch (err: any) {
        if (!isCancelled) {
          setAnaliseTextoColado({
            valido: false,
            erroJson: true,
            mensagem: err?.message || 'Aguardando fechamento do JSON ou texto tabulado...',
          });
          setCardsPrevia([]);
          setIdsSelecionados(new Set());
        }
      } finally {
        if (!isCancelled) {
          setAnalisandoTexto(false);
        }
      }
    }, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [textoColado, eixoDestinoId, eixos]);

  // =========================================================================
  // PROCESSAMENTO DE IMPORTAÇÃO COM DESTINO ROBUSTO E POP-UP DE SUCESSO
  // =========================================================================
  const processarArquivo = async (file: File) => {
    setProcessando(true);
    setErro(null);

    try {
      let finalEixoId = eixoDestinoId;
      const res = await AnkiService.importarArquivo(file, finalEixoId, eixos);
      onImportarConcluido(res);

      const eixoRef = eixos.find(e => e.id === finalEixoId);
      setSucessoPopUp({
        totalCards: res.totalCards,
        eixoId: finalEixoId,
        eixoNome: eixoRef?.titulo || 'Eixo Importado',
        especialidade: eixoRef?.especialidade || 'Geral / Outros',
        topicoNome: 'Geral / Automático',
        tiposContagem: { total: res.totalCards },
        cardsCriados: res.cardsImportados,
      });
    } catch (e: any) {
      console.error('Falha ao processar arquivo:', e);
      setErro(`Erro ao processar ${file.name}: ${e?.message || 'Arquivo corrompido ou formato incompatível'}`);
    } finally {
      setProcessando(false);
    }
  };

  const handleProcessarTextoColado = () => {
    if (!textoColado.trim()) {
      setErro('Cole o JSON ou texto dos flashcards antes de clicar em adicionar.');
      return;
    }
    setProcessando(true);
    setErro(null);

    setTimeout(async () => {
      try {
        const raw = textoColado.trim();

        // 1. Verificar se é pacote exportado completo (Eixo ou Coleção com metadados)
        if (raw.startsWith('{')) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              if (parsed.eixo && Array.isArray(parsed.cards)) {
                // Pacote de Eixo Completo exportado
                const res = {
                  cardsImportados: parsed.cards,
                  eixosCriados: [parsed.eixo],
                  totalCards: parsed.cards.length,
                  nomeDeck: parsed.eixo.titulo,
                  mensagem: `Eixo "${parsed.eixo.titulo}" e seus tópicos importados com sucesso!`,
                };
                onImportarConcluido(res);

                const contagem: Record<string, number> = {};
                parsed.cards.forEach((c: any) => {
                  contagem[c.tipoCard || 'conceito'] = (contagem[c.tipoCard || 'conceito'] || 0) + 1;
                });

                setSucessoPopUp({
                  totalCards: parsed.cards.length,
                  eixoId: parsed.eixo.id,
                  eixoNome: parsed.eixo.titulo,
                  especialidade: parsed.eixo.especialidade || 'Clínica Médica',
                  topicoNome: `${(parsed.eixo.topicos || []).length} tópicos estruturados`,
                  tiposContagem: contagem,
                  cardsCriados: parsed.cards,
                });
                setTextoColado('');
                setProcessando(false);
                return;
              } else if (Array.isArray(parsed.eixos) && Array.isArray(parsed.cards)) {
                // Backup Completo de Coleção exportado
                const res = {
                  cardsImportados: parsed.cards,
                  eixosCriados: parsed.eixos,
                  totalCards: parsed.cards.length,
                  nomeDeck: 'Backup Completo',
                  mensagem: `Coleção completa com ${parsed.cards.length} cards e ${parsed.eixos.length} eixos importada com sucesso!`,
                };
                onImportarConcluido(res);

                const contagem: Record<string, number> = {};
                parsed.cards.forEach((c: any) => {
                  contagem[c.tipoCard || 'conceito'] = (contagem[c.tipoCard || 'conceito'] || 0) + 1;
                });

                setSucessoPopUp({
                  totalCards: parsed.cards.length,
                  eixoId: parsed.eixos[0]?.id || 'eixo-1',
                  eixoNome: `${parsed.eixos.length} Eixos Clínicos`,
                  especialidade: 'Diversas Especialidades',
                  topicoNome: 'Todos os tópicos sincronizados',
                  tiposContagem: contagem,
                  cardsCriados: parsed.cards,
                });
                setTextoColado('');
                setProcessando(false);
                return;
              }
            }
          } catch {
            // Continua para o fluxo padrão de processamento direto
          }
        }

        let finalEixoId = eixoDestinoId;
        let finalEixoTitulo = '';
        let finalEixoEspecialidade: string = 'Clínica Médica';
        let finalTopicoId: string | undefined = undefined;
        let finalTopicoNome: string | undefined = undefined;

        // 2. Caso: Novo Eixo Clínico
        if (eixoDestinoId === '__novo_eixo__') {
          finalEixoTitulo = novoEixoTitulo.trim() || 'Novo Eixo Clínico';
          finalEixoId = `eixo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          finalEixoEspecialidade = novoEixoEspecialidade;

          const topicosIniciais = [];
          if (novoTopicoTitulo.trim()) {
            finalTopicoId = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            finalTopicoNome = novoTopicoTitulo.trim();
            topicosIniciais.push({
              id: finalTopicoId,
              titulo: finalTopicoNome,
              descricao: 'Tópico importado',
              eixoId: finalEixoId,
              totalCards: 0,
            });
          }

          const novoEixo: EixoClinico = {
            id: finalEixoId,
            titulo: finalEixoTitulo,
            subtitulo: 'Tópicos essenciais de alto rendimento',
            especialidade: novoEixoEspecialidade,
            descricao: 'Importado via Gemini / MedCards',
            icone: 'Stethoscope',
            corTema: CORES_DISPONIVEIS[0],
            totalCards: 0,
            cardsDominados: 0,
            pendentesHoje: 0,
            ultimaAtividade: 'Agora',
            topicos: topicosIniciais,
          };

          StorageService.adicionarEixo(novoEixo);
          if (onEixoCriado) onEixoCriado(novoEixo);
        } else {
          // Eixo existente selecionado
          const eixoExistente = eixos.find(e => e.id === eixoDestinoId);
          if (eixoExistente) {
            finalEixoTitulo = eixoExistente.titulo;
            finalEixoEspecialidade = eixoExistente.especialidade;
          }

          // Tópico manual novo
          if (topicoSelecionadoModo === '__novo_topico__' && novoTopicoTitulo.trim()) {
            finalTopicoId = `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            finalTopicoNome = novoTopicoTitulo.trim();
            StorageService.adicionarTopico(finalEixoId, finalTopicoNome, undefined, finalTopicoId);
          } else if (topicoSelecionadoModo !== '__auto__' && topicoSelecionadoModo) {
            // Tópico existente selecionado no dropdown
            const topObj = eixoExistente?.topicos?.find(t => t.id === topicoSelecionadoModo);
            finalTopicoId = topicoSelecionadoModo;
            finalTopicoNome = topObj?.titulo || 'Tópico Selecionado';
          }
        }

        // 3. Processar texto e normalizar cards (100% offline, local e assíncrono)
        const res = await AnkiService.processarTextoAssincrono(
          textoColado, 
          finalEixoId, 
          'Gemini / MedCards', 
          finalTopicoId, 
          finalTopicoNome, 
          finalEixoEspecialidade
        );

        // Filtrar de acordo com a seleção na prévia interativa
        if (idsSelecionados.size > 0 && cardsPrevia.length > 0) {
          const indicesSelecionados = new Set<number>();
          cardsPrevia.forEach((cp, idx) => {
            if (idsSelecionados.has(cp.id)) {
              indicesSelecionados.add(idx);
            }
          });
          res.cardsImportados = res.cardsImportados.filter((_, idx) => indicesSelecionados.has(idx));
          res.totalCards = res.cardsImportados.length;
        }

        if (res.cardsImportados.length === 0) {
          setErro('Nenhum flashcard selecionado para adicionar. Marque ao menos um cartão na prévia.');
          setProcessando(false);
          return;
        }

        // 4. Se modo for __auto__ e o card trouxer seu próprio tópico no JSON, garantir no Storage
        if (topicoSelecionadoModo === '__auto__') {
          res.cardsImportados = res.cardsImportados.map(card => {
            const nomeTop = card.topicoNome || (card as any).topico;
            if (nomeTop && nomeTop !== 'Conceitos Gerais' && !card.topicoId) {
              const { topicoId, topicoNome } = StorageService.garantirTopico(finalEixoId, nomeTop);
              return {
                ...card,
                topicoId,
                topicoNome,
              };
            }
            if (!card.topicoId) {
              return {
                ...card,
                topicoId: 'top-geral',
                topicoNome: 'Conceitos Gerais',
              };
            }
            return card;
          });
        }

        onImportarConcluido(res);

        // 5. Preparar resumo detalhado para o Pop-up de Sucesso
        const contagem: Record<string, number> = {};
        res.cardsImportados.forEach(c => {
          contagem[c.tipoCard] = (contagem[c.tipoCard] || 0) + 1;
        });

        const topicoResumo = finalTopicoNome || (analiseTextoColado?.topicos?.[0] || 'Tópicos sincronizados');

        setSucessoPopUp({
          totalCards: res.totalCards,
          eixoId: finalEixoId,
          eixoNome: finalEixoTitulo || 'Eixo Selecionado',
          especialidade: finalEixoEspecialidade,
          topicoNome: topicoResumo,
          tiposContagem: contagem,
          cardsCriados: res.cardsImportados,
        });

        setTextoColado('');
      } catch (e: any) {
        setErro(e?.message || 'Falha ao processar texto.');
      } finally {
        setProcessando(false);
      }
    }, 20);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processarArquivo(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  };

  const handleDragLeave = () => {
    setArrastando(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processarArquivo(file);
    }
  };

  // =========================================================================
  // EXPORTAÇÕES
  // =========================================================================
  const eixoExportar = eixos.find(e => e.id === eixoDestinoId) || eixos[0];
  const cardsDoEixoExportar = cards.filter(c => c.eixoId === (eixoExportar?.id || ''));
  const cardIndividualExportar = cards.find(c => c.id === cardSelecionadoId) || cards[0];

  const handleBaixarEixoJson = () => {
    if (!eixoExportar) return;
    const jsonStr = AnkiService.exportarEixoJson(eixoExportar, cardsDoEixoExportar);
    const nomeLimpo = eixoExportar.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_');
    AnkiService.baixarArquivo(jsonStr, `eixo_${nomeLimpo}.json`);
  };

  const handleCopiarEixoJson = async () => {
    if (!eixoExportar) return;
    const jsonStr = AnkiService.exportarEixoJson(eixoExportar, cardsDoEixoExportar);
    const ok = await AnkiService.copiarParaClipboard(jsonStr);
    if (ok) {
      setJsonEixoCopiado(true);
      setTimeout(() => setJsonEixoCopiado(false), 3000);
    }
  };

  const handleBaixarEixoAnki = () => {
    if (!eixoExportar) return;
    const tsvContent = AnkiService.exportarParaAnkiTSV(cardsDoEixoExportar);
    const nomeLimpo = eixoExportar.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_');
    AnkiService.baixarArquivo(tsvContent, `eixo_${nomeLimpo}_anki.txt`, 'text/tab-separated-values');
  };

  const handleBaixarColecaoJson = () => {
    onExportarJson();
  };

  const handleCopiarColecaoJson = async () => {
    const jsonStr = AnkiService.exportarColecaoJson(cards, eixos, progresso);
    const ok = await AnkiService.copiarParaClipboard(jsonStr);
    if (ok) {
      setJsonColecaoCopiado(true);
      setTimeout(() => setJsonColecaoCopiado(false), 3000);
    }
  };

  const handleBaixarColecaoAnki = () => {
    const tsvContent = AnkiService.exportarParaAnkiTSV(cards);
    AnkiService.baixarArquivo(tsvContent, `medcards_todos_anki_${new Date().toISOString().split('T')[0]}.txt`, 'text/tab-separated-values');
  };

  const handleBaixarCardJson = () => {
    if (!cardIndividualExportar) return;
    const jsonStr = AnkiService.exportarCardIndividualJson(cardIndividualExportar);
    const nomeLimpo = cardIndividualExportar.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
    AnkiService.baixarArquivo(jsonStr, `card_${nomeLimpo}.json`);
  };

  const handleCopiarCardJson = async () => {
    if (!cardIndividualExportar) return;
    const jsonStr = AnkiService.exportarCardIndividualJson(cardIndividualExportar);
    const ok = await AnkiService.copiarParaClipboard(jsonStr);
    if (ok) {
      setJsonCardCopiado(true);
      setTimeout(() => setJsonCardCopiado(false), 3000);
    }
  };

  const cardsFiltradosBusca = cards.filter(c => {
    if (!filtroBuscaCard.trim()) return true;
    const q = filtroBuscaCard.toLowerCase();
    return c.titulo.toLowerCase().includes(q) || c.especialidade.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.28)] border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
        
        {/* Cabeçalho Executivo com Acabamento Hospitalar */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Central de Integração & IA
                </h3>
                <span className="text-[9.5px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Offline First
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 font-medium">
                Importação rápida com Gemini AI, Anki (.apkg/.txt) e Backups JSON
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAbrirCriacaoManual && (
              <button
                id="btn-modal-alternar-manual"
                type="button"
                onClick={onAbrirCriacaoManual}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Criar Flashcard Manualmente"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Criar Manual</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navegador de Abas Segmentado (Pill Bar estilo iOS / Linear) */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-slate-50/60 border-b border-slate-100">
          <div className="p-1 rounded-2xl bg-slate-200/70 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTabAtiva('importar')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tabAtiva === 'importar'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Upload className={`w-3.5 h-3.5 shrink-0 ${tabAtiva === 'importar' ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>Importar Flashcards</span>
            </button>

            <button
              type="button"
              onClick={() => setTabAtiva('exportar')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                tabAtiva === 'exportar'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Download className={`w-3.5 h-3.5 shrink-0 ${tabAtiva === 'exportar' ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>Exportar Dados</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {tabAtiva === 'importar' ? (
            <div className="space-y-3.5">
              
              {/* Seletor de Destino dos Flashcards */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Destino dos Flashcards
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    Organização automática
                  </span>
                </div>

                {/* Seleção do Eixo */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Eixo Clínico:
                  </label>
                  <select
                    value={eixoDestinoId}
                    onChange={e => setEixoDestinoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                  >
                    {eixos.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {ex.titulo} ({ex.especialidade})
                      </option>
                    ))}
                    <option value="__novo_eixo__">➕ Criar Novo Eixo Clínico...</option>
                  </select>
                </div>

                {/* Se for Novo Eixo: Título + Especialidade */}
                {eixoDestinoId === '__novo_eixo__' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Título do Novo Eixo:
                      </label>
                      <input
                        type="text"
                        value={novoEixoTitulo}
                        onChange={e => setNovoEixoTitulo(e.target.value)}
                        placeholder="Ex: Infectologia & Antimicrobianos"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Especialidade Médica:
                      </label>
                      <select
                        value={novoEixoEspecialidade}
                        onChange={e => setNovoEixoEspecialidade(e.target.value as EspecialidadeMedica)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      >
                        {TODAS_ESPECIALIDADES_MEDICAS.map(esp => (
                          <option key={esp} value={esp}>
                            {esp}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Seleção do Tópico / Aula */}
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Tópico / Aula:</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Agrupamento temático)
                    </span>
                  </label>

                  {eixoDestinoId !== '__novo_eixo__' ? (
                    <div className="space-y-2">
                      <select
                        value={topicoSelecionadoModo}
                        onChange={e => setTopicoSelecionadoModo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                      >
                        <option value="__auto__">✨ Detectar automaticamente do JSON ou manter Geral</option>
                        {eixos.find(e => e.id === eixoDestinoId)?.topicos?.map(top => (
                          <option key={top.id} value={top.id}>
                            📚 {top.titulo}
                          </option>
                        ))}
                        <option value="__novo_topico__">➕ Criar Novo Tópico neste Eixo...</option>
                      </select>

                      {topicoSelecionadoModo === '__novo_topico__' && (
                        <input
                          type="text"
                          value={novoTopicoTitulo}
                          onChange={e => setNovoTopicoTitulo(e.target.value)}
                          placeholder="Digite o nome do novo tópico (ex: Insuficiência Cardíaca Aguda)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={novoTopicoTitulo}
                        onChange={e => setNovoTopicoTitulo(e.target.value)}
                        placeholder="Nome do Tópico inicial (ex: Manejo de Sepse)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Alternador de Modo: Colar do Gemini vs Arquivo */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setModoImportacao('texto')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    modoImportacao === 'texto'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Colar do Gemini / IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoImportacao('arquivo')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    modoImportacao === 'arquivo'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Arquivo (.apkg / .json / .txt)</span>
                </button>
              </div>

              {modoImportacao === 'arquivo' ? (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 sm:p-7 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                      arrastando
                        ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
                        : 'border-blue-200 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                      <Package className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">
                        Toque ou arraste seu arquivo aqui
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                        Aceita pacotes Anki <strong>.apkg</strong>, textos <strong>.txt / .tsv</strong> ou backups <strong>.json</strong>
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".apkg,.colpkg,.zip,.json,.txt,.tsv,.csv"
                    className="hidden"
                  />
                </>
              ) : (
                <div className="space-y-3">
                  {/* Card Minimalista do Prompt Mestre UFPA */}
                  <div className="p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-2.5 shadow-3xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-3xs">
                          UFPA
                        </span>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                            Prompt Mestre • Foco Provas UFPA
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Fidelidade estrita aos slides e materiais de aula
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopiarPrompt}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-3xs cursor-pointer transition-all active:scale-95 shrink-0"
                        title="Copiar prompt completo para enviar ao Gemini ou ChatGPT"
                      >
                        {promptCopiado ? (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5 text-white" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-white" />
                            <span>Copiar Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Fluxo em 3 etapas sem fricção */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px]">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 text-slate-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                        <span className="truncate">Copie o Prompt</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 text-slate-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                        <span className="truncate">Envie c/ Aula UFPA</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 text-slate-700 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                        <span className="truncate">Cole o JSON Aqui</span>
                      </div>
                    </div>

                    {/* Botão de Expansão Sutil do Prompt */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setVerPromptDetalhado(!verPromptDetalhado)}
                        className="text-[10.5px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{verPromptDetalhado ? 'Ocultar texto completo do prompt' : 'Ver diretrizes completas do prompt'}</span>
                        <span className="text-[9px]">{verPromptDetalhado ? '▲' : '▼'}</span>
                      </button>

                      {verPromptDetalhado && (
                        <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 text-[10.5px] font-mono text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {promptModeloGemini}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Textarea do JSON com Indicação Offline */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>Cole o JSON gerado:</span>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                          ⚡ 100% Offline (Local)
                        </span>
                      </label>
                      {textoColado.trim() && (
                        <button
                          type="button"
                          onClick={() => setTextoColado('')}
                          className="text-[10.5px] text-slate-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <textarea
                        rows={5}
                        value={textoColado}
                        onChange={e => setTextoColado(e.target.value)}
                        placeholder='Cole o JSON aqui... (ex: [{"tipoCard": "conceito", "titulo": "...", "topico": "..."}, ...])'
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all resize-y shadow-3xs"
                      />
                      {analisandoTexto && (
                        <div className="absolute top-2 right-2.5 px-2 py-0.5 rounded-md bg-blue-50/90 border border-blue-200 text-blue-700 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                          <span>Analisando localmente...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL ANTES DE CLICAR NO OK */}
                  {analiseTextoColado && analiseTextoColado.valido && (
                    <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ✨ {analiseTextoColado.totalCards} Flashcards Identificados!
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                          {analiseTextoColado.formato}
                        </span>
                      </div>

                      {/* Badges de Tipos */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {analiseTextoColado.tiposContagem.caso_clinico > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            {analiseTextoColado.tiposContagem.caso_clinico} Casos Clínicos
                          </span>
                        )}
                        {analiseTextoColado.tiposContagem.fluxograma_complexo > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {analiseTextoColado.tiposContagem.fluxograma_complexo} Árvores de Decisão
                          </span>
                        )}
                        {analiseTextoColado.tiposContagem.fluxograma_oclusao > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                            {analiseTextoColado.tiposContagem.fluxograma_oclusao} Fluxogramas
                          </span>
                        )}
                        {analiseTextoColado.tiposContagem.cloze > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                            {analiseTextoColado.tiposContagem.cloze} Cloze
                          </span>
                        )}
                        {analiseTextoColado.tiposContagem.conceito > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            {analiseTextoColado.tiposContagem.conceito} Conceitos
                          </span>
                        )}
                      </div>

                      {/* Tópicos Identificados */}
                      {analiseTextoColado.topicos && analiseTextoColado.topicos.length > 0 && (
                        <div className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60 flex items-start gap-1.5">
                          <span className="font-bold shrink-0">📌 Tópicos detectados:</span>
                          <span className="font-semibold underline line-clamp-2">
                            {analiseTextoColado.topicos.join(' • ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRÉ-VISUALIZAÇÃO INTERATIVA COM SELEÇÃO INDIVIDUAL */}
                  {cardsPrevia.length > 0 && (
                    <div className="surface-clean rounded-2xl p-3 space-y-2 border border-slate-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Prévia dos Cartões ({idsSelecionados.size} de {cardsPrevia.length} selecionados)
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setIdsSelecionados(new Set(cardsPrevia.map(c => c.id)))}
                            className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                          >
                            Marcar todos
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setIdsSelecionados(new Set())}
                            className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                          >
                            Desmarcar
                          </button>
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {cardsPrevia.map((c, idx) => {
                          const selecionado = idsSelecionados.has(c.id);
                          const tipoLabel = 
                            c.tipoCard === 'caso_clinico' ? 'Caso Clínico' :
                            c.tipoCard === 'fluxograma_complexo' ? 'Árvore Decisão' :
                            c.tipoCard === 'fluxograma_oclusao' ? 'Fluxograma' :
                            c.tipoCard === 'cloze' ? 'Cloze' : 'Conceito';
                          
                          const tipoCor = 
                            c.tipoCard === 'caso_clinico' ? 'bg-purple-100 text-purple-700' :
                            c.tipoCard === 'fluxograma_complexo' ? 'bg-emerald-100 text-emerald-700' :
                            c.tipoCard === 'fluxograma_oclusao' ? 'bg-indigo-100 text-indigo-700' :
                            c.tipoCard === 'cloze' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700';

                          return (
                            <div
                              key={c.id || idx}
                              onClick={() => {
                                const novo = new Set(idsSelecionados);
                                if (novo.has(c.id)) novo.delete(c.id);
                                else novo.add(c.id);
                                setIdsSelecionados(novo);
                              }}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                                selecionado 
                                  ? 'bg-blue-50/40 border-blue-200 text-slate-900' 
                                  : 'bg-slate-50/60 border-slate-200/60 opacity-60 text-slate-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selecionado}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tipoCor}`}>
                                    {tipoLabel}
                                  </span>
                                  {c.topicoNome && (
                                    <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                      • {c.topicoNome}
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold text-xs leading-snug line-clamp-2">
                                  {c.perguntaGatilho || c.titulo}
                                </p>
                                {c.perolaClinica && c.perolaClinica !== 'Fixação clínica de alto rendimento.' && (
                                  <p className="text-[11px] text-amber-800 line-clamp-1 flex items-center gap-1">
                                    <span>💡</span>
                                    <span className="font-medium">Dica:</span>
                                    <span>{c.perolaClinica}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {analisandoTexto && (
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>⚡ Analisando texto e identificando tópicos com alta velocidade...</span>
                    </div>
                  )}

                  {analiseTextoColado && analiseTextoColado.erroJson && !analisandoTexto && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span>{analiseTextoColado.mensagem}</span>
                    </div>
                  )}

                  {/* Botão de Confirmação */}
                  <button
                    type="button"
                    onClick={handleProcessarTextoColado}
                    disabled={processando || !textoColado.trim() || (cardsPrevia.length > 0 && idsSelecionados.size === 0)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {cardsPrevia.length > 0 && idsSelecionados.size > 0
                        ? `Adicionar ${idsSelecionados.size} Flashcard${idsSelecionados.size > 1 ? 's' : ''} ao MedCards`
                        : 'Adicionar Flashcards ao MedCards'}
                    </span>
                  </button>
                </div>
              )}

              {processando && (
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-700 text-xs font-semibold flex items-center gap-2 animate-pulse">
                  <HardDrive className="w-4 h-4 animate-spin" />
                  <span>Processando e estruturando flashcards...</span>
                </div>
              )}

              {erro && (
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Erro ao importar</span>
                  </div>
                  <p>{erro}</p>
                </div>
              )}
            </div>
          ) : (
            /* =========================================================================
             * ABA EXPORTAR: SELETOR DE ESCOPO (EIXO, CONJUNTO OU INDIVIDUAL)
             * ========================================================================= */
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">
                  Selecione o que deseja exportar:
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModoExportacao('eixo')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                      modoExportacao === 'eixo'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Por Eixo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoExportacao('conjunto')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                      modoExportacao === 'conjunto'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Coleção Completa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoExportacao('individual')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                      modoExportacao === 'individual'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Individual</span>
                  </button>
                </div>
              </div>

              {/* OPÇÃO 1: EXPORTAR POR EIXO */}
              {modoExportacao === 'eixo' && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Escolha o Eixo Clínico:
                    </label>
                    <select
                      value={eixoDestinoId}
                      onChange={e => setEixoDestinoId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                    >
                      {eixos.map(ex => (
                        <option key={ex.id} value={ex.id}>
                          {ex.titulo} • {cards.filter(c => c.eixoId === ex.id).length} cards
                        </option>
                      ))}
                    </select>
                  </div>

                  {eixoExportar && (
                    <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-blue-900 block">{eixoExportar.titulo}</span>
                        <span className="text-[11px] text-blue-700">
                          {cardsDoEixoExportar.length} flashcards • {eixoExportar.especialidade}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/70 text-blue-800">
                        {eixoExportar.topicos?.length || 0} tópicos
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleBaixarEixoJson}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopiarEixoJson}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {jsonEixoCopiado ? (
                        <>
                          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copiar JSON</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleBaixarEixoAnki}
                      className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Anki TXT</span>
                    </button>
                  </div>
                </div>
              )}

              {/* OPÇÃO 2: EXPORTAR CONJUNTO / COLEÇÃO COMPLETA */}
              {modoExportacao === 'conjunto' && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">Coleção Completa MedCards</span>
                      <span className="text-[11px] text-slate-500">
                        {cards.length} flashcards em {eixos.length} eixos clínicos
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Backup Integral
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleBaixarColecaoJson}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Backup</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopiarColecaoJson}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {jsonColecaoCopiado ? (
                        <>
                          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copiar Tudo</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleBaixarColecaoAnki}
                      className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Anki Geral</span>
                    </button>
                  </div>
                </div>
              )}

              {/* OPÇÃO 3: EXPORTAR CARD INDIVIDUAL */}
              {modoExportacao === 'individual' && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Localizar e Selecionar Flashcard:
                    </label>
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={filtroBuscaCard}
                        onChange={e => setFiltroBuscaCard(e.target.value)}
                        placeholder="Filtrar card pelo título ou afecção..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 bg-slate-50/60"
                      />
                    </div>

                    <select
                      value={cardSelecionadoId}
                      onChange={e => setCardSelecionadoId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                    >
                      {cardsFiltradosBusca.map(c => (
                        <option key={c.id} value={c.id}>
                          [{c.especialidade}] {c.titulo} ({c.tipoCard})
                        </option>
                      ))}
                    </select>
                  </div>

                  {cardIndividualExportar && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          {cardIndividualExportar.tipoCard} • {cardIndividualExportar.especialidade}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cardIndividualExportar.repeticoes} revisões
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {cardIndividualExportar.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {cardIndividualExportar.perguntaGatilho}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopiarCardJson}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {jsonCardCopiado ? (
                        <>
                          <ClipboardCheck className="w-3.5 h-3.5 text-white" />
                          <span>JSON Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-white" />
                          <span>Copiar JSON do Card</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleBaixarCardJson}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Baixar Arquivo (.json)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
       * POP-UP MODAL DE SUCESSO PÓS-IMPORTAÇÃO (CONFIRMAÇÃO DETALHADA)
       * ========================================================================= */}
      {sucessoPopUp && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                  Importação Concluída
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {sucessoPopUp.totalCards} Flashcards Adicionados!
                </h3>
              </div>
            </div>

            {/* Caixa com o Eixo e Tópico de Destino */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Eixo Clínico:
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {sucessoPopUp.eixoNome}
                  </p>
                  <span className="text-[11px] text-blue-600 font-semibold">
                    {sucessoPopUp.especialidade}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Tópico / Aula:
                </span>
                <p className="font-bold text-slate-800 text-xs">
                  📚 {sucessoPopUp.topicoNome}
                </p>
              </div>

              {/* Contagem por tipo */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60">
                {sucessoPopUp.tiposContagem.caso_clinico > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    {sucessoPopUp.tiposContagem.caso_clinico} Casos Clínicos
                  </span>
                )}
                {sucessoPopUp.tiposContagem.fluxograma_oclusao > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    {sucessoPopUp.tiposContagem.fluxograma_oclusao} Fluxogramas
                  </span>
                )}
                {sucessoPopUp.tiposContagem.cloze > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                    {sucessoPopUp.tiposContagem.cloze} Cloze
                  </span>
                )}
                {sucessoPopUp.tiposContagem.conceito > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {sucessoPopUp.tiposContagem.conceito} Conceitos
                  </span>
                )}
              </div>
            </div>

            {/* Ações pós-importação */}
            <div className="space-y-2 pt-1">
              {onEstudarCardsImportados && (
                <button
                  type="button"
                  onClick={() => {
                    const cardsToStudy = sucessoPopUp.cardsCriados;
                    setSucessoPopUp(null);
                    onClose();
                    onEstudarCardsImportados(cardsToStudy);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Estudar Estes Flashcards Agora</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                {onNavegarParaEixo && (
                  <button
                    type="button"
                    onClick={() => {
                      const eixoId = sucessoPopUp.eixoId;
                      setSucessoPopUp(null);
                      onClose();
                      onNavegarParaEixo(eixoId);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Ver no Eixo</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSucessoPopUp(null)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Importar Mais
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
