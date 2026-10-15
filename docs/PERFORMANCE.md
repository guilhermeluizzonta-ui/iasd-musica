# Desempenho: o app trava?

Medido em 14/10/2026 com `testes/perf/medir.js`: Chromium com o **processador 4x mais lento** (perto de um tablet intermediário), tela 1280x800 densidade 2, repertório grande (**300 cifras, 60 partituras, 20 listas**).
Abaixo de ~100 ms parece instantâneo; 100–300 ms dá para perceber; acima de ~500 ms parece travado.

## Resultado: antes × depois das correções de 14/10

| Ação | Antes (v0.1.5) | Depois | Situação |
|---|---|---|---|
| Abrir o app | 784 ms | 653 ms | ok (uma vez por uso) |
| Lista de cifras (300) | 785 ms | 329 ms | ok |
| Buscar digitando ("santo") | 523 ms (≈100 ms por letra) | 26 ms | resolvido |
| Abrir uma cifra | 463 ms | 304 ms | ok |
| Subir meio tom | 191 ms | 122 ms | ok |
| Ajustar à tela | 503 ms | 480 ms | aceitável (testa vários tamanhos) |
| Lista de partituras (60) | 275 ms | 278 ms | ok |
| Listas de culto (20) | 52 ms | 57 ms | ok |
| **PDF de 12 páginas: memória das páginas** | **366 MB** | **61 MB** | **resolvido (era o maior risco)** |
| **PDF escaneado de 6 páginas: memória** | **183 MB** | **61 MB** | **resolvido** |
| PDF: primeira página na tela | 888 ms | 765 ms | ok |
| Pauta 60 notas: redesenhar | 374 ms | 272 ms | melhorou |
| Pauta 300 notas: abrir / redesenhar | 951 / 528 ms | 619 / 374 ms | melhorou |
| Pauta 800 notas (14 páginas): abrir / redesenhar | 2945 / 1553 ms | 1074 / 641 ms | melhorou; ainda pesado |

## O que foi corrigido
1. **PDF desenhava todas as páginas de uma vez.** Cada página ocupa ~30 MB de imagem; um PDF de 12 páginas passava de 360 MB, o bastante para o Android fechar o app ou travar. Agora só as páginas perto da tela são desenhadas (até 1,5 tela acima/abaixo) e as que ficam longe liberam a memória. Ao sair da partitura, a memória também é liberada.
2. **Busca redesenhava a lista a cada letra.** Agora espera a pessoa parar de digitar (0,14 s). Vale para cifras, partituras e escolher músicas da lista.
3. **Listas longas.** O navegador só desenha as linhas que estão na tela (`content-visibility`).
4. **Gravação do banco a cada toque.** Trocar tom, zoom, colunas gravava o banco inteiro (centenas de KB) toda vez. Agora as mudanças seguidas viram uma gravação só (~0,3 s depois) e, ao sair ou minimizar, grava na hora.
5. **Pauta media cada nota forçando o navegador a recalcular a folha inteira** (custo crescia com o quadrado do número de notas). Agora mede todas de uma vez.

## O que ainda pode pesar (próximas melhorias, em ordem)
1. **Pauta redesenha a folha inteira a cada traço.** Com músicas longas (300+ notas) cada nota escrita custa 0,3–0,6 s no tablet lento. Solução: redesenhar só a linha que mudou (e só a conferência dos compassos dela). É a próxima melhoria recomendada para escrever com a S Pen sem atraso.
2. **Abrir a pauta com música longa** (~1 s): mesma solução acima, mais desenhar primeiro só as folhas visíveis.
3. **Ajustar à tela** testa vários tamanhos (busca binária, ~5 desenhos). Dá para medir uma vez e calcular.
4. **App num arquivo só (447 KB)**: o navegador lê tudo ao abrir (~0,4 s de processamento). Aceitável hoje; se crescer muito (Criar cifra, slides), separar partes que só carregam quando usadas.
5. **Banco no localStorage**: cresce com as cifras (300 cifras ≈ 220 KB; com letras completas, ~600 KB+). Até ~2 MB vai bem; acima disso, migrar cifras para o IndexedDB (já usado nos PDFs).
6. **Anotações**: ficam todas numa chave; com muitas anotações em muitas músicas, separar por música.

## Conclusão
- Para o uso normal (abrir cifra, transpor, listas, letras, partituras), o app responde rápido mesmo num aparelho lento.
- O risco real de travar/fechar era o **PDF com muitas páginas** — corrigido.
- O ponto que ainda pede trabalho é **escrever na pauta em músicas longas**; para hinos curtos (até ~150 notas) já está fluido.
- Medir de novo a cada versão grande: `testes/perf/README.md`. Conferir no tablet real (Samsung com S Pen) e no S20 FE.
