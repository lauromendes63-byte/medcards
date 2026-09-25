import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Image as ImageIcon,
  Square,
  PenTool,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { MascaraImagem } from '../types';

interface ImageOcclusionEditorProps {
  imagemUrl?: string;
  imagemUrlInicial?: string;
  onImagemUrlChange?: (url: string) => void;
  onImagemChange?: (url: string) => void;
  mascaras?: MascaraImagem[];
  mascarasIniciais?: MascaraImagem[];
  onMascarasChange?: (mascaras: MascaraImagem[]) => void;
  onSave?: (imagemUrl: string, mascaras: MascaraImagem[]) => void;
}

// Presets médicos úteis para teste rápido ou quando o usuário não tiver imagem em mãos
const PRESET_IMAGES = [
  {
    nome: 'Polígono de Willis (Neurologia)',
    url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
    mascarasPadrao: [
      { id: 'm1', numero: 1, tipoForma: 'retangulo' as const, x: 38, y: 22, largura: 24, altura: 14, textoOculto: 'Artéria Comunicante Anterior', dica: 'Vascular' },
      { id: 'm2', numero: 2, tipoForma: 'retangulo' as const, x: 22, y: 42, largura: 22, altura: 15, textoOculto: 'Artéria Cerebral Média (ACM)', dica: 'Ramo D' },
      { id: 'm3', numero: 3, tipoForma: 'retangulo' as const, x: 42, y: 70, largura: 18, altura: 16, textoOculto: 'Artéria Basilar', dica: 'Tronco' },
    ],
  },
  {
    nome: 'Triângulo de Calot (Cirurgia)',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    mascarasPadrao: [
      { id: 'm1', numero: 1, tipoForma: 'retangulo' as const, x: 25, y: 30, largura: 26, altura: 18, textoOculto: 'Ducto Cístico', dica: 'Limite inferior' },
      { id: 'm2', numero: 2, tipoForma: 'retangulo' as const, x: 55, y: 25, largura: 25, altura: 18, textoOculto: 'Ducto Hepático Comum', dica: 'Limite medial' },
      { id: 'm3', numero: 3, tipoForma: 'retangulo' as const, x: 40, y: 60, largura: 28, altura: 16, textoOculto: 'Artéria Cística', dica: 'Conteúdo principal' },
    ],
  },
  {
    nome: 'Eletrocardiograma - Parede Anterior (Cardiologia)',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    mascarasPadrao: [
      { id: 'm1', numero: 1, tipoForma: 'retangulo' as const, x: 15, y: 25, largura: 30, altura: 22, textoOculto: 'Supra de ST em V1 a V4', dica: 'Artéria Descendente Anterior' },
      { id: 'm2', numero: 2, tipoForma: 'retangulo' as const, x: 55, y: 25, largura: 32, altura: 22, textoOculto: 'Imagem em espelho em DII, DIII, aVF', dica: 'Parede inferior' },
    ],
  },
];

export const ImageOcclusionEditor: React.FC<ImageOcclusionEditorProps> = ({
  imagemUrl: propImagemUrl,
  imagemUrlInicial,
  onImagemUrlChange,
  onImagemChange,
  mascaras: propMascaras,
  mascarasIniciais,
  onMascarasChange,
  onSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const imagemUrl = propImagemUrl ?? imagemUrlInicial ?? '';
  const listaMascaras = Array.isArray(propMascaras) 
    ? propMascaras 
    : (Array.isArray(mascarasIniciais) ? mascarasIniciais : []);

  const notifyUrlChange = (url: string) => {
    if (onImagemUrlChange) onImagemUrlChange(url);
    if (onImagemChange) onImagemChange(url);
    if (onSave) onSave(url, listaMascaras);
  };

  const notifyMascarasChange = (masks: MascaraImagem[]) => {
    if (onMascarasChange) onMascarasChange(masks);
    if (onSave) onSave(imagemUrl, masks);
  };

  const [mascaraSelecionadaId, setMascaraSelecionadaId] = useState<string | null>(
    listaMascaras[0]?.id || null
  );

  // Ferramenta de desenho: Retângulo ou Caneta / Forma Livre
  const [modoDesenho, setModoDesenho] = useState<'retangulo' | 'livre'>('retangulo');
  const [desenhando, setDesenhando] = useState(false);
  const [inicioDesenho, setInicioDesenho] = useState<{ x: number; y: number } | null>(null);
  const [mascaraTemporaria, setMascaraTemporaria] = useState<{ x: number; y: number; largura: number; altura: number } | null>(null);
  const [pontosLivre, setPontosLivre] = useState<{ x: number; y: number }[]>([]);

  // Estados de manipulação interativa (arrastar e redimensionar)
  const [arrastandoMascaraId, setArrastandoMascaraId] = useState<string | null>(null);
  const [redimensionandoMascaraId, setRedimensionandoMascaraId] = useState<string | null>(null);
  const dragStartRef = useRef<{ 
    clientX: number; 
    clientY: number; 
    startX: number; 
    startY: number; 
    startW: number; 
    startH: number;
    initialPoints?: { x: number; y: number }[];
  } | null>(null);
  const hasDraggedRef = useRef(false);

  const [modoPreview, setModoPreview] = useState(false);
  const [erroCarregamentoImagem, setErroCarregamentoImagem] = useState(false);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [mostrarUrlInput, setMostrarUrlInput] = useState(false);
  const [mostrarCalibracaoBloco, setMostrarCalibracaoBloco] = useState(false);

  // Processar arquivo de imagem (FileReader)
  const processarArquivoImagem = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setErroCarregamentoImagem(false);
        notifyUrlChange(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload local de imagem do dispositivo
  const handleUploadArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processarArquivoImagem(file);
    if (e.target) e.target.value = '';
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastandoArquivo(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastandoArquivo(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastandoArquivo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processarArquivoImagem(file);
    }
  };

  // Suporte a Colar da Área de Transferência (Ctrl+V / Cmd+V)
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (imagemUrl) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processarArquivoImagem(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [imagemUrl]);

  // Coordenadas relativas rigorosamente ancoradas aos pixels da imagem (0 a 100%)
  const getCoordsRelativas = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / height) * 100));
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  };

  // Início de desenho no fundo da imagem
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (modoPreview || !imagemUrl) return;
    if (arrastandoMascaraId || redimensionandoMascaraId) return;

    // Se tocou em máscara existente ou no manipulador de redimensionamento, não inicia novo desenho
    if ((e.target as HTMLElement).closest('.mascara-existente') || (e.target as HTMLElement).closest('.resize-handle')) {
      return;
    }

    e.preventDefault();
    try {
      activePointerIdRef.current = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}

    const coords = getCoordsRelativas(e.clientX, e.clientY);
    setDesenhando(true);

    if (modoDesenho === 'retangulo') {
      setInicioDesenho(coords);
      setMascaraTemporaria({ x: coords.x, y: coords.y, largura: 0, altura: 0 });
    } else {
      setPontosLivre([coords]);
    }
  };

  // Movimento de Ponteiro (Desenho, Arraste ou Redimensionamento)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Caso 1: Arrastando posição da máscara existente
    if (arrastandoMascaraId && dragStartRef.current) {
      hasDraggedRef.current = true;
      const deltaX = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;

      const mask = listaMascaras.find(m => m.id === arrastandoMascaraId);
      if (!mask) return;

      const newX = Math.max(0, Math.min(100 - mask.largura, Math.round(dragStartRef.current.startX + deltaX)));
      const newY = Math.max(0, Math.min(100 - mask.altura, Math.round(dragStartRef.current.startY + deltaY)));

      if (mask.tipoForma === 'livre' && dragStartRef.current.initialPoints) {
        const shiftX = newX - dragStartRef.current.startX;
        const shiftY = newY - dragStartRef.current.startY;
        const novosPontos = dragStartRef.current.initialPoints.map(p => ({
          x: Math.max(0, Math.min(100, Math.round((p.x + shiftX) * 10) / 10)),
          y: Math.max(0, Math.min(100, Math.round((p.y + shiftY) * 10) / 10)),
        }));
        handleAtualizarMascara(mask.id, { x: newX, y: newY, pontos: novosPontos });
      } else {
        handleAtualizarMascara(mask.id, { x: newX, y: newY });
      }
      return;
    }

    // Caso 2: Redimensionando largura e altura da máscara existente
    if (redimensionandoMascaraId && dragStartRef.current) {
      hasDraggedRef.current = true;
      const deltaX = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;

      const mask = listaMascaras.find(m => m.id === redimensionandoMascaraId);
      if (!mask) return;

      const newW = Math.max(3, Math.min(100 - mask.x, Math.round(dragStartRef.current.startW + deltaX)));
      const newH = Math.max(3, Math.min(100 - mask.y, Math.round(dragStartRef.current.startH + deltaY)));

      handleAtualizarMascara(mask.id, { largura: newW, altura: newH });
      return;
    }

    // Caso 3: Desenhando nova máscara
    if (!desenhando) return;

    const coords = getCoordsRelativas(e.clientX, e.clientY);

    if (modoDesenho === 'retangulo') {
      if (!inicioDesenho) return;
      const x = Math.min(inicioDesenho.x, coords.x);
      const y = Math.min(inicioDesenho.y, coords.y);
      const largura = Math.abs(coords.x - inicioDesenho.x);
      const altura = Math.abs(coords.y - inicioDesenho.y);
      setMascaraTemporaria({ x, y, largura, altura });
    } else {
      setPontosLivre(prev => {
        if (prev.length === 0) return [coords];
        const last = prev[prev.length - 1];
        const dist = Math.hypot(coords.x - last.x, coords.y - last.y);
        if (dist >= 0.6) {
          return [...prev, coords];
        }
        return prev;
      });
    }
  };

  // Finalização do Ponteiro
  const handlePointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    // Soltar captura do ponteiro se houver
    if (e && activePointerIdRef.current !== null) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(activePointerIdRef.current);
      } catch (err) {}
      activePointerIdRef.current = null;
    }

    // Finalizar arraste ou redimensionamento
    if (arrastandoMascaraId || redimensionandoMascaraId) {
      setArrastandoMascaraId(null);
      setRedimensionandoMascaraId(null);
      dragStartRef.current = null;
      return;
    }

    // Finalizar criação de nova máscara
    if (!desenhando) return;
    setDesenhando(false);

    if (modoDesenho === 'retangulo') {
      if (mascaraTemporaria && mascaraTemporaria.largura >= 3 && mascaraTemporaria.altura >= 3) {
        const novaMascara: MascaraImagem = {
          id: `mascara-${Date.now()}`,
          numero: listaMascaras.length + 1,
          tipoForma: 'retangulo',
          x: Math.round(mascaraTemporaria.x),
          y: Math.round(mascaraTemporaria.y),
          largura: Math.round(mascaraTemporaria.largura),
          altura: Math.round(mascaraTemporaria.altura),
          textoOculto: `Estrutura #${listaMascaras.length + 1}`,
          dica: '',
          revelado: false,
        };

        const novas = [...listaMascaras, novaMascara];
        notifyMascarasChange(novas);
        setMascaraSelecionadaId(novaMascara.id);
      }
      setInicioDesenho(null);
      setMascaraTemporaria(null);
    } else {
      if (pontosLivre.length >= 3) {
        const minX = Math.min(...pontosLivre.map(p => p.x));
        const maxX = Math.max(...pontosLivre.map(p => p.x));
        const minY = Math.min(...pontosLivre.map(p => p.y));
        const maxY = Math.max(...pontosLivre.map(p => p.y));
        const largura = Math.max(4, Math.round(maxX - minX));
        const altura = Math.max(4, Math.round(maxY - minY));

        const novaMascara: MascaraImagem = {
          id: `mascara-${Date.now()}`,
          numero: listaMascaras.length + 1,
          tipoForma: 'livre',
          pontos: pontosLivre,
          x: Math.round(minX),
          y: Math.round(minY),
          largura,
          altura,
          textoOculto: `Estrutura Livre #${listaMascaras.length + 1}`,
          dica: '',
          revelado: false,
        };

        const novas = [...listaMascaras, novaMascara];
        notifyMascarasChange(novas);
        setMascaraSelecionadaId(novaMascara.id);
      }
      setPontosLivre([]);
    }
  };

  // Iniciar arraste de máscara existente (touch / mouse)
  const handleMaskPointerDown = (e: React.PointerEvent, mask: MascaraImagem) => {
    if (modoPreview) return;
    e.stopPropagation();
    e.preventDefault();
    setMascaraSelecionadaId(mask.id);
    setArrastandoMascaraId(mask.id);
    hasDraggedRef.current = false;

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: mask.x,
      startY: mask.y,
      startW: mask.largura,
      startH: mask.altura,
      initialPoints: mask.pontos ? JSON.parse(JSON.stringify(mask.pontos)) : undefined,
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Iniciar redimensionamento no canto inferior direito da máscara selecionada
  const handleResizePointerDown = (e: React.PointerEvent, mask: MascaraImagem) => {
    if (modoPreview) return;
    e.stopPropagation();
    e.preventDefault();
    setMascaraSelecionadaId(mask.id);
    setRedimensionandoMascaraId(mask.id);
    hasDraggedRef.current = false;

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: mask.x,
      startY: mask.y,
      startW: mask.largura,
      startH: mask.altura,
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Ajuste fino individual de máscara por botões (+- 1% ou 2%)
  const nudgeMascara = (id: string, dx: number, dy: number, dw: number = 0, dh: number = 0) => {
    const atual = listaMascaras.find(m => m.id === id);
    if (!atual) return;
    const newW = Math.max(3, Math.min(100 - atual.x, atual.largura + dw));
    const newH = Math.max(3, Math.min(100 - atual.y, atual.altura + dh));
    const newX = Math.max(0, Math.min(100 - newW, atual.x + dx));
    const newY = Math.max(0, Math.min(100 - newH, atual.y + dy));

    if (atual.tipoForma === 'livre' && atual.pontos) {
      const shiftX = newX - atual.x;
      const shiftY = newY - atual.y;
      const novosPontos = atual.pontos.map(p => ({
        x: Math.max(0, Math.min(100, Math.round((p.x + shiftX) * 10) / 10)),
        y: Math.max(0, Math.min(100, Math.round((p.y + shiftY) * 10) / 10)),
      }));
      handleAtualizarMascara(id, { x: newX, y: newY, largura: newW, altura: newH, pontos: novosPontos });
    } else {
      handleAtualizarMascara(id, { x: newX, y: newY, largura: newW, altura: newH });
    }
  };

  // Deslocamento de todas as máscaras em bloco (calibração para cards importados)
  const shiftTodasMascaras = (dx: number, dy: number) => {
    const novas = listaMascaras.map(m => {
      const newX = Math.max(0, Math.min(100 - m.largura, m.x + dx));
      const newY = Math.max(0, Math.min(100 - m.altura, m.y + dy));
      const shiftX = newX - m.x;
      const shiftY = newY - m.y;
      if (m.tipoForma === 'livre' && m.pontos) {
        return {
          ...m,
          x: newX,
          y: newY,
          pontos: m.pontos.map(p => ({
            x: Math.max(0, Math.min(100, Math.round((p.x + shiftX) * 10) / 10)),
            y: Math.max(0, Math.min(100, Math.round((p.y + shiftY) * 10) / 10)),
          }))
        };
      }
      return { ...m, x: newX, y: newY };
    });
    notifyMascarasChange(novas);
  };

  // Adicionar máscara retangular rápida pelo botão
  const handleAdicionarMascaraManual = () => {
    const offset = (listaMascaras.length * 5) % 30;
    const novaMascara: MascaraImagem = {
      id: `mascara-${Date.now()}`,
      numero: listaMascaras.length + 1,
      tipoForma: 'retangulo',
      x: 20 + offset,
      y: 20 + offset,
      largura: 25,
      altura: 12,
      textoOculto: `Estrutura #${listaMascaras.length + 1}`,
      dica: '',
      revelado: false,
    };
    const novas = [...listaMascaras, novaMascara];
    notifyMascarasChange(novas);
    setMascaraSelecionadaId(novaMascara.id);
  };

  const handleRemoverMascara = (id: string) => {
    const filtradas = listaMascaras.filter(m => m.id !== id).map((m, idx) => ({
      ...m,
      numero: idx + 1,
    }));
    notifyMascarasChange(filtradas);
    if (mascaraSelecionadaId === id) {
      setMascaraSelecionadaId(filtradas[0]?.id || null);
    }
  };

  const handleAtualizarMascara = (id: string, campos: Partial<MascaraImagem>) => {
    const atualizadas = listaMascaras.map(m => m.id === id ? { ...m, ...campos } : m);
    notifyMascarasChange(atualizadas);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Escolha ou Upload da Imagem */}
      {!imagemUrl ? (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-7 sm:p-9 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group select-none ${
              arrastandoArquivo
                ? 'border-blue-600 bg-blue-100/70 scale-[1.01] ring-4 ring-blue-500/20'
                : 'border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {arrastandoArquivo ? 'Solte a imagem aqui' : 'Toque ou arraste uma imagem aqui'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
                Diagrama anatômico, fluxograma, ECG, lâmina ou raio-X (PNG, JPG, WEBP). Você também pode copiar uma imagem e colar diretamente com <strong>Ctrl+V / ⌘V</strong>.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Procurar no Dispositivo
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMostrarUrlInput(!mostrarUrlInput);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all"
              >
                Inserir Link Web (URL)
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadArquivo}
            accept="image/*"
            className="hidden"
          />

          {/* Opção de Colar Link Web / URL */}
          {mostrarUrlInput && (
            <div className="p-3 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-2 animate-in fade-in">
              <label className="text-[11px] font-bold text-slate-700 block">
                Link Direto da Imagem (HTTPS):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/imagem-anatomia.jpg"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (urlInput.trim()) {
                      setErroCarregamentoImagem(false);
                      notifyUrlChange(urlInput.trim());
                      setUrlInput('');
                      setMostrarUrlInput(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Carregar
                </button>
              </div>
            </div>
          )}

          {/* Presets médicos rápidos */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Ou escolha um modelo anatômico pronto:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.nome}
                  type="button"
                  onClick={() => {
                    notifyUrlChange(preset.url);
                    notifyMascarasChange(preset.mascarasPadrao);
                    setMascaraSelecionadaId(preset.mascarasPadrao[0]?.id || null);
                  }}
                  className="p-2.5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 text-left text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{preset.nome}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Barra de Ferramentas de Oclusão */}
          <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200">
            {/* Seletor de Ferramenta: Retângulo vs Caneta Livre */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center p-0.5 rounded-xl bg-slate-200/70 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setModoDesenho('retangulo')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modoDesenho === 'retangulo'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Desenhar caixas retangulares"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Retângulo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoDesenho('livre')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modoDesenho === 'livre'
                      ? 'bg-white text-purple-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Contornar livremente ramos tortuosos ou textos irregulares"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Caneta (Livre)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModoPreview(!modoPreview)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  modoPreview ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Alternar modo de teste interativo"
              >
                {modoPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{modoPreview ? 'Sair do Teste' : 'Testar Oclusões'}</span>
              </button>

              {listaMascaras.length > 0 && !modoPreview && (
                <button
                  type="button"
                  onClick={() => setMostrarCalibracaoBloco(!mostrarCalibracaoBloco)}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mostrarCalibracaoBloco ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Ajustar todas as máscaras ao mesmo tempo (caso tenham deslocado)"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Mover em Bloco</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                {listaMascaras.length} {listaMascaras.length === 1 ? 'máscara' : 'máscaras'}
              </span>
              <button
                type="button"
                onClick={() => {
                  notifyUrlChange('');
                  notifyMascarasChange([]);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Trocar imagem
              </button>
            </div>
          </div>

          {/* Gaveta de Calibração / Deslocamento em Bloco */}
          {mostrarCalibracaoBloco && listaMascaras.length > 0 && !modoPreview && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-2 flex-wrap text-xs animate-in fade-in">
              <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                <Move className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Deslocar Todas as {listaMascaras.length} Máscaras:</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftTodasMascaras(-2, 0)}
                  className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-blue-700 cursor-pointer shadow-3xs"
                  title="Mover todas 2% para a esquerda"
                >
                  ⬅️ Esquerda
                </button>
                <button
                  type="button"
                  onClick={() => shiftTodasMascaras(2, 0)}
                  className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-blue-700 cursor-pointer shadow-3xs"
                  title="Mover todas 2% para a direita"
                >
                  ➡️ Direita
                </button>
                <button
                  type="button"
                  onClick={() => shiftTodasMascaras(0, -2)}
                  className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-blue-700 cursor-pointer shadow-3xs"
                  title="Subir todas 2%"
                >
                  ⬆️ Subir
                </button>
                <button
                  type="button"
                  onClick={() => shiftTodasMascaras(0, 2)}
                  className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-blue-700 cursor-pointer shadow-3xs"
                  title="Descer todas 2%"
                >
                  ⬇️ Descer
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div>
              {modoDesenho === 'retangulo' ? (
                <span>💡 <strong>Modo Retângulo:</strong> Toque e arraste para desenhar nova oclusão. Toque numa máscara existente para <strong>arrastar</strong> ou <strong>redimensionar</strong>.</span>
              ) : (
                <span>✏️ <strong>Modo Caneta (Forma Livre):</strong> Desenhe contornando livremente os limites anatômicos.</span>
              )}
            </div>
            {arrastandoMascaraId && (
              <span className="font-bold text-blue-600 animate-pulse">
                Arrastando máscara...
              </span>
            )}
            {redimensionandoMascaraId && (
              <span className="font-bold text-purple-600 animate-pulse">
                Redimensionando...
              </span>
            )}
          </div>

          {erroCarregamentoImagem && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center justify-between">
              <span>A imagem não pôde ser carregada do link externo. Selecione uma imagem do seu celular ou PC.</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold"
              >
                Carregar Imagem
              </button>
            </div>
          )}

          {/* VIEWPORT CENTRADOR COM FUNDO ESCURO */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-1 sm:p-2 select-none shadow-inner">
            {/* WRAPPER RIGOROSAMENTE COLADO ÀS BORDAS DA IMAGEM RENDERIZADA (ZERO LETTERBOXING INTERNO) */}
            <div 
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative inline-block max-w-full select-none touch-none cursor-crosshair"
              style={{ lineHeight: 0 }}
            >
              <img
                src={imagemUrl}
                alt="Diagrama para Oclusão de Imagem"
                className="block max-w-full h-auto max-h-[60vh] sm:max-h-[480px] w-auto mx-auto select-none pointer-events-none"
                referrerPolicy="no-referrer"
                onError={() => setErroCarregamentoImagem(true)}
              />

              {/* SVG Overlay para Formas Livres e Desenho Ativo */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                {/* Máscaras Livres Salvas */}
                {listaMascaras.filter(m => m.tipoForma === 'livre' && m.pontos && m.pontos.length > 2).map((m) => {
                  const selecionada = m.id === mascaraSelecionadaId;
                  const revelada = modoPreview ? m.revelado : false;
                  const pontosString = m.pontos!.map(p => `${p.x},${p.y}`).join(' ');

                  return (
                    <g 
                      key={m.id}
                      className="mascara-existente pointer-events-auto cursor-pointer"
                      onPointerDown={(e) => handleMaskPointerDown(e, m)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (modoPreview) {
                          handleAtualizarMascara(m.id, { revelado: !m.revelado });
                        } else {
                          setMascaraSelecionadaId(m.id);
                        }
                      }}
                    >
                      <polygon
                        points={pontosString}
                        fill={modoPreview 
                          ? (revelada ? 'transparent' : '#4f46e5') 
                          : (selecionada ? '#2563eb' : '#4f46e5')
                        }
                        fillOpacity={modoPreview && revelada ? 0 : 1}
                        stroke={modoPreview && revelada ? 'rgba(16, 185, 129, 0.8)' : (selecionada ? '#ffffff' : '#c7d2fe')}
                        strokeWidth={selecionada ? '1.5' : '0.8'}
                        strokeDasharray={modoPreview && revelada ? '2,2' : undefined}
                        className="transition-all hover:brightness-110"
                      />
                      {(!modoPreview || !revelada) && (
                        <text
                          x={m.x + m.largura / 2}
                          y={m.y + m.altura / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#ffffff"
                          fontSize="3.6"
                          fontWeight="bold"
                          className="select-none pointer-events-none drop-shadow-sm"
                        >
                          [ #{m.numero} ]
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Traço em desenho livre corrente */}
                {pontosLivre.length > 1 && (
                  <polyline
                    points={pontosLivre.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>

              {/* Máscaras Retangulares Salvas */}
              {listaMascaras.filter(m => !m.tipoForma || m.tipoForma === 'retangulo').map((m) => {
                const selecionada = m.id === mascaraSelecionadaId;
                const revelada = modoPreview ? m.revelado : false;

                return (
                  <div
                    key={m.id}
                    onPointerDown={(e) => handleMaskPointerDown(e, m)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (modoPreview) {
                        handleAtualizarMascara(m.id, { revelado: !m.revelado });
                      } else {
                        setMascaraSelecionadaId(m.id);
                      }
                    }}
                    className={`mascara-existente absolute rounded-lg transition-all flex items-center justify-center text-center p-1 text-xs select-none ${
                      modoPreview
                        ? revelada
                          ? 'bg-transparent border-2 border-dashed border-emerald-500/80 shadow-2xs hover:bg-emerald-500/10 cursor-pointer animate-in fade-in'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold border-2 border-indigo-300 shadow-md cursor-pointer opacity-100'
                        : selecionada
                        ? 'bg-blue-600 text-white font-bold border-2 border-white ring-2 ring-blue-400 shadow-lg cursor-move opacity-100 z-20'
                        : 'bg-indigo-700 text-white font-semibold border border-white/60 hover:bg-indigo-600 hover:border-white shadow-xs cursor-pointer opacity-95 z-10'
                    }`}
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      width: `${m.largura}%`,
                      height: `${m.altura}%`,
                      opacity: modoPreview && revelada ? undefined : 1,
                    }}
                    title={modoPreview && revelada ? `Estrutura: ${m.textoOculto}` : (selecionada ? 'Arraste para mover ou use o canto para redimensionar' : `Toque para selecionar estrutura #${m.numero}`)}
                  >
                    {modoPreview ? (
                      !revelada && (
                        <span className="text-[11px] font-black tracking-wide">
                          [ #{m.numero} ]
                        </span>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center overflow-hidden w-full h-full pointer-events-none">
                        <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.2 rounded-sm shrink-0">
                          #{m.numero}
                        </span>
                        <span className="text-[9px] truncate max-w-full opacity-90 px-0.5">
                          {m.textoOculto}
                        </span>
                      </div>
                    )}

                    {/* MANIPULADOR DE REDIMENSIONAMENTO NO CANTO INFERIOR DIREITO DA MÁSCARA SELECIONADA */}
                    {selecionada && !modoPreview && (
                      <div
                        onPointerDown={(e) => handleResizePointerDown(e, m)}
                        className="resize-handle absolute -bottom-2 -right-2 w-6 h-6 flex items-center justify-center z-30 cursor-se-resize touch-none"
                        title="Arraste para redimensionar"
                      >
                        <div className="w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-sm shadow-md flex items-center justify-center">
                          <Maximize2 className="w-2 h-2 text-blue-700 rotate-90" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Caixa retangular em desenho corrente */}
              {mascaraTemporaria && (
                <div
                  className="absolute border-2 border-blue-400 bg-blue-500/40 rounded-lg pointer-events-none z-30"
                  style={{
                    left: `${mascaraTemporaria.x}%`,
                    top: `${mascaraTemporaria.y}%`,
                    width: `${mascaraTemporaria.largura}%`,
                    height: `${mascaraTemporaria.altura}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* 3. CAMPOS INDIVIDUAIS POR MÁSCARA COM AJUSTE FINO (SETAS DIRECIONAIS) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-800">
                  Máscaras de Oclusão ({listaMascaras.length})
                </h4>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (Cada máscara possui seu próprio texto oculto e controle milimétrico de posição)
                </span>
              </div>

              <button
                type="button"
                onClick={handleAdicionarMascaraManual}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Máscara</span>
              </button>
            </div>

            {listaMascaras.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
                Nenhuma máscara criada ainda. Use a ferramenta Retângulo ou Caneta acima para ocluir estruturas na imagem.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {listaMascaras.map((m) => {
                  const selecionada = m.id === mascaraSelecionadaId;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setMascaraSelecionadaId(m.id)}
                      className={`p-3 rounded-2xl border transition-all ${
                        selecionada
                          ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300/60 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-md text-white text-[11px] font-black flex items-center justify-center shadow-3xs ${
                            m.tipoForma === 'livre' ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            #{m.numero}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Máscara #{m.numero}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                            {m.tipoForma === 'livre' ? 'Caneta / Livre' : 'Retângulo'}
                          </span>
                          {selecionada && (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded-md">
                              Selecionada
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoverMascara(m.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir esta máscara"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Texto Oculto (Resposta da Máscara #{m.numero}) *
                          </label>
                          <input
                            type="text"
                            required
                            value={m.textoOculto}
                            onChange={(e) => handleAtualizarMascara(m.id, { textoOculto: e.target.value })}
                            placeholder="Ex: Artéria Cerebral Média"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Dica Opcional (Máscara #{m.numero})
                          </label>
                          <input
                            type="text"
                            value={m.dica || ''}
                            onChange={(e) => handleAtualizarMascara(m.id, { dica: e.target.value })}
                            placeholder="Ex: Ramo da carótida interna"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* CONTROLES DE AJUSTE FINO (SETAS DIRECIONAIS E DIMENSÕES) */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-slate-600">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 mr-0.5">Ajuste Fino:</span>
                          
                          {/* Mover Posição */}
                          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, -1, 0); }}
                              className="px-1.5 py-0.5 rounded hover:bg-white text-[11px] font-bold text-slate-700 cursor-pointer"
                              title="Mover 1% para esquerda"
                            >
                              ⬅️
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, 0, -1); }}
                              className="px-1.5 py-0.5 rounded hover:bg-white text-[11px] font-bold text-slate-700 cursor-pointer"
                              title="Subir 1%"
                            >
                              ⬆️
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, 0, 1); }}
                              className="px-1.5 py-0.5 rounded hover:bg-white text-[11px] font-bold text-slate-700 cursor-pointer"
                              title="Descer 1%"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, 1, 0); }}
                              className="px-1.5 py-0.5 rounded hover:bg-white text-[11px] font-bold text-slate-700 cursor-pointer"
                              title="Mover 1% para direita"
                            >
                              ➡️
                            </button>
                          </div>

                          {/* Ajustar Tamanho */}
                          {(!m.tipoForma || m.tipoForma === 'retangulo') && (
                            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, 0, 0, -1, 0); }}
                                className="px-1 py-0.5 rounded hover:bg-white text-[9.5px] font-bold text-slate-700 cursor-pointer"
                                title="Diminuir largura"
                              >
                                L-
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, 0, 0, 1, 0); }}
                                className="px-1 py-0.5 rounded hover:bg-white text-[9.5px] font-bold text-slate-700 cursor-pointer"
                                title="Aumentar largura"
                              >
                                L+
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, 0, 0, 0, -1); }}
                                className="px-1 py-0.5 rounded hover:bg-white text-[9.5px] font-bold text-slate-700 cursor-pointer"
                                title="Diminuir altura"
                              >
                                A-
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); nudgeMascara(m.id, 0, 0, 0, 1); }}
                                className="px-1 py-0.5 rounded hover:bg-white text-[9.5px] font-bold text-slate-700 cursor-pointer"
                                title="Aumentar altura"
                              >
                                A+
                              </button>
                            </div>
                          )}
                        </div>

                        <span className="text-[9.5px] font-mono text-slate-400">
                          X:{m.x}% Y:{m.y}% • {m.largura}×{m.altura}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
