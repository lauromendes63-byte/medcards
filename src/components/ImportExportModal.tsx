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
  HardDrive,
  ChevronDown,
  ChevronUp,
  Trash2
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

export type FocoInstitucional = 'ufpa' | 'enamed' | 'usp';

export interface InfoFocoInstitucional {
  id: FocoInstitucional;
  sigla: string;
  nomeCurto: string;
  nomeCompleto: string;
  descricao: string;
  corBadge: string;
  corFundoPill: string;
  iconeEmoji: string;
  instrucaoPrompt: string;
  regraOuroPrompt: string;
}

export const FOCOS_INSTITUCIONAIS: Record<FocoInstitucional, InfoFocoInstitucional> = {
  ufpa: {
    id: 'ufpa',
    sigla: 'UFPA',
    nomeCurto: 'Provas UFPA',
    nomeCompleto: 'Foco Provas & Aulas UFPA',
    descricao: 'Fidelidade estrita aos slides, apostilas e gravações de aula dos professores da UFPA.',
    corBadge: 'bg-blue-600 text-white',
    corFundoPill: 'bg-blue-600 text-white shadow-xs',
    iconeEmoji: '🏛️',
    instrucaoPrompt: `Você é um preceptor médico especialista em elaboração de flashcards de alto rendimento para o MedCards, com FOCO PRINCIPAL NAS PROVAS DA FACULDADE DE MEDICINA DA UFPA (Universidade Federal do Pará), módulos acadêmicos, internato e residência médica.
Com base no material médico, transcrições de aulas, slides de professores da UFPA, casos clínicos, apostilas, PDFs ou fotos fornecidos, elabore flashcards rigorosamente estruturados no formato JSON para o aplicativo MedCards.`,
    regraOuroPrompt: `REGRA DE OURO CRÍTICA — FIDELIDADE ESTRITA AO CONTEÚDO FORNECIDO (FOCO PROVAS UFPA):
1. ESTRITA ADERÊNCIA AO CONTEÚDO ENVIADO:
   - Seu foco primário e mandatório são as cobranças das provas e módulos da Faculdade de Medicina da UFPA.
   - Os flashcards devem se ater ESTRITAMENTE e EXCLUSIVAMENTE ao conteúdo que o aluno passar junto ao prompt (transcrições de aulas, slides de professores da UFPA, discussões clínicas de enfermaria/ambulatório, apostilas e resumos enviados).
   - NUNCA invente condutas, parâmetros ou diretrizes conflitantes com os slides ou materiais fornecidos pelo aluno. Se o professor da UFPA destacou uma conduta, dosagem, classificação ou pegadinha específica no material, essa informação TEM PRIORIDADE ABSOLUTA nos cartões.
   - NUNCA omita, resuma superficialmente, corte ou descarte informações presentes nos materiais enviados. Todos os dados, dosagens exatas de medicamentos, valores de corte laboratoriais, achados de imagem, sinais clínicos, condutas e contraindicações fornecidos são essenciais e devem ser integralmente aproveitados e distribuídos nos flashcards gerados.`
  },
  enamed: {
    id: 'enamed',
    sigla: 'ENAMED',
    nomeCurto: 'ENAMED / ENARE',
    nomeCompleto: 'Foco ENAMED & Residência Nacional (ENARE)',
    descricao: 'Matriz de competências do INEP, condutas prioritárias do SUS e pegadinhas de alto rendimento.',
    corBadge: 'bg-emerald-600 text-white',
    corFundoPill: 'bg-emerald-600 text-white shadow-xs',
    iconeEmoji: '🩺',
    instrucaoPrompt: `Você é um preceptor médico especialista em elaboração de flashcards de alto rendimento para o MedCards, com FOCO PRINCIPAL NO ENAMED (Exame Nacional de Medicina), ENARE (Exame Nacional de Residência Médica) e diretrizes nacionais do SUS / Ministério da Saúde.
Com base no material médico, apostilas, diretrizes, casos clínicos ou resumos fornecidos, elabore flashcards rigorosamente estruturados no formato JSON para o aplicativo MedCards.`,
    regraOuroPrompt: `REGRA DE OURO CRÍTICA — MATRIZ DE COMPETÊNCIAS DO ENAMED / ENARE:
1. FOCO NA TOMADA DE CONDUTA E DIRETRIZES DO SUS:
   - Seu foco primário e mandatório é a matriz oficial do ENAMED / INEP e as provas do ENARE.
   - Priorize cenários de pronto-socorro, atenção primária à saúde (APS) e grandes síndromes clínicas de alta prevalência (Cardiologia, Pediatria, GO, Preventiva e Cirurgia).
   - Formate condutas segundo os Protocolos Clínicos e Diretrizes Terapêuticas (PCDT) do Ministério da Saúde e consensos nacionais de referência.
   - Destaque pegadinhas clássicas de bancas de residência médica: critérios de gravidade, contraindicações imediatas e conduta diagnóstica inicial versus conduta definitiva.`
  },
  usp: {
    id: 'usp',
    sigla: 'USP',
    nomeCurto: 'Residência USP',
    nomeCompleto: 'Foco Residência Médica USP (FMUSP / USP-RP)',
    descricao: 'Diretrizes do Hospital das Clínicas (HCFMUSP), casos de alta complexidade e diagnósticos diferenciais.',
    corBadge: 'bg-amber-600 text-white',
    corFundoPill: 'bg-amber-600 text-white shadow-xs',
    iconeEmoji: '🏥',
    instrucaoPrompt: `Você é um preceptor médico especialista em elaboração de flashcards de alto rendimento para o MedCards, com FOCO PRINCIPAL NAS PROVAS DE RESIDÊNCIA MÉDICA DA USP (FMUSP - Hospital das Clínicas, FUVEST e USP Ribeirão Preto).
Com base no material médico, diretrizes institucionais, casos de alta complexidade, apostilas e consensos fornecidos, elabore flashcards rigorosamente estruturados no formato JSON para o aplicativo MedCards.`,
    regraOuroPrompt: `REGRA DE OURO CRÍTICA — PADRÃO DE EXCELÊNCIA E ALTA COMPLEXIDADE USP:
1. FOCO NO PADRÃO HCFMUSP E DIRETRIZES DE PONTA:
   - Seu foco primário e mandatório são as bancas da USP (FMUSP e USP-RP), reconhecidas pelo rigor clínico e alta complexidade.
   - Priorize diagnósticos diferenciais sutis, estratificação prognóstica e condutas baseadas nas publicações do Hospital das Clínicas da FMUSP e consensos internacionais de ponta.
   - Explore detalhadamente parâmetros hemodinâmicos de UTI, dosagens precisas de drogas vasoativas, achados tomográficos/radiológicos específicos e indicações cirúrgicas de urgência.
   - Valorize o raciocínio fisiopatológico que costuma ser o diferencial nas questões de alta discriminação da FUVEST/USP.`
  }
};

export const gerarPromptCompleto = (foco: FocoInstitucional, quantidadeCards: number = 20): string => {
  const f = FOCOS_INSTITUCIONAIS[foco];
  const qtdTotal = Math.max(1, Math.min(100, Math.round(quantidadeCards || 20)));
  const qtdConceito = Math.max(1, Math.round(qtdTotal * 0.45));
  const qtdFluxogramaComplexo = Math.max(1, Math.round(qtdTotal * 0.20));
  const qtdFluxogramaOclusao = Math.max(1, Math.round(qtdTotal * 0.15));
  const qtdCaso = Math.max(1, Math.round(qtdTotal * 0.10));
  const qtdCloze = Math.max(0, qtdTotal - qtdConceito - qtdFluxogramaComplexo - qtdFluxogramaOclusao - qtdCaso);

  return `${f.instrucaoPrompt}
IMPORTANTE: Elabore rigorosamente um total exato de ${qtdTotal} flashcards de alto rendimento com base no material fornecido.

${f.regraOuroPrompt}

REGRAS DE FORMATAÇÃO E TIPOGRAFIA MÉDICA:
1. PROIBIÇÃO ABSOLUTA DE COLCHETES PARA SEPARAR ITENS:
   - NUNCA use colchetes [...] para separar itens, títulos, categorias, etapas ou termos nas perguntas ou respostas.
   - Use colchetes APENAS para as tags oficiais de cor do MedCards ([azul], [vermelho], [verde], [roxo], [laranja], [amarelo]), para a sintaxe de cloze {{c1::termo}} ou para arrays JSON [].
   - Para listar ou separar elementos no texto clínico, use marcadores visuais (•), hífens (-), numeração (1., 2.) ou a seta clínica (--> ou ➔).

2. EVITAR PARÊNTESES AO MÁXIMO:
   - Evite o uso de parênteses (...) nas perguntas, respostas e justificativas.
   - Use parênteses APENAS quando a situação for estritamente necessária (exemplo: indicar que uma conduta ou droga é opcional, como "(opcional)", ou para unidades de dosagem e siglas médicas indispensáveis). No restante, integre o texto de forma fluida e direta sem poluição de parênteses desnecessários.

3. REGRA DE OURO DO CAMPO "topico" (AGRUPAMENTO POR AULA/TEMA CENTRAL):
   - O campo "topico" deve ser SEMPRE o NOME DA AULA OU TEMA GERAL (ex: "topico": "Osteomielite e Artrite Séptica", "topico": "Arboviroses e Malária", "topico": "Síndrome Coronariana Aguda").
   - NUNCA crie micro-tópicos fragmentados para cada pergunta ou flashcard (como "Fisiopatologia da osteomielite", "Tratamento da osteomielite", "Classificação de Gustilo"). Todos os cards gerados a partir do mesmo material devem pertencer ao MESMO "topico".
   - Se o material contiver mais de um grande tema bem distinto (exemplo: aula conjunta com "Dengue", "Chikungunya" e "Malária"), faça o split em no máximo 2 ou 3 tópicos bem delimitados. Jamais disperse os cards em dezenas de tópicos picados que poluem e desorganizam o app!

4. FORMULAÇÃO CLÍNICA NATURAL DAS PERGUNTAS (SEM PROLIXIDADE ROBÓTICA):
   - NUNCA formule perguntas robóticas, artificiais, prolixas ou pedantes.
   ❌ EVITE formulações artificiais e excessivamente acadêmicas como:
      - "Como se divide a taxonomia da Leptospira na classificação sorológica clássica e nos subclados genômicos modernos?"
      - "Quais são os sinais clínicos e o achado semiomarcador clássico da fase precoce septicêmica da leptospirose anictérica?"
   ✅ ADOTE perguntas diretas, objetivas, de alta relevância prática e padrão prova de residência médica:
      - "Quais são as principais manifestações da fase precoce da leptospirose e o achado semiológico patognomônico nas panturrilhas e olhos?"
      - "Paciente com suspeita de leptospirose grave (Doença de Weil): qual a tríade clínica clássica e o esquema antimicrobiano parenteral de escolha?"
      - "Qual a conduta diagnóstica confirmatória de escolha na 1ª semana versus a partir da 2ª semana de sintomas da leptospirose?"
   - Linguagem médica limpa, ágil, direta, como em discussões clínicas de plantão e questões do Revalida/ENAMED/USP.

5. ARQUITETURA VISUAL, CORES E MARCAÇÕES MÉDICAS (CRÍTICO & MANDATÓRIO):
   O MedCards possui um motor tipográfico clínico proprietário de alto contraste. Para criar uma experiência visual digna de material médico de ponta, você DEVE utilizar ativamente as seguintes marcações nos campos "resposta", "perguntaGatilho", "justificativaDetalhada" e nos nós dos fluxogramas:

   🎨 PALETA DE CORES E DESTAQUES CLÍNICOS:
   • ==amarelo== ou [amarelo]termo[/amarelo]: MARCA-TEXTO AMARELO VIBRANTE.
     - Quando usar: Valores de corte numéricos, metas de tempo (ex: tempo porta-balão, metas de PA, dosagens críticas, critérios de escores definidores).
     - Exemplo: "Meta de PAM ==≥ 65 mmHg== em choque séptico." ou "Delta-T de reperfusão ==< 4,5 horas== no AVC isquêmico."

   • [azul]termo[/azul]: DESTAQUE AZUL CLÍNICO (Conduta Imediata / Padrão-Ouro).
     - Quando usar: Fármacos de 1ª escolha, condutas prioritárias imediatas e exames diagnósticos padrão-ouro.
     - Exemplo: "Iniciar [azul]Noradrenalina[/azul] precocemente se refratário a volume." ou "Exame padrão-ouro: [azul]Angiotomografia de Artérias Pulmonares[/azul]."

   • [vermelho]termo[/vermelho]: DESTAQUE VERMELHO ALERTA (Red Flags / Contraindicações).
     - Quando usar: Contraindicações formais absolutas, pegadinhas frequentes de prova, sinais de alarme ("Red Flags") e risco iminente de morte.
     - Exemplo: "⚠️ [vermelho]Contraindicação absoluta:[/vermelho] uso de beta-bloqueador em intoxicação por cocaína ou BAV avançado!"

   • [verde]termo[/verde]: DESTAQUE VERDE CLÍNICO (Metas Terapêuticas / Profilaxias / Critérios de Alta).
     - Quando usar: Metas terapêuticas atingidas, medidas preventivas/profiláticas, sinais de bom prognóstico e critérios de alta segura.
     - Exemplo: "Profilaxia primária com [verde]Vacinação contra Hepatite B e Tétano[/verde]." ou "Critério de compensação clínica: [verde]Diurese > 0,5 mL/kg/h[/verde]."

   • [roxo]termo[/roxo]: DESTAQUE ROXO / PÚRPURA (Diferenciais & Fisiopatologia).
     - Quando usar: Diagnósticos diferenciais cruciais, mecanismos fisiopatológicos, etiologias e correlações anatômicas.
     - Exemplo: "Diferencial obrigatório: [roxo]Dissecção Aguda de Aorta tipo Stanford A[/roxo]."

   • [laranja]termo[/laranja]: DESTAQUE LARANJA ÂMBAR (Avisos Intermediários / Condições Especiais).
     - Quando usar: Critérios de exclusão relativa, monitorização intermediária e ajustes para gestantes ou insuficiência renal.
     - Exemplo: "Atenção: [laranja]Ajustar dose para ClCr < 30 mL/min[/laranja] e monitorar função renal."

   🖋️ MARCADORES DE TEXTO E TIPOGRAFIA:
   • **negrito**: Títulos de seções, parâmetros clínicos, nomes de patologias e doses farmacológicas.
   • <u>sublinhado</u>: Faixas etárias, grupos de risco e populações especiais (ex: <u>gestantes no 3º trimestre</u>, <u>idosos institucionalizados</u>).
   • --> ou ->: Transforma-se AUTOMATICAMENTE na seta médica de sequência (➔).
     - Exemplo: "Dor torácica típica --> ECG em até 10 minutos --> Dosagem de Troponina ultrassensível".

   🔤 OCLUSÃO DE TEXTO (CLOZE):
   • {{c1::termo_oculto}}: Cria a lacuna interativa nos cards do tipo "cloze".
     - Exemplo: "A principal causa de abdome agudo cirúrgico no jovem é a {{c1::Apendicite Aguda}}."

   ⚡ EMOJIS ESTRATÉGICOS DE FIXAÇÃO VISUAL:
   • ⚠️ : No início de linhas com Red Flags, riscos iminentes ou alertas de bancas.
   • ⭐ : No início de linhas com Regra de Ouro da conduta ou critério diagnóstico definidor.
   • 💡 : Para mnemônicos, pérolas clínicas e sacadas práticas de prova.

   📐 ARQUITETURA DE RESPOSTA SEM "TEXTÃO":
   - NUNCA GERAR "TEXTÃO" OU PARÁGRAFO CONTÍNUO: É terminantemente proibido devolver o campo "resposta" ou "justificativaDetalhada" como um bloco denso e ininterrupto de texto.
   - SEPARAÇÃO POR QUEBRAS DE LINHA DUPLAS (\\n\\n): Separe tópicos e seções por quebras de linha duplas ("enter") para garantir respiro visual e leitura rápida no celular.
   - SUBTÍTULOS ESTRUTURADOS:
     • Quando houver etapas ou categorias na conduta, inicie a seção com um subtítulo em maiúsculas terminado em dois-pontos (ex: "ANTIBIOTICOTERAPIA IMEDIATA (1ª HORA):" ou "CRITÉRIOS DE INDICAÇÃO CIRÚRGICA:").
   - DICA PRÁTICA / PONTO-CHAVE ("dica" ou "perolaClinica"):
     • Deve ser curta, direta e objetiva (1 a 2 frases no máximo) com o ponto de virada da conduta médica ou da questão.

GRANDE TUTORIAL DOS FORMATOS DO MEDCARDS:

1. CONCEITO DIRETO (tipoCard: "conceito"):
   - Estrutura: "tipoCard": "conceito", "titulo", "topico", "especialidade", "perguntaGatilho", "resposta", "dica" (ou "perolaClinica").

2. FLUXOGRAMA COMPLEXO / ÁRVORE DE DECISÃO RAMIFICADA (tipoCard: "fluxograma_complexo"):
   - ⚠️ ATENÇÃO MANDATÓRIA AO "perguntaGatilho": 
     • ❌ PROIBIDO USAR COMANDOS META-ROBÓTICOS PROLIXOS como: "Reconstrua o algoritmo de decisão propedêutica...", "Navegue pelo algoritmo...", "Complete os passos do fluxograma...", "Percorra a árvore...". Isso NÃO é uma pergunta e polui a interface!
     • ✅ OBRIGATÓRIO FORMULAR UMA PERGUNTA CLÍNICA DIRETA, CONCISA E DESAFIADORA (1 a 2 frases no máximo), como um médico preceptor perguntando no plantão:
       Exemplos excelentes:
       - "Suspeita de Osteomielite no PS: qual o exame inicial e qual a conduta se o RX for normal?"
       - "Dor torácica com Supra de ST no ECG: qual a conduta imediata e o tempo-limite para angioplastia primária vs trombólise?"
       - "Cetoacidose Diabética: qual o valor de corte do K+ sérico para autorizar o início da insulinoterapia?"
   - Cada nó deve ter seu tipo ("inicio" | "decisao" | "alerta" | "conduta" | "diagnostico"), "oculto": true (exceto o inicial), e uma "dica" curta que dá a pista para deduzir a conduta daquela etapa.
   - Os ramos ("ramos") DEVEM conter o "rotulo" da condição clínica de transição (ex: "Se Wells > 4 (Alta probabilidade)", "Se D-Dímero normal (< 500 ng/mL)", "Se instabilidade hemodinâmica") e a "cor": "verde"|"vermelho"|"azul"|"amber"|"roxo".
   - Estrutura do objeto: "tipoCard": "fluxograma_complexo", "titulo", "topico", "especialidade", "perguntaGatilho", com "fluxogramaComplexo" contendo "noInicialId", "nos" (com "id", "titulo", "descricao", "tipo", "oculto", "dica", "ramos").

3. FLUXOGRAMA LINEAR PASSO A PASSO (tipoCard: "fluxograma_oclusao"):
   - Estrutura: "tipoCard": "fluxograma_oclusao", com "algoritmoDecisao" contendo "blocos" ordenados (com "id", "titulo", "criterioEntrada", "descricao", "tipo": "inicio"|"conduta"|"decisao"|"alerta").

4. OCLUSÃO DE TEXTO / CLOZE (tipoCard: "cloze"):
   - Estrutura: "tipoCard": "cloze", com campo "textoCloze" contendo {{c1::termo_oculto}}.

5. CASO CLÍNICO COM MÚLTIPLA ESCOLHA (tipoCard: "caso_clinico"):
   - Estrutura: "tipoCard": "caso_clinico", com "casoClinicoDados" contendo "historiaClinica", "exameFisicoSinais", "opcoes" (4 alternativas), "indiceCorreto" (0 a 3) e "justificativaDetalhada".

DISTRIBUIÇÃO SUGERIDA PARA ESTE TEMA (TOTAL EXATO DE ${qtdTotal} FLASHCARDS):
- ${qtdConceito} Flashcards "conceito" (conceito direto, perguntas gatilho de conduta)
- ${qtdFluxogramaComplexo} Flashcards "fluxograma_complexo" (árvores de decisão com ramificações)
- ${qtdFluxogramaOclusao} Flashcards "fluxograma_oclusao" (algoritmos sequenciais passo a passo)
- ${qtdCaso} Flashcards "caso_clinico" (casos com história clínica, exame físico e alternativas)
- ${qtdCloze} Flashcards "cloze" (lacunas estratégicas {{c1::...}})

QUANTIDADE EXATA & SUGESTÃO DE COMPLEMENTAÇÃO:
- Você DEVE entregar EXATAMENTE o total solicitado de ${qtdTotal} flashcards no array JSON principal.
- Caso você (IA) julgue que o material fornecido possui conteúdo relevante adicional que não coube nesta cota de ${qtdTotal} flashcards para ficar 100% coberto:
  1. Entregue rigorosamente os ${qtdTotal} flashcards no JSON.
  2. Logo após fechar o array JSON "]", adicione uma nota curta no formato:
     "💡 SUGESTÃO DE COMPLEMENTAÇÃO: Para cobrir 100% de todos os detalhes desta aula, seria ideal gerar mais [X] flashcards focados em: [listar 2 ou 3 subtemas específicos que ficaram de fora]."

ESTRUTURA JSON EXATA (Retorne APENAS o JSON válido sem nenhum texto explicativo fora dele, exceto a nota de complementação se necessária):
[
  {
    "tipoCard": "conceito",
    "topico": "Síndrome Coronariana Aguda",
    "titulo": "Critérios Eletrocardiográficos e Metas no IAMCSST",
    "especialidade": "Cardiologia",
    "perguntaGatilho": "Quais os critérios eletrocardiográficos do IAMCSST e as metas de tempo para reperfusão imediata?",
    "resposta": "**Critérios de Supra de ST no Ponto J (em 2 ou mais derivações contíguas):**\\n\\n• **Derivações gerais:** ==Elevação ≥ 1 mm== em todas derivações (exceto V2-V3).\\n\\n• <u>Nas derivações V2-V3</u>:\\n  - Homens < 40 anos: **≥ 2,5 mm**\\n  - Homens ≥ 40 anos: **≥ 2,0 mm**\\n  - Mulheres: **≥ 1,5 mm**\\n\\n• **Conduta Imediata:** Iniciar dupla antiagregação com [azul]AAS + Ticagrelor[/azul] e anticoagulação plena com [azul]Enoxaparina[/azul].\\n\\n• **Fluxo de Atendimento:** Dor torácica --> ECG em até ==10 minutos== --> Encaminhar para hemodinâmica.\\n\\n• **Metas Terapêuticas:** [verde]Resolução da dor e queda do supra > 50% em 90 min[/verde].\\n\\n• **Diferencial Obrigatório:** Descartar [roxo]Dissecção Aguda de Aorta[/roxo] antes de qualquer trombólise.\\n\\n• **Atenção Especial:** [laranja]Ajustar dose de Enoxaparina se ClCr < 30 mL/min[/laranja].\\n\\n⚠️ **Red Flag:** ⚠️ [vermelho]Contraindicação formal a nitratos:[/vermelho] Infarto de VD (V3R/V4R), PAS < 90 mmHg ou uso recente de inibidores da 5-PDE (Sildenafila)!\\n\\n⭐ **Regra de Ouro:** Tempo porta-balão meta: ==< 90 minutos== (ou ==< 120 min== se transferido).",
    "perolaClinica": "Tempo porta-agulha para trombólise química com Tenecteplase: meta ==< 30 minutos== se a angioplastia primária não for realizável em até 120 minutos."
  },
  {
    "tipoCard": "fluxograma_complexo",
    "topico": "Síndrome Coronariana Aguda",
    "titulo": "Algoritmo de Decisão de Reperfusão no IAM com Supra de ST",
    "especialidade": "Cardiologia",
    "perguntaGatilho": "Dor torácica com Supra de ST no ECG: qual a conduta imediata e o tempo-limite para angioplastia primária vs trombólise química?",
    "fluxogramaComplexo": {
      "id": "fluxo-iamcsst",
      "titulo": "Algoritmo de Reperfusão no IAMCSST",
      "descricao": "Estratificação do tempo porta-balão vs porta-agulha e critérios de transferência",
      "noInicialId": "no-1",
      "nos": [
        {
          "id": "no-1",
          "titulo": "IAM com Supra de ST Confirmado no ECG (< 10 min)",
          "descricao": "Iniciar dupla antiagregação imediata (AAS + Clopidogrel/Ticagrelor) e avaliar disponibilidade de laboratório de hemodinâmica.",
          "tipo": "inicio",
          "posicaoX": 500,
          "posicaoY": 50,
          "ramos": [
            { "id": "r1", "rotulo": "Tempo previsto até angioplastia < 120 min", "destinoNoId": "no-cate", "cor": "verde" },
            { "id": "r2", "rotulo": "Tempo previsto até angioplastia > 120 min", "destinoNoId": "no-trombolise", "cor": "amber" }
          ]
        },
        {
          "id": "no-cate",
          "titulo": "Angioplastia Primária Imediata (Padrão-Ouro)",
          "descricao": "Transferência imediata para hemodinâmica. Meta porta-balão ==< 90 minutos== (ou ==< 120 min== se transferido).",
          "tipo": "conduta",
          "oculto": true,
          "dica": "Estratégia mecânica de reperfusão",
          "posicaoX": 250,
          "posicaoY": 240,
          "ramos": []
        },
        {
          "id": "no-trombolise",
          "titulo": "Fibrinólise Química na Sala de Emergência",
          "descricao": "Tenecteplase (TNK) ou Alteplase (rtPA) em até ==30 minutos== (porta-agulha). Se falha de reperfusão em 90 min: CATE de resgate.",
          "tipo": "alerta",
          "oculto": true,
          "dica": "Estratégia química quando não há hemodinâmica rápida",
          "posicaoX": 750,
          "posicaoY": 240,
          "ramos": []
        }
      ]
    }
  }
]

MATERIAL / AULA / DIRETRIZ / PRINT PARA CONVERTER:
[COLE AQUI SEU TEXTO, RESUMO OU TRANSCRIÇÃO]`;
};

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
  const [focoInstitucional, setFocoInstitucional] = useState<FocoInstitucional>('ufpa');
  const [quantidadePrompt, setQuantidadePrompt] = useState<number>(20);

  const handleCopiarPrompt = async () => {
    const promptTexto = gerarPromptCompleto(focoInstitucional, quantidadePrompt);
    const ok = await AnkiService.copiarParaClipboard(promptTexto);
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
            image_occlusion: 0,
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

      const contagem: Record<string, number> = {};
      res.cardsImportados.forEach(c => {
        contagem[c.tipoCard] = (contagem[c.tipoCard] || 0) + 1;
      });

      const eixoCriadoPrincipal = res.eixosCriados && res.eixosCriados.length > 0 ? res.eixosCriados[0] : null;
      const eixoRef = eixoCriadoPrincipal || eixos.find(e => e.id === finalEixoId);

      const topicosQtd = (eixoCriadoPrincipal?.topicos || []).length;
      const topicoDescricao = topicosQtd > 0
        ? `${topicosQtd} tópico${topicosQtd > 1 ? 's' : ''} estruturado${topicosQtd > 1 ? 's' : ''}`
        : 'Tópicos sincronizados';

      setSucessoPopUp({
        totalCards: res.totalCards,
        eixoId: eixoRef?.id || finalEixoId,
        eixoNome: res.eixosCriados.length > 1 ? `${res.eixosCriados.length} Eixos Clínicos` : (eixoRef?.titulo || 'Eixo Importado'),
        especialidade: eixoRef?.especialidade || 'Geral / Outros',
        topicoNome: topicoDescricao,
        tiposContagem: contagem,
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
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.28)] border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
        
        {/* Cabeçalho Executivo Clean */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Central de Integração
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Importação estruturada de flashcards clínicos e sincronização
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
                  {/* Card Executivo do Prompt Mestre com Seletor de Foco Institucional */}
                  <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/90 rounded-3xl space-y-4 shadow-xs">
                    
                    {/* Linha de Seleção do Foco: UFPA | ENAMED | USP */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                          <span>🎯</span>
                          <span>Foco do Prompt Mestre:</span>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Selecione o perfil desejado
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
                        {(['ufpa', 'enamed', 'usp'] as FocoInstitucional[]).map(focoId => {
                          const info = FOCOS_INSTITUCIONAIS[focoId];
                          const ativo = focoInstitucional === focoId;
                          return (
                            <button
                              key={focoId}
                              type="button"
                              onClick={() => setFocoInstitucional(focoId)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                ativo
                                  ? `${info.corBadge} shadow-sm ring-1 ring-black/5`
                                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                              }`}
                            >
                              <span className="text-xs">{info.iconeEmoji}</span>
                              <span className="truncate">{info.sigla}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bloco de Apresentação e Botão de Copiar */}
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl ${FOCOS_INSTITUCIONAIS[focoInstitucional].corBadge} flex flex-col items-center justify-center font-black tracking-tight shrink-0 shadow-sm ring-1 ring-black/5`}>
                          <span className="text-[9px] opacity-80 uppercase leading-none font-bold">Foco</span>
                          <span className="text-xs font-black leading-tight">{FOCOS_INSTITUCIONAIS[focoInstitucional].sigla}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                            {FOCOS_INSTITUCIONAIS[focoInstitucional].nomeCompleto}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
                            {FOCOS_INSTITUCIONAIS[focoInstitucional].descricao}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
                        {/* Caixa pequena para digitar a quantidade desejada de flashcards (padrão 20) */}
                        <div 
                          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-3xs"
                          title="Quantidade de flashcards a ser gerada pelo prompt (padrão: 20)"
                        >
                          <label htmlFor="input-qtd-prompt" className="text-[11px] font-bold text-slate-700 whitespace-nowrap cursor-pointer">
                            Qtd:
                          </label>
                          <input
                            id="input-qtd-prompt"
                            type="number"
                            min={1}
                            max={100}
                            value={quantidadePrompt}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (isNaN(val)) {
                                setQuantidadePrompt(20);
                              } else {
                                setQuantidadePrompt(Math.max(1, Math.min(100, val)));
                              }
                            }}
                            className="w-12 text-center text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-lg py-1 px-1 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                          />
                          <span className="text-[10px] text-slate-500 font-semibold hidden sm:inline">cards</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopiarPrompt}
                          className="inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-600/25 cursor-pointer transition-all active:scale-95 shrink-0"
                          title="Copiar prompt completo formatado para colar na IA"
                        >
                          {promptCopiado ? (
                            <>
                              <ClipboardCheck className="w-4 h-4 text-white" />
                              <span>Prompt Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-white" />
                              <span>Copiar Prompt ({quantidadePrompt})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Guia em 3 Passos Espaçosos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-slate-700 flex items-center gap-2.5 shadow-2xs">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">1</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[11.5px] leading-tight">Copiar Prompt</p>
                          <p className="text-[10px] text-slate-500 truncate">Clique no botão azul acima</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-slate-700 flex items-center gap-2.5 shadow-2xs">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">2</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[11.5px] leading-tight">Enviar com Aula/PDF</p>
                          <p className="text-[10px] text-slate-500 truncate">No Gemini ou ChatGPT</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 text-slate-700 flex items-center gap-2.5 shadow-2xs">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">3</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[11.5px] leading-tight">Colar o JSON</p>
                          <p className="text-[10px] text-slate-500 truncate">No campo abaixo e salvar</p>
                        </div>
                      </div>
                    </div>

                    {/* Acordeão de Prévia do Prompt */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setVerPromptDetalhado(!verPromptDetalhado)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>{verPromptDetalhado ? 'Ocultar diretrizes do prompt' : `Ver texto completo do prompt (${FOCOS_INSTITUCIONAIS[focoInstitucional].sigla} • ${quantidadePrompt} cards)`}</span>
                        {verPromptDetalhado ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {verPromptDetalhado && (
                        <div className="mt-2.5 p-3.5 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 text-[11px] font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-blue-600 selection:text-white">
                          {gerarPromptCompleto(focoInstitucional, quantidadePrompt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Textarea do JSON Espaçosa e Clean */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Cole o JSON gerado pela IA:</span>
                      </label>
                      {textoColado.trim() && (
                        <button
                          type="button"
                          onClick={() => setTextoColado('')}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                          title="Limpar texto colado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Limpar</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <textarea
                        rows={8}
                        value={textoColado}
                        onChange={e => setTextoColado(e.target.value)}
                        placeholder='Cole aqui o JSON gerado... (ex: [{"tipoCard": "conceito", "titulo": "...", "topico": "..."}, ...])'
                        className="w-full min-h-[190px] sm:min-h-[220px] p-3.5 sm:p-4 rounded-2xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-[12.5px] font-mono bg-slate-50/50 focus:bg-white transition-all resize-y shadow-inner text-slate-800 placeholder:text-slate-400 leading-relaxed"
                      />
                      {analisandoTexto && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-blue-50/95 border border-blue-200 text-blue-700 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Identificando cards...</span>
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
                        {analiseTextoColado.tiposContagem.image_occlusion > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                            {analiseTextoColado.tiposContagem.image_occlusion} Oclusão Imagem
                          </span>
                        )}
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
                            c.tipoCard === 'image_occlusion' ? 'Oclusão Imagem' :
                            c.tipoCard === 'cloze' ? 'Cloze' : 'Conceito';
                          
                          const tipoCor = 
                            c.tipoCard === 'caso_clinico' ? 'bg-purple-100 text-purple-700' :
                            c.tipoCard === 'fluxograma_complexo' ? 'bg-emerald-100 text-emerald-700' :
                            c.tipoCard === 'fluxograma_oclusao' ? 'bg-indigo-100 text-indigo-700' :
                            c.tipoCard === 'image_occlusion' ? 'bg-teal-100 text-teal-700' :
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
                {sucessoPopUp.tiposContagem.image_occlusion > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    {sucessoPopUp.tiposContagem.image_occlusion} Oclusão Imagem
                  </span>
                )}
                {sucessoPopUp.tiposContagem.caso_clinico > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    {sucessoPopUp.tiposContagem.caso_clinico} Casos Clínicos
                  </span>
                )}
                {sucessoPopUp.tiposContagem.fluxograma_complexo > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {sucessoPopUp.tiposContagem.fluxograma_complexo} Árvores de Decisão
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
