import { EixoClinico, CardClinico, ProgressoDiario } from '../types';

export const INITIAL_PROGRESS: ProgressoDiario = {
  data: new Date().toISOString().split('T')[0],
  cardsRevisadosHoje: 0,
  metaDiaria: 20,
  sequenciaDias: 1,
  taxaRetencaoMedia: 90,
  tempoEstudadoMinutos: 0,
};

// Exatamente 1 Eixo Clínico de Ortopedia com 1 Tópico Clínico
export const INITIAL_EIXOS: EixoClinico[] = [
  {
    id: 'eixo-ortopedia',
    titulo: 'Ortopedia & Traumatologia',
    subtitulo: 'Trauma de Membros, Fraturas & Emergências Ortopédicas',
    especialidade: 'Ortopedia e Traumatologia',
    descricao: 'Protocolos de atendimento inicial no trauma ortopédico, classificação de fraturas expostas, luxações agudas e conduta imediata na síndrome compartimental.',
    icone: '🦴',
    corTema: {
      bgTag: 'bg-amber-100',
      textTag: 'text-amber-950',
      borderTag: 'border-amber-300',
      accent: '#D97706',
    },
    totalCards: 6,
    cardsDominados: 2,
    pendentesHoje: 4,
    ultimaAtividade: 'Hoje às 10:00',
    topicos: [
      {
        id: 'top-ortop-trauma',
        eixoId: 'eixo-ortopedia',
        titulo: 'Trauma Ortopédico & Síndrome Compartimental',
        descricao: 'Fraturas expostas (Gustilo), luxação glenoumeral, fraturas distais do rádio e conduta na síndrome compartimental aguda.',
      },
    ],
  },
];

// Exatamente 6 Cards de Ortopedia cobrindo todos os 6 tipos de flashcards:
// 1. Conceito (Básico Frente / Verso)
// 2. Cloze (Oclusão de Texto / Lacuna)
// 3. Image Occlusion (Oclusão de Imagem Radiográfica)
// 4. Fluxograma Linear (Passo a Passo com Critérios)
// 5. Fluxograma Complexo (Árvore de Decisão Ramificada Fullscreen)
// 6. Caso Clínico (Múltipla Escolha com Justificativa)
export const INITIAL_CARDS: CardClinico[] = [
  // =========================================================================
  // 1. TIPO CONCEITO (Básico: Frente e Verso)
  // =========================================================================
  {
    id: 'card-ortop-basico',
    eixoId: 'eixo-ortopedia',
    topicoId: 'top-ortop-trauma',
    topicoNome: 'Trauma Ortopédico & Síndrome Compartimental',
    especialidade: 'Ortopedia e Traumatologia',
    titulo: 'Classificação de Gustilo-Anderson para Fraturas Expostas',
    perguntaGatilho: 'Quais são os critérios diagnósticos que definem uma Fratura Exposta Gustilo Grau III e qual o esquema de antibioticoterapia empírica imediata indicado no PS?',
    resposta: 'Gustilo Grau III: Ferida extensa (> 10 cm), laceração grave de partes moles, alto grau de contaminação, lesão por alta energia (projétil de arma de fogo ou esmagamento) ou lesão neurovascular que exija reparo.\n\nAntibioticoterapia imediata (na primeira hora):\n• Cefazolina (Cefalosporina de 1ª geração, 2g IV) + Gentamicina (Aminoglicosídeo, 5 mg/kg IV).\n• Se houver contaminação por solo, fezes ou meio rural: Adicionar Penicilina Cristalina (ou Metronidazol) para cobrir Clostridium tetani / anaeróbios.',
    perolaClinica: 'O tempo porta-antibiótico é o fator mais determinante na redução de infecção óssea profunda (osteomielite). Deve ser administrado na primeira hora (meta < 60 min), antes de qualquer exame de imagem complementar.',
    mnemonicoOuDica: 'Gustilo III = Cefalo 1ª + Aminoglicosídeo (+ Penicilina se terra/esterco)',
    diretrizReferencia: 'Manual de Fraturas Rockwood & Green / Diretrizes SBOT',
    repeticoes: 3,
    intervaloDias: 2,
    fatorFacilidade: 2.5,
    proximaRevisao: new Date().toISOString(),
    status: 'pendente',
    taxaAcerto: 85,
    historicoRespostas: ['bom', 'facil', 'bom'],
    tipoCard: 'conceito',
  },

  // =========================================================================
  // 2. TIPO CLOZE (Oclusão de Texto / Lacuna)
  // =========================================================================
  {
    id: 'card-ortop-cloze',
    eixoId: 'eixo-ortopedia',
    topicoId: 'top-ortop-trauma',
    topicoNome: 'Trauma Ortopédico & Síndrome Compartimental',
    especialidade: 'Ortopedia e Traumatologia',
    titulo: 'Fisiopatologia e Diagnóstico da Síndrome Compartimental Aguda',
    textoCloze: 'Na Síndrome Compartimental Aguda em membros, o sinal clínico mais precoce e sensível é a {{c1::dor desproporcional ao estiramento passivo}} muscular. O diagnóstico de confirmação é feito pela pressão delta (pressão arterial diastólica menos pressão compartimental) {{c2::≤ 30 mmHg}}, sendo a conduta imediata mandatória a {{c3::fasciotomia cirúrgica descompressiva}}.',
    perguntaGatilho: 'Complete as lacunas sobre o diagnóstico precoce, ponto de corte pressórico e conduta imediata na Síndrome Compartimental Aguda.',
    resposta: '1: dor desproporcional ao estiramento passivo | 2: ≤ 30 mmHg | 3: fasciotomia cirúrgica descompressiva',
    perolaClinica: 'Ausência de pulsos arteriais (pulselessness) e palidez são sinais extremamente tardios que traduzem necrose isquêmica estabelecida. O diagnóstico é essencialmente clínico e a descompressão deve ocorrer antes de 6 horas para evitar sequela neurológica permanente.',
    mnemonicoOuDica: 'Os 6 Ps: Pain (estiramento passivo), Paresthesia, Pressure, Pallor, Paralysis, Pulselessness',
    diretrizReferencia: 'American Academy of Orthopaedic Surgeons (AAOS) Clinical Practice Guidelines',
    repeticoes: 4,
    intervaloDias: 4,
    fatorFacilidade: 2.6,
    proximaRevisao: new Date().toISOString(),
    status: 'pendente',
    taxaAcerto: 90,
    historicoRespostas: ['bom', 'bom', 'facil'],
    tipoCard: 'cloze',
  },

  // =========================================================================
  // 3. TIPO IMAGE OCCLUSION (Oclusão de Imagem Anatômica e Radiológica)
  // =========================================================================
  {
    id: 'card-ortop-imagem',
    eixoId: 'eixo-ortopedia',
    topicoId: 'top-ortop-trauma',
    topicoNome: 'Trauma Ortopédico & Síndrome Compartimental',
    especialidade: 'Ortopedia e Traumatologia',
    titulo: 'Radiografia e Anatomia das Fraturas Distais do Rádio (Colles)',
    imagemUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    perguntaGatilho: 'Identifique os componentes anatômicos e marcos de desvio na radiografia de punho pós-trauma:',
    resposta: '1: Epífise Distal do Rádio (desvio dorsal em garfo de jantar)\n2: Processo Estiloide da Ulna (frequente fratura por avulsão)\n3: Articulação Radioulnar Distal - ARUD (congruência articular)',
    mascarasImagem: [
      {
        id: 'm-ortop-1',
        numero: 1,
        tipoForma: 'retangulo',
        x: 32,
        y: 26,
        largura: 34,
        altura: 18,
        textoOculto: 'Epífise Distal do Rádio (Fratura de Colles com desvio dorsal)',
        dica: 'Desvio dorsal típico em "garfo de jantar"',
        revelado: false,
      },
      {
        id: 'm-ortop-2',
        numero: 2,
        tipoForma: 'retangulo',
        x: 18,
        y: 50,
        largura: 28,
        altura: 16,
        textoOculto: 'Processo Estiloide da Ulna',
        dica: 'Frequentemente avulsionado por tração ligamentar',
        revelado: false,
      },
      {
        id: 'm-ortop-3',
        numero: 3,
        tipoForma: 'retangulo',
        x: 52,
        y: 58,
        largura: 30,
        altura: 18,
        textoOculto: 'Articulação Radioulnar Distal (ARUD)',
        dica: 'Avaliar diástase e instabilidade pós-redução',
        revelado: false,
      },
    ],
    perolaClinica: 'A Fratura de Colles decorre tipicamente de queda sobre a mão espalmada com o punho em dorsiflexão, promovendo desvio DORSAL do fragmento distal (deformidade em garfo de jantar). Em contrapartida, a Fratura de Smith decorre de punho em flexão volar (desvio volar / "pá de jardim").',
    mnemonicoOuDica: 'Colles = Dorsal ("garfo de jantar") vs Smith = Volar ("pá de jardineiro")',
    diretrizReferencia: 'Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)',
    repeticoes: 5,
    intervaloDias: 7,
    fatorFacilidade: 2.7,
    proximaRevisao: '2026-09-14T00:00:00.000Z',
    status: 'dominado',
    taxaAcerto: 100,
    historicoRespostas: ['facil', 'facil', 'facil'],
    tipoCard: 'image_occlusion',
  },

  // =========================================================================
  // 4. TIPO FLUXOGRAMA LINEAR (Passo a Passo com Critérios de Entrada)
  // =========================================================================
  {
    id: 'card-ortop-fluxo-linear',
    eixoId: 'eixo-ortopedia',
    topicoId: 'top-ortop-trauma',
    topicoNome: 'Trauma Ortopédico & Síndrome Compartimental',
    especialidade: 'Ortopedia e Traumatologia',
    titulo: 'Manejo Inicial da Fratura Exposta no Pronto-Socorro',
    perguntaGatilho: 'Ordene e complete os critérios das etapas de atendimento inicial ao paciente com fratura exposta de membro:',
    resposta: 'Passo 1: Avaliação primária pelo ABCDE do ATLS e estabilização hemodinâmica.\nPasso 2: Exposição da ferida, cobertura estéril com compressa e SF 0,9% (sem manipulação grosseira no leito).\nPasso 3: Antibioticoterapia venosa imediata (< 60 min) + Vacina/Soro antitetânico.\nPasso 4: Alinhamento grosseiro com tração suave, imobilização com tala gessada e encaminhamento para limpeza cirúrgica e desbridamento no centro cirúrgico.',
    perolaClinica: 'Nunca tente reduzir fragmentos ósseos expostos contaminados para dentro da ferida no box de emergência. Apenas cubra com curativo estéril embebido em SF 0,9% e conduza imediatamente ao bloco cirúrgico.',
    diretrizReferencia: 'Advanced Trauma Life Support (ATLS 10ª ed) & SBOT',
    repeticoes: 2,
    intervaloDias: 1,
    fatorFacilidade: 2.4,
    proximaRevisao: new Date().toISOString(),
    status: 'pendente',
    taxaAcerto: 80,
    historicoRespostas: ['dificil', 'bom'],
    tipoCard: 'fluxograma_oclusao',
    algoritmoDecisao: {
      id: 'alg-ortop-fe',
      titulo: 'Protocolo de Atendimento da Fratura Exposta no PS',
      especialidade: 'Ortopedia e Traumatologia',
      eixoId: 'eixo-ortopedia',
      topicoId: 'top-ortop-trauma',
      blocos: [
        { id: 'b1', tipo: 'inicio', titulo: 'Chegada ao PS: Paciente Politraumatizado com Fratura Exposta', descricao: 'Priorizar protocolo ATLS (ABCDE), estabilização hemodinâmica e acesso calibroso.' },
        { id: 'b2', tipo: 'conduta', titulo: 'Curativo Estéril Oclusivo com Soro Fisiológico 0,9%', descricao: 'Remover contaminantes grosseiros externos visíveis, mas não explorar ou lavar sob pressão no leito.' },
        { id: 'b3', tipo: 'decisao', titulo: 'Antibioticoterapia Venosa Precoce (< 60 min) + Tétano', descricao: 'Cefazolina 2g IV imediata. Adicionar Gentamicina se Gustilo III e Penicilina se contaminação orgânica.' },
        { id: 'b4', tipo: 'conduta', titulo: 'Imobilização Provisória com Tala e Encaminhamento ao Centro Cirúrgico', descricao: 'Alinhamento em eixo com tala moldada, radiografias de 2 incidências e limpeza cirúrgica no bloco.' },
      ],
      ramificacoes: [
        { id: 'r1', origemId: 'b1', destinoId: 'b2', criterioCondicional: 'Vias aéreas e choque compensados pelo ATLS' },
        { id: 'r2', origemId: 'b2', destinoId: 'b3', criterioCondicional: 'Curativo estéril posicionado e membro estabilizado' },
        { id: 'r3', origemId: 'b3', destinoId: 'b4', criterioCondicional: 'Antibiótico infundido e centro cirúrgico acionado' },
      ],
    },
    blocosOclusao: [
      { id: 'bo-1', posicao: { x: 10, y: 18, largura: 38, altura: 24 }, textoOculto: 'ABCDE do ATLS + Estabilização inicial', dica: 'Prioridade absoluta no trauma' },
      { id: 'bo-2', posicao: { x: 52, y: 18, largura: 38, altura: 24 }, textoOculto: 'Curativo oclusivo estéril sem manipular no leito', dica: 'Proteção da ferida' },
      { id: 'bo-3', posicao: { x: 10, y: 55, largura: 38, altura: 24 }, textoOculto: 'Antibiótico IV na 1ª hora (Cefazolina ± Genta) + Tétano', dica: 'Prevenção de osteomielite' },
      { id: 'bo-4', posicao: { x: 52, y: 55, largura: 38, altura: 24 }, textoOculto: 'Desbridamento e fixação no Centro Cirúrgico', dica: 'Tratamento cirúrgico definitivo' },
    ],
  },

  // =========================================================================
  // 5. TIPO FLUXOGRAMA COMPLEXO (Árvore de Decisão Ramificada Fullscreen)
  // =========================================================================
  {
    id: 'card-ortop-fluxo-complexo',
    eixoId: 'eixo-ortopedia',
    topicoId: 'top-ortop-trauma',
    topicoNome: 'Trauma Ortopédico & Síndrome Compartimental',
    especialidade: 'Ortopedia e Traumatologia',
    titulo: 'Árvore de Decisão: Suspeita de Síndrome Compartimental Aguda',
    perguntaGatilho: 'Navegue pela árvore de decisão para definir a investigação e indicação de fasciotomia descompressiva na suspeita de síndrome compartimental aguda pós-fratura:',
    resposta: 'Na suspeita de síndrome compartimental em membro: 1. Abertura completa e bivalvação imediata de qualquer gesso, atadura ou curativo constritivo e manter o membro ao nível do coração (nunca elevar). 2. Se dor desproporcional e tensão persistirem, aferir pressão intracompartimental por cateter/manômetro. 3. Se Delta P (Pressão Diastólica - Pressão Compartimental) ≤ 30 mmHg ou quadro clínico evidente: Fasciotomia descompressiva de urgência de todos os 4 compartimentos da perna. Se Delta P > 30 mmHg: Monitorização contínua e reavaliação a cada 2h.',
    perolaClinica: 'A elevação do membro na suspeita de síndrome compartimental é CONTRAINDICADA, pois reduz a pressão arterial de perfusão nos leitos capilares e agrava a isquemia tecidual profunda!',
    diretrizReferencia: 'Orthopaedic Trauma Association (OTA) & AAOS Guidelines',
    repeticoes: 2,
    intervaloDias: 1,
    fatorFacilidade: 2.5,
    proximaRevisao: new Date().toISOString(),
    status: 'pendente',
    taxaAcerto: 80,
    historicoRespostas: ['dificil', 'bom'],
    tipoCard: 'fluxograma_complexo',
    fluxogramaComplexo: {
      id: 'fluxo-ortop-sindrome-comp',
      titulo: 'Algoritmo de Investigação e Descompressão da Síndrome Compartimental',
      descricao: 'Protocolo de avaliação clínica, critérios de medição da pressão intracompartimental e indicação de fasciotomia dos 4 compartimentos.',
      noInicialId: 'no-ortop-1',
      nos: [
        {
          id: 'no-ortop-1',
          titulo: 'Paciente com Fratura de Tíbia: Dor Intensa e Tensa no Membro',
          descricao: 'Dor severa desproporcional ao trauma, edema tenso e dor excruciante ao estiramento passivo dos pododáctilos.',
          tipo: 'inicio',
          posicaoX: 560,
          posicaoY: 60,
          ramos: [
            {
              id: 'ramo-ortop-1',
              rotulo: 'Gesso ou Tala Circular Presente',
              destinoNoId: 'no-ortop-2',
              cor: 'amber',
            },
            {
              id: 'ramo-ortop-2',
              rotulo: 'Sem Contenção Externa / Pós-Abertura',
              destinoNoId: 'no-ortop-3',
              cor: 'azul',
            },
          ],
        },
        {
          id: 'no-ortop-2',
          titulo: 'Bivalvação Completa de Gesso / Atadura até a Pele',
          descricao: 'Remover completamente todas as faixas e acolchoamentos até a pele. Manter o membro estritamente ao nível do coração (NUNCA elevar).',
          tipo: 'conduta',
          posicaoX: 140,
          posicaoY: 300,
          ramos: [
            {
              id: 'ramo-ortop-3',
              rotulo: 'Sintomas persistem após 15-30 min',
              destinoNoId: 'no-ortop-3',
              cor: 'vermelho',
            },
          ],
        },
        {
          id: 'no-ortop-3',
          titulo: 'Aferição da Pressão Intracompartimental (Delta P = PAD - Pcomp)',
          descricao: 'Mensurar pressão tecidual com agulha/manômetro nos 4 compartimentos da perna. Calcular: Pressão Arterial Diastólica menos Pressão Compartimental.',
          tipo: 'decisao',
          posicaoX: 560,
          posicaoY: 540,
          ramos: [
            {
              id: 'ramo-ortop-4',
              rotulo: 'Delta P ≤ 30 mmHg (Ou Clínica Típica)',
              destinoNoId: 'no-ortop-4',
              cor: 'vermelho',
            },
            {
              id: 'ramo-ortop-5',
              rotulo: 'Delta P > 30 mmHg com Dúvida Clínica',
              destinoNoId: 'no-ortop-5',
              cor: 'verde',
            },
          ],
        },
        {
          id: 'no-ortop-4',
          titulo: 'Fasciotomia Descompressiva de Urgência (4 Compartimentos)',
          descricao: 'Dupla incisão anterolateral e posteromedial para descompressão completa dos compartimentos anterior, lateral, posterior superficial e profundo.',
          tipo: 'alerta',
          posicaoX: 280,
          posicaoY: 800,
          ramos: [],
        },
        {
          id: 'no-ortop-5',
          titulo: 'Monitorização Contínua e Reavaliação Seriada a cada 2h',
          descricao: 'Manter vigilância neurovascular rigorosa em UTI/leito cirúrgico. Qualquer piora clínica exige nova aferição pressórica ou fasciotomia imediata.',
          tipo: 'conduta',
          posicaoX: 840,
          posicaoY: 800,
          ramos: [],
        },
      ],
    },
  },

  // =========================================================================
  // 6. TIPO CASO CLÍNICO (Múltipla Escolha com Justificativa e Exame Físico)
  // =========================================================================
  {
    id: 'card-ortop-caso',
    eixoId: 'eixo-ortopedia',
    topicoId: 'top-ortop-trauma',
    topicoNome: 'Trauma Ortopédico & Síndrome Compartimental',
    especialidade: 'Ortopedia e Traumatologia',
    titulo: 'Conduta Imediata na Luxação Anterior Glenoumeral no Pronto-Socorro',
    perguntaGatilho: 'Antes e após qualquer tentativa de redução incruenta da luxação glenoumeral, qual conduta propedêutica é indispensável para a segurança do paciente e documentação médico-legal?',
    resposta: 'Opção B: Avaliação e documentação do exame neurovascular (especialmente do nervo axilar e pulsos periféricos) associada a radiografias pré e pós-redução por método atraumático.',
    perolaClinica: 'O nervo axilar (circunflexo) é o mais frequentemente lesado na luxação anterior do ombro. Teste a sensibilidade tátil sobre a face lateral do deltoide ("patch do deltoide") antes e após a manobra de redução!',
    diretrizReferencia: 'Manual de Trauma do Membro Superior / Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)',
    repeticoes: 4,
    intervaloDias: 5,
    fatorFacilidade: 2.6,
    proximaRevisao: '2026-09-15T00:00:00.000Z',
    status: 'dominado',
    taxaAcerto: 95,
    historicoRespostas: ['bom', 'facil', 'facil'],
    tipoCard: 'caso_clinico',
    casoClinicoDados: {
      historiaClinica: 'Homem de 24 anos dá entrada no pronto-socorro após sofrer queda com o braço em abdução e rotação externa há 1 hora. Queixa-se de dor intensa no ombro direito e sensação de "braço solto".',
      exameFisicoSinais: 'Sinal da dragona evidente no ombro direito (perda da convexidade normal do músculo deltoide). Braço mantido em leve abdução e sustentado pelo membro contralateral. Parestesia discreta na face lateral superior do braço.',
      opcoes: [
        'A) Realizar tração longitudinal enérgica imediata pelo método de Hipócrates com o calcanhar na axila sem qualquer radiografia prévia.',
        'B) Avaliação e registro detalhado do exame neurovascular (especialmente sensibilidade do nervo axilar e pulso radial) + Radiografia de ombro pré e pós-redução por técnica atraumática (ex: Milch ou Cunningham).',
        'C) Encaminhar imediatamente para artroscopia de urgência no centro cirúrgico para reparo da lesão labral anteroinferior (Bankart).',
        'D) Prescrever anti-inflamatório, manter membro solto sem imobilização e encaminhar para consulta ambulatorial em 30 dias.',
      ],
      indiceCorreto: 1,
      justificativaDetalhada: 'Na luxação glenoumeral anterior aguda: 1. A avaliação neurovascular pré-redução é mandatória para documentar se já existe neuropraxia do nervo axilar (sensibilidade na área do deltoide) ou déficit vascular; 2. A radiografia pré-redução em 2 incidências (AP verdadeiro e perfil de escápula/axilar) descarta fraturas associadas do colo cirúrgico ou tuberosidade maior; 3. A redução incruenta deve priorizar técnicas atraumáticas e suaves sob sedação/analgesia; 4. A radiografia e o reexame neurovascular pós-redução confirmam o sucesso e a integridade anatômica.',
    },
  },
];
