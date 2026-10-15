// Mede o app com o processador 4x mais lento (perto de um tablet intermediário)
const { chromium } = require('playwright');
const THROTTLE = +(process.env.T || 4);
const res = {};
const frame = 'new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)))';
(async () => {
  const b = await chromium.launch({ args: ['--enable-precise-memory-info'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => {
    window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    const set = Storage.prototype.setItem; window.__saves = { n: 0, ms: 0, kb: 0 };
    Storage.prototype.setItem = function (k, v) { const t = performance.now(); set.call(this, k, v); window.__saves.n++; window.__saves.ms += performance.now() - t; window.__saves.kb = Math.max(window.__saves.kb, Math.round(v.length / 1024)); };
  });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(pg);
  await cdp.send('Performance.enable');
  const heap = async () => { const m = (await cdp.send('Performance.getMetrics')).metrics; return Math.round(m.find(x => x.name === 'JSHeapUsedSize').value / 1048576); };
  // 1) monta um repertório grande: 300 cifras, 60 partituras, 20 listas
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(500);
  await pg.evaluate(() => {
    db.user = db.user || { name: 'Teste' }; db.role = 'editor';
    const base = SEED[0].text;
    for (let i = 0; i < 300; i++) db.songs.push({ id: 'p' + i, title: 'Música de teste ' + i, artist: 'Artista ' + (i % 30), text: base.replace(/^\{title:[^}]*\}/m, `{title: Música de teste ${i}}`), created: Date.now() - i });
    for (let i = 0; i < 60; i++) db.scores.push({ id: 'sc' + i, title: 'Partitura ' + i, file: 'x.pdf', size: 1, pages: 4, album: 'A', folderId: null, local: false, added: i });
    for (let i = 0; i < 20; i++) db.lists.push({ id: 'l' + i, title: 'Culto ' + i, date: '2026-10-1' + (i % 9), time: '', leader: '', note: '', items: db.songs.slice(i * 5, i * 5 + 8).map((s, k) => ({ id: 'it' + i + k, songId: s.id, shift: 0, note: '' })), created: 1, updated: 1 });
    save();
  });
  res.tamanhoBanco_KB = await pg.evaluate(() => Math.round(localStorage.getItem(STORE).length / 1024));
  // 2) abertura do app com o processador lento
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  const t0 = Date.now(); await pg.reload({ waitUntil: 'load' }); await pg.evaluate(frame); res.abrirApp_ms = Date.now() - t0;
  res.abrirApp_tarefasLongas = await pg.evaluate(() => window.__lt.slice());
  res.memoriaJS_MB_inicio = await heap();
  const medir = async (nome, fn) => { await pg.evaluate(() => { window.__saves = { n: 0, ms: 0, kb: 0 }; window.__lt = []; }); const t = Date.now(); await pg.evaluate(fn); await pg.evaluate(frame); res[nome] = { ms: Date.now() - t, gravacoes: await pg.evaluate(() => ({ n: window.__saves.n, ms: Math.round(window.__saves.ms), kb: window.__saves.kb })), tarefasLongas: await pg.evaluate(() => window.__lt.slice()) }; };
  await medir('listaCifras_300', () => go('cifras'));
  await medir('buscaDigitando', async () => { const q = document.getElementById('list-q'); for (const ch of 'santo') { q.value += ch; q.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 0)); } });
  await medir('abrirCifra', () => go('cifra', { id: 'p5' }));
  await medir('subirTom', () => document.getElementById('t-up').click());
  await medir('ajustarATela', () => document.getElementById('t-fit').click());
  await medir('listaPartituras_60', () => go('partituras'));
  await medir('listas_20', () => go('listas'));
  // 3) PDFs
  for (const [arq, id] of [['vetor12.pdf', 'pv1'], ['scan6.pdf', 'pv2']]) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await pg.evaluate(async ([arq, id]) => { const bl = await (await fetch('perf/' + arq)).blob(); await idbPut(id, bl); db.scores.push({ id, title: arq, file: arq, size: bl.size, pages: null, album: '', folderId: null, local: true, added: 1 }); save(); }, [arq, id]);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
    const h0 = await heap(); const t = Date.now();
    await pg.evaluate(id => go('partitura', { id }), id);
    await pg.waitForFunction(() => [...document.querySelectorAll('#pv-pages canvas')].some(c => c.width > 0), null, { timeout: 120000 });
    const tPrimeira = Date.now() - t;
    await pg.waitForTimeout(THROTTLE * 2500);
    const mem = () => pg.evaluate(() => Math.round([...document.querySelectorAll('#pv-pages canvas')].reduce((a, c) => a + c.width * c.height * 4, 0) / 1048576));
    const m1 = await mem();
    await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(THROTTLE * 2500);
    const m2 = await mem();
    const desenhadas = await pg.evaluate(() => [...document.querySelectorAll('#pv-pages canvas')].filter(c => c.width > 0).map(c => c.dataset.page).join(','));
    res['pdf_' + arq] = { paginas: await pg.evaluate(() => pv.doc.numPages), primeiraPagina_ms: tPrimeira, memoriaCanvas_MB_inicio: m1, memoriaCanvas_MB_noFim: m2, paginasNaMemoriaNoFim: desenhadas, memoriaJS_MB: (await heap()) - h0 };
    await pg.evaluate(() => window.scrollTo(0, 0));
  }
  // 4) Editor da pauta com muitas notas: tempo de redesenhar a folha inteira
  for (const N of [60, 300, 800]) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await pg.evaluate(N => {
      const itens = []; let l = 0, x = 22;
      for (let i = 0; i < N; i++) { itens.push({ id: 'n' + i, tipo: 'seminima', l, p: 0, x, s: i % 9, ss: [i % 9], dir: (i % 9) >= 4 ? 'down' : 'up' }); x += 8; if ((i + 1) % 4 === 0) { itens.push({ id: 'b' + i, tipo: 'barra', l, p: 0, x }); x += 5; } if (x > 120) { l++; x = 22; } }
      const linhas = Array.from({ length: l + 1 }, () => ({ pautas: ['sol'] }));
      localStorage.setItem('pauta-mao-livre.v2', JSON.stringify({ musicas: [{ id: 'm', titulo: 'Grande', clave: 'sol', tom: 'G', compasso: { num: 4, den: 4 }, unidade: { tipo: 'seminima' }, linhas, itens, anot: [] }], atual: 'm', guiaNaoMostrar: true }));
    }, N);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
    const t = Date.now(); await pg.goto('http://localhost:8765/pauta.html?app=1&abrir=m', { waitUntil: 'load' }); await pg.evaluate(frame); const abrir = Date.now() - t;
    await pg.evaluate(() => { window.__lt = []; window.__saves = { n: 0, ms: 0, kb: 0 }; });
    const t2 = Date.now(); await pg.click('#bTema'); await pg.evaluate(frame); const redesenho = Date.now() - t2;
    res['pauta_' + N + 'notas'] = { abrir_ms: abrir, redesenharTudo_ms: redesenho, nos_SVG: await pg.evaluate(() => document.querySelectorAll('svg *').length), paginas: await pg.evaluate(() => document.querySelectorAll('.papel').length) };
  }
  res.erros = errs;
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
