// Músico: partitura escrita (pauta) abre só para ver; editor continua editando.
// Uso: npm run build:web; cd www && python3 -m http.server 8765; cd testes/pauta-musico && node testar.js
const { chromium } = require('playwright');
let ok = 0, falhas = 0; const conf = (c, n) => { if (c) { ok++; console.log('OK   ', n); } else { falhas++; console.log('FALHA', n); } };
const MUS = { id: 'm1', titulo: 'Teste', clave: 'sol', tom: 'C', compasso: { num: 4, den: 4 }, unidade: { tipo: 'seminima' }, linhas: [{ pautas: ['sol'] }], itens: [{ id: 'n1', tipo: 'seminima', l: 0, p: 0, x: 30, s: 2, ss: [2], dir: 'up' }], anot: [] };
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 1024, height: 640 } })).newPage();
  const erros = []; pg.on('pageerror', e => erros.push(e.message));
  for (const papel of ['musico', 'editor']) {
    await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(300);
    await pg.evaluate(([papel, m]) => { const d = JSON.parse(localStorage.getItem('repertorio.v1') || '{}'); d.role = papel; d.user = { name: 'T', email: 't@t.t' }; d.tourDone = 1; localStorage.setItem('repertorio.v1', JSON.stringify(d)); localStorage.setItem('pauta-mao-livre.v2', JSON.stringify({ musicas: [m], atual: m.id, guiaNaoMostrar: true })); }, [papel, MUS]);
    await pg.goto('http://localhost:8765/pauta.html?app=1&abrir=m1'); await pg.waitForTimeout(900);
    const st = await pg.evaluate(() => ({ ver: document.body.classList.contains('visualizar'), soVer: document.body.classList.contains('so-ver'), editarVisivel: !!document.getElementById('segEditar').getClientRects().length, listaVisivel: !!document.getElementById('bMusica').getClientRects().length }));
    if (papel === 'musico') {
      conf(st.ver && st.soVer, 'músico: a partitura abre em Visualizar');
      conf(!st.editarVisivel && !st.listaVisivel, 'músico: sem botão Editar e sem lista de músicas');
      await pg.evaluate(() => document.getElementById('segEditar').click()); await pg.waitForTimeout(150);
      conf(await pg.evaluate(() => document.body.classList.contains('visualizar')), 'músico: não consegue voltar para Editar');
      await pg.evaluate(() => document.getElementById('bTitulo') && document.getElementById('bTitulo').click()); await pg.waitForTimeout(150);
      conf(await pg.evaluate(() => document.getElementById('tituloEd').hidden), 'músico: não muda o nome');
    } else {
      conf(!st.ver && !st.soVer && st.editarVisivel, 'editor: abre editando, com Editar e Visualizar');
    }
  }
  conf(!erros.length, 'sem erros' + (erros.length ? ': ' + erros.join(' | ') : ''));
  console.log(`\n${ok} de ${ok + falhas}`); await b.close(); process.exit(falhas ? 1 : 0);
})();
