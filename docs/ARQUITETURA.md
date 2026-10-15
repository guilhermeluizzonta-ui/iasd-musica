# Arquitetura do app IASD Música

Atualizado em 14/10/2026 (v0.1.5 + melhorias de desempenho no ramo `listas`).

## Visão geral
- App de cifras, letras, partituras e listas de culto do Ministério da Música da IASD Jaraguá do Sul - Central.
- **Web puro:** HTML + CSS + JavaScript, sem framework e sem empacotador. Roda igual no navegador (prévia no Claude) e no Android.
- **Android:** Capacitor 8. O app web roda numa WebView; a parte nativa é pequena (Java: `MainActivity` e o plugin `ImmersivePlugin`, para tela cheia).
- **Funciona sem internet:** fontes, leitor de PDF e o próprio app vão dentro do APK.

## Pastas e arquivos
| Caminho | O que é |
|---|---|
| `src/app.html` | O app inteiro (telas, estilos e lógica) num arquivo só. |
| `src/pauta/pauta-mao-livre.html` | Editor de partitura à mão (S Pen). Vira `www/pauta.html`. |
| `scripts/build-web.mjs` | Monta `www/`: troca fontes e PDF.js da internet por arquivos locais e gera `index.html` e `pauta.html`. |
| `android/` | Projeto Android (Capacitor). |
| `.github/workflows/apk.yml` | Gera o APK a cada envio para o `main` e publica em Releases (`v0.1.N`, N = número da execução). |
| `testes/pauta/` | Testes automáticos (Node + jsdom). |
| `testes/perf/` | Medição de desempenho (Playwright + Chromium com processador desacelerado). |
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
| `config` | Configurações: instrumento, modo, estilo, contorno, folha da partitura, fonte, cor. |
| `pauta.html` (outra página) | Editor da partitura escrita à mão; abre por Partituras › + › Criar partitura. |

## Onde os dados ficam (no aparelho)
| Chave | Conteúdo |
|---|---|
| `localStorage['repertorio.v1']` | Banco principal (`db`): usuário, papel, cifras (`songs`, em ChordPro), visualização por música (`view`: tom, capo, colunas, zoom), favoritas, listas, partituras (catálogo e importadas), pastas, preferências (`prefs`). |
| `localStorage['repertorio.notes.v1']` | Anotações à mão (cifra e partitura). |
| `localStorage['pauta-mao-livre.v2']` | Partituras escritas na pauta, desenhos ensinados, preferências da Biblioteca. |
| `IndexedDB 'repertorio-pdf'` | Os arquivos PDF baixados ou importados. |
| `db.tourDone` | Data em que a pessoa terminou o tour (sem ela, o tour começa sozinho ao entrar). |
| Outras chaves pequenas | Dicas já vistas, "só caneta", pedido de abertura da pauta e volta para a pasta. |

- **Gravação:** `save()` agrupa as mudanças e grava o banco ~0,3 s depois; ao sair ou minimizar grava na hora (`saveNow()`).
- **Drive:** o app **só lê** o Google Drive (catálogo de 48 partituras dos Adoradores). Escrita no Drive e sincronização ficam para a fase 2.

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
- Plugins: `@capacitor/app`, `filesystem`, `share`, `keep-awake`.

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
