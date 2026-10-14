# Criar cifra — checkpoint

Iniciado em 14/10/2026, ramo `cifra-criar`. Mesmo caminho da Pauta a Mão Livre: protótipo primeiro, depois integração no app.

## Onde está
- `src/cifra/criar-cifra.html` — protótipo completo, um arquivo só. Publicado no Claude como Artifact "Criar Cifra" (versão 1).
- `testes/cifra/` — testes jsdom: `npm install` e `node testar.js ../../src/cifra/criar-cifra.html` (17 testes, todos passam).

## Como funciona (protótipo)
- **Ficha:** título, artista e tom (maior/menor + grade de 12). O tom define a paleta. Mudar o tom depois pergunta se transpõe os acordes já colocados.
- **Partes:** Intro, Estrofe (numeração automática), Pré-refrão, Refrão, Ponte, Solo, Interlúdio, Final. Intro/Solo/Interlúdio/Final são só de acordes. Menu da parte: renomear, mover, repetir logo abaixo (com acordes), apagar. "Adicionar parte" também repete uma parte existente no fim.
- **Modo Letra:** caixa de texto por parte. Ao editar, os acordes já colocados andam junto com o texto.
- **Modo Acordes:** a letra vira letra por letra (alvos). Paleta presa embaixo: acordes do tom com o grau (I, ii…), "também comuns" (V7, sus, dominantes secundárias, inversões), acordes desta música e **montador** (nota, tipo, baixo).
  - Arrastar da paleta até a sílaba (puxando para cima; deslizar para o lado rola a fileira).
  - Ou tocar no acorde (fica amarelo) e ir tocando nas sílabas.
  - Acorde colocado: arrastar move; arrastar até a paleta tira; tocar abre Trocar / Tirar. Com acorde escolhido, tocar num colocado troca.
  - Acordes vizinhos não se sobrepõem (a sílaba seguinte é empurrada).
- Desfazer (até 120 passos), Visualizar (igual à cifra aberta no app + texto ChordPro), Salvar (no protótipo, localStorage `cifra-criar.v1`).
- Saída em **ChordPro**, o mesmo formato das cifras importadas; também abre ChordPro existente (`fromChordPro`), então serve como editor visual das cifras já cadastradas.

## Integração com o app (feita em 14/10/2026, protótipo aprovado pelo Guilherme)
- Tudo dentro de `src/app.html` (tela `v-criar`, rota `criar`), sem página separada: funciona no APK e no visualizador do Claude. Estilos com prefixo `cc-`; código no bloco `CC` (perto do fim do script).
- **Cifras › + › Criar cifra** (primeiro item, amarelo; só Editor). O antigo "Nova cifra" passou a se chamar **Importar da internet** (é o editor de colar/ChordPro). O botão do repertório vazio também abre o Criar cifra.
- Começa pela **ficha** (título, artista, tom). Depois: Letra / Acordes, Adicionar parte, Desfazer, Ficha, **Editar como texto**, Visualizar (mesmo desenho da cifra aberta), **Salvar** (grava em `db.songs` como ChordPro e abre a cifra).
- **Editar** na cifra aberta agora abre o editor visual. Se a cifra tiver algo que ele ainda não representa (ex.: comentário com acorde no meio da letra), abre o editor de texto, como antes. A checagem compara letra, acordes e comentários na ida e volta (`CC.visualOk`).
- No editor de texto há o botão **Editor visual** (leva o texto como está). Do visual, **Editar como texto** faz o caminho inverso.
- **Rascunho**: cada mudança fica em `localStorage['cifra-criar.rascunho']`. Saindo sem salvar, um aviso diz onde continuar; a ficha de "Criar cifra" oferece Continuar / Descartar; ao Editar uma cifra com mudanças guardadas, aparece "Abrir".
- Voltar do Android e Esc: fecham menu, acorde escolhido, Visualizar e ficha antes de sair da tela.
- No celular a barra quebra em duas linhas (o Salvar nunca fica escondido); o aviso (toast) aparece logo acima da paleta.
- Testes: `testes/cifra/testar-app.js ../../src/app.html` (15 testes do fluxo completo no app).

## Próximos passos
1. Testar no tablet e no S20 FE com dedo e S Pen; gerar APK quando juntar com o `main`.
2. Ideias: tom − / + na própria tela; marcar repetições (2x); copiar acordes de uma estrofe para a outra; comentários no meio da letra no editor visual.
