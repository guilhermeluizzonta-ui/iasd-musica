// Integração com o app: Criar partitura (pasta), abrir partitura escrita, Voltar, lista em Partituras
// Uso: node testar13.js ../../www   (depois de npm run build:web)
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const dir = process.argv[2];
let ok = 0, tot = 0; const chk = (n, c, info) => { tot++; if (c) ok++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (info ? ' → ' + info : '')); };
function abrir(arq, url, ls, ss) {
  const erros = [], nav = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => { if (/navigation/i.test(e.message)) nav.push(e.message); else if (!/scrollTo|scrollIntoView/.test(e.message)) erros.push(e.message); });
  const html = fs.readFileSync(path.join(dir, arq), 'utf8').replace(/<script src="lib\/capacitor.js"><\/script>/, '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, beforeParse(w) {
    for (const [k, v] of Object.entries(ls || {})) w.localStorage.setItem(k, v);
    for (const [k, v] of Object.entries(ss || {})) w.sessionStorage.setItem(k, v);
    w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 1, height: 1 });
    w.Element.prototype.setPointerCapture = () => {}; w.HTMLCanvasElement.prototype.getContext = () => null;
  } });
  return { w: dom.window, d: dom.window.document, erros, nav };
}
// 1) Criar partitura dentro da pasta f1
let p = abrir('pauta.html', 'https://app.local/pauta.html?app=1&nova=1&pasta=f1', { 'pauta-mao-livre.v2': JSON.stringify({ musicas: [{ id: 'velha', titulo: 'Antiga', clave: 'sol', tom: 'C', compasso: { num: 4, den: 4 }, unidade: { tipo: 'seminima' }, linhas: [{ pautas: ['sol'] }], itens: [], anot: [] }], atual: 'velha', guiaNaoMostrar: true }) });
const $ = id => p.d.getElementById(id);
chk('Criar partitura abre a ficha de música nova', !$('janFicha').hidden && $('fichaTitulo').textContent === 'Nova música');
chk('botão Voltar aparece quando vem do app', !$('bVoltarApp').hidden);
chk('ficha pode ser cancelada (volta ao app)', !$('fCancelar').hidden);
$('fTitulo').value = 'Exercício 1'; $('fSalvar').click();
let b = JSON.parse(p.w.localStorage.getItem('pauta-mao-livre.v2'));
const nova = b.musicas.find(m => m.titulo === 'Exercício 1');
chk('música criada fica na pasta de onde veio', nova && nova.pasta === 'f1', JSON.stringify(nova && { pasta: nova.pasta }));
chk('endereço não recria a música ao recarregar', !/nova=1/.test(p.w.location.href), p.w.location.href);
$('bVoltarApp').click();
chk('Voltar leva para o app (index.html)', p.nav.length > 0);
chk('pauta sem erros', !p.erros.length, p.erros.join(' ; '));
// 2) Abrir uma partitura escrita pelo app
const ls = { 'pauta-mao-livre.v2': JSON.stringify(b) };
p = abrir('pauta.html', 'https://app.local/pauta.html?app=1&abrir=velha', ls);
chk('tocar na partitura escrita abre ela', p.d.getElementById('tMusica').textContent === 'Antiga', p.d.getElementById('tMusica').textContent);
// 3) Cancelar a ficha de nova volta ao app
p = abrir('pauta.html', 'https://app.local/pauta.html?app=1&nova=1&pasta=', ls);
p.d.getElementById('fCancelar').click();
chk('cancelar a ficha volta ao app', p.nav.length > 0);
// 4) App: lista da pasta mostra a partitura escrita; voltar da pauta reabre a pasta
const a = abrir('index.html', 'https://app.local/index.html', ls, { 'repertorio.voltar': JSON.stringify({ folder: 'f1' }) });
const ev = s => a.w.eval(s);
ev("db.folders.push({ id: 'f1', name: 'Exercícios', parentId: null, created: 1 }); db.user = db.user || { name: 'Teste' }; save(); enterApp(); openFolder('f1');");
const lista = a.d.getElementById('pdf-list').innerHTML;
chk('Partituras › pasta mostra a partitura escrita', /data-pauta="[^"]+"/.test(lista) && lista.includes('Exercício 1') && !lista.includes('Antiga'));
ev("openFolder(null)");
chk('a partitura sem pasta aparece em Partituras', a.d.getElementById('pdf-list').innerHTML.includes('Antiga'));
ev("openFolder('f1')");
a.d.querySelector('[data-pauta]').click();
chk('tocar nela abre a pauta e guarda a pasta para voltar', a.nav.length > 0 && JSON.parse(a.w.sessionStorage.getItem('repertorio.voltar')).folder === 'f1');
chk('menu + tem Criar partitura em Partituras', !a.d.getElementById('fab-score').hidden && a.d.getElementById('fab-score').textContent.includes('Criar partitura'));
// 5) Voltando da pauta (com login), o app abre Partituras na mesma pasta
const STORE = ev('STORE'); const dbSalvo = a.w.localStorage.getItem(STORE);
const a2 = abrir('index.html', 'https://app.local/index.html', Object.assign({ [STORE]: dbSalvo }, ls), { 'repertorio.voltar': JSON.stringify({ folder: 'f1' }) });
chk('voltando da pauta, abre Partituras na mesma pasta', a2.w.eval("route.name === 'partituras' && pdfFolder === 'f1'"), a2.w.eval('route.name + " " + pdfFolder'));
chk('app sem erros', !a.erros.length && !a2.erros.length, a.erros.concat(a2.erros).join(' ; ').slice(0, 400));
console.log(`\n${ok} de ${tot}`);
