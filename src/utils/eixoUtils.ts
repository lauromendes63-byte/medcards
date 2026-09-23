import { CardClinico, EixoClinico } from '../types';
import { StorageService } from '../services/storage';

export interface DadosEixoVisual {
  icone: string;
  bgTag: string;
  textTag: string;
  borderTag: string;
  accent: string;
  nomeEixo: string;
  especialidade: string;
}

const ESPECIALIDADE_MAP: Record<string, { icone: string; bgTag: string; textTag: string; borderTag: string; accent: string }> = {
  'Ortopedia e Traumatologia': { icone: '🦴', bgTag: 'bg-amber-100', textTag: 'text-amber-950', borderTag: 'border-amber-300', accent: '#D97706' },
  'Ortopedia': { icone: '🦴', bgTag: 'bg-amber-100', textTag: 'text-amber-950', borderTag: 'border-amber-300', accent: '#D97706' },
  'Cardiologia': { icone: '🫀', bgTag: 'bg-rose-100', textTag: 'text-rose-950', borderTag: 'border-rose-300', accent: '#E11D48' },
  'Neurologia': { icone: '🧠', bgTag: 'bg-purple-100', textTag: 'text-purple-950', borderTag: 'border-purple-300', accent: '#9333EA' },
  'Pneumologia': { icone: '🫁', bgTag: 'bg-cyan-100', textTag: 'text-cyan-950', borderTag: 'border-cyan-300', accent: '#0891B2' },
  'Ginecologia e Obstetrícia': { icone: '🤰', bgTag: 'bg-fuchsia-100', textTag: 'text-fuchsia-950', borderTag: 'border-fuchsia-300', accent: '#C026D3' },
  'Pediatria': { icone: '👶', bgTag: 'bg-teal-100', textTag: 'text-teal-950', borderTag: 'border-teal-300', accent: '#0D9488' },
  'Cirurgia Geral': { icone: '🔬', bgTag: 'bg-emerald-100', textTag: 'text-emerald-950', borderTag: 'border-emerald-300', accent: '#059669' },
  'Medicina de Emergência': { icone: '⚡', bgTag: 'bg-orange-100', textTag: 'text-orange-950', borderTag: 'border-orange-300', accent: '#EA580C' },
  'Terapia Intensiva': { icone: '🚨', bgTag: 'bg-rose-100', textTag: 'text-rose-950', borderTag: 'border-rose-300', accent: '#E11D48' },
  'Infectologia': { icone: '🦠', bgTag: 'bg-lime-100', textTag: 'text-lime-950', borderTag: 'border-lime-300', accent: '#65A30D' },
  'Hematologia': { icone: '🩸', bgTag: 'bg-red-100', textTag: 'text-red-950', borderTag: 'border-red-300', accent: '#DC2626' },
  'Dermatologia': { icone: '🧴', bgTag: 'bg-amber-100', textTag: 'text-amber-950', borderTag: 'border-amber-300', accent: '#D97706' },
  'Oftalmologia': { icone: '👁️', bgTag: 'bg-sky-100', textTag: 'text-sky-950', borderTag: 'border-sky-300', accent: '#0284C7' },
  'Psiquiatria': { icone: '🧘', bgTag: 'bg-indigo-100', textTag: 'text-indigo-950', borderTag: 'border-indigo-300', accent: '#4F46E5' },
  'Nefrologia': { icone: '💧', bgTag: 'bg-blue-100', textTag: 'text-blue-950', borderTag: 'border-blue-300', accent: '#2563EB' },
  'Endocrinologia': { icone: '⚖️', bgTag: 'bg-violet-100', textTag: 'text-violet-950', borderTag: 'border-violet-300', accent: '#7C3AED' },
  'Gastroenterologia': { icone: '🧪', bgTag: 'bg-amber-100', textTag: 'text-amber-950', borderTag: 'border-amber-300', accent: '#D97706' },
  'Reumatologia': { icone: '🧬', bgTag: 'bg-purple-100', textTag: 'text-purple-950', borderTag: 'border-purple-300', accent: '#9333EA' },
  'Urologia': { icone: '🚹', bgTag: 'bg-blue-100', textTag: 'text-blue-950', borderTag: 'border-blue-300', accent: '#2563EB' },
  'Otorrinolaringologia': { icone: '👂', bgTag: 'bg-teal-100', textTag: 'text-teal-950', borderTag: 'border-teal-300', accent: '#0D9488' },
  'Anestesiologia': { icone: '💉', bgTag: 'bg-emerald-100', textTag: 'text-emerald-950', borderTag: 'border-emerald-300', accent: '#059669' },
  'Radiologia': { icone: '🩻', bgTag: 'bg-slate-100', textTag: 'text-slate-950', borderTag: 'border-slate-300', accent: '#475569' },
  'Oncologia': { icone: '🎗️', bgTag: 'bg-purple-100', textTag: 'text-purple-950', borderTag: 'border-purple-300', accent: '#9333EA' },
  'Geriatria': { icone: '🕰️', bgTag: 'bg-amber-100', textTag: 'text-amber-950', borderTag: 'border-amber-300', accent: '#D97706' },
  'Medicina Preventiva e Social': { icone: '🛡️', bgTag: 'bg-teal-100', textTag: 'text-teal-950', borderTag: 'border-teal-300', accent: '#0D9488' },
  'Medicina de Família e Comunidade': { icone: '🏡', bgTag: 'bg-teal-100', textTag: 'text-teal-950', borderTag: 'border-teal-300', accent: '#0D9488' },
  'Clínica Médica': { icone: '🩺', bgTag: 'bg-blue-100', textTag: 'text-blue-950', borderTag: 'border-blue-300', accent: '#2563EB' },
  'Geral / Outros': { icone: '🩺', bgTag: 'bg-slate-100', textTag: 'text-slate-950', borderTag: 'border-slate-300', accent: '#475569' },
};

const LUCIDE_NAME_TO_EMOJI: Record<string, string> = {
  Brain: '🧠',
  Heart: '🫀',
  Activity: '📈',
  Stethoscope: '🩺',
  ShieldCheck: '🛡️',
  Pill: '💊',
  FolderPlus: '📁',
  Syringe: '💉',
};

export function normalizarEmojiEixo(icone?: string): string {
  if (!icone) return '🩺';
  if (LUCIDE_NAME_TO_EMOJI[icone]) return LUCIDE_NAME_TO_EMOJI[icone];
  return icone;
}

export function getDadosEixoParaCard(
  card?: Partial<CardClinico> | null,
  eixosDisponiveis?: EixoClinico[]
): DadosEixoVisual {
  const eixos = eixosDisponiveis || StorageService.getEixos();
  const esp = card?.especialidade || 'Clínica Médica';

  // 1. Tentar encontrar pelo eixoId
  let eixoEncontrado: EixoClinico | undefined;
  if (card?.eixoId) {
    eixoEncontrado = eixos.find(e => e.id === card.eixoId);
  }

  // 2. Se não achou, tentar encontrar pela especialidade
  if (!eixoEncontrado && card?.especialidade) {
    eixoEncontrado = eixos.find(e => e.especialidade === card.especialidade);
  }

  if (eixoEncontrado) {
    return {
      icone: normalizarEmojiEixo(eixoEncontrado.icone),
      bgTag: eixoEncontrado.corTema?.bgTag || 'bg-amber-100',
      textTag: eixoEncontrado.corTema?.textTag || 'text-amber-950',
      borderTag: eixoEncontrado.corTema?.borderTag || 'border-amber-300',
      accent: eixoEncontrado.corTema?.accent || '#D97706',
      nomeEixo: eixoEncontrado.titulo,
      especialidade: eixoEncontrado.especialidade || esp,
    };
  }

  // 3. Fallback pela tabela de especialidades
  const fallback = ESPECIALIDADE_MAP[esp] || ESPECIALIDADE_MAP['Clínica Médica'];
  return {
    icone: fallback.icone,
    bgTag: fallback.bgTag,
    textTag: fallback.textTag,
    borderTag: fallback.borderTag,
    accent: fallback.accent,
    nomeEixo: esp,
    especialidade: esp,
  };
}
