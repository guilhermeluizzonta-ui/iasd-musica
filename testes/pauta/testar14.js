// Modo e estilo da folha: segue o app, sol/lua só na tela, Configurações escolhe a folha
// Uso: node testar14.js ../../www
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const dir = process.argv[2];
let ok = 0, tot = 0; const chk = (n, c, info) => { tot++; if (c) ok++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (info ? ' → ' + info : '')); };
function abrir(arq, url, ls, escuroSistema) {
  const erros = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => { if (!/navigation|scrollTo|scrollIntoView/i.test(e.message)) erros.push(e.message); });
  const html = fs.readFileSync(path.join(dir, arq), 'utf8').replace(/<script src="lib\/capacitor.js"><\/script>/, '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', url, virtualConsole: vc, beforeParse(w) {
    for (const [k, v] of Object.entries(ls || {})) w.localStorage.setItem(k, v);
    w.matchMedia = q => ({ matches: /dark/.test(q) ? !!escuroSistema : false, addEventListener() {}, addListener() {} });
    w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 1, height: 1 });
    w.Element.prototype.setPointerCapture = () => {}; w.HTMLCanvasElement.prototype.getContext = () => null;
  } });
  return { w: dom.window, d: dom.window.document, erros };
}
const mus = JSON.stringify({ musicas: [{ id: 'm', titulo: 'Teste', clave: 'sol', tom: 'C', compasso: { num: 4, den: 4 }, unidade: { tipo: 'seminima' }, linhas: [{ pautas: ['sol'] }], itens: [], anot: [{ id: 'a1', tipo: 'texto', x: 50, dy: 5, texto: 'oi', cor: '#1565C0', l: 0 }] }], atual: 'm', guiaNaoMostrar: true });
const app = prefs => JSON.stringify({ user: { name: 'T' }, prefs });
const v = (p, k) => p.d.documentElement.style.getPropertyValue(k);
let p = abrir('pauta.html', 'https://app.local/pauta.html?app=1', { 'pauta-mao-livre.v2': mus, 'repertorio.v1': app({ mode: 'escuro', folha: 'palco', accent: 'azul' }) });
chk('app escuro + folha Palco: folha preta, notas âmbar', v(p, '--papel') === '#000000' && v(p, '--tinta') === '#FFD54A' && p.d.documentElement.dataset.theme === 'dark', v(p, '--papel') + ' ' + v(p, '--tinta'));
chk('cor de destaque do app (azul) na pauta', v(p, '--acento') === '#6AA7F0', v(p, '--acento'));
chk('anotação azul fica clara na folha escura', (p.d.querySelector('.anot-texto') || {}).getAttribute && p.d.querySelector('.anot-texto').getAttribute('fill') === '#79B8FF');
chk('botão mostra o sol (trocar para clara)', p.d.getElementById('bTema').getAttribute('aria-label') === 'Folha clara');
p.d.getElementById('bTema').click();
chk('sol/lua troca para a folha clara do Palco', v(p, '--papel') === '#FFFFFF' && v(p, '--tinta') === '#000000' && p.d.documentElement.dataset.theme === 'light');
chk('sol/lua não muda o tema do app', JSON.parse(p.w.localStorage.getItem('repertorio.v1')).prefs.mode === 'escuro');
chk('impressão sempre preto no branco', /@media print[\s\S]*--papel: #FFFFFF !important/.test([...p.d.querySelectorAll('style')].map(s => s.textContent).join('')));
chk('pauta sem erros', !p.erros.length, p.erros.join(' ; '));
p = abrir('pauta.html', 'https://app.local/pauta.html?app=1', { 'pauta-mao-livre.v2': mus, 'repertorio.v1': app({ mode: 'auto', folha: 'creme' }) }, true);
chk('modo "seguir o aparelho" com aparelho escuro: Creme escura', v(p, '--papel') === '#1F1A13', v(p, '--papel'));
p = abrir('pauta.html', 'https://app.local/pauta.html', { 'pauta-mao-livre.v2': mus });
chk('fora do app: Clássica clara', v(p, '--papel') === '#FFFFFF' && v(p, '--tinta') === '#141414');
// App: Configurações
const a = abrir('index.html', 'https://app.local/index.html', { 'repertorio.v1': app({ mode: 'claro' }) });
a.w.eval("go('config')");
const cards = a.d.querySelectorAll('#folhas [data-folha-pick]');
chk('Configurações mostram 5 folhas', cards.length === 5, [...cards].map(c => c.dataset.folhaPick).join(','));
chk('Clássica vem marcada por padrão', a.d.querySelector('#folhas [aria-pressed="true"]').dataset.folhaPick === 'classica');
a.d.querySelector('[data-folha-pick="retro"]').click();
a.d.getElementById('cfg-save').click();
chk('escolher Retrô e Salvar grava prefs.folha', JSON.parse(a.w.localStorage.getItem('repertorio.v1')).prefs.folha === 'retro');
chk('app sem erros', !a.erros.length, a.erros.join(' ; ').slice(0, 300));
console.log(`\n${ok} de ${tot}`);
