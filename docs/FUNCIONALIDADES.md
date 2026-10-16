# O que o app faz (por área)

Atualizado em 14/10/2026 — versão v0.1.5 (+ melhorias de desempenho prontas no ramo `listas`).
Papéis: **Editor** (cadastra e organiza) e **Músico** (usa). O que vale só para o Editor está marcado.

## Entrada e Início
- Entrar / Criar conta (local, sem servidor). No cadastro: "Você louva com" (Banda, Orquestra, Coral, Louvor) e instrumento ou voz. Modo de teste.
- Início: logo da IASD, "Jaraguá do Sul - Central", data, saudação, versículo do dia, visualizadas recentemente, próximo culto.

## Tour do app
- **Primeiro acesso:** logo depois de entrar, o tour começa sozinho e o app só fica liberado no fim (32 passos, uns 3 minutos). Sem "Sair" nessa primeira vez; o botão voltar do Android volta um passo.
- **Menu › Tour do app:** para rever quando quiser, aí com "Sair do tour".
- Cada passo destaca um botão e explica para que serve. Nos passos com a mãozinha, o tour espera a pessoa tocar no destaque (abrir o menu, entrar em Cifras, subir o tom, anotar, abrir a letra, começar o modo culto).
- Ordem: Início e menu → cifra (tom, instrumento, simplificar, colunas, tamanho, tela cheia, anotar, favoritar) → letra → partituras → lista de culto e modo culto → claro/escuro.
- Usa uma cifra e uma lista de exemplo (ids `tour-*`), retiradas no fim junto com as anotações feitas nelas.

## Cifras
- **Biblioteca do ministério (Drive):** Cifras › + › Importar › Biblioteca. Pastas e músicas do Drive, sincroniza ao abrir e pelo botão; toque na música e baixe. Marcas Nova / Baixada / Nova versão. Filtro Todas · Minhas · Biblioteca. Detalhes em `docs/BIBLIOTECA.md`.
- Repertório com busca (título e artista), painéis de favoritas e recentes, lixeira (apagar volta pela lixeira).
- Cifra aberta: tom − / tom / + e grade para escolher o tom (só muda na tela de quem usa); **capotraste** (sem capo, 1ª a 9ª casa, com "formas de G" e formas fáceis) para quem toca violão, guitarra, ukulele, cavaquinho, viola caipira ou bandolim; simplificar acordes; colunas Auto/1–4; tamanho do texto; ajustar à tela; tela cheia com tela acesa; pinça para zoom; anotar à mão (cores, marca-texto, texto, borracha); favoritar; adicionar à lista (Editor); compartilhar em ChordPro; abrir partitura e letra ligadas.
- Editor (Editor): colar/importar de sites (Cifra Club, Banana Cifras), ChordPro, importar vários de um .txt, tom sugerido pelos acordes.
- *Em outro ramo (ainda não no app publicado):* **Criar cifra** visual — letra por partes e acordes arrastados até a sílaba.

## Letras
- Saem da própria cifra (sem acordes); busca por título, artista ou trecho; favoritas e recentes próprias; tom para cantar, colunas, tamanho, pinça, tela cheia.

## Partituras
- Catálogo dos Adoradores (48 PDFs do Drive, só leitura), baixar no aparelho (uma ou todas), funciona sem internet depois.
- Pastas em níveis, organizadas por cada um no próprio aparelho; mover, renomear, excluir (o conteúdo sobe um nível).
- Importar PDF do aparelho (nome repetido vira "Cópia (1)"), ligar à cifra.
- PDF aberto: zoom (botões e pinça), página atual, tela cheia com toque nas laterais para passar página, anotar à mão.
- **Criar partitura** (+ › Criar partitura): ficha com prévia desenhada (clave, armadura, compasso) e abre o editor da pauta.

## Editor da pauta (Pauta a Mão Livre)
- Escrever notas à mão com a S Pen (semibreve a semicolcheia, acordes, pausas, acidentes, ponto/staccato, ligaduras, barra de compasso, barra de colcheias) ou arrastar da Biblioteca.
- Ficha da música (formação Sol/Fá/Dó/piano, tom, compasso, unidade, andamento), nome das notas e cifra dos acordes, conferência do compasso (✓ / falta / passou).
- Linhas (+)/(−), páginas A4 automáticas, clave por linha, sistema de piano.
- Ferramentas: Ponteiro, Caneta, Mover, Anotar, Borracha que varre (um Desfazer devolve o risco), Ajustar espaçamento, Desfazer, Biblioteca (favoritos, recentes, acordes prontos), Ensinar meu desenho, Editar/Visualizar, tela cheia, sol/lua da folha.

## Listas de culto
- Criar (título, data, hora, responsável, observação), escolher músicas, tom do culto por música, reordenar, clonar, "Abrir em" cifra/partitura/letra, modo culto com próxima/anterior, próximo culto no Início.

## Configurações
- Meu instrumento; Modo (claro, escuro, seguir o aparelho); Estilo (Simples, Moderno, Retrô); Contorno; Folha da partitura (Clássica, Creme, Suave, Palco, Retrô); Fonte; Cor de destaque; Salvar / Restaurar padrão.

## Android (APK)
- Botão voltar inteligente, compartilhar, tela acesa, tela cheia imersiva, ícone e nome "IASD Música".

## Ainda não (planejado)
- Exportar PDF da partitura escrita (próximo); importar foto/PDF de partitura (OMR); sincronizar e publicar no Drive; acervo de cifras; slides; grade do maestro e partes com transposição; letra na pauta; login com servidor (fase 2).
