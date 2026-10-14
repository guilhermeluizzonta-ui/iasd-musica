# Pauta a Mão Livre — checkpoint e plano de integração

Estado em 13/10/2026. Editor de partitura escrita à mão com a S Pen (o app reconhece o desenho e troca pelo símbolo certo, na altura certa).

## Onde está
- `src/pauta/pauta-mao-livre.html` — o editor completo, um arquivo só (HTML + CSS + JS, glifos Noto Music embutidos como SVG). É o mesmo protótipo publicado no Claude (Artifact "Pauta a Mão Livre", versão 18).
- `scripts/build-web.mjs` (passo 4) — gera `www/pauta.html` para o APK: troca a fonte do Google pela local (`fonts/fonts.css`), inclui `lib/capacitor.js`. Funciona offline.
- `testes/pauta/` — testes automáticos (jsdom). `npm install` e depois, por exemplo, `node testar12.js ../../src/pauta/pauta-mao-livre.html`.
  - Resultados esperados hoje: todos passam, exceto 1 em `testar4.js` (compasso vazio no fim não é contado — expectativa antiga) e 1 em `testar11.js` (conta bandeirolas das miniaturas da Biblioteca).

## O que já funciona (MVP quase completo)
- Ficha obrigatória da música (título, compositor, formação: Sol / Fá / Dó / piano Sol+Fá, tom, compasso, unidade, andamento).
- Escrever à mão: notas (semibreve a semicolcheia), acordes, pausas, acidentes, ponto de aumento × staccato, ligaduras, barra de compasso, barra de colcheias.
- "Ensinar meu desenho": a pessoa desenha 3–5 vezes cada símbolo; reconhecedor $P; na dúvida pergunta "Qual destes?".
- Arrastar da Biblioteca (Favoritos, Recentes, grupos organizáveis, acordes prontos do tom e montador).
- Linhas (+)/(−), paginação A4 automática, clave por linha (tocar na clave), sistema de piano.
- Conferência do compasso (✓ verde / "3 de 4 · falta" / "5 de 4 · passou"), nome das notas e cifra dos acordes no status.
- Ferramentas: Ponteiro, Caneta, Mover, Anotar (5 cores, traço ou texto), Borracha que varre (um Desfazer devolve o risco inteiro), Ajustar (espaçamento igual), Desfazer.
- Editor × Visualizar (prévia limpa para impressão), tela cheia, barras recolhíveis, título editável, guia/tutorial inicial.

## Falta para fechar o MVP
1. **Exportar PDF** a partir do Visualizar (próximo passo). No APK, usar o plugin Share/Filesystem que o app já tem. Ideia: guardar os dados da música dentro do PDF, para reimportar 100% editável.
2. ~~**Entrada no app (decidido pelo Guilherme, 13/10):**~~ **Feito em 14/10** (ver "Integração com o app" abaixo). Texto original: em Partituras, no botão **+**, junto de "Nova pasta" e "Importar PDF", fica **"Criar partitura"**. Já colocado em `src/app.html` (`fab-score`, abre `pauta.html`). Falta: um botão Voltar na pauta (`history.back()`) e conferir o botão voltar do Android dentro da `pauta.html`; depois, listar as partituras escritas na pasta aberta.
3. **Teste no tablet e no S20 FE com a S Pen** (calibrar os limites do reconhecedor com desenhos reais).

## Armazenamento
- Hoje: `localStorage`, chave `pauta-mao-livre.v2` (`{ musicas, atual, zoom, dedo, espera, fab, favs, recentes, biblio, modelos, anotCor, visAnot, guiaNaoMostrar }`). Os desenhos ensinados (`modelos`) ficam no aparelho.
- `pauta.html` e `index.html` rodam na mesma origem do WebView, então o app consegue ler a lista de músicas escritas pela mesma chave.
- Fase 2: sincronizar/publicar no Drive (ver decisões do repositório Drive).

## Próximas etapas (depois do MVP)
- **Importar foto ou PDF de partitura (reconhecimento óptico — OMR).** Para partituras e exercícios de autoria própria. Caminho: foto/PDF → programa de OMR (ex.: Audiveris, gratuito) → **MusicXML** → importador no app → corrigir com a S Pen, com a imagem original ao lado e os compassos duvidosos marcados. Acerto esperado: PDF digital bom; scan limpo razoável; foto de celular depende de luz e enquadramento; manuscrito fraco. Primeiro passo: testar com 1–2 partituras reais do Guilherme. O importador de MusicXML também serve para abrir arquivos do MuseScore.
- Letra embaixo da pauta; recursos de estudo (nome das notas, dedilhado, partitura → cifra, ChordPro).
- Grade do maestro e partes com transposição (violino, viola, piano, flauta, trompete; coral do primeiro soprano ao baixo).
- Vozes 1/2 na mesma pauta; tema escuro; itens novos da Biblioteca (tercina, marcas de ensaio, textos, cifra acima, mudança de tom/compasso); levar preferências da Biblioteca para as Configurações do app.

## Integração com o app (feita em 14/10/2026, design aprovado no quadro "Criar partitura")
- **Partituras › + › Criar partitura** (primeiro item, amarelo; só Editor) abre a **ficha no app**: título, compositor/arranjo, formação, tom (maior/menor + grade de 12, com a armadura escrita), compasso, unidade, andamento, prévia "Como a partitura começa" e **Salvar em** (pasta).
- Ao confirmar, o app grava o pedido em `localStorage['pauta.pedido']` e abre `pauta.html?app=1&nova=<id do pedido>`; a pauta cria a música com esses dados (sem abrir a ficha dela) e guarda `pastaApp`.
- Na pauta aberta pelo app (`?app=1`): botão **Voltar** antes do título; o ícone de lista vira **Ficha da partitura**; o **botão voltar do Android** fecha o que estiver aberto e depois volta ao app; excluir pela ficha volta ao app.
- No app, as músicas da pauta aparecem **na pasta escolhida** como "Criada no app · piano · G maior · 4/4", etiqueta **editável**, lápis **Editar notas** (`pauta.html?app=1&id=…`) e ⋯ com **Abrir (como os músicos veem)** (`&ver=1`, modo Visualizar), Editar notas, Mover, Ligar à cifra, Excluir (apaga também na pauta).
- O app sincroniza com a chave `pauta-mao-livre.v2` ao abrir e ao voltar (inclusive voltando pelo histórico).
- Build: `www/pauta.html` ganhou a regra `[hidden]{display:none!important}` (sem ela as janelas da pauta apareciam todas abertas no APK).
- No visualizador do Claude a página da pauta não existe: "Criar partitura" mostra a ficha e avisa que o editor abre no APK.
