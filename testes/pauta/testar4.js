// Linhas, folhas, piano, clave por linha, Ajustar e anotações
const fs = require('fs');
const { JSDOM } = require('jsdom');
let html = fs.readFileSync(process.argv[2], 'utf8').replace('  // ---------- Início ----------',
  '  window.__t = { M, itens, itensDe, adicionar, adicionarLinha, removerLinha, abrirMenuClave, escolherClave, ajustar, usar, reconhecer, nomeNota, descrever, segmentos, salvarAnot, desfazer, get LAYOUT() { return LAYOUT; }, get BASE() { return BASE; }, get INICIO() { return INICIO; } };\n  // ---------- Início ----------');
const banco = { musicas: [{ id: 'm1', titulo: 'Linhas e piano', autor: 'Teste', clave: 'sol', tom: 'G', compasso: { num: 4, den: 4, simbolo: 'C' }, unidade: { tipo: 'seminima', ponto: false }, andamento: 72, itens: [] }], atual: 'm1' };
const erros = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://exemplo.test/', beforeParse(w) { w.localStorage.setItem('pauta-mao-livre.v2', JSON.stringify(banco)); w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 }); w.addEventListener('error', e => erros.push(e.message)); } });
const w = dom.window, t = w.__t, d = w.document;
let ok = 0, tot = 0; const chk = (n, c, info) => { tot++; if (c) ok++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (info ? ' → ' + info : '')); };
chk('abre sem erros (música antiga ganha linhas)', !erros.length && t.M().linhas.length === 1, erros.join(';'));
// linha 1 em Sol: notas, barra
const nota = (l, p, s, x, tipo = 'seminima') => { t.usar(l, p); const n = { id: `n${l}${p}${x}`, tipo, s, ss: [s], x, dir: s >= 4 ? 'down' : 'up' }; t.adicionar(n); return n; };
nota(0, 0, 2, 40); nota(0, 0, 4, 45); nota(0, 0, 3, 47); nota(0, 0, 6, 60);
t.usar(0, 0); t.adicionar({ id: 'b1', tipo: 'barra', x: 70 });
// (+) cria linhas iguais; muda a linha 2 para piano
t.adicionarLinha();
chk('(+) repete a linha anterior', t.M().linhas[1].pautas.join() === 'sol');
t.abrirMenuClave(1, 100, 100); t.escolherClave('piano');
chk('linha 2 vira piano', t.M().linhas[1].pautas.join() === 'sol,fa' && t.LAYOUT[1].topos.length === 2);
t.adicionarLinha();
chk('linha 3 segue o piano', t.M().linhas[2].pautas.join() === 'sol,fa');
// notas nas duas pautas do piano
nota(1, 0, 4, 40); nota(1, 1, 4, 40); nota(1, 1, 0, 60, 'minima');
t.usar(1, 1);
chk('nome na clave de Fá (linha 2, pauta de baixo)', t.nomeNota(t.itensDe(1, 1)[0]) === 'Ré', t.nomeNota(t.itensDe(1, 1)[0]));
chk('nome na clave de Sol (mesmo lugar, pauta de cima)', t.nomeNota(t.itensDe(1, 0)[0]) === 'Si', t.nomeNota(t.itensDe(1, 0)[0]));
// reconhecer um desenho na pauta de baixo da linha 2
t.usar(1, 1);
const B = t.BASE, yS = s => B - s * 1.25;
const rab = (cx, cy, r = 1.1) => { const p = []; for (let i = 0; i <= 10; i++) { const yy = cy - r + (2 * r * i) / 10; p.push({ x: cx - r, y: yy }); p.push({ x: cx + r, y: yy + 0.1 }); } return p; };
const lin = (x0, y0, x1, y1) => Array.from({ length: 31 }, (_, i) => ({ x: x0 + (x1 - x0) * i / 30, y: y0 + (y1 - y0) * i / 30 }));
const r = t.reconhecer([rab(80, yS(2)), lin(81.3, yS(2), 81.3, yS(2) - 9)]);
chk('desenho reconhecido na pauta de Fá do piano', r.ok && r.nota.l === 1 && r.nota.p === 1, JSON.stringify(r.nota));
// barra atravessa as duas pautas
t.usar(1, 0); t.adicionar({ id: 'b2', tipo: 'barra', x: 90 });
chk('barra da linha de piano vale para as duas pautas', t.segmentos().filter(s => s.l === 1).length >= 2, t.segmentos().map(s => `${s.l}:${s.numero}`).join(' '));
// números de compasso seguem de uma linha para a outra
const segs = t.segmentos();
chk('compassos numerados em sequência', segs.map(s => s.numero).join(',') === segs.map((_, i) => i + 1).join(','), segs.map(s => `L${s.l + 1}#${s.numero}`).join(' '));
// folhas: encher a primeira
const antes = t.LAYOUT[t.LAYOUT.length - 1].pagina;
for (let k = 0; k < 3; k++) t.adicionarLinha();
const pags = t.LAYOUT.map(L => L.pagina).join(',');
chk('folha nova criada sozinha quando a primeira enche', t.LAYOUT[t.LAYOUT.length - 1].pagina > antes, pags);
chk('status avisa a folha nova', /Folha|Linha/.test(d.getElementById('status').textContent), d.getElementById('status').textContent);
// (−) remove a última linha vazia
const n0 = t.M().linhas.length; t.removerLinha();
chk('(−) tira a última linha vazia', t.M().linhas.length === n0 - 1);
// voltar a linha 2 para uma pauta pede confirmação (a pauta de baixo tem notas)
t.abrirMenuClave(1, 100, 100); t.escolherClave('sol');
chk('pede confirmação antes de apagar a pauta de baixo', t.M().linhas[1].pautas.length === 2 && !d.getElementById('menuClaveAviso').hidden, d.getElementById('menuClaveAviso').textContent);
t.desfazer && 0;
// Ajustar
t.ajustar();
const xs = t.itensDe(0, 0).filter(i => i.tipo === 'seminima').map(i => i.x);
const passos = xs.slice(1).map((x, i) => +(x - xs[i]).toFixed(2));
chk('Ajustar deixa espaçamento igual no compasso', passos.every(p => Math.abs(p - passos[0]) < 0.05), `x: ${xs.join(', ')}`);
const pianoCols = [t.itensDe(1, 0)[0].x, t.itensDe(1, 1)[0].x];
chk('Ajustar alinha as notas das duas pautas do piano', Math.abs(pianoCols[0] - pianoCols[1]) < 0.01, pianoCols.join(' / '));
// anotação
t.salvarAnot({ tipo: 'texto', x: 100, dy: 5, texto: 'respirar aqui' }, t.LAYOUT[0].y0 + 5);
chk('anotação de texto salva e desenhada', t.M().anot.length === 1 && d.querySelector('.anot-texto').textContent === 'respirar aqui');
chk('sem erros no fim', !erros.length, erros.join(';'));
console.log(`\n${ok} de ${tot}`);

// Imagem da primeira folha
const svg = d.getElementById('pauta');
const css = `.papel{fill:#fff;stroke:#ccc;stroke-width:.25}.linhas line{stroke:#3B403D;stroke-width:.2}.cab,.band,.glifo,.ponto,.lig,.chave{fill:#141414}.furo{fill:#fff}.haste,.traco-fino{stroke:#141414;stroke-width:.32;fill:none}.traco-grosso{stroke:#141414;stroke-width:.9}.supl{stroke:#141414;stroke-width:.3}.alvo,.alvo-linha,.toque-clave{fill:none;stroke:none}.titulo-mus{font:700 3.4px serif}.autor-mus{font:2.2px sans-serif}.num-comp{font:900 6.6px serif}.rot{font:600 2.3px sans-serif;fill:#6B746F}.rot.completo{fill:#00873E}.rot.passou{fill:#C62828}.rot.falta{fill:#B26A00}.num-pag{font:2.4px sans-serif;fill:#666}.mais circle{fill:#00A651}.menos circle{fill:#9AA59F}.mais path,.menos path{stroke:#fff;stroke-width:.5}.anot-texto{font:600 3.2px sans-serif}`;
const vb = svg.getAttribute('viewBox').split(' ').map(Number);
const s = svg.outerHTML.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${vb[2] * 8}" height="${vb[3] * 8}" `).replace(/(<svg[^>]*>)/, `$1<style>${css}</style><rect width="${vb[2]}" height="${vb[3]}" fill="#E6EAE7"/>`);
fs.writeFileSync('folhas.svg', s);
