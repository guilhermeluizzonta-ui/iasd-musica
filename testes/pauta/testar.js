// Testa o reconhecimento de acordes com traços simulados (em milímetros da pauta)
const fs = require('fs');
const { JSDOM } = require('jsdom');
let html = fs.readFileSync(process.argv[2], 'utf8');
html = html.replace('  // ---------- Início ----------', '  window.__t = { reconhecer, M, itens, adicionar, acrescentarCabecas, nomeAcorde, descrever, renderizar, cabecas };\n  // ---------- Início ----------');
const banco = { musicas: [{ id: 'm1', titulo: 'Teste', autor: '', clave: 'sol', tom: 'C', compasso: { num: 4, den: 4, simbolo: 'C' }, unidade: { tipo: 'seminima', ponto: false }, andamento: null, itens: [] }], atual: 'm1' };
const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'https://exemplo.test/', pretendToBeVisual: true,
  beforeParse(w) {
    w.localStorage.setItem('pauta-mao-livre.v2', JSON.stringify(banco));
    w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 1, height: 1 });
  }
});
const w = dom.window, t = w.__t;
if (!t) { console.log('gancho de teste não encontrado'); process.exit(1); }
const SP = 2.5, BASE = 42, yS = s => BASE - s * SP / 2;
const laco = (cx, cy, r = 1.1) => { const p = []; for (let i = 0; i <= 36; i++) { const a = i / 36 * 2 * Math.PI + 0.3; p.push({ x: cx + r * 1.15 * Math.cos(a), y: cy + r * Math.sin(a) }); } return p; };
const rabisco = (cx, cy, r = 1.1) => { const p = []; for (let i = 0; i <= 10; i++) { const yy = cy - r + (2 * r * i) / 10; p.push({ x: cx - r, y: yy }); p.push({ x: cx + r, y: yy + 0.1 }); } return p; };
const linha = (x0, y0, x1, y1, n = 30) => { const p = []; for (let i = 0; i <= n; i++) p.push({ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n }); return p; };
const bandeira = (x, y) => { const p = []; for (let i = 0; i <= 20; i++) { const u = i / 20; p.push({ x: x + 2.4 * Math.sin(u * 2.2), y: y + 6 * u }); } return p; };

const casos = [];
function caso(nome, tracos, esperado) { casos.push([nome, tracos, esperado]); }
caso('semínima simples', [rabisco(40, yS(4)), linha(41.3, yS(4), 41.3, yS(4) - 9)], r => r.nota.tipo === 'seminima' && r.nota.ss.join() === '4');
caso('acorde Dó maior (C)', [rabisco(50, yS(-2)), rabisco(50, yS(0)), rabisco(50, yS(2)), linha(51.3, yS(-2), 51.3, yS(2) - 9)], r => r.nota.tipo === 'seminima' && r.nota.ss.join() === '-2,0,2' && r.nota.dir === 'up');
caso('semibreves em acorde', [laco(70, yS(1)), laco(70, yS(3)), laco(70, yS(5))], r => r.nota.tipo === 'semibreve' && r.nota.ss.join() === '1,3,5');
caso('mínimas em acorde, haste para baixo', [laco(90, yS(6)), laco(90, yS(8)), linha(88.6, yS(8), 88.6, yS(6) + 9)], r => r.nota.tipo === 'minima' && r.nota.ss.join() === '6,8' && r.nota.dir === 'down');
caso('colcheias em acorde', [rabisco(100, yS(0)), rabisco(100, yS(2)), linha(101.3, yS(0), 101.3, yS(2) - 9), bandeira(101.3, yS(2) - 9)], r => r.nota.tipo === 'colcheia' && r.nota.ss.join() === '0,2');
caso('semicolcheias em acorde', [rabisco(110, yS(1)), rabisco(110, yS(3)), linha(111.3, yS(1), 111.3, yS(3) - 9.5), bandeira(111.3, yS(3) - 9.5), bandeira(111.3, yS(3) - 7.5)], r => r.nota.tipo === 'semicolcheia' && r.nota.ss.join() === '1,3');
caso('cabeça + haste num traço só', [[...laco(120, yS(2)).reverse(), ...linha(121.3, yS(2), 121.3, yS(2) - 9)]], r => ['minima', 'seminima'].includes(r.nota.tipo) && r.nota.ss.join() === '2');

let ok = 0;
for (const [nome, tracos, esperado] of casos) {
  const r = t.reconhecer(tracos);
  const passou = r.ok && r.nota && esperado(r);
  if (passou) ok++;
  console.log((passou ? 'OK   ' : 'FALHA') + ' ' + nome + ' → ' + (r.ok ? (r.nota ? `${r.nota.tipo} [${r.nota.ss}] ${r.nota.dir || ''} (${r.partes})` : JSON.stringify(r)) : r.motivo));
}

// Montar acordes na pauta e conferir a cifra
const ac = (ss, x) => { const n = { id: 'n' + x, tipo: 'seminima', s: ss[0], ss, x, dir: 'up' }; t.adicionar(n); return n; };
const conf = (nome, ss, x, cifra) => { const n = ac(ss, x); const c = t.nomeAcorde(n); const p = c === cifra; if (p) ok++; console.log((p ? 'OK   ' : 'FALHA') + ` cifra ${nome}: ${c || '(nenhuma)'} (esperado ${cifra})`); return n; };
conf('Dó-Mi-Sol', [-2, 0, 2], 30, 'C');
conf('Sol-Si-Ré-Fá', [2, 4, 6, 8], 40, 'G7');
conf('Mi-Sol-Dó (inversão)', [0, 2, 5], 50, 'C/E');
conf('Ré-Fá-Lá-Dó', [-1, 1, 3, 5], 60, 'Dm7');
const lam = conf('Lá-Dó-Mi', [3, 5, 7], 70, 'Am');

// Cabeça desenhada na coluna de uma nota existente → soma ao acorde
const r2 = t.reconhecer([laco(70.2, yS(9))]);
const somou = r2.ok && r2.acrescentar && r2.acrescentar.id === lam.id;
if (somou) { t.acrescentarCabecas(r2.acrescentar.id, r2.acrescentar.ss); ok++; }
console.log((somou ? 'OK   ' : 'FALHA') + ' somar cabeça ao acorde → ' + JSON.stringify(r2.acrescentar || r2) + ' agora: ' + t.cabecas(lam).join(',') + ' cifra ' + t.nomeAcorde(lam));
console.log('status:', w.document.getElementById('status').textContent);
console.log(`\n${ok} de ${casos.length + 6} testes passaram`);
const erros = w.document.querySelectorAll('.nota').length;
console.log('itens desenhados na pauta:', erros);
