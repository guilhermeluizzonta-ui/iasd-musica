// Calibra o comparador $P com símbolos simulados (mm), com variação de mão
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const NP = 32;
function reamostrar(pts, n) {
  let L = 0; for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) L += dist(pts[i - 1], pts[i]);
  if (L === 0) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const I = L / (n - 1), arr = pts.map(p => ({ ...p })), out = [{ ...arr[0] }]; let D = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].id !== arr[i - 1].id) continue;
    const d = dist(arr[i - 1], arr[i]);
    if (d > 0 && D + d >= I) { const t = (I - D) / d; const q = { x: arr[i - 1].x + t * (arr[i].x - arr[i - 1].x), y: arr[i - 1].y + t * (arr[i].y - arr[i - 1].y), id: arr[i].id }; out.push(q); arr.splice(i, 0, q); D = 0; }
    else D += d;
  }
  while (out.length < n) out.push({ ...arr[arr.length - 1] });
  return out.slice(0, n);
}
function normalizar(pts) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const s = Math.max(x1 - x0, y1 - y0) || 1;
  const q = pts.map(p => ({ x: (p.x - x0) / s, y: (p.y - y0) / s }));
  const cx = q.reduce((a, p) => a + p.x, 0) / q.length, cy = q.reduce((a, p) => a + p.y, 0) / q.length;
  return q.map(p => ({ x: p.x - cx, y: p.y - cy }));
}
function nuvem(tracos) { const pts = []; tracos.forEach((t, id) => t.forEach(p => pts.push({ x: p.x, y: p.y, id }))); return normalizar(reamostrar(pts, NP)); }
function cloudD(a, b, ini) {
  const n = a.length, usado = new Array(n).fill(false); let soma = 0, i = ini;
  do { let m = -1, md = Infinity; for (let j = 0; j < n; j++) if (!usado[j]) { const d = dist(a[i], b[j]); if (d < md) { md = d; m = j; } } usado[m] = true; soma += (1 - ((i - ini + n) % n) / n) * md; i = (i + 1) % n; } while (i !== ini);
  return soma;
}
function distNuvem(a, b) { const n = a.length, passo = Math.floor(Math.sqrt(n)); let mn = Infinity; for (let i = 0; i < n; i += passo) mn = Math.min(mn, cloudD(a, b, i), cloudD(b, a, i)); return mn; }

// ---- símbolos à mão (mm), com tremor e variação de proporção ----
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const linha = (x0, y0, x1, y1, n = 14) => Array.from({ length: n + 1 }, (_, i) => ({ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n }));
const tremer = (t, a) => t.map(p => ({ x: p.x + (rnd() - 0.5) * a, y: p.y + (rnd() - 0.5) * a }));
const GER = {
  sustenido: v => [linha(0, -0.2 * v, 0.2, 7), linha(1.4, -0.6, 1.6 + 0.2 * v, 6.6), linha(-0.5, 2.8, 2.1, 2.2 - 0.3 * v), linha(-0.5, 4.8, 2.1, 4.2)],
  bemol: v => [linha(0, 0, 0, 7), [...Array(16)].map((_, i) => { const a = Math.PI * (1 - i / 15) * 1.15 - 0.2; return { x: 0 + 1.2 * (1 + v * 0.2) * (1 - Math.cos(a)) * 0.9, y: 5.4 - 1.4 * Math.sin(a) + (i / 15) * 1.6 }; })],
  bequadro: v => [linha(0, 0, 0, 5.2), linha(0, 5.2, 1.6, 4.6 - 0.2 * v), linha(1.6, 2.2, 1.6, 7.3), linha(0, 2.8, 1.6, 2.2)],
  pSeminima: v => [[{ x: 0.2, y: 0 }, { x: 1.6, y: 1.8 }, { x: 0.2, y: 3.4 + 0.3 * v }, { x: 1.7, y: 5.2 }, { x: 0.6, y: 6.2 }, { x: 1.4, y: 7.4 }].flatMap((p, i, a) => i ? linha(a[i - 1].x, a[i - 1].y, p.x, p.y, 5).slice(1) : [p])],
  pColcheia: v => [[...Array(10)].map((_, i) => ({ x: 0.4 + 0.5 * Math.cos(i / 9 * 6.28), y: 0.5 + 0.5 * Math.sin(i / 9 * 6.28) })), [...linha(0.4, 1.2, 2.4, 0.6 + 0.2 * v, 6), ...linha(2.4, 0.6, 1.0, 4.6, 10)]],
  pMinima: v => [[...Array(12)].flatMap((_, i) => [{ x: 0, y: 0 + i * 0.09 }, { x: 2.6 + 0.3 * v, y: 0.05 + i * 0.09 }])],
  fermata: v => [[...Array(16)].map((_, i) => ({ x: 3 - 3 * Math.cos(Math.PI * i / 15), y: 2 - 2.2 * Math.sin(Math.PI * i / 15) * (1 + 0.1 * v) })), [...Array(8)].map((_, i) => ({ x: 3 + 0.25 * Math.cos(i), y: 1.6 + 0.25 * Math.sin(i) }))],
  acento: v => [[...linha(0, 0, 3, 1 + 0.1 * v, 8), ...linha(3, 1 + 0.1 * v, 0, 2.1, 8).slice(1)]],
  // formas que NÃO são símbolos treinados (para ver se o comparador recusa)
  minima_desenhada: v => [[...Array(16)].map((_, i) => ({ x: 1.2 + 1.2 * Math.cos(i / 15 * 6.4), y: 6 + 0.9 * Math.sin(i / 15 * 6.4) })), linha(2.4, 6, 2.4, -2)],
  rabisco: v => [[...Array(30)].map((_, i) => ({ x: rnd() * 3, y: rnd() * 3 }))]
};
const amostra = (tipo, k) => nuvem(GER[tipo](rnd() - 0.5).map(t => tremer(t, 0.35)));
const TREINO = ['sustenido', 'bemol', 'bequadro', 'pSeminima', 'pColcheia', 'pMinima', 'fermata', 'acento'];
const modelos = Object.fromEntries(TREINO.map(t => [t, [0, 1, 2, 3].map(k => amostra(t, k))]));
const melhores = c => TREINO.map(t => ({ t, d: Math.min(...modelos[t].map(m => distNuvem(c, m))) })).sort((a, b) => a.d - b.d);
const certos = [], errados = [];
let acertos = 0, total = 0;
for (const t of TREINO) for (let k = 0; k < 12; k++) {
  const r = melhores(amostra(t, 10 + k)); total++;
  if (r[0].t === t) { acertos++; certos.push(r[0].d); } else errados.push(`${t}→${r[0].t} (${r[0].d.toFixed(2)})`);
}
const fora = ['minima_desenhada', 'rabisco'].map(t => [t, Math.min(...[0, 1, 2, 3, 4].map(() => melhores(amostra(t, 0))[0].d))]);
certos.sort((a, b) => a - b);
const q = p => certos[Math.floor(p * (certos.length - 1))].toFixed(2);
console.log(`acertos ${acertos}/${total}`, errados.length ? 'erros: ' + errados.join(', ') : '');
console.log(`distância dos acertos: mediana ${q(0.5)}  p90 ${q(0.9)}  máx ${q(1)}`);
console.log('formas não treinadas (menor distância):', fora.map(([t, d]) => `${t} ${d.toFixed(2)}`).join(' | '));
