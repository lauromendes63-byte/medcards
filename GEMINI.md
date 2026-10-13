# Regras Permanentes do Projeto MedCards

## Fluxo Obrigatório de Finalização e Deploy (GitHub / Vercel)
Sempre que finalizar qualquer alteração de código ou interface no projeto MedCards:
1. **Incrementar a versão do App e Cache PWA**:
   - Atualizar a versão e `releaseNotes` em `vite.config.ts` (`versionGeneratorPlugin`).
   - Atualizar `CACHE_NAME` em `public/sw.js` (ex.: `medcards-pwa-vX.Y.Z`).
   - Atualizar `CURRENT_APP_VERSION` em `src/utils/versionManager.ts`.
2. **Gerar o Build de Produção**:
   - Executar `npm run build` para validar ausência de erros TypeScript/Vite e atualizar `public/version.json`.
3. **Publicar Automaticamente no GitHub / Vercel**:
   - Executar `git add -A`, `git commit` e `git push origin main` para que o deploy no Vercel seja disparado imediatamente.
4. **Não iniciar servidor local**:
   - **NUNCA** iniciar `npm run dev` / servidor local a menos que o usuário peça explicitamente. O usuário utiliza o app diretamente pelo deploy do Vercel.

## Diretrizes de Flashcards e Prompt Universal
- **Perguntas norteadoras diretas**: Sempre naturais, clínicas e diretas ao ponto, sem introduções robóticas ou prolixas.
- **Passo a Passo (`fluxograma_oclusao`)**: Todos os passos — **incluindo o Passo 1** — devem começar 100% ocluídos (`revelado = false`) e ser revelados em ordem sequencial do Passo 1 até o fim.
- **Fluxograma (`fluxograma_complexo`)**: Árvore clínica visual limpa, sem coordenadas manuais obrigatórias e com alternância rápida entre Estudo Ativo (Oclusão) e Fluxograma Completo.
