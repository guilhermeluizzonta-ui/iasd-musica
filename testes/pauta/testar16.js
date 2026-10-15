// Redesenho por linha: só a linha alterada é refeita e o resultado é igual ao redesenho completo
// Uso: node testar16.js ../../src/pauta/pauta-mao-livre.html
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf8').replace('  // ---------- Início ----------',
  '  window.__t = { M, renderizar, renderizarTudo, CAIXAS, TIPS, desfazer, guardarDesfazer, get selId() { return selId; }, set selId(v) { selId = v; } };\n  // ---------- Início ----------');
let ok = 0, tot = 0; const chk = (n, c, info) => { tot++; if (c) ok++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (info ? ' → ' + info : '')); };
const itens = []; for (let l = 0; l < 4; l++) for (let k = 0; k < 8; k++) itens.push({ id: `n${l}_${k}`, tipo: k % 3 ? 'colcheia' : 'seminima', l, p: 0, x: 24 + k * 11, s: (k * 3 + l) % 9, ss: [(k * 3 + l) % 9], dir: 'up' });
itens.push({ id: 'v1', tipo: 'viga', ns: ['n1_1', 'n1_2'], l: 1, p: 0 }, { id: 'lg', tipo: 'ligadura', a: 'n2_0', b: 'n2_3', l: 2, p: 0 }, { id: 'br', tipo: 'barra', l: 0, p: 0, x: 70 });
const banco = { musicas: [{ id: 'm', titulo: 'Linhas', clave: 'sol', tom: 'C', compasso: { num: 4, den: 4, simbolo: '' }, unidade: { tipo: 'seminima', ponto: false }, linhas: [0, 1, 2, 3].map(() => ({ pautas: ['sol'] })), itens, anot: [] }], atual: 'm', guiaNaoMostrar: true };
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', beforeParse(w) {
  w.localStorage.setItem('pauta-mao-livre.v2', JSON.stringify(banco));
  let k = 0; w.SVGElement.prototype.getBBox = function () { const c = this.querySelector('[cx],[x1],[x]'); const x = c ? parseFloat(c.getAttribute('cx') || c.getAttribute('x1') || c.getAttribute('x')) : 0; return { x, y: 10, width: 2, height: 3 }; };
  w.Element.prototype.setPointerCapture = () => {};
} });
const t = dom.window.__t, d = dom.window.document;
const grupos = () => [...d.querySelectorAll('g[data-linha]')];
const foto = () => grupos().map(g => g.getAttribute('data-linha') + ':' + g.innerHTML).sort().join('\n');
const antes = new Map(grupos().map(g => [g.dataset.linha, g]));
chk('4 linhas desenhadas em grupos', grupos().length === 4);
// 1) mexe numa nota da linha 2
t.guardarDesfazer(); t.M().itens.find(i => i.id === 'n2_5').s = 7; t.M().itens.find(i => i.id === 'n2_5').ss = [7]; t.renderizar();
const depois = new Map(grupos().map(g => [g.dataset.linha, g]));
chk('só a linha 2 foi refeita', depois.get('2') !== antes.get('2') && ['0', '1', '3'].every(l => depois.get(l) === antes.get(l)));
const inc = foto(); t.renderizarTudo(); chk('igual ao redesenho completo', foto() === inc);
// 2) move uma nota da linha 0 para a linha 3
const n = t.M().itens.find(i => i.id === 'n0_2'); n.l = 3; t.renderizar();
chk('nota movida de linha continua tocável (borracha)', t.CAIXAS.has('n0_2') && d.querySelector('g[data-linha="3"] [data-id="n0_2"]') && !d.querySelector('g[data-linha="0"] [data-id="n0_2"]'));
const inc2 = foto(); t.renderizarTudo(); chk('igual ao completo depois de mover', foto() === inc2);
// 3) seleção só troca a classe
const g1 = grupos().find(g => g.dataset.linha === '1');
t.selId = 'n1_4'; t.renderizar();
chk('selecionar não refaz a linha', grupos().find(g => g.dataset.linha === '1') === g1 && d.querySelector('[data-id="n1_4"]').classList.contains('sel'));
t.selId = null; t.renderizar(); chk('tirar a seleção limpa a classe', !d.querySelector('.nota.sel'));
// 4) barra de colcheias: notas da viga refazem a linha
const n12 = t.M().itens.find(i => i.id === 'n1_2'); n12.s = 8; n12.ss = [8]; t.renderizar();
const inc3 = foto(); t.renderizarTudo(); chk('viga acompanha a nota alterada', foto() === inc3);
// 5) estrutura (nova linha) refaz tudo
t.M().linhas.push({ pautas: ['sol'] }); t.renderizar();
chk('nova linha refaz a estrutura', d.querySelector('svg#pauta > g.linhas, svg > g.linhas').querySelectorAll('line').length === 5 * t.M().linhas.length, d.querySelector('svg > g.linhas').querySelectorAll('line').length + ' linhas de pauta');
// 6) desfazer
t.desfazer(); chk('desfazer volta a nota da linha 2', t.M().itens.find(i => i.id === 'n2_5').s !== 7 && t.M().linhas.length === 4);
const inc4 = foto(); t.renderizarTudo(); chk('igual ao completo depois de desfazer', foto() === inc4);
console.log(`\n${ok} de ${tot}`);
