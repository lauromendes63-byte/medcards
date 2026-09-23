import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Eye, EyeOff, Sparkles, Check, Trash2, HelpCircle } from 'lucide-react';

interface VisualClozeEditorProps {
  value?: string;
  texto?: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}

interface ClozeSegment {
  id: string;
  texto: string;
  isCloze: boolean;
  numero?: number;
}

export const VisualClozeEditor: React.FC<VisualClozeEditorProps> = ({
  value,
  texto,
  onChange,
  placeholder = 'Ex: No infarto com supra de ST, administrar AAS e transferir para cateterismo em até 120 minutos.',
}) => {
  const textValue = value ?? texto ?? '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selecaoAtual, setSelecaoAtual] = useState<{ start: number; end: number; text: string } | null>(null);
  const [modoPreview, setModoPreview] = useState(false);
  const [notificacaoRapida, setNotificacaoRapida] = useState<string | null>(null);

  // Parse do texto memoizado para extrair segmentos e oclusões ativas com alta performance
  const segments = React.useMemo((): ClozeSegment[] => {
    if (!textValue) return [];
    const regex = /\{\{c(\d+)::([^}]+)\}\}/g;
    const list: ClozeSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(textValue)) !== null) {
      if (match.index > lastIndex) {
        list.push({
          id: `text-${lastIndex}`,
          texto: textValue.substring(lastIndex, match.index),
          isCloze: false,
        });
      }

      list.push({
        id: `cloze-${match.index}`,
        texto: match[2],
        isCloze: true,
        numero: parseInt(match[1], 10),
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < textValue.length) {
      list.push({
        id: `text-${lastIndex}`,
        texto: textValue.substring(lastIndex),
        isCloze: false,
      });
    }

    return list;
  }, [textValue]);

  const oclusoes = React.useMemo(() => segments.filter(s => s.isCloze), [segments]);

  // Função para detectar seleção precisa no textarea com debounce leve
  const selectionTimeoutRef = useRef<number | null>(null);

  const atualizarSelecao = useCallback(() => {
    if (selectionTimeoutRef.current) {
      window.clearTimeout(selectionTimeoutRef.current);
    }
    selectionTimeoutRef.current = window.setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;

      let start = el.selectionStart;
      let end = el.selectionEnd;

      if (start !== end) {
        while (start < end && /\s/.test(el.value[start])) {
          start++;
        }
        while (end > start && /\s/.test(el.value[end - 1])) {
          end--;
        }

        const selectedText = el.value.substring(start, end).trim();
        if (selectedText.length > 0) {
          setSelecaoAtual({ start, end, text: selectedText });
          return;
        }
      }
      setSelecaoAtual(null);
    }, 50);
  }, []);

  // Monitorar seleção de texto por eventos e pelo document selectionchange
  useEffect(() => {
    const handleDocSelectionChange = () => {
      if (document.activeElement === textareaRef.current) {
        atualizarSelecao();
      }
    };

    document.addEventListener('selectionchange', handleDocSelectionChange);
    return () => {
      if (selectionTimeoutRef.current) {
        window.clearTimeout(selectionTimeoutRef.current);
      }
      document.removeEventListener('selectionchange', handleDocSelectionChange);
    };
  }, [atualizarSelecao]);

  // Função principal para ocluir a seleção
  const handleOcluir = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const el = textareaRef.current;
    if (!el) return;

    let start = el.selectionStart;
    let end = el.selectionEnd;
    let textoSelecionado = '';

    // Se temos uma seleção ativa salva
    if (start !== end) {
      // Aparar espaços
      while (start < end && /\s/.test(el.value[start])) start++;
      while (end > start && /\s/.test(el.value[end - 1])) end--;
      textoSelecionado = el.value.substring(start, end);
    } else if (selecaoAtual && selecaoAtual.text) {
      start = selecaoAtual.start;
      end = selecaoAtual.end;
      textoSelecionado = selecaoAtual.text;
    } else {
      // SE NADA ESTÁ SELECIONADO: Inteligência para Mobile!
      // Se o cursor estiver parado em cima de uma palavra, expande para a palavra inteira
      const cursorPos = start;
      const valor = el.value;
      if (cursorPos >= 0 && valor.length > 0) {
        // Encontra início da palavra
        let pStart = cursorPos;
        while (pStart > 0 && /[\wÀ-ÿ]/.test(valor[pStart - 1])) {
          pStart--;
        }
        // Encontra fim da palavra
        let pEnd = cursorPos;
        while (pEnd < valor.length && /[\wÀ-ÿ]/.test(valor[pEnd])) {
          pEnd++;
        }

        if (pEnd > pStart) {
          start = pStart;
          end = pEnd;
          textoSelecionado = valor.substring(start, end).trim();
        }
      }
    }

    if (!textoSelecionado || textoSelecionado.trim().length === 0) {
      el.focus();
      setNotificacaoRapida('Selecione ou clique em uma palavra do texto para ocluir.');
      setTimeout(() => setNotificacaoRapida(null), 3000);
      return;
    }

    // Calcula o próximo número de oclusão
    const numerosExistentes = oclusoes.map(o => o.numero || 1);
    const nextNum = (numerosExistentes.length > 0 ? Math.max(...numerosExistentes) : 0) + 1;
    const novoToken = `{{c${nextNum}::${textoSelecionado}}}`;

    const textoCompleto = textValue;
    const novoTexto = textoCompleto.substring(0, start) + novoToken + textoCompleto.substring(end);
    
    onChange(novoTexto);
    setSelecaoAtual(null);

    // Mensagem amigável de feedback
    setNotificacaoRapida(`Palavra "${textoSelecionado}" ocluída como [c${nextNum}]`);
    setTimeout(() => setNotificacaoRapida(null), 2500);

    // Reposiciona o cursor após o token no textarea
    setTimeout(() => {
      if (el) {
        el.focus();
        const novaPos = start + novoToken.length;
        el.setSelectionRange(novaPos, novaPos);
      }
    }, 40);
  }, [textValue, selecaoAtual, oclusoes, onChange]);

  // Atalho de teclado Ctrl+Shift+C ou Cmd+Shift+C no textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      handleOcluir();
    }
  };

  // Remover uma oclusão específica pelo chip
  const handleRemoverOclusao = (numero: number, textoOculto: string) => {
    const regex = new RegExp(`\\{\\{c${numero}::${textoOculto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\}\\}`, 'g');
    const novoTexto = textValue.replace(regex, textoOculto);
    onChange(novoTexto);
  };

  // Limpar todas as oclusões mantendo o texto puro
  const handleLimparTodasOclusoes = () => {
    const textoLimpo = textValue.replace(/\{\{c\d+::([^\}]+)\}\}/g, '$1');
    onChange(textoLimpo);
  };

  return (
    <div className="space-y-2.5">
      {/* Barra de Ferramentas */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-amber-50/90 p-2 sm:p-2.5 rounded-xl border border-amber-200">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão de Ocluir Seleção com proteção contra perda de foco */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Impede o textarea de perder o foco!
              handleOcluir();
            }}
            onTouchStart={(e) => {
              e.preventDefault(); // Impede perda de seleção no mobile!
              handleOcluir();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
            title="Selecione um termo ou clique em uma palavra para ocluir (Atalho: Ctrl+Shift+C)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>
              {selecaoAtual 
                ? `Ocluir "${selecaoAtual.text.slice(0, 15)}${selecaoAtual.text.length > 15 ? '…' : ''}"` 
                : 'Ocluir Termo Selecionado'}
            </span>
          </button>

          {/* Alternador de Prévia */}
          <button
            type="button"
            onClick={() => setModoPreview(!modoPreview)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              modoPreview 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {modoPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{modoPreview ? 'Editar Texto' : 'Ver Como Fica'}</span>
          </button>
        </div>

        {oclusoes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
              {oclusoes.length} {oclusoes.length === 1 ? 'lacuna ativa' : 'lacunas ativas'}
            </span>
            <button
              type="button"
              onClick={handleLimparTodasOclusoes}
              className="text-[10.5px] text-amber-800 hover:text-rose-600 underline font-medium cursor-pointer"
            >
              Remover todas
            </button>
          </div>
        )}
      </div>

      {/* Notificação rápida de ação */}
      {notificacaoRapida && (
        <div className="p-2 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{notificacaoRapida}</span>
          <button 
            type="button" 
            onClick={() => setNotificacaoRapida(null)}
            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor Principal ou Modo Preview */}
      {!modoPreview ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={4}
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            onSelect={atualizarSelecao}
            onKeyUp={atualizarSelecao}
            onMouseUp={atualizarSelecao}
            onTouchEnd={atualizarSelecao}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3.5 py-3 rounded-xl bg-white border border-amber-200 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-sans leading-relaxed resize-y min-h-[110px]"
          />

          {/* Dica rápida abaixo do textarea para orientar o estudante */}
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-1 px-1">
            <span>
              💡 Selecione o texto e clique em <strong>Ocluir</strong>, ou dê duplo clique em uma palavra.
            </span>
            <span className="hidden sm:inline">
              Atalho: <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border text-[10px] font-mono">Ctrl+Shift+C</kbd>
            </span>
          </div>
        </div>
      ) : (
        /* Preview Visual Limpo (como o estudante verá) */
        <div className="p-4 rounded-xl bg-white border border-amber-200 min-h-[110px] text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
          {segments.length === 0 ? (
            <span className="text-slate-400 italic">Nenhum texto preenchido ainda.</span>
          ) : (
            segments.map((seg) => {
              if (seg.isCloze) {
                return (
                  <span
                    key={seg.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                  >
                    <span className="text-[10px] text-amber-600 font-mono">[{seg.numero}]</span>
                    <span>{seg.texto}</span>
                  </span>
                );
              }
              return <span key={seg.id}>{seg.texto}</span>;
            })
          )}
        </div>
      )}

      {/* Lista de Chips de Oclusão Ativos */}
      {oclusoes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Lacunas Criadas (toque no ✕ para desfazer):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {oclusoes.map((o) => (
              <span
                key={o.id}
                className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-semibold shadow-2xs"
              >
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9.5px] font-black flex items-center justify-center">
                  {o.numero}
                </span>
                <span className="max-w-[180px] truncate">{o.texto}</span>
                <button
                  type="button"
                  onClick={() => handleRemoverOclusao(o.numero!, o.texto)}
                  className="p-0.5 hover:bg-amber-200 text-amber-800 hover:text-rose-700 rounded transition-colors cursor-pointer ml-0.5"
                  title="Remover esta oclusão"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
