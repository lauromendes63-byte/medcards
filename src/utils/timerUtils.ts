import { CardClinico, ConfiguracaoTimers, TimersRodada, TopicoClinico } from '../types';

export const DEFAULT_CONFIG_TIMERS: ConfiguracaoTimers = {
  rodada1: {
    erreiMinutos: 2,
    dificilMinutos: 5,
    bomMinutos: 15,
    facilMinutos: 30,
  },
  rodada2: {
    erreiMinutos: 3,
    dificilMinutos: 15,
    bomMinutos: 45,
    facilMinutos: 90,
  },
  rodada3Plus: {
    erreiMinutos: 5,
    dificilMinutos: 60,
    bomMinutos: 180,
    facilMinutos: 360,
  },
};

/**
 * Formata minutos em formato amigável e legível para botões médicos
 * Exemplos: 2 -> "2m", 60 -> "1h", 90 -> "1h 30m", 180 -> "3h"
 */
export function formatarTempoMinutos(minutos: number): string {
  if (minutos <= 0) return 'Imediato';
  if (minutos < 60) return `${minutos}m`;
  
  const horas = Math.floor(minutos / 60);
  const restoMinutos = minutos % 60;
  
  if (restoMinutos === 0) {
    return `${horas}h`;
  }
  return `${horas}h ${restoMinutos}m`;
}

/**
 * Retorna os timers ativos e a identificação de rodada para um dado card
 */
export function obterInfoRodadaCard(
  card: CardClinico,
  topico?: TopicoClinico,
  configGlobal?: ConfiguracaoTimers
): {
  rodada: number;
  nomeRodada: string;
  timers: TimersRodada;
  ehCustomizadoTopico: boolean;
} {
  const rodada = Math.max(1, card.rodadaAtual || 1);
  const cfg = topico?.customTimers || configGlobal || DEFAULT_CONFIG_TIMERS;
  const ehCustomizadoTopico = !!topico?.customTimers;

  let timers: TimersRodada;
  let nomeRodada: string;

  if (rodada === 1) {
    timers = cfg.rodada1;
    nomeRodada = 'Rodada 1 (Intensivo)';
  } else if (rodada === 2) {
    timers = cfg.rodada2;
    nomeRodada = 'Rodada 2 (Consolidação)';
  } else {
    timers = cfg.rodada3Plus;
    nomeRodada = `Rodada ${rodada}+ (Fixação)`;
  }

  return {
    rodada,
    nomeRodada,
    timers,
    ehCustomizadoTopico,
  };
}

/**
 * Verifica se um flashcard clínico está pendente para estudo/revisão agora.
 * Um card é considerado pendente quando:
 * 1. Seu status for 'pendente' ou 'atrasado', OU
 * 2. Não possui data de próxima revisão definida, OU
 * 3. A data de próxima revisão for menor ou igual ao momento atual (agora).
 */
export function isCardPendente(card: CardClinico, agora: Date = new Date()): boolean {
  if (card.status === 'pendente' || card.status === 'atrasado') {
    return true;
  }
  if (!card.proximaRevisao) {
    return true;
  }
  const prox = new Date(card.proximaRevisao);
  const time = prox.getTime();
  if (isNaN(time)) {
    return true;
  }
  return time <= agora.getTime();
}
