// Slides › Enviar pelo WhatsApp, com plugins nativos falsos (Filesystem, WhatsApp, Share).
// Uso: npm run build:web; cd www && python3 -m http.server 8765; cd testes/whatsapp && node testar.js
const { chromium } = require('playwright');
let ok = 0, falhas = 0; const conf = (c, n) => { if (c) { ok++; console.log('OK   ', n); } else { falhas++; console.log('FALHA', n); } };
const LETRA = `{title: Canção de Teste}
{artist: Ministério da Música}
{key: G}

{start_of_verse: 1ª Estrofe}
[G]Primeira linha de teste
[C]Segunda linha de teste
{end_of_verse}

{start_of_chorus: Refrão}
[D]Refrão de teste aqui
[G]Fim do refrão
{end_of_chorus}`;
async function rodar(semZap) {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 700 } });
  await ctx.addInitScript((semZap) => {
    window.__log = [];
    const ok = (v) => Promise.resolve(v);
    const falso = { getPlatform: () => 'android', Plugins: {
      Filesystem: { writeFile: (o) => { window.__log.push(['fs', o.path, o.directory, (o.data || '').length]); return ok({ uri: 'file:///data/cache/' + o.path }); } },
      WhatsApp: { shareFile: (o) => { window.__log.push(['wa', o]); return semZap ? Promise.reject(Object.assign(new Error('WhatsApp não encontrado'), { code: 'SEM_WHATSAPP' })) : ok({ app: 'com.whatsapp' }); } },
      Share: { share: (o) => { window.__log.push(['share', o]); return ok({}); } },
      App: { addListener: () => ok({ remove() {} }) }, KeepAwake: { keepAwake: ok, allowSleep: ok }, Immersive: { enter: ok, exit: ok } } };
    Object.defineProperty(falso, 'isNativePlatform', { value: () => true, writable: false });   // o capacitor.js do www não troca o falso
    Object.defineProperty(window, 'Capacitor', { get: () => falso, set: () => {}, configurable: true });
  }, semZap);
  const pg = await ctx.newPage(); const erros = []; pg.on('pageerror', e => { if (!/read only property 'isNativePlatform'/.test(e.message)) erros.push(e.message); });
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(400);
  await pg.evaluate((letra) => {
    db.user = { name: 'T', email: 't@t.t' }; db.role = 'editor'; db.tourDone = 1;
    db.songs.push({ id: 'w1', title: 'Canção de Teste', artist: 'Ministério da Música', text: letra, source: '', archived: false, created: 1, updated: 1 });
    db.lists = [{ id: 'lw', title: 'Culto de teste', date: '2026-10-17', time: '', leader: '', note: '', devo: { on: false }, created: 1, updated: 1, items: [{ id: 'i1', songId: 'w1', shift: 0, note: '' }] }];
    save(); enterApp(); if (tour.on) tourEnd(true);
    go('slides', { id: 'lw', back: { name: 'lista', params: { id: 'lw' } } });
  }, LETRA);
  await pg.waitForTimeout(800);
  return { b, pg, erros };
}
(async () => {
  let { b, pg, erros } = await rodar(false);
  conf(await pg.isVisible('#sl-zap-go'), 'Slides tem o botão Enviar pelo WhatsApp');
  await pg.fill('#sl-zap', '(47) 99999-1234'); await pg.dispatchEvent('#sl-zap', 'change'); await pg.waitForTimeout(150);
  conf(await pg.evaluate('db.slideZap') === '(47) 99999-1234', 'guarda o número da sonoplastia');
  await pg.click('#sl-zap-go'); await pg.waitForTimeout(6000);
  let log = await pg.evaluate('window.__log');
  const fs1 = log.find(x => x[0] === 'fs'), wa = log.find(x => x[0] === 'wa');
  conf(fs1 && /\.pptx$/.test(fs1[1]) && fs1[2] === 'CACHE' && fs1[3] > 1000, 'grava o .pptx no cache do app');
  conf(wa && wa[1].mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' && /\.pptx$/.test(wa[1].path), 'manda o arquivo para o WhatsApp');
  conf(wa && wa[1].phone === '5547999991234', 'com o número da sonoplastia (DDI 55)');
  conf(!log.some(x => x[0] === 'share'), 'não abre a lista de apps quando o WhatsApp está instalado');
  await pg.reload(); await pg.waitForTimeout(500); await pg.evaluate("go('slides', { id: 'lw' })"); await pg.waitForTimeout(500);
  conf(await pg.inputValue('#sl-zap') === '(47) 99999-1234', 'o número continua lá ao voltar');
  const e1 = erros.slice(); await b.close();
  ({ b, pg, erros } = await rodar(true));
  await pg.click('#sl-zap-go'); await pg.waitForTimeout(6000);
  log = await pg.evaluate('window.__log');
  conf(log.some(x => x[0] === 'share'), 'sem WhatsApp no aparelho: abre o compartilhar comum');
  conf(!e1.length && !erros.length, 'sem erros' + (e1.concat(erros).length ? ': ' + e1.concat(erros).join(' | ') : ''));
  await b.close();
  console.log(`\n${ok} de ${ok + falhas}`); process.exit(falhas ? 1 : 0);
})();
