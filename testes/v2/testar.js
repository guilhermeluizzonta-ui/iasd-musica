// Testes da versão 2 (ramo v2-ensaio): devocional, metrônomo, referência, roteiro, acordes, histórico, pauta tocando
// Uso: npm run build:web (na raiz) · cd www && python3 -m http.server 8765 · cd testes/v2 && npm i playwright && node testar.js
// Se o Chromium do Playwright não estiver instalado: CHROMIUM=/caminho/do/chrome node testar.js
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8765';
let ok = 0, tot = 0; const chk = (n, c, info) => { tot++; if (c) ok++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (info !== undefined ? ' → ' + JSON.stringify(info) : '')); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 900, height: 1000 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL + '/index.html'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { localStorage.clear(); }); await pg.reload(); await pg.waitForTimeout(300);
  await pg.evaluate(() => { db.user = { name: 'Teste' }; db.role = 'editor'; save(); enterApp(); });
  const sid = await pg.evaluate(() => activeSongs().find(s => songParts(s.text).length >= 2).id);

  // 1) Devocional
  chk('Devocional é o 1º item do menu', await pg.evaluate(() => document.querySelector('.nav-item[data-nav]').dataset.nav === 'devocional'));
  await pg.evaluate(() => go('devocional'));
  await pg.fill('#dv-ped-in', 'Ensaio de quarta'); await pg.click('#dv-ped-form button[type=submit]');
  chk('pedido de oração anotado', await pg.evaluate(() => db.pedidos.length === 1));
  await pg.evaluate(id => { db.lists.push({ id: 'l1', title: 'Culto', date: todayIso(), devo: { on: true, openBy: 'Ana' }, items: [{ id: 'i1', songId: id, shift: 0, note: '' }], created: 1, updated: 1 }); save(); go('lista', { id: 'l1', back: { name: 'listas' } }); }, sid);
  await pg.click('[data-li-start]');
  chk('Começar abre a abertura', await pg.evaluate(() => route.name === 'devocional' && route.idx === -1));
  await pg.click('[data-dv-start]'); chk('depois vem a música', await pg.evaluate(() => route.name === 'cifra' && route.idx === 0));
  await pg.click('#ln-next'); chk('no fim, oração final', await pg.evaluate(() => route.name === 'devocional' && route.idx === 1));
  await pg.evaluate(() => { listById('l1').devo.on = false; go('lista', { id: 'l1', back: { name: 'listas' } }); });
  await pg.click('[data-li-start]'); chk('sem devocional, começa na música', await pg.evaluate(() => route.name === 'cifra'));

  // 2) Metrônomo
  await pg.evaluate(id => go('cifra', { id }), sid);
  await pg.click('#v-cifra [data-ens="metro"]'); await pg.click('.ens-pop [data-m="5"]'); await pg.click('.ens-pop [data-m-time="3/4"]');
  await pg.click('.ens-pop [data-m-play]'); await pg.waitForTimeout(1200);
  chk('metrônomo rodando', await pg.evaluate(() => ens.run));
  await pg.click('.ens-pop [data-m-save]');
  chk('andamento gravado na cifra', await pg.evaluate(id => /\{tempo: 85\}/.test(songById(id).text) && /\{time: 3\/4\}/.test(songById(id).text), sid));
  await pg.evaluate(() => go('cifras')); chk('trocar de tela para o metrônomo', await pg.evaluate(() => !ens.run));

  // 3) Nota de referência
  await pg.evaluate(id => go('cifra', { id }), sid);
  await pg.click('#v-cifra [data-ens="ref"]');
  for (const r of ['tonica', 'acorde', 'escala', 'coral']) await pg.click(`.ens-pop [data-r="${r}"]`);
  chk('notas do coral no tom G', await pg.evaluate(() => JSON.stringify(satbOf(songKeyInfo(songById(cur.id), 0)))), );
  chk('S/C/T/B = G4/B3/D4/G2', await pg.evaluate(() => { const s = satbOf(songKeyInfo(songById(cur.id), 0)); return s.S === 67 && s.C === 59 && s.T === 62 && s.B === 43; }));

  // 4) Roteiro
  await pg.evaluate(() => closeEnsPop());
  await pg.click('#rot-bar [data-ens="rot"]');
  const parts = await pg.evaluate(id => songParts(songById(id).text), sid);
  for (const x of ['Intro', parts[0], parts[1], parts[1], 'Final']) await pg.click(`.ens-pop [data-rot-add="${x}"]`);
  await pg.click('.ens-pop [data-rot-save]');
  chk('roteiro gravado na cifra', await pg.evaluate(id => rotOfSong(songById(id)).length === 5, sid));
  chk('repetição vira ×2', await pg.evaluate(() => /×2/.test(document.getElementById('rot-bar').textContent)));

  // 6) Acordes
  const sh = await pg.evaluate(() => ['C', 'D/F#', 'Bm7', 'E7(9)', 'A7(4)', 'F#m7(b5)'].map(n => (fretShape(n, 'violao') || {}).frets.join(' ')));
  chk('formas do violão', sh[0] === '-1 3 2 0 1 0' && sh[1] === '2 -1 0 2 3 2' && sh[2] === '-1 2 0 2 0 2', sh);
  chk('7(4) é sus4 com sétima', await pg.evaluate(() => chordTones('A7(4)').ints.sort((a, b) => a - b).join(',') === '0,5,7,10'));
  await pg.click('#t-dg'); chk('faixa dos acordes aparece', await pg.evaluate(() => document.querySelectorAll('#dg-bar .dg').length > 3));
  await pg.click('[data-dg-inst="teclado"]'); chk('teclado', await pg.evaluate(() => !!document.querySelector('#dg-bar .kb')));

  // 7) Histórico e cantores
  await pg.evaluate(id => { db.lists.push({ id: 'l2', title: 'Antes', date: isoDay(new Date(Date.now() - 10 * 864e5)), items: [{ id: 'x', songId: id, shift: 2, note: '' }] }); save(); go('cifra', { id }); }, sid);
  chk('linha do histórico', await pg.evaluate(() => /tocada hoje em G · 2 vezes/.test(document.getElementById('viewer-sub').textContent)), await pg.evaluate(() => document.getElementById('viewer-sub').textContent));
  await pg.click('#t-key'); await pg.fill('#keypick .kp-saveform input', 'Maria'); await pg.click('#keypick .kp-saveform button');
  chk('tom do cantor guardado', await pg.evaluate(id => db.cantores[id][0].n === 'Maria', sid));

  // 8 e 9) Pauta tocando
  await pg.goto(URL + '/pauta.html'); await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    const it = (id, tipo, x, ss, p) => ({ id, tipo, s: ss[ss.length - 1], ss, x, l: 0, p, dir: 'up' });
    const itens = [it('a1', 'seminima', 40, [4, 2], 0), it('a2', 'seminima', 55, [5, 2], 0), it('a3', 'seminima', 70, [4, 1], 0), it('a4', 'seminima', 85, [4, 2], 0), { id: 'br', tipo: 'barra', x: 95, l: 0, p: 0 },
      it('a5', 'semibreve', 105, [4, 2], 0), { id: 'lg', tipo: 'ligadura', a: 'a4', b: 'a5', l: 0, p: 0 }, it('b1', 'minima', 40, [3, 0], 1), it('b2', 'minima', 70, [4, 1], 1), it('b3', 'semibreve', 105, [3], 1)];
    localStorage.setItem('pauta-mao-livre.v2', JSON.stringify({ musicas: [{ id: 'mt', titulo: 'Coral', tom: 'G', compasso: { num: 4, den: 4, simbolo: '' }, unidade: { tipo: 'seminima', ponto: false }, andamento: 240, clave: 'sol', linhas: [{ pautas: ['sol', 'fa'] }], itens, anot: [] }], atual: 'mt', guiaNaoMostrar: true }));
  });
  await pg.reload(); await pg.waitForTimeout(300);
  const mt = await pg.evaluate(() => { const r = window.__tocador.montar(); return { v: Object.values(r.vozes), e: r.evs.map(e => e.midi + '@' + e.q + '/' + e.d) }; });
  chk('vozes do coral', mt.v.join() === 'Soprano,Contralto,Tenor,Baixo', mt.v);
  chk('armadura (Fá♯) e ligadura (5 tempos)', mt.e.includes('66@2/1') && mt.e.includes('71@3/5') && !mt.e.some(x => x.endsWith('@4/4') && x.startsWith('71')), mt.e);
  await pg.click('#bTocar'); await pg.click('[data-mudo="0:baixo"]'); await pg.click('#tcContar'); await pg.click('#tcPlay'); await pg.waitForTimeout(500);
  chk('cursor acende as notas', await pg.evaluate(() => document.querySelectorAll('.nota.tocando').length > 0));
  await pg.waitForTimeout(2200);
  chk('para no fim', await pg.evaluate(() => !window.__tocador.TOC.rodando));
  chk('sem erros de script', errs.length === 0, errs);
  console.log(`\n${ok} de ${tot}`);
  await b.close(); process.exit(ok === tot ? 0 : 1);
})();
