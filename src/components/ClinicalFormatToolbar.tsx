import React from 'react';
import { Bold, Highlighter, List, AlertTriangle, Star } from 'lucide-react';

interface ClinicalFormatToolbarProps {
  targetInputId: string;
  valorAtual: string;
  onValorChange: (novoValor: string) => void;
  mostrarTopico?: boolean;
  mostrarOuroAlerta?: boolean;
  compacto?: boolean;
  className?: string;
}

export const ClinicalFormatToolbar: React.FC<ClinicalFormatToolbarProps> = ({
  targetInputId,
  valorAtual,
  onValorChange,
  mostrarTopico = true,
  mostrarOuroAlerta = true,
  compacto = false,
  className = '',
}) => {
  const aplicarFormatacao = (
    abertura: string,
    fechamento: string,
    padraoTexto: string = 'termo'
  ) => {
    const el = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) {
      const inicio = el.selectionStart ?? valorAtual.length;
      const fim = el.selectionEnd ?? valorAtual.length;
      const textoSelecionado = valorAtual.substring(inicio, fim) || padraoTexto;
      const novoTexto =
        valorAtual.substring(0, inicio) +
        abertura +
        textoSelecionado +
        fechamento +
        valorAtual.substring(fim);

      onValorChange(novoTexto);

      setTimeout(() => {
        el.focus();
        const novoInicio = inicio + abertura.length;
        const novoFim = novoInicio + textoSelecionado.length;
        el.setSelectionRange(novoInicio, novoFim);
      }, 15);
    } else {
      const prefixo = valorAtual ? (valorAtual.endsWith(' ') ? '' : ' ') : '';
      onValorChange(valorAtual + prefixo + abertura + padraoTexto + fechamento);
    }
  };

  const inserirLinhaEspecial = (marcador: string) => {
    const el = document.getElementById(targetInputId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) {
      const inicio = el.selectionStart ?? valorAtual.length;
      const textoAntes = valorAtual.substring(0, inicio);
      const textoDepois = valorAtual.substring(inicio);
      const prefixo = textoAntes.length === 0 || textoAntes.endsWith('\n') ? marcador : `\n${marcador}`;
      const novoTexto = textoAntes + prefixo + textoDepois;

      onValorChange(novoTexto);

      setTimeout(() => {
        el.focus();
        const cursor = inicio + prefixo.length;
        el.setSelectionRange(cursor, cursor);
      }, 15);
    } else {
      const prefixo = valorAtual ? `\n${marcador}` : marcador;
      onValorChange(valorAtual + prefixo);
    }
  };

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 p-1 bg-slate-50/95 rounded-xl border border-slate-200/90 shadow-3xs ${className}`}
    >
      {/* 1. Negrito */}
      <button
        type="button"
        onClick={() => aplicarFormatacao('**', '**', 'termo importante')}
        className="h-6 sm:h-7 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-black text-slate-900 shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all select-none"
        title="Inserir Negrito (**termo**)"
      >
        <span className="font-black text-xs leading-none">B</span>
        {!compacto && <span className="font-bold text-[10.5px]">Negrito</span>}
      </button>

      {/* 2. Grifado Amarelo */}
      <button
        type="button"
        onClick={() => aplicarFormatacao('==', '==', 'dado crítico')}
        className="h-6 sm:h-7 px-2 rounded-lg bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 text-[11px] font-black text-yellow-950 shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all select-none"
        title="Grifar Marca-Texto Amarelo (==termo==)"
      >
        <span className="text-xs leading-none">🖍️</span>
        {!compacto && <span className="font-extrabold text-[10.5px]">Grifado</span>}
      </button>

      {/* 3. Destaque Azul */}
      <button
        type="button"
        onClick={() => aplicarFormatacao('[azul]', '[/azul]', 'droga 1ª escolha')}
        className="h-6 sm:h-7 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold text-blue-900 shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all select-none"
        title="Destaque Azul ([azul]conduta[/azul])"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0 shadow-3xs"></span>
        {!compacto && <span className="font-bold text-[10.5px]">Azul</span>}
      </button>

      {/* 4. Alerta Vermelho */}
      <button
        type="button"
        onClick={() => aplicarFormatacao('[vermelho]', '[/vermelho]', 'contraindicação')}
        className="h-6 sm:h-7 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold text-rose-900 shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all select-none"
        title="Alerta Vermelho ([vermelho]alerta[/vermelho])"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shrink-0 shadow-3xs"></span>
        {!compacto && <span className="font-bold text-[10.5px]">Vermelho</span>}
      </button>

      {/* 5. Tópico / Lista */}
      {mostrarTopico && (
        <button
          type="button"
          onClick={() => inserirLinhaEspecial('• ')}
          className="h-6 sm:h-7 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-bold text-slate-800 shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all select-none"
          title="Inserir Marcador de Tópico (•)"
        >
          <span className="font-black text-blue-600 text-sm leading-none">•</span>
          {!compacto && <span className="text-[10.5px] font-bold">Tópico</span>}
        </button>
      )}

      {/* 6. Ponto de Ouro */}
      {mostrarOuroAlerta && (
        <button
          type="button"
          onClick={() => inserirLinhaEspecial('⭐ Regra de Ouro: ')}
          className="h-6 sm:h-7 px-1.5 sm:px-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10.5px] font-bold text-amber-900 shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all select-none"
          title="Inserir Ponto de Ouro / Dica (⭐)"
        >
          <span className="text-xs leading-none">⭐</span>
          {!compacto && <span className="font-bold text-[10.5px]">Ouro</span>}
        </button>
      )}

      {/* 7. Alerta de Risco */}
      {mostrarOuroAlerta && (
        <button
          type="button"
          onClick={() => inserirLinhaEspecial('⚠️ Alerta: ')}
          className="h-6 sm:h-7 px-1.5 sm:px-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-[10.5px] font-bold text-red-900 shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all select-none"
          title="Inserir Alerta / Contraindicação (⚠️)"
        >
          <span className="text-xs leading-none">⚠️</span>
          {!compacto && <span className="font-bold text-[10.5px]">Alerta</span>}
        </button>
      )}
    </div>
  );
};
