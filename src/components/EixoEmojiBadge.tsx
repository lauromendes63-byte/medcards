import React from 'react';
import { CardClinico, EixoClinico } from '../types';
import { getDadosEixoParaCard } from '../utils/eixoUtils';

interface EixoEmojiBadgeProps {
  card?: Partial<CardClinico> | null;
  eixos?: EixoClinico[];
  especialidade?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  mostrarNomeTooltip?: boolean;
}

/**
 * Quadrado elegante com o Emoji do Eixo e sua cor temática personalizada.
 * Substitui o nome longo por extenso no cabeçalho dos flashcards,
 * garantindo layout harmonioso e sem truncamentos em telas móveis.
 */
export const EixoEmojiBadge: React.FC<EixoEmojiBadgeProps> = ({
  card,
  eixos,
  especialidade,
  size = 'md',
  className = '',
  mostrarNomeTooltip = true,
}) => {
  const dados = getDadosEixoParaCard(
    card || (especialidade ? { especialidade } : undefined),
    eixos
  );

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs rounded-lg',
    md: 'w-7 h-7 sm:w-8 sm:h-8 text-sm sm:text-base rounded-xl',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg rounded-2xl',
  }[size];

  const tooltipText = mostrarNomeTooltip
    ? `${dados.nomeEixo}${dados.especialidade && dados.especialidade !== dados.nomeEixo ? ` • ${dados.especialidade}` : ''}`
    : undefined;

  return (
    <div
      title={tooltipText}
      className={`inline-flex items-center justify-center border shadow-3xs shrink-0 select-none transition-transform active:scale-95 cursor-default ${dados.bgTag} ${dados.borderTag} ${sizeClasses} ${className}`}
    >
      <span role="img" aria-label={dados.nomeEixo} className="leading-none drop-shadow-2xs">
        {dados.icone}
      </span>
    </div>
  );
};
