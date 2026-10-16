// Slides da lista + ordem do roteiro na cifra e na letra (ramo slides)
// Uso: npm run build:web (na raiz) · cd www && python3 -m http.server 8765 · cd testes/slides && node testar.js [pasta-de-saída]
// Precisa do playwright (npm i playwright) ou NODE_PATH apontando para ele. CHROMIUM=/caminho/do/chrome se preciso.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.URL || 'http://localhost:8765';
const OUT = process.argv[2] || path.join(__dirname, 'saida');
fs.mkdirSync(OUT, { recursive: true });
let ok = 0, tot = 0; const chk = (n, c, info) => { tot++; if (c) ok++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (info !== undefined ? ' → ' + JSON.stringify(info) : '')); };
// letra inventada para o teste (sem direitos de terceiros)
const TEXTO = `{title: Canção de Teste}
{artist: Ministério da Música}
{key: G}
{x_roteiro: Intro | Refrão | 1ª Estrofe | Refrão | Refrão | Solo | 2ª Estrofe | Refrão | Final}

{c: Intro: [G] [D] [Em] [C]}

{start_of_verse: Estrofe 1}
[G]Manhã de sol na [D]casa do Senhor
[Em]Vamos juntos [C]cantar
[G]Cada voz é um [D]som de louvor
[C]Nada vai nos [D]calar
{end_of_verse}

{start_of_chorus}
[C]Canta, canta, [G]povo de Deus
[D]Erga as mãos ao [Em]céu
[C]Ele é fiel, [G]Ele é bom
[D]Santo é o Seu [G]nome
{end_of_chorus}

{start_of_verse: Estrofe 2}
[G]Quando a noite [D]chegar
[Em]Sua luz vai [C]brilhar
[G]No caminho [D]vou seguir
[C]Sem medo de [D]cair
[G]Sua mão vai [D]me guiar
[C]Até o [D]fim
{end_of_verse}`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 1100 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL + '/index.html'); await pg.waitForTimeout(300);
  await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(300);
  const ids = await pg.evaluate((T) => {
    db.user = { name: 'Teste' }; db.role = 'editor'; db.tourDone = Date.now();
    const now = Date.now();
    db.songs.push({ id: 'st', title: 'Canção de Teste', artist: 'Ministério da Música', text: T, source: '', archived: false, created: now, updated: now });
    db.songs.push({ id: 'so', title: 'Só Acordes', artist: '', text: '{title: Só Acordes}\n{key: D}\n{c: Intro: [D] [A] [G]}\n[D] [A] [Bm] [G]', source: '', archived: false, created: now, updated: now });
    const ag = db.songs.find(s => s.title === 'Amazing Grace').id;
    db.lists = [{ id: 'l1', title: 'Culto de sábado', date: '2026-10-17', items: [{ id: 'i1', songId: 'st', shift: 0, note: '' }, { id: 'i2', songId: ag, shift: 0, note: '' }, { id: 'i3', songId: 'so', shift: 0, note: '' }], created: 1, updated: 1 }];
    save(); enterApp(); return { ag };
  }, TEXTO);

  // 1) Cifra na ordem do roteiro
  await pg.evaluate(() => go('cifra', { id: 'st' })); await pg.waitForTimeout(200);
  const ordem = () => pg.evaluate(() => [...document.querySelectorAll('#sheet .section-name, #sheet > .body > .comment')].map(e => e.textContent.trim()));
  let o = await ordem();
  chk('cifra começa pelo refrão e segue o roteiro', JSON.stringify(o) === JSON.stringify(['Intro: G D Em C', 'Refrão', '1ª Estrofe', 'Refrão2ª vez', 'Refrão3ª vez', 'Solo', '2ª Estrofe', 'Refrão4ª vez', 'Final']), o);
  chk('refrão repetido aparece por extenso, marcado "2ª vez"', await pg.evaluate(() => [...document.querySelectorAll('#sheet .section-name .rep')].map(e => e.textContent).join() === '2ª vez,3ª vez,4ª vez'));
  await pg.click('#rot-bar [data-rot-i="5"]'); await pg.waitForTimeout(400);
  chk('tocar no chip vai para a parte certa (a 2ª vez do refrão também tem o seu lugar)', await pg.evaluate(() => document.querySelector('#sheet [data-rot="5"]').classList.contains('rot-hl')));
  await pg.click('#rot-bar [data-rot-ord]'); await pg.waitForTimeout(200);
  o = await ordem();
  chk('"como está escrita" volta ao texto original', JSON.stringify(o) === JSON.stringify(['Intro: G D Em C', '1ª Estrofe', 'Refrão', '2ª Estrofe']), o);
  await pg.click('#rot-bar [data-rot-ord]'); await pg.waitForTimeout(200);
  chk('anotações da ordem do roteiro ficam separadas', await pg.evaluate(() => cifraInkKey() === 'c:st|rot'));

  // 2) Letra na mesma ordem
  await pg.evaluate(() => go('letra', { id: 'st' })); await pg.waitForTimeout(200);
  const lo = await pg.evaluate(() => [...document.querySelectorAll('#lsheet .section')].map(e => (e.querySelector('.section-name') || e.querySelector('.comment') || {}).textContent));
  chk('letra segue o roteiro (Intro, Solo e Final aparecem como marca)', JSON.stringify(lo) === JSON.stringify(['Intro', 'Refrão', '1ª Estrofe', 'Refrão2ª vez', 'Refrão3ª vez', 'Solo', '2ª Estrofe', 'Refrão4ª vez', 'Final']), lo);

  // 2b) Cifra importada (Cifra Club): parte com linha em branco no meio continua na mesma parte
  const RAW = '[Intro] G  D  Em  C\n\n[Primeira Parte]\nG      D\nLinha um da estrofe\nEm      C\nLinha dois da estrofe\n\nG      D\nLinha três da estrofe\nEm      C\nLinha quatro da estrofe\n\n[Refrão]\nC      G\nTeu santo nome eu vou louvar\nD      Em\nTeu santo nome vou exaltar';
  await pg.evaluate((raw) => { const t = convertToChordPro(raw, { title: 'Importada', artist: 'X' }).text; db.songs.push({ id: 'imp', title: 'Importada', artist: 'X', text: setHeadDirectives(t, { x_roteiro: 'Refrão | Refrão | 1ª Estrofe | Refrão' }), source: '', archived: false, created: 1, updated: 1 }); save(); go('cifra', { id: 'imp' }); }, RAW);
  await pg.waitForTimeout(200);
  const imp = await pg.evaluate(() => [...document.querySelectorAll('#sheet .section-name, #sheet .line')].map(e => e.classList.contains('line') ? [...e.querySelectorAll('.lyric')].map(l => l.textContent).join('').replace(/\s+/g, ' ').slice(0, 12).trim() : '[' + e.textContent.trim() + ']'));
  chk('cifra importada: os nomes ficam no lugar e o 2º parágrafo fica na estrofe', JSON.stringify(imp) === JSON.stringify(['[Refrão]', 'Teu santo no', 'Teu santo no', '[Refrão2ª vez]', 'Teu santo no', 'Teu santo no', '[1ª Estrofe]', 'Linha um da', 'Linha dois d', 'Linha três d', 'Linha quatro', '[Refrão3ª vez]', 'Teu santo no', 'Teu santo no']), imp);

  // 3) Roteiro só deste culto vale nos slides
  await pg.evaluate(() => go('lista', { id: 'l1', back: { name: 'listas' } }));
  chk('botão Slides na lista', await pg.isVisible('[data-li-slides]'));
  await pg.click('[data-li-slides]'); await pg.waitForTimeout(300);
  chk('abre a tela de slides', await pg.evaluate(() => route.name === 'slides' && !document.getElementById('v-slides').hidden));
  const resumo = () => pg.evaluate(() => sl.b.slides.map(x => x.kind === 'lyrics' ? `${x.part}${x.rep > 1 ? '#' + x.rep : ''}${x.n > 1 ? ' ' + x.k + '/' + x.n : ''}` : x.kind === 'title' ? 'T:' + x.song : x.inst ? 'V:' + x.part : 'V'));
  let r = await resumo();
  const esperado = ['V', 'T:Canção de Teste', 'Refrão', '1ª Estrofe', 'Refrão#2', 'Refrão#3', 'V:Solo', '2ª Estrofe 1/2', '2ª Estrofe 2/2', 'Refrão#4', 'V', 'T:Amazing Grace', '1ª Estrofe', '2ª Estrofe', 'V', 'T:Só Acordes'];
  chk('slides na ordem do roteiro, refrão repetido de verdade', JSON.stringify(r) === JSON.stringify(esperado), r);
  chk('estrofe de 6 linhas vira 3 + 3', await pg.evaluate(() => sl.b.slides.filter(x => x.part === '2ª Estrofe' && x.si === 0).map(x => x.lines.length).join() === '3,3'));
  chk('aviso da música sem letra', (await pg.textContent('#sl-warn')).includes('Só Acordes'));
  chk('notas do apresentador dizem o que vem depois', await pg.evaluate(() => sl.b.slides[4].notes === 'Canção de Teste · Refrão (2ª vez)\nDepois: Refrão (3ª vez)'), await pg.evaluate(() => sl.b.slides[4].notes));
  chk('mesmo tamanho de letra na música toda', await pg.evaluate(() => new Set(sl.b.slides.filter(x => x.kind === 'lyrics' && x.si === 0).map(x => x.pt)).size === 1));
  chk('miniaturas desenhadas e em escala', await pg.evaluate(() => { const th = document.querySelector('#sl-prev .sl-th'); return document.querySelectorAll('#sl-prev .sl-cell').length === 16 && parseFloat(th.style.getPropertyValue('--k')) > 0.1; }));
  await pg.screenshot({ path: path.join(OUT, 'tela-slides-tablet.png'), fullPage: false });

  // 4) Opções
  await pg.click('[data-sl-lines="2"]'); r = await resumo();
  chk('2 linhas: mais slides (refrão de 4 linhas vira 2)', r.length === 24, r.length);
  await pg.click('[data-sl-lines="4"]');
  await pg.click('[data-sl-t="blank"]'); r = await resumo();
  chk('sem tela vazia entre músicas (o Solo continua vazio)', !r.includes('V') && r.includes('V:Solo'), r);
  await pg.click('[data-sl-t="blank"]');
  await pg.click('[data-sl-t="caps"]');
  chk('maiúsculas na prévia', await pg.evaluate(() => document.querySelector('#sl-prev .sl-cell:nth-of-type(3) .sl-box').textContent.includes('CANTA, CANTA')));
  await pg.click('[data-sl-t="caps"]');
  chk('opções guardadas na lista (editor) e como padrão', await pg.evaluate(() => listById('l1').slides && db.slidePrefs && db.slidePrefs.lines === 4));

  // 5) Os 5 modelos: um .pptx de cada
  const tpls = await pg.evaluate(() => SL_TPL.map(t => t.id));
  for (const id of tpls) {
    await pg.click(`[data-sl-tpl="${id}"]`); await pg.waitForTimeout(100);
    const b64 = await pg.evaluate(async () => (await slMakePptx()).write({ outputType: 'base64' }));
    fs.writeFileSync(path.join(OUT, `modelo-${id}.pptx`), Buffer.from(b64, 'base64'));
    await pg.screenshot({ path: path.join(OUT, `tela-modelo-${id}.png`), clip: { x: 0, y: 0, width: 1000, height: 1100 } });
  }
  chk('5 modelos geraram .pptx', tpls.length === 5 && tpls.every(id => fs.statSync(path.join(OUT, `modelo-${id}.pptx`)).size > 5000));
  await pg.click('[data-sl-tpl="classico"]');

  // 6) Botão Gerar no navegador: baixa o arquivo
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 15000 }), pg.click('#sl-go')]);
  const fn = dl.suggestedFilename(); await dl.saveAs(path.join(OUT, fn));
  chk('Gerar baixa o .pptx com o nome da lista', fn === 'Culto de sabado 2026-10-17 - slides.pptx', fn);

  // 7) Slide grande
  await pg.click('#sl-prev [data-sl-big="2"]'); await pg.waitForTimeout(200);
  chk('slide grande abre com as notas', await pg.isVisible('#sl-big') && (await pg.textContent('#sl-big-note')).includes('Depois:'));
  await pg.keyboard.press('ArrowRight'); chk('seta avança', await pg.evaluate(() => sl.big === 3));
  await pg.screenshot({ path: path.join(OUT, 'tela-slide-grande.png') });
  await pg.keyboard.press('Escape'); chk('Esc fecha', await pg.evaluate(() => document.getElementById('sl-big').hidden));

  // 8) Celular
  await pg.setViewportSize({ width: 412, height: 915 }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, 'tela-slides-celular.png') });
  chk('celular sem rolagem para o lado', await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

  // 9) Músico também gera (sem mexer na lista)
  await pg.evaluate(() => { db.role = 'musico'; delete listById('l1').slides; save(); go('slides', { id: 'l1', back: { name: 'listas' } }); });
  await pg.click('[data-sl-lines="2"]');
  chk('músico gera; a escolha não muda a lista', await pg.evaluate(() => !listById('l1').slides && db.slidePrefs.lines === 2));
  chk('sem erros', !errs.length, errs.slice(0, 3));
  console.log(`\n${ok} de ${tot}`);
  await b.close(); process.exit(ok === tot ? 0 : 1);
})();
