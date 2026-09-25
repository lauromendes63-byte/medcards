import { RamoFluxogramaComplexo, NoFluxogramaComplexo } from '../types';

export const CORES_RAMO: { 
  id: RamoFluxogramaComplexo['cor']; 
  rotulo: string; 
  nomeCurto: string; 
  hex: string; 
  bgClass: string; 
  textClass: string;
}[] = [
  { id: 'verde', rotulo: 'Verde (Sim / Estável / Positivo)', nomeCurto: 'Verde (Sim)', hex: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-700' },
  { id: 'vermelho', rotulo: 'Vermelho (Não / Grave / Alerta)', nomeCurto: 'Vermelho (Não)', hex: '#f43f5e', bgClass: 'bg-rose-500', textClass: 'text-rose-700' },
  { id: 'azul', rotulo: 'Azul (Padrão / Desvio / Investigação)', nomeCurto: 'Azul', hex: '#0ea5e9', bgClass: 'bg-sky-500', textClass: 'text-sky-700' },
  { id: 'amber', rotulo: 'Âmbar (Atenção / Limítrofe)', nomeCurto: 'Âmbar', hex: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-700' },
  { id: 'purple', rotulo: 'Roxo (Diagnóstico / Diferencial)', nomeCurto: 'Roxo', hex: '#a855f7', bgClass: 'bg-purple-500', textClass: 'text-purple-700' },
  { id: 'indigo', rotulo: 'Índigo (Conduta Específica)', nomeCurto: 'Índigo', hex: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-700' },
  { id: 'teal', rotulo: 'Teal (Terapia Adicional)', nomeCurto: 'Teal', hex: '#14b8a6', bgClass: 'bg-teal-500', textClass: 'text-teal-700' },
  { id: 'slate', rotulo: 'Cinza (Neutro / Reavaliação)', nomeCurto: 'Cinza', hex: '#94a3b8', bgClass: 'bg-slate-500', textClass: 'text-slate-700' },
];

export function obterDashArraySeta(estilo?: RamoFluxogramaComplexo['estilo']): string {
  if (estilo === 'tracejada') return '6,4';
  if (estilo === 'pontilhada') return '2.5,3.5';
  return 'none';
}

export function obterStrokeWidthSeta(espessura?: RamoFluxogramaComplexo['espessura']): string {
  if (espessura === 'fina') return '1.8';
  if (espessura === 'grossa') return '3.6';
  return '2.5';
}

export interface PontoAncora {
  x: number;
  y: number;
  dir: 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
}

/**
 * Calcula conexões ortogonais e curvas de Bézier cúbicas dinâmicas suaves entre nós.
 * Implementa âncoras dinâmicas pelo lado mais próximo (borda direita -> borda esquerda quando à direita,
 * borda inferior -> borda superior quando abaixo, etc.), com distribuição inteligente de múltiplas saídas/entradas
 * para evitar sobreposição de setas e textos em trajetórias paralelas ou convergentes.
 */
export function calcularConexaoDinamica(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  larguraCard = 240,
  alturaCard = 125,
  ramoIndex = 0,
  totalRamos = 1,
  entradaIndex = 0,
  totalEntradas = 1
) {
  // Margem de segurança de deslocamento perpendicular obrigatório (28px)
  const OFFSET = 28;

  // Centros dos blocos de origem e destino
  const cx1 = ox + larguraCard / 2;
  const cy1 = oy + alturaCard / 2;
  const cx2 = dx + larguraCard / 2;
  const cy2 = dy + alturaCard / 2;

  const diffX = cx2 - cx1;
  const diffY = cy2 - cy1;
  const absDiffX = Math.abs(diffX);
  const absDiffY = Math.abs(diffY);

  // Espaçamento entre as bordas externas dos blocos
  const gapDireita = dx - (ox + larguraCard);
  const gapEsquerda = ox - (dx + larguraCard);

  // =========================================================================
  // ÂNCORAS DE CONEXÃO DINÂMICAS (Lado mais próximo e canônico)
  // =========================================================================
  let saida: PontoAncora;
  let entrada: PontoAncora;

  // 1. Se o destino estiver à direita da origem
  if (diffX > 0 && (gapDireita >= 10 || absDiffX >= absDiffY * 0.75)) {
    saida = { x: ox + larguraCard, y: cy1, dir: 'RIGHT' };
    entrada = { x: dx, y: cy2, dir: 'LEFT' };
  }
  // 2. Se o destino estiver à esquerda da origem
  else if (diffX < 0 && (gapEsquerda >= 10 || absDiffX >= absDiffY * 0.75)) {
    saida = { x: ox, y: cy1, dir: 'LEFT' };
    entrada = { x: dx + larguraCard, y: cy2, dir: 'RIGHT' };
  }
  // 3. Se o destino estiver abaixo da origem
  else if (diffY >= 0) {
    saida = { x: cx1, y: oy + alturaCard, dir: 'DOWN' };
    entrada = { x: cx2, y: dy, dir: 'UP' };
  }
  // 4. Se o destino estiver acima da origem
  else {
    saida = { x: cx1, y: oy, dir: 'UP' };
    entrada = { x: cx2, y: dy + alturaCard, dir: 'DOWN' };
  }

  // =========================================================================
  // DISTRIBUIÇÃO ESPACIAL DE ÂNCORAS MÚLTIPLAS (Evita sobreposição de setas)
  // =========================================================================
  if (totalRamos > 1) {
    if (saida.dir === 'DOWN' || saida.dir === 'UP') {
      const spanX = Math.min(150, 48 * (totalRamos - 1));
      const shiftX = (ramoIndex / (totalRamos - 1) - 0.5) * spanX;
      saida.x = cx1 + shiftX;
    } else {
      const spanY = Math.min(65, 26 * (totalRamos - 1));
      const shiftY = (ramoIndex / (totalRamos - 1) - 0.5) * spanY;
      saida.y = cy1 + shiftY;
    }
  }

  if (totalEntradas > 1) {
    if (entrada.dir === 'UP' || entrada.dir === 'DOWN') {
      const spanX = Math.min(150, 48 * (totalEntradas - 1));
      const shiftX = (entradaIndex / (totalEntradas - 1) - 0.5) * spanX;
      entrada.x = cx2 + shiftX;
    } else {
      const spanY = Math.min(65, 26 * (totalEntradas - 1));
      const shiftY = (entradaIndex / (totalEntradas - 1) - 0.5) * spanY;
      entrada.y = cy2 + shiftY;
    }
  }

  const x1 = saida.x;
  const y1 = saida.y;
  const x2 = entrada.x;
  const y2 = entrada.y;

  // Recuo milimétrico do ponto final para que a ponta da cabeça da seta
  // encoste perfeitamente na borda externa do card alvo sem invadir o seu interior
  let endX = x2;
  let endY = y2;
  if (entrada.dir === 'LEFT') {
    endX = x2 - 1.5;
  } else if (entrada.dir === 'RIGHT') {
    endX = x2 + 1.5;
  } else if (entrada.dir === 'UP') {
    endY = y2 - 1.5;
  } else if (entrada.dir === 'DOWN') {
    endY = y2 + 1.5;
  }

  // =========================================================================
  // ROTEAMENTO COM DESVIO E MARGEM DE SEGURANÇA (OFFSET DE 28px)
  // =========================================================================
  let pathData = '';
  let midX = 0;
  let midY = 0;

  // Parâmetro t e offset perpendicular para evitar sobreposição de rótulos/pílulas de texto
  const tLabel = totalRamos > 1 ? 0.35 + 0.30 * (ramoIndex / (totalRamos - 1)) : 0.5;
  const labelShiftOffset = totalRamos > 1 ? (ramoIndex - (totalRamos - 1) / 2) * 14 : 0;

  if (saida.dir === 'RIGHT' && entrada.dir === 'LEFT') {
    const hDist = endX - x1;
    if (hDist >= 2 * OFFSET) {
      const controlMidX = (x1 + endX) / 2;
      const c1x = controlMidX;
      const c1y = y1;
      const c2x = controlMidX;
      const c2y = endY;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(c1x)} ${Math.round(c1y)}, ${Math.round(c2x)} ${Math.round(c2y)}, ${Math.round(endX)} ${Math.round(endY)}`;
      
      const invT = 1 - tLabel;
      midX = Math.round(invT * invT * invT * x1 + 3 * invT * invT * tLabel * c1x + 3 * invT * tLabel * tLabel * c2x + tLabel * tLabel * tLabel * endX);
      midY = Math.round(invT * invT * invT * y1 + 3 * invT * invT * tLabel * c1y + 3 * invT * tLabel * tLabel * c2y + tLabel * tLabel * tLabel * endY) + labelShiftOffset;
    } else {
      const escapeY = cy2 >= cy1 
        ? Math.max(oy + alturaCard, dy + alturaCard) + OFFSET + Math.abs(labelShiftOffset)
        : Math.min(oy, dy) - OFFSET - Math.abs(labelShiftOffset);
      const p1x = x1 + OFFSET;
      const p2x = endX - OFFSET;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(p1x)} ${Math.round(y1)}, ${Math.round(p1x)} ${Math.round(escapeY)}, ${Math.round((p1x + p2x) / 2)} ${Math.round(escapeY)} C ${Math.round(p2x)} ${Math.round(escapeY)}, ${Math.round(p2x)} ${Math.round(endY)}, ${Math.round(endX)} ${Math.round(endY)}`;
      midX = Math.round((p1x + p2x) / 2) + labelShiftOffset;
      midY = Math.round(escapeY);
    }
  } else if (saida.dir === 'LEFT' && entrada.dir === 'RIGHT') {
    const hDist = x1 - endX;
    if (hDist >= 2 * OFFSET) {
      const controlMidX = (x1 + endX) / 2;
      const c1x = controlMidX;
      const c1y = y1;
      const c2x = controlMidX;
      const c2y = endY;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(c1x)} ${Math.round(c1y)}, ${Math.round(c2x)} ${Math.round(c2y)}, ${Math.round(endX)} ${Math.round(endY)}`;
      
      const invT = 1 - tLabel;
      midX = Math.round(invT * invT * invT * x1 + 3 * invT * invT * tLabel * c1x + 3 * invT * tLabel * tLabel * c2x + tLabel * tLabel * tLabel * endX);
      midY = Math.round(invT * invT * invT * y1 + 3 * invT * invT * tLabel * c1y + 3 * invT * tLabel * tLabel * c2y + tLabel * tLabel * tLabel * endY) + labelShiftOffset;
    } else {
      const escapeY = cy2 >= cy1 
        ? Math.max(oy + alturaCard, dy + alturaCard) + OFFSET + Math.abs(labelShiftOffset)
        : Math.min(oy, dy) - OFFSET - Math.abs(labelShiftOffset);
      const p1x = x1 - OFFSET;
      const p2x = endX + OFFSET;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(p1x)} ${Math.round(y1)}, ${Math.round(p1x)} ${Math.round(escapeY)}, ${Math.round((p1x + p2x) / 2)} ${Math.round(escapeY)} C ${Math.round(p2x)} ${Math.round(escapeY)}, ${Math.round(p2x)} ${Math.round(endY)}, ${Math.round(endX)} ${Math.round(endY)}`;
      midX = Math.round((p1x + p2x) / 2) + labelShiftOffset;
      midY = Math.round(escapeY);
    }
  } else if (saida.dir === 'DOWN' && entrada.dir === 'UP') {
    const vDist = endY - y1;
    if (vDist >= 2 * OFFSET) {
      const controlMidY = (y1 + endY) / 2;
      const c1x = x1;
      const c1y = controlMidY;
      const c2x = endX;
      const c2y = controlMidY;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(c1x)} ${Math.round(c1y)}, ${Math.round(c2x)} ${Math.round(c2y)}, ${Math.round(endX)} ${Math.round(endY)}`;
      
      const invT = 1 - tLabel;
      midX = Math.round(invT * invT * invT * x1 + 3 * invT * invT * tLabel * c1x + 3 * invT * tLabel * tLabel * c2x + tLabel * tLabel * tLabel * endX) + labelShiftOffset;
      midY = Math.round(invT * invT * invT * y1 + 3 * invT * invT * tLabel * c1y + 3 * invT * tLabel * tLabel * c2y + tLabel * tLabel * tLabel * endY);
    } else {
      const escapeX = cx2 >= cx1
        ? Math.max(ox + larguraCard, dx + larguraCard) + OFFSET + Math.abs(labelShiftOffset)
        : Math.min(ox, dx) - OFFSET - Math.abs(labelShiftOffset);
      const p1y = y1 + OFFSET;
      const p2y = endY - OFFSET;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(x1)} ${Math.round(p1y)}, ${Math.round(escapeX)} ${Math.round(p1y)}, ${Math.round(escapeX)} ${Math.round((p1y + p2y) / 2)} C ${Math.round(escapeX)} ${Math.round(p2y)}, ${Math.round(endX)} ${Math.round(p2y)}, ${Math.round(endX)} ${Math.round(endY)}`;
      midX = Math.round(escapeX);
      midY = Math.round((p1y + p2y) / 2) + labelShiftOffset;
    }
  } else if (saida.dir === 'UP' && entrada.dir === 'DOWN') {
    const vDist = y1 - endY;
    if (vDist >= 2 * OFFSET) {
      const controlMidY = (y1 + endY) / 2;
      const c1x = x1;
      const c1y = controlMidY;
      const c2x = endX;
      const c2y = controlMidY;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(c1x)} ${Math.round(c1y)}, ${Math.round(c2x)} ${Math.round(c2y)}, ${Math.round(endX)} ${Math.round(endY)}`;
      
      const invT = 1 - tLabel;
      midX = Math.round(invT * invT * invT * x1 + 3 * invT * invT * tLabel * c1x + 3 * invT * tLabel * tLabel * c2x + tLabel * tLabel * tLabel * endX) + labelShiftOffset;
      midY = Math.round(invT * invT * invT * y1 + 3 * invT * invT * tLabel * c1y + 3 * invT * tLabel * tLabel * c2y + tLabel * tLabel * tLabel * endY);
    } else {
      const escapeX = cx2 >= cx1
        ? Math.max(ox + larguraCard, dx + larguraCard) + OFFSET + Math.abs(labelShiftOffset)
        : Math.min(ox, dx) - OFFSET - Math.abs(labelShiftOffset);
      const p1y = y1 - OFFSET;
      const p2y = endY + OFFSET;
      pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(x1)} ${Math.round(p1y)}, ${Math.round(escapeX)} ${Math.round(p1y)}, ${Math.round(escapeX)} ${Math.round((p1y + p2y) / 2)} C ${Math.round(escapeX)} ${Math.round(p2y)}, ${Math.round(endX)} ${Math.round(p2y)}, ${Math.round(endX)} ${Math.round(endY)}`;
      midX = Math.round(escapeX);
      midY = Math.round((p1y + p2y) / 2) + labelShiftOffset;
    }
  } else {
    // Casos ortogonais mistos em L
    let c1x = x1;
    let c1y = y1;
    let c2x = endX;
    let c2y = endY;

    if (saida.dir === 'RIGHT') {
      c1x = Math.max(x1 + OFFSET, (x1 + endX) / 2);
      c1y = y1;
    } else if (saida.dir === 'LEFT') {
      c1x = Math.min(x1 - OFFSET, (x1 + endX) / 2);
      c1y = y1;
    } else if (saida.dir === 'DOWN') {
      c1x = x1;
      c1y = Math.max(y1 + OFFSET, (y1 + endY) / 2);
    } else if (saida.dir === 'UP') {
      c1x = x1;
      c1y = Math.min(y1 - OFFSET, (y1 + endY) / 2);
    }

    if (entrada.dir === 'LEFT') {
      c2x = Math.min(endX - OFFSET, (x1 + endX) / 2);
      c2y = endY;
    } else if (entrada.dir === 'RIGHT') {
      c2x = Math.max(endX + OFFSET, (x1 + endX) / 2);
      c2y = endY;
    } else if (entrada.dir === 'UP') {
      c2x = endX;
      c2y = Math.min(endY - OFFSET, (y1 + endY) / 2);
    } else if (entrada.dir === 'DOWN') {
      c2x = endX;
      c2y = Math.max(endY + OFFSET, (y1 + endY) / 2);
    }

    pathData = `M ${Math.round(x1)} ${Math.round(y1)} C ${Math.round(c1x)} ${Math.round(c1y)}, ${Math.round(c2x)} ${Math.round(c2y)}, ${Math.round(endX)} ${Math.round(endY)}`;
    
    const invT = 1 - tLabel;
    midX = Math.round(invT * invT * invT * x1 + 3 * invT * invT * tLabel * c1x + 3 * invT * tLabel * tLabel * c2x + tLabel * tLabel * tLabel * endX) + labelShiftOffset;
    midY = Math.round(invT * invT * invT * y1 + 3 * invT * invT * tLabel * c1y + 3 * invT * tLabel * tLabel * c2y + tLabel * tLabel * tLabel * endY);
  }

  return {
    pathData,
    midX,
    midY,
    saida,
    entrada
  };
}

// =========================================================================
// ALGORITMO HIERÁRQUICO ESTILO DAGRE/SUGIYAMA COM ESPAÇAMENTO GENEROSO
// =========================================================================
export interface AutoLayoutOptions {
  cardWidth?: number;
  cardHeight?: number;
  rankSep?: number; // Separação vertical entre níveis (mínimo 200px para passagem livre de setas e rótulos)
  nodeSep?: number; // Separação horizontal entre cards vizinhos (mínimo 160px para rótulos multiline)
  startX?: number;
  startY?: number;
}

/**
 * Organiza deterministicamente um grafo/árvore de decisão em camadas (ranks),
 * garantindo folgas verticais (rankSep) e horizontais (nodeSep) suficientes para que
 * setas e rótulos multiline nunca colidam com cards vizinhos.
 */
export function calcularLayoutHierarquicoFluxograma(
  nosOriginais: NoFluxogramaComplexo[],
  noInicialId?: string,
  options: AutoLayoutOptions = {}
): NoFluxogramaComplexo[] {
  if (!nosOriginais || nosOriginais.length === 0) return [];
  if (nosOriginais.length === 1) {
    return [{ ...nosOriginais[0], posicaoX: options.startX ?? 550, posicaoY: options.startY ?? 60 }];
  }

  const cardWidth = options.cardWidth ?? 250;
  const cardHeight = options.cardHeight ?? 120;
  const rankSep = options.rankSep ?? 130;
  const nodeSep = options.nodeSep ?? 110;
  const startX = options.startX ?? 600;
  const startY = options.startY ?? 60;

  // Mapa de nós e dependências
  const noMap = new Map<string, NoFluxogramaComplexo>();
  const inDegree = new Map<string, number>();
  const parentsMap = new Map<string, string[]>();
  const childrenMap = new Map<string, string[]>();

  nosOriginais.forEach(n => {
    noMap.set(n.id, n);
    inDegree.set(n.id, 0);
    parentsMap.set(n.id, []);
    childrenMap.set(n.id, []);
  });

  nosOriginais.forEach(n => {
    if (Array.isArray(n.ramos)) {
      n.ramos.forEach(r => {
        if (r.destinoNoId && noMap.has(r.destinoNoId)) {
          inDegree.set(r.destinoNoId, (inDegree.get(r.destinoNoId) || 0) + 1);
          parentsMap.get(r.destinoNoId)?.push(n.id);
          childrenMap.get(n.id)?.push(r.destinoNoId);
        }
      });
    }
  });

  const raizId =
    noInicialId ||
    nosOriginais.find(n => n.tipo === 'inicio')?.id ||
    nosOriginais.find(n => (inDegree.get(n.id) || 0) === 0)?.id ||
    nosOriginais[0].id;

  // Atribuição de Ranks via Longest Path para que nós fiquem sempre abaixo de todos os seus antecessores
  const ranks = new Map<string, number>();
  ranks.set(raizId, 0);

  // Nós com inDegree 0 também iniciam no topo
  nosOriginais.forEach(n => {
    if ((inDegree.get(n.id) || 0) === 0) {
      ranks.set(n.id, 0);
    }
  });

  let alterou = true;
  let iteracoes = 0;
  const maxIter = nosOriginais.length * 3;

  while (alterou && iteracoes < maxIter) {
    alterou = false;
    iteracoes++;

    nosOriginais.forEach(n => {
      const meuRank = ranks.get(n.id);
      if (meuRank !== undefined) {
        const filhos = childrenMap.get(n.id) || [];
        filhos.forEach(filhoId => {
          const rankFilhoAtual = ranks.get(filhoId) ?? -1;
          const rankEsperado = meuRank + 1;
          if (rankFilhoAtual < rankEsperado) {
            ranks.set(filhoId, rankEsperado);
            alterou = true;
          }
        });
      }
    });
  }

  // Atribui rank padrão para os nós desconectados se houver
  let maxRank = 0;
  ranks.forEach(r => { if (r > maxRank) maxRank = r; });
  nosOriginais.forEach(n => {
    if (!ranks.has(n.id)) {
      ranks.set(n.id, maxRank + 1);
    }
  });

  // Agrupar nós por nível
  const gruposNivel = new Map<number, string[]>();
  ranks.forEach((r, noId) => {
    if (!gruposNivel.has(r)) {
      gruposNivel.set(r, []);
    }
    gruposNivel.get(r)?.push(noId);
  });

  const niveisOrdenados = Array.from(gruposNivel.keys()).sort((a, b) => a - b);
  const resultado: NoFluxogramaComplexo[] = [];

  niveisOrdenados.forEach(nivel => {
    const ids = gruposNivel.get(nivel) || [];
    const count = ids.length;
    const y = startY + nivel * (cardHeight + rankSep);

    // Largura total ocupada pelos blocos deste nível
    const totalLarguraNivel = count * cardWidth + (count - 1) * nodeSep;
    const inicioX = startX - totalLarguraNivel / 2;

    ids.forEach((noId, idx) => {
      const noOriginal = noMap.get(noId)!;
      let x = inicioX + idx * (cardWidth + nodeSep);

      // Se houver apenas 1 nó no nível intermediário e ele não for a raiz
      if (count === 1 && nivel > 0) {
        const pais = parentsMap.get(noId) || [];
        const filhos = childrenMap.get(noId) || [];
        
        // Verifica se há alguma aresta direta de um nível anterior para um nível posterior pulando este nó
        let temArestaBypass = false;
        nosOriginais.forEach(outro => {
          const outroRank = ranks.get(outro.id) ?? 0;
          if (outroRank < nivel) {
            (childrenMap.get(outro.id) || []).forEach(fId => {
              const fRank = ranks.get(fId) ?? 0;
              if (fRank > nivel && fId !== noId) {
                temArestaBypass = true;
              }
            });
          }
        });

        if (temArestaBypass) {
          // Desloca o nó intermediário para a esquerda para abrir corredor central limpo
          x = startX - cardWidth - nodeSep / 2;
        } else if (pais.length > 0) {
          const posicoesPais = resultado.filter(r => pais.includes(r.id)).map(r => r.posicaoX ?? startX);
          if (posicoesPais.length > 0) {
            const mediaX = posicoesPais.reduce((a, b) => a + b, 0) / posicoesPais.length;
            x = mediaX;
          }
        }
      }

      resultado.push({
        ...noOriginal,
        posicaoX: Math.round(x),
        posicaoY: Math.round(y),
      });
    });
  });

  return resultado;
}

// =========================================================================
// SISTEMA DE TEMAS VISUAIS DO FLUXOGRAMA (Dark, Light Confortável, Blueprint)
// =========================================================================
export type FlowchartThemeId = 'dark' | 'light' | 'blueprint';

export interface FlowchartThemeConfig {
  id: FlowchartThemeId;
  nome: string;
  nomeCurto: string;
  descricao: string;
  
  // Canvas
  canvasBg: string;
  canvasBorderClass: string;
  gridDotColor: string;
  gridSize: string;
  
  // Dica / Banner de Navegação
  bannerBg: string;
  bannerText: string;
  bannerBorder: string;

  // Cards normais / revelados
  cardBgClass: string;
  cardBorderClass: string;
  cardShadowClass: string;
  cardTitleClass: string;
  cardDescClass: string;
  cardMutedClass: string;
  cardDividerClass: string;

  // Cards ocultos (para estudo e adivinhação)
  hiddenCardBgClass: string;
  hiddenCardBorderClass: string;
  hiddenCardTitleClass: string;
  hiddenCardDescClass: string;
  hiddenCardButtonClass: string;

  // Rótulo da seta (Pílula SVG)
  arrowPillFill: string;
  arrowPillTextFill: string;

  // Gaveta inferior de detalhes (Drawer)
  drawerBgClass: string;
  drawerBorderClass: string;
  drawerTitleClass: string;
  drawerTextClass: string;

  // Toolbar
  toolbarBgClass: string;
  toolbarBorderClass: string;
  toolbarTextClass: string;
  toolbarButtonActive: string;
  toolbarButtonInactive: string;
}

export const FLOWCHART_THEMES: Record<FlowchartThemeId, FlowchartThemeConfig> = {
  dark: {
    id: 'dark',
    nome: 'Escuro (Obsidian)',
    nomeCurto: 'Escuro',
    descricao: 'Contraste imersivo em modo noturno profundo',
    canvasBg: '#090d16',
    canvasBorderClass: 'border-slate-800',
    gridDotColor: '#334155',
    gridSize: '24px 24px',
    bannerBg: 'bg-slate-900/90',
    bannerText: 'text-slate-300',
    bannerBorder: 'border-slate-800',
    cardBgClass: 'bg-slate-800/95',
    cardBorderClass: 'border-slate-700',
    cardShadowClass: 'shadow-lg shadow-black/40',
    cardTitleClass: 'text-white',
    cardDescClass: 'text-slate-300',
    cardMutedClass: 'text-slate-400',
    cardDividerClass: 'border-slate-700/70',
    hiddenCardBgClass: 'bg-slate-900/95',
    hiddenCardBorderClass: 'border-amber-500/70 hover:border-amber-400',
    hiddenCardTitleClass: 'text-amber-200',
    hiddenCardDescClass: 'text-slate-400',
    hiddenCardButtonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    arrowPillFill: '#0f172a',
    arrowPillTextFill: '#f8fafc',
    drawerBgClass: 'bg-slate-900',
    drawerBorderClass: 'border-slate-800',
    drawerTitleClass: 'text-white',
    drawerTextClass: 'text-slate-200',
    toolbarBgClass: 'bg-slate-900/90',
    toolbarBorderClass: 'border-slate-800',
    toolbarTextClass: 'text-slate-300',
    toolbarButtonActive: 'bg-slate-800 text-white font-bold shadow-sm',
    toolbarButtonInactive: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
  },
  light: {
    id: 'light',
    nome: 'Claro Confortável (Fundo Branco)',
    nomeCurto: 'Claro Suave',
    descricao: 'Fundo branco puro com grid delicado e cartões de alta legibilidade',
    canvasBg: '#ffffff',
    canvasBorderClass: 'border-slate-300 shadow-sm',
    gridDotColor: '#e2e8f0',
    gridSize: '24px 24px',
    bannerBg: 'bg-white/95',
    bannerText: 'text-slate-700',
    bannerBorder: 'border-slate-300 shadow-sm',
    cardBgClass: 'bg-white',
    cardBorderClass: 'border-slate-300',
    cardShadowClass: 'shadow-md shadow-slate-200/90',
    cardTitleClass: 'text-slate-900 font-extrabold',
    cardDescClass: 'text-slate-700',
    cardMutedClass: 'text-slate-500',
    cardDividerClass: 'border-slate-100',
    hiddenCardBgClass: 'bg-amber-50/95',
    hiddenCardBorderClass: 'border-amber-400 hover:border-amber-500',
    hiddenCardTitleClass: 'text-amber-900',
    hiddenCardDescClass: 'text-amber-800/80',
    hiddenCardButtonClass: 'bg-amber-500 hover:bg-amber-600 text-white font-bold',
    arrowPillFill: '#ffffff',
    arrowPillTextFill: '#0f172a',
    drawerBgClass: 'bg-white',
    drawerBorderClass: 'border-slate-200 shadow-md',
    drawerTitleClass: 'text-slate-900',
    drawerTextClass: 'text-slate-800',
    toolbarBgClass: 'bg-white/95',
    toolbarBorderClass: 'border-slate-200',
    toolbarTextClass: 'text-slate-700',
    toolbarButtonActive: 'bg-white text-slate-950 font-bold shadow-sm ring-1 ring-slate-200',
    toolbarButtonInactive: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70',
  },
  blueprint: {
    id: 'blueprint',
    nome: 'Blueprint Moderno (Midnight)',
    nomeCurto: 'Blueprint',
    descricao: 'Estilo técnico médico cirúrgico em azul meia-noite',
    canvasBg: '#091124',
    canvasBorderClass: 'border-blue-900/60',
    gridDotColor: '#1e3a8a',
    gridSize: '24px 24px',
    bannerBg: 'bg-[#0e1a38]/95',
    bannerText: 'text-blue-200',
    bannerBorder: 'border-blue-900/80',
    cardBgClass: 'bg-[#0d1b3e]/95',
    cardBorderClass: 'border-blue-800/60',
    cardShadowClass: 'shadow-lg shadow-blue-950/70',
    cardTitleClass: 'text-blue-50 font-extrabold',
    cardDescClass: 'text-blue-200/85',
    cardMutedClass: 'text-blue-300/60',
    cardDividerClass: 'border-blue-900/60',
    hiddenCardBgClass: 'bg-[#08122a]/95',
    hiddenCardBorderClass: 'border-cyan-500/70 hover:border-cyan-400',
    hiddenCardTitleClass: 'text-cyan-200',
    hiddenCardDescClass: 'text-blue-300/70',
    hiddenCardButtonClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold',
    arrowPillFill: '#08122a',
    arrowPillTextFill: '#e0f2fe',
    drawerBgClass: 'bg-[#0e1a38]',
    drawerBorderClass: 'border-blue-900/80',
    drawerTitleClass: 'text-blue-50',
    drawerTextClass: 'text-blue-200',
    toolbarBgClass: 'bg-[#0e1a38]/95',
    toolbarBorderClass: 'border-blue-900/80',
    toolbarTextClass: 'text-blue-200',
    toolbarButtonActive: 'bg-blue-900/90 text-cyan-200 font-bold shadow-sm',
    toolbarButtonInactive: 'text-blue-300/70 hover:text-blue-100 hover:bg-blue-900/40',
  },
};

export function getStoredFlowchartTheme(): FlowchartThemeId {
  try {
    const saved = localStorage.getItem('medcards_flowchart_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'blueprint') {
      return saved;
    }
  } catch (_) {}
  return 'light';
}

export function setStoredFlowchartTheme(theme: FlowchartThemeId) {
  try {
    localStorage.setItem('medcards_flowchart_theme', theme);
  } catch (_) {}
}

