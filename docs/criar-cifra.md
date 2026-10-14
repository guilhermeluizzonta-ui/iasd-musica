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

## Próximos passos
1. Guilherme testar no tablet/celular (dedo e S Pen) e aprovar o jeito de usar.
2. Integrar no app: Cifras › + › **Criar cifra** (junto de Nova cifra / Importar arquivo); salvar em `db.songs`; botão "Editar no modo visual" no editor de cifra.
3. Ideias: tom − / + na própria tela; marcar repetições (2x); copiar acordes de uma estrofe para a outra.
