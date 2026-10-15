# Medição de desempenho

Simula um tablet intermediário: processador 4x mais lento (mude com `T=6`), tela 1280x800, densidade 2.

```
npm run build:web                       # na raiz
python3 testes/perf/gerar-pdfs.py       # PDFs de teste em www/perf/
cd www && python3 -m http.server 8765   # deixe rodando
cd testes/perf && npm i playwright && node medir.js
```
Mede: abrir o app com 300 cifras, lista e busca de cifras, abrir cifra, subir tom, ajustar à tela, partituras, listas,
PDF de 12 páginas e escaneado de 6 (memória das páginas), editor da pauta com 60, 300 e 800 notas.
Resultados e análise em `docs/PERFORMANCE.md`.
