# Biblioteca do Drive (cifras e partituras)

O app lê as pastas **Cifras** e **Partituras** do Drive do ministério (`App de Cifras - Projeto`) por um pequeno
Google Apps Script (`drive/biblioteca.gs`). O script roda com a conta do Guilherme:

- as pastas **não precisam ser públicas**;
- o script só entrega arquivos que estão dentro dessas duas pastas;
- só lê: não cria, não muda e não apaga nada no Drive.

## Publicar o script (uma vez)
1. Abra <https://script.google.com>, toque em **Novo projeto** e dê o nome **IASD Música - Biblioteca**.
2. Apague o que estiver em `Código.gs` e cole todo o conteúdo de `drive/biblioteca.gs`. Salve.
3. No alto, escolha a função **autorizar** e toque em **Executar**. O Google pede permissão para ler o Drive:
   **Revisar permissões › sua conta › Avançado › Acessar IASD Música - Biblioteca (não seguro) › Permitir**.
   (O aviso aparece porque o script é seu e não passou pela verificação do Google.)
4. **Implantar › Nova implantação › ⚙ › App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   - **Implantar** e copie o **URL do app da Web** (termina em `/exec`).
5. Mande o endereço para o Claude pôr como padrão no app (`BIB_URL_PADRAO`) ou cole em
   **Configurações › Biblioteca do Drive › Testar e salvar** (só o editor vê).

Mudou o script depois? **Implantar › Gerenciar implantações › ✏ › Versão: Nova versão**. O endereço continua o mesmo.

## Como o app usa
- **Cifras › + › Importar:** escolha **Biblioteca do ministério** ou **Arquivo do aparelho**.
  Na biblioteca aparecem as pastas e as músicas do Drive; ao tocar numa, o app pergunta se quer baixar.
  A cifra baixada vira ChordPro (título e artista saem do nome do arquivo: `Artista - Título.txt`;
  o desenho dos acordes no fim do arquivo e a 1ª linha com o nome são retirados).
- **Sincronizar:** a biblioteca se atualiza sozinha ao abrir (se a lista tem mais de 2 min) e pelo botão.
  Sem internet, mostra a última lista guardada. Marcas: **Nova** (entrou no Drive desde a última vez),
  **Baixada**, **Nova versão** (o arquivo mudou no Drive depois de baixado; tocar oferece Atualizar).
- **Busca:** na biblioteca, responde "Sim: está na biblioteca (N músicas)" ou "Não encontrei … na biblioteca". Na busca de Cifras, se a música não está entre as baixadas, aparece "Na biblioteca do ministério: N músicas … Ver na biblioteca" (ou que também não está lá).
- **Sem internet:** aviso vermelho na biblioteca e em Partituras; mostra a última lista guardada; tocar numa música não baixada explica que precisa de internet; as já baixadas abrem normalmente. Quando a rede volta, sincroniza sozinho.
- As cifras baixadas aparecem em **Cifras** junto com as outras (filtro Todas).
- **Cifras: Todas · Minhas · Biblioteca** separa as baixadas da biblioteca das criadas/importadas pela pessoa.
- **Partituras:** a lista vem do Drive (sincroniza ao abrir a tela, se tem mais de 10 min, e pelo botão).
  Partitura nova entra na pasta com o mesmo caminho do Drive. A que saiu do Drive some da lista;
  se já estava baixada, continua no aparelho marcada "fora do acervo do Drive".
  Enquanto o script não estiver ligado, vale a lista fixa antiga (48 dos Adoradores).
- O músico também importa cifras (biblioteca ou aparelho); editar continua só com o editor.

## Formato dos arquivos de cifra no Drive
- Um `.txt` por música, nome `Coleção ou artista - Título.txt` (ex.: `Novo Hinário Adventista - Renova-me.txt`).
- Acordes na linha de cima da letra; partes entre colchetes (`[Intro]`, `[Primeira Parte]`, `[Refrão]`).
- Opcional: linha `Tom: G`. Arquivo em ChordPro também serve.

## Teste
`cd testes/biblioteca && node testar-biblioteca.js [tablet|celular]` (script falso no lugar do Google; servidor em `www/` na porta 8765).
