// Percorre o tour do app como um usuário (Playwright + Chromium).
// Uso (na raiz): npm run build:web; cd www && python3 -m http.server 8765   (deixe rodando)
//                cd testes/tour && npm i playwright && node testar-tour.js [tablet|celular] [editor|musico]
const { chromium } = require('playwright');
const tela = process.argv[2] || 'tablet', papel = process.argv[3] || 'editor';
const [W, H] = tela === 'celular' ? [390, 844] : [1024, 640];
let ok = 0, falhas = 0;
const conf = (cond, nome) => { if (cond) { ok++; console.log('OK   ', nome); } else { falhas++; console.log('FALHA', nome); } };
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  const erros = []; pg.on('pageerror', e => erros.push(e.message));
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(400);
  if (papel === 'musico') await pg.click('[data-login-role="musico"]');
  await pg.fill('#l-email', 'teste@iasd.org'); await pg.fill('#l-pass', '12345678'); await pg.click('#f-login button[type=submit]');
  await pg.waitForTimeout(1200);
  conf(await pg.evaluate('tour.on && tour.mandatory'), 'primeiro acesso: o tour começa sozinho e é obrigatório');
  conf(await pg.evaluate("document.getElementById('tour-skip').hidden"), 'primeiro acesso: sem "Sair do tour"');
  conf(await pg.evaluate("!!document.querySelector('[data-open=\"tour-ag\"]') || db.songs.some(s => s.id === 'tour-ag')"), 'cifra de exemplo criada');
  const vistos = []; let k = 0;
  while (await pg.evaluate('tour.on') && k++ < 80) {
    await pg.waitForTimeout(450);
    const st = await pg.evaluate("({ i: tour.i, wait: !!tour.steps[tour.i].wait, free: !!tour.steps[tour.i].free, alvo: !!tour.el, visivel: (() => { if (!tour.el) return true; const r = tour.el.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight; })() })");
    if (!vistos.includes(st.i)) vistos.push(st.i);
    if (!st.visivel) conf(false, `passo ${st.i + 1}: destaque fora da tela ` + await pg.evaluate('JSON.stringify(tour.el.getBoundingClientRect())'));
    if (st.wait) {
      const [x, y] = await pg.evaluate('(() => { const r = tour.el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()');
      await pg.mouse.click(x, y); await pg.waitForTimeout(700);
    } else {
      if (st.free) { await pg.mouse.move(W * 0.3, 300); await pg.mouse.down(); await pg.mouse.move(W * 0.3 + 120, 310, { steps: 8 }); await pg.mouse.up(); }
      await pg.click('#tour-next'); await pg.waitForTimeout(400);
    }
  }
  const n = await pg.evaluate('TOUR_STEPS.length'); const await0 = await pg.evaluate('TOUR_STEPS.map(s => s.title)');
  const faltam = [...Array(n).keys()].filter(i => !vistos.includes(i)).map(i => (i + 1) + ' ' + (await0[i] || ''));
  conf(vistos.length === n, `passou por todos os passos (${vistos.length} de ${n})` + (faltam.length ? ' — faltou: ' + faltam.join(', ') : ''));
  const fim = await pg.evaluate("({ done: !!db.tourDone, demo: db.songs.some(s => s.id.startsWith('tour-')) || (db.lists || []).some(l => l.id.startsWith('tour-')), notas: Object.keys(notes).some(k => k.includes('tour-')), rota: route.name })");
  conf(fim.done, 'tour marcado como feito');
  conf(!fim.demo && !fim.notas, 'exemplos do tour retirados (cifras, lista e anotações)');
  conf(fim.rota === 'inicio', 'volta ao Início');
  await pg.reload(); await pg.waitForTimeout(1200);
  conf(!(await pg.evaluate('tour.on')), 'ao abrir de novo, o tour não recomeça');
  await pg.click('#menu-btn'); await pg.click('#nav-tour'); await pg.waitForTimeout(400);
  conf(await pg.evaluate("tour.on && !tour.mandatory && !document.getElementById('tour-skip').hidden"), 'Menu › Tour do app: abre com "Sair do tour"');
  await pg.click('#tour-skip'); await pg.waitForTimeout(300);
  conf(!(await pg.evaluate("tour.on || db.songs.some(s => s.id.startsWith('tour-'))")), 'Sair do tour fecha e limpa os exemplos');
  conf(!erros.length, 'sem erros no app' + (erros.length ? ': ' + erros.join(' | ') : ''));
  console.log(`\n${ok} de ${ok + falhas}`);
  await b.close(); process.exit(falhas ? 1 : 0);
})();
