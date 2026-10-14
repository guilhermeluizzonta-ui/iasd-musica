// Capotraste e Meu instrumento. Uso: node testar15.js ../../www
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const dir = process.argv[2];
let ok = 0, tot = 0; const chk = (n, c, info) => { tot++; if (c) ok++; console.log((c ? 'OK   ' : 'FALHA') + ' ' + n + (info ? ' → ' + info : '')); };
function abrir(ls) {
  const erros = []; const vc = new VirtualConsole(); vc.on('jsdomError', e => { if (!/navigation|scrollTo|scrollIntoView/i.test(e.message)) erros.push(e.message); });
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/<script src="lib\/capacitor.js"><\/script>/, '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://app.local/index.html', virtualConsole: vc, beforeParse(w) { for (const [k, v] of Object.entries(ls)) w.localStorage.setItem(k, v); w.matchMedia = () => ({ matches: false, addEventListener() {} }); } });
  return { w: dom.window, d: dom.window.document, erros, ev: s => dom.window.eval(s) };
}
const base = instr => JSON.stringify({ user: { name: 'T' }, prefs: { mode: 'claro', instrumento: instr } });
// música em A com acordes A D E F#m
let a = abrir({ 'repertorio.v1': base('piano') });
a.ev(`db.songs.push({ id: 'sx', title: 'Teste Capo', artist: 'X', text: '{title: Teste Capo}\\n{key: A}\\n[A]Santo, [D]santo, [E]santo [F#m]é', created: 1 }); save(); go('cifra', { id: 'sx' });`);
const acordes = () => [...a.d.querySelectorAll('#sheet .chord')].map(c => c.textContent).filter(Boolean).join(' ');
chk('piano: sem botão Capo', a.d.getElementById('t-capo-g').hidden);
chk('acordes no tom original', acordes() === 'A D E F#m', acordes());
a = abrir({ 'repertorio.v1': base('violao') });
a.ev(`db.songs.push({ id: 'sx', title: 'Teste Capo', artist: 'X', text: '{title: Teste Capo}\\n{key: A}\\n[A]Santo, [D]santo, [E]santo [F#m]é', created: 1 }); save(); go('cifra', { id: 'sx' });`);
chk('violão: botão Capo aparece', !a.d.getElementById('t-capo-g').hidden);
a.d.getElementById('t-capo').click();
const casas = [...a.d.querySelectorAll('#capopick [data-capo]')];
chk('lista Sem capo + 1ª a 9ª casa', casas.length === 10 && casas[0].textContent.startsWith('Sem capo'));
chk('capo 2 mostra formas de G (fácil)', /formas de G/.test(casas[2].textContent) && /fácil/.test(casas[2].textContent), casas[2].textContent);
casas[2].click();
chk('capo 2: acordes nas formas G C D Em', acordes() === 'G C D Em', acordes());
chk('tom que soa continua A, com aviso do capo', /Tom: A/.test(a.d.querySelector('#sheet .meta').textContent) && /Capo 2ª casa \(formas de G\)/.test(a.d.querySelector('#sheet .meta').textContent), a.d.querySelector('#sheet .meta').textContent);
chk('botão mostra Capo 2', a.d.getElementById('t-capo').textContent === 'Capo 2');
a.d.getElementById('t-up').click();
chk('subir meio tom com capo: soa Bb, formas G# ...', /Tom: Bb/.test(a.d.querySelector('#sheet .meta').textContent) && acordes().split(' ')[0] === 'Ab', acordes() + ' | ' + a.d.querySelector('#sheet .meta').textContent);
chk('capo fica guardado na música', a.ev("db.view['sx'].capo") === 2);
// Configurações
a.ev("go('config')");
chk('Configurações: Meu instrumento com grupos', a.d.querySelectorAll('#instrs [data-instr]').length >= 20 && /Cordas/.test(a.d.getElementById('instrs').textContent) && /Teclas/.test(a.d.getElementById('instrs').textContent));
a.d.querySelector('[data-instr="teclado"]').click(); a.d.getElementById('cfg-save').click();
chk('trocar para Teclado grava', JSON.parse(a.w.localStorage.getItem('repertorio.v1')).prefs.instrumento === 'teclado');
a.d.getElementById('cfg-reset').click();
chk('Restaurar padrão mantém o instrumento', a.ev('db.prefs.instrumento') === 'teclado');
a.ev("go('cifra', { id: 'sx' })");
chk('teclado: capo some e acordes voltam ao tom que soa', a.d.getElementById('t-capo-g').hidden && acordes().split(' ')[0] === 'Bb', acordes());
chk('sem erros', !a.erros.length, a.erros.join(' ; ').slice(0, 300));
console.log(`\n${ok} de ${tot}`);
