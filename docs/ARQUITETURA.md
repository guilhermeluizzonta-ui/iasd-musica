# Arquitetura do app IASD Música

Atualizado em 14/10/2026 (v0.1.5 + melhorias de desempenho no ramo `listas`).

## Visão geral
- App de cifras, letras, partituras e listas de culto do Ministério da Música da IASD Jaraguá do Sul - Central.
- **Web puro:** HTML + CSS + JavaScript, sem framework e sem empacotador. Roda igual no navegador (prévia no Claude) e no Android.
- **Android:** Capacitor 8. O app web roda numa WebView; a parte nativa é pequena (Java: `MainActivity` e os plugins próprios `ImmersivePlugin`, para tela cheia, e `WhatsAppPlugin`, para mandar os slides direto pelo WhatsApp).
- **Funciona sem internet:** fontes, leitor de PDF e o próprio app vão dentro do APK.

## Pastas e arquivos
| Caminho | O que é |
|---|---|
| `src/app.html` | O app inteiro (telas, estilos e lógica) num arquivo só. |
| `src/pauta/pauta-mao-livre.html` | Editor de partitura à mão (S Pen). Vira `www/pauta.html`. |
| `scripts/build-web.mjs` | Monta `www/`: troca fontes, PDF.js e o gerador de PowerPoint (PptxGenJS 3.12) da internet por arquivos locais e gera `index.html` e `pauta.html`. |
| `android/` | Projeto Android (Capacitor). |
| `.github/workflows/apk.yml` | Gera o APK a cada envio para o `main` e publica em Releases (`v0.1.N`, N = número da execução). |
| `testes/pauta/` | Testes automáticos (Node + jsdom). |
| `testes/slides/` | Slides e ordem do roteiro (Playwright; gera um .pptx de cada modelo). |
| `testes/perf/` | Medição de desempenho (Playwright + Chromium com processador desacelerado). |
| `drive/biblioteca.gs` | Google Apps Script que entrega ao app as pastas Cifras e Partituras do Drive (ver `docs/BIBLIOTECA.md`). |
| `docs/` | Esta documentação. |

## Telas (rotas)
Navegação interna por `go(nome, params)`; cada tela é uma `<section class="view" id="v-…">`.

| Rota | Tela |
|---|---|
| `login`, `signup` | Entrar e cadastro (local, sem servidor; "Modo de teste"). |
| `inicio` | Início: logo, versículo do dia, visualizadas recentemente, próximo culto. |
| `cifras`, `cifra`, `editor`, `favoritas`, `lixeira` | Repertório de cifras, cifra aberta, editor (texto/ChordPro), favoritas, lixeira. |
| `letras`, `letra` | Letras (saem da própria cifra, sem os acordes). |
| `partituras`, `partitura`, `scoreform` | Pastas e PDFs, PDF aberto, ficha de nova partitura escrita. |
| `listas`, `lista`, `listaform`, `listapick` | Listas de culto, lista aberta/modo culto, dados da lista, escolher músicas. |
| `slides` | Slides da lista (PowerPoint): modelos, opções, prévia, gerar .pptx. |
| `config` | Configurações: instrumento, modo, estilo, contorno, folha da partitura, fonte, cor. |
| `pauta.html` (outra página) | Editor da partitura escrita à mão; abre por Partituras › + › Criar partitura. |

## Onde os dados ficam (no aparelho)
| Chave | Conteúdo |
|---|---|
| `localStorage['repertorio.v1']` | Banco principal (`db`): usuário, papel, cifras (`songs`, em ChordPro), visualização por música (`view`: tom, capo, colunas, zoom), favoritas, listas, partituras (catálogo e importadas), pastas, preferências (`prefs`). |
| `localStorage['repertorio.notes.v1']` | Anotações à mão (cifra e partitura). |
| `localStorage['pauta-mao-livre.v2']` | Partituras escritas na pauta, desenhos ensinados, preferências da Biblioteca. |
| `IndexedDB 'repertorio-pdf'` | Os arquivos PDF baixados ou importados. |
| `localStorage['repertorio.bib.cifras' / '.partituras']` | Última lista da biblioteca do Drive (árvore de pastas e arquivos), para funcionar sem internet. |
| `db.bibUrl`, `db.libPartAt` | Endereço do script da biblioteca (se o editor pôs um diferente do padrão) e quando as partituras vieram do Drive (depois disso a lista fixa `CATALOG` deixa de valer). |
| `db.slidePrefs`, `lista.slides` | Última escolha dos slides (padrão) e a escolha guardada na lista (editor). |
| `db.tourDone` | Data em que a pessoa terminou o tour (sem ela, o tour começa sozinho ao entrar). |
| Outras chaves pequenas | Dicas já vistas, "só caneta", pedido de abertura da pauta e volta para a pasta. |

- **Gravação:** `save()` agrupa as mudanças e grava o banco ~0,3 s depois; ao sair ou minimizar grava na hora (`saveNow()`).
- **Drive:** o app **só lê** o Google Drive, pela biblioteca (`drive/biblioteca.gs`, ver `docs/BIBLIOTECA.md`): cifras e partituras sincronizadas. Escrita no Drive fica para a fase 2.

## Ordem do roteiro e slides
- `arrangeText(texto, roteiro)` reescreve o ChordPro na ordem do roteiro (repetições seguidas viram `Nome ×N`; `{x_rot: k}` marca onde começa cada item, para o chip rolar até ele). `shownText(s, v)` é o que a cifra e a letra mostram.
- `slSequence(s, item)` usa a mesma busca de partes (pelo nome, sem acento) mas repete de verdade, para os slides.
- Slides: `buildSlides` → `slLayout` (tamanho da letra em pontos, igual na prévia e no PowerPoint) → `slMakePptx` (PptxGenJS, carregado só na hora) → `slSave` (APK: Filesystem + Share; Claude: downloads; navegador: baixar).
- Anotações da cifra na ordem do roteiro: chave `c:<id>|rot` em `repertorio.notes.v1`.

## Formatos
- **Cifra:** ChordPro (`{title:}`, `{key:}`, `[C]acorde na sílaba`, seções `{start_of_verse}`…). Transpor, capotraste e simplificar só mudam a exibição.
- **Partitura escrita:** JSON próprio (linhas, pautas, itens com tipo/posição/altura, anotações). Símbolos da fonte Noto Music (licença OFL) embutidos como caminhos SVG.
- **Lista de culto:** título, data, hora, responsável, músicas com tom do culto (deslocamento) e observação.

## Temas
- Modo claro/escuro/seguir o aparelho; estilos Simples, Moderno, Retrô; contorno; fonte; cor de destaque.
- Folha da partitura: Clássica, Creme, Suave, Palco, Retrô (clara e escura). A tabela `FOLHAS` existe no app e na pauta (manter iguais). PDF/impressão sempre preto no branco.

## Integração nativa (APK)
- Botão voltar do Android: fecha o que estiver aberto antes de voltar de tela; no Início, sai.
- Compartilhar (cifra em ChordPro), tela acesa, tela cheia imersiva.
- Plugins: `@capacitor/app`, `filesystem`, `share`, `keep-awake`; próprios: `Immersive` e `WhatsApp` (`shareFile({ path, mime, text, phone })`: ACTION_SEND com `setPackage` do WhatsApp/Business pelo FileProvider; `phone` vira o extra `jid`; sem WhatsApp → erro `SEM_WHATSAPP`). O manifesto declara `<queries>` dos pacotes do WhatsApp.
- Testes: `testes/whatsapp` (plugins nativos falsos), `testes/pauta-musico` (músico só vê a pauta).

## Testes
```
cd testes/pauta && npm install
node testar12.js ../../src/pauta/pauta-mao-livre.html   # editor da pauta (testar*.js)
npm run build:web  (na raiz) e depois:
node testar13.js ../../www   # app ↔ pauta
node testar14.js ../../www   # modo e folha
node testar15.js ../../www   # capotraste e instrumento
```
Tour do app (Playwright; servidor em `www/` na porta 8765): `cd testes/tour && node testar-tour.js tablet editor` (também `celular`, `musico`).
Falhas conhecidas e esperadas: 1 em `testar4.js` e 1 em `testar11.js` (expectativas antigas dos próprios testes).

## Publicar uma versão
1. Juntar o trabalho no `main` (hoje: `listas` → `main`).
2. O GitHub Actions gera o APK (~1 min) e publica em **Releases** como `v0.1.N`.
3. Baixar o `.apk` no tablet/celular e instalar (permitir fontes desconhecidas).

## Ramos
- `main`: o que vira APK.
- `listas`: ramo de trabalho atual (tudo já no `main` até a v0.1.5).
- `cifra-criar`: editor visual de cifra (Criar cifra) — **ainda não** está no `main`.
