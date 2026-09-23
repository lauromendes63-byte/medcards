/**
 * Utilitários clínicos para formatação e higienização de perguntas e enunciados médicos
 */

/**
 * Remove a repetição do histórico do paciente da pergunta gatilho quando
 * a vinheta já é descrita e exibida no bloco de Quadro Clínico do caso.
 */
export function extrairPerguntaObjetiva(perguntaGatilho?: string, historiaClinica?: string): string {
  if (!perguntaGatilho) {
    return 'Qual a conduta diagnóstica ou terapêutica imediata mais apropriada?';
  }

  const perguntaTrim = perguntaGatilho.trim();
  if (!historiaClinica) {
    return perguntaTrim;
  }

  // Comandos clássicos de perguntas de provas de residência médica e revalidação
  const padroesComando = [
    /(?:Antes e após|Diante d[oe]|Considerando|Com base|Em relação|A conduta|Qual|Quais|Assinale|O diagnóstico|A conduta imediata|Para este paciente|Neste caso|Frente ao quadro|O achado|A melhor|A conduta terapêutica|O exame|Sobre este caso|Nesse contexto|A hipótese)[^.!?]*\?/i,
  ];

  // Verifica se a pergunta inicia duplicando palavras da história clínica
  const inicioHistoria = historiaClinica.trim().slice(0, 30).toLowerCase().replace(/[^\w\s]/g, '');
  const inicioPergunta = perguntaTrim.slice(0, 45).toLowerCase().replace(/[^\w\s]/g, '');

  const temSobreposicao = inicioPergunta.includes(inicioHistoria.slice(0, 18)) || 
    (inicioHistoria.length > 10 && inicioPergunta.startsWith(inicioHistoria.slice(0, 15)));

  if (temSobreposicao || perguntaTrim.length > 170) {
    // Procura comandos diretos na pergunta
    for (const padrao of padroesComando) {
      const match = perguntaTrim.match(padrao);
      if (match && match.index !== undefined && match.index > 20) {
        return match[0].trim();
      }
    }

    // Se houver múltiplas frases divididas por pontuação
    const frases = perguntaTrim.split(/(?<=[.!?])\s+/);
    if (frases.length > 1) {
      // Pega a frase que contém a interrogação '?'
      const frasesInterrogativas = frases.filter(f => f.includes('?'));
      if (frasesInterrogativas.length > 0) {
        return frasesInterrogativas.join(' ').trim();
      }
      // Se não tiver '?', pega a última sentença
      return frases[frases.length - 1].trim();
    }
  }

  return perguntaTrim;
}
