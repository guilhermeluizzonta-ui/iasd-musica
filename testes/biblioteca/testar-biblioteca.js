// Biblioteca do Drive (cifras e partituras) com um script falso no lugar do Google Apps Script.
// Uso (na raiz): npm run build:web; cd www && python3 -m http.server 8765   (deixe rodando)
//                cd testes/biblioteca && npm i playwright && node testar-biblioteca.js [tablet|celular]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const tela = process.argv[2] || 'tablet';
const [W, H] = tela === 'celular' ? [390, 844] : [1024, 640];
const SHOTS = process.env.SHOTS || '';
const URL_SCRIPT = 'https://script.google.com/macros/s/TESTE/exec';
const PDF_B64 = fs.readFileSync(path.join(__dirname, 'pdf-teste.b64'), 'utf8');
let ok = 0, falhas = 0;
const conf = (c, nome) => { if (c) { ok++; console.log('OK   ', nome); } else { falhas++; console.log('FALHA', nome); } };

// cifra no formato dos arquivos da pasta Cifras (letra de teste, não é música real)
const CIFRA = (titulo) => `${titulo}

[Intro] D  A/C#  Bm  G

[Primeira Parte]

   D        G/D       A
Linha um da canção de teste
G          A7(4)  A7
  Linha dois para conferir

[Refrão]

  D            A/C#
Refrão do exemplo aqui
Bm       G      A7   D
  Fim do refrão de teste

----------------- Acordes -----------------
A/C# = X 4 X 2 5 5
A7(4) = X 0 2 0 3 0
`;
const arvCifras = (mod) => ({ id: 'raizC', nome: 'Cifras', arquivos: [], pastas: [
  { id: 'pAdo', nome: 'Adoradores', arquivos: [], pastas: [
    { id: 'pA1', nome: 'Adoradores 1', pastas: [], arquivos: [{ id: 'f1', nome: 'Adoradores Novo Tempo - Canção Um.txt', tam: 900, mod: 1000, tipo: 'text/plain' }] }] },
  { id: 'pNovo', nome: 'Hinário Adventista Novo', pastas: [], arquivos: [
    { id: 'f2', nome: 'Novo Hinário Adventista - Canção de Teste.txt', tam: 800, mod, tipo: 'text/plain' },
    { id: 'f3', nome: 'Novo Hinário Adventista - Outra Canção.txt', tam: 700, mod: 1000, tipo: 'text/plain' }] },
  { id: 'pAnt', nome: 'Hinário Adventista - Antigo', pastas: [], arquivos: [{ id: 'f4', nome: 'Hinário Adventista - 571 - Hino Antigo.txt', tam: 600, mod: 1000, tipo: 'text/plain' }] }] });
let modF2 = 1000, extraPdf = false;
const arvPart = () => ({ id: 'raizP', nome: 'Partituras', arquivos: [], pastas: [
  { id: 'qAdo', nome: 'Adoradores', arquivos: [], pastas: [
    { id: 'qA9', nome: 'Adoradores 9', pastas: [], arquivos: [{ id: 'pdfNovo', nome: 'CANÇÃO NOVA DE TESTE.pdf', tam: 1683, mod: 2000, tipo: 'application/pdf' }]
      .concat(extraPdf ? [{ id: 'pdfExtra', nome: 'Mais Uma.pdf', tam: 1683, mod: 2000, tipo: 'application/pdf' }] : []) }] }] });
const pedidos = [];
async function falso(route) {
  const u = new URL(route.request().url()), p = Object.fromEntries(u.searchParams);
  pedidos.push(p);
  const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
  if (p.chave !== 'iasd-jgs-central-musica') return json({ erro: 'chave' });
  if (p.acao === 'ping') return json({ ok: true, raizes: ['cifras', 'partituras'] });
  if (p.acao === 'lista') return json({ raiz: p.raiz, gerado: new Date().toISOString(), arvore: p.raiz === 'cifras' ? arvCifras(modF2) : arvPart() });
  if (p.acao === 'arquivo') {
    const todos = [].concat(...[arvCifras(modF2), arvPart()].map(function walk(n) { return (n.arquivos || []).concat(...(n.pastas || []).map(walk)); }));
    const a = todos.find(x => x.id === p.id); if (!a) return json({ erro: 'fora' });
    if (/\.pdf$/i.test(a.nome)) return json(Object.assign({}, a, { b64: PDF_B64 }));
    return json(Object.assign({}, a, { texto: CIFRA(a.nome.replace(/\.txt$/, '')) }));
  }
  return json({ erro: 'acao' });
}
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: H } });
  await ctx.route(URL_SCRIPT + '**', falso);
  const pg = await ctx.newPage(); const erros = []; pg.on('pageerror', e => erros.push(e.message));
  const foto = async (n) => { if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, `${tela}-${n}.png`) }); };
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(400);
  await pg.fill('#l-email', 'teste@iasd.org'); await pg.fill('#l-pass', '12345678'); await pg.click('#f-login button[type=submit]');
  await pg.waitForTimeout(800); await pg.evaluate('tour.on && tourEnd(false)'); await pg.waitForTimeout(300);

  // sem endereço: a biblioteca avisa (só quando o app não tem um endereço padrão)
  if (!(await pg.evaluate('BIB_URL_PADRAO'))) {
    await pg.evaluate("go('biblioteca', { back: { name: 'cifras' } })"); await pg.waitForTimeout(200);
    conf(/Configurações/.test(await pg.textContent('#bib-st')), 'sem endereço: avisa para ligar em Configurações');
  } else conf(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(await pg.evaluate('BIB_URL_PADRAO')), 'app vem com o endereço da biblioteca');

  // Configurações › Biblioteca do Drive
  await pg.evaluate("go('config')"); await pg.waitForTimeout(200);
  conf(await pg.isVisible('#cfg-bib-box'), 'editor vê Biblioteca do Drive em Configurações');
  await pg.fill('#cfg-bib-url', URL_SCRIPT); await pg.click('#cfg-bib-test'); await pg.waitForTimeout(500);
  conf(/Funcionou/.test(await pg.textContent('#cfg-bib-st')), 'testar e salvar: ligou a biblioteca');
  await foto('1-config');

  // Cifras › + › Importar → escolha
  await pg.evaluate("go('cifras')"); await pg.waitForTimeout(200);
  await pg.click('#fab'); await pg.click('#fab-import'); await pg.waitForTimeout(200);
  conf(await pg.isVisible('#modal') && /Biblioteca do ministério/.test(await pg.textContent('#modal')) && /Arquivo do aparelho/.test(await pg.textContent('#modal')), 'Importar abre a escolha: Biblioteca ou Aparelho');
  await foto('2-escolha');
  await pg.click('#modal [data-modal="0"]'); await pg.waitForTimeout(700);
  conf(await pg.evaluate("route.name") === 'biblioteca', 'abre a biblioteca');
  conf(await pg.evaluate("document.querySelectorAll('#bib-list [data-bibp]').length") === 3, 'mostra as 3 pastas do Drive');
  conf(/Atualizada/.test(await pg.textContent('#bib-st')) && /4 músicas/.test(await pg.textContent('#bib-st')), 'sincronizou sozinha ao abrir (4 músicas)');
  await foto('3-biblioteca');
  await pg.click('[data-bibp="pNovo"]'); await pg.waitForTimeout(200);
  conf(/Hinário Adventista Novo/.test(await pg.textContent('#bib-crumbs')), 'entra na pasta (caminho no topo)');
  await foto('4-pasta');
  await pg.click('[data-bibf="f2"]'); await pg.waitForTimeout(200);
  conf(/Baixar “Canção de Teste”\?/.test(await pg.textContent('#modal-t')), 'tocar na música pergunta se quer baixar');
  await foto('5-baixar');
  await pg.click('#modal [data-modal="0"]'); await pg.waitForTimeout(800);
  const s = await pg.evaluate("(() => { const s = db.songs.find(x => x.lib && x.lib.id === 'f2'); return s && { title: s.title, artist: s.artist, text: s.text, rota: route.name, aberta: route.id === s.id }; })()");
  conf(s && s.title === 'Canção de Teste' && s.artist === 'Novo Hinário Adventista', 'baixou com título e artista do nome do arquivo');
  conf(s && /\{start_of_chorus: Refrão\}/.test(s.text) && /\[A\/C#\]/.test(s.text), 'virou ChordPro (partes e acordes)');
  conf(s && !/X 4 X 2 5 5/.test(s.text) && !/^Novo Hinário/m.test(s.text.replace(/^\{.*$/gm, '')), 'tirou o desenho dos acordes e a 1ª linha repetida');
  conf(s && s.rota === 'cifra' && s.aberta, 'abre a cifra baixada');
  await foto('6-cifra');
  await pg.evaluate("go('biblioteca', { back: { name: 'cifras' } })"); await pg.waitForTimeout(400);
  conf(/Baixada/.test(await pg.textContent('#bib-list')), 'na biblioteca, a música aparece como Baixada');
  // nova versão no Drive
  modF2 = 5000; await pg.click('#bib-sync'); await pg.waitForTimeout(600);
  conf(pedidos.some(p => p.acao === 'lista' && p.novo === '1'), 'Sincronizar pede lista nova (sem cache)');
  conf(/Nova versão/.test(await pg.textContent('#bib-list')), 'mudou no Drive: aparece Nova versão');
  await foto('7-nova-versao');
  await pg.click('[data-bibf="f2"]'); await pg.waitForTimeout(200);
  conf(/Nova versão/.test(await pg.textContent('#modal-t')), 'tocar oferece Atualizar');
  await pg.click('#modal [data-modal="0"]'); await pg.waitForTimeout(800);
  conf(await pg.evaluate("db.songs.filter(x => x.lib && x.lib.id === 'f2').length === 1 && db.songs.find(x => x.lib && x.lib.id === 'f2').lib.mod === 5000"), 'atualizou a mesma cifra (sem duplicar)');
  // busca em todas as pastas
  await pg.evaluate("go('biblioteca', { back: { name: 'cifras' } })"); await pg.waitForTimeout(300);
  await pg.fill('#bib-q', 'antigo'); await pg.waitForTimeout(200);
  conf(await pg.evaluate("document.querySelectorAll('#bib-list [data-bibf]').length") === 1, 'busca acha pelo nome da pasta');
  await pg.fill('#bib-q', '');
  // busca diz se existe ou não
  await pg.fill('#bib-q', 'outra'); await pg.waitForTimeout(150);
  conf(/Sim: “outra” está na biblioteca \(1 música\)/.test(await pg.textContent('#bib-count')), 'busca: diz que existe e quantas');
  await pg.fill('#bib-q', 'nao existe xyz'); await pg.waitForTimeout(150);
  conf(/Não encontrei “nao existe xyz” na biblioteca/.test(await pg.textContent('#bib-list')), 'busca: diz que não existe');
  await foto('7b-nao-existe');
  await pg.fill('#bib-q', '');
  // a baixada aparece em Cifras normalmente
  await pg.evaluate("go('cifras')"); await pg.waitForTimeout(200);
  conf(await pg.evaluate("[...document.querySelectorAll('#list-songs strong')].some(e => e.textContent === 'Canção de Teste')"), 'a cifra baixada aparece em Cifras (Todas)');
  // busca em Cifras olha a biblioteca
  await pg.fill('#list-q', 'outra'); await pg.waitForTimeout(250);
  conf(await pg.isVisible('#cf-bib') && /Na biblioteca do ministério/.test(await pg.textContent('#cf-bib')), 'busca em Cifras avisa que existe na biblioteca');
  await foto('7c-cifras-busca');
  await pg.click('[data-cfbib]'); await pg.waitForTimeout(300);
  conf(await pg.evaluate("route.name === 'biblioteca' && $('bib-q').value === 'outra'"), '"Ver na biblioteca" abre a biblioteca já com a busca');
  await pg.evaluate("go('cifras')"); await pg.fill('#list-q', 'zzz nada'); await pg.waitForTimeout(250);
  conf(/também não está na biblioteca/.test(await pg.textContent('#cf-bib')), 'busca em Cifras: diz que não está em lugar nenhum');
  await pg.fill('#list-q', ''); await pg.waitForTimeout(100);
  // sem internet
  await ctx.setOffline(true); await pg.waitForTimeout(200);
  await pg.evaluate("bib.path = []; $('bib-q').value = ''; go('biblioteca', { back: { name: 'cifras' } })"); await pg.waitForTimeout(300);
  conf(await pg.isVisible('#bib-off') && /sem internet/i.test(await pg.textContent('#bib-off')), 'sem internet: aviso na biblioteca');
  conf(await pg.evaluate("document.querySelectorAll('#bib-list [data-bibp]').length") === 3, 'sem internet: mostra a última lista guardada');
  await foto('7d-sem-internet');
  await pg.click('[data-bibp="pNovo"]'); await pg.waitForTimeout(150); await pg.click('[data-bibf="f3"]'); await pg.waitForTimeout(200);
  conf(/Sem internet/.test(await pg.textContent('#modal-t')), 'sem internet: tocar para baixar avisa');
  await foto('7e-sem-internet-baixar');
  await pg.click('#modal [data-modal="0"]');
  await pg.click('[data-bibf="f2"]'); await pg.waitForTimeout(300);
  conf(await pg.evaluate("route.name === 'cifra'"), 'sem internet: a já baixada abre');
  await ctx.setOffline(false); await pg.waitForTimeout(200);

  // Cifras: Todas · Minhas · Biblioteca
  await pg.evaluate("go('cifras')"); await pg.waitForTimeout(200);
  await pg.click('[data-cf="biblioteca"]'); await pg.waitForTimeout(200);
  const nBib = await pg.evaluate("document.querySelectorAll('#list-songs [data-open]').length");
  await pg.click('[data-cf="minhas"]'); await pg.waitForTimeout(200);
  const nMinhas = await pg.evaluate("document.querySelectorAll('#list-songs [data-open]').length");
  const nTotal = await pg.evaluate("activeSongs().length");
  conf(nBib === 1 && nMinhas === nTotal - 1, `filtros separam biblioteca (${nBib}) das minhas (${nMinhas})`);
  await foto('8-filtro');
  await pg.click('[data-cf="todas"]');

  // Partituras: acervo vem do Drive
  await pg.evaluate("go('partituras')"); await pg.waitForTimeout(900);
  const pz = await pg.evaluate("(() => { const n = db.scores.find(x => x.catId === 'pdfNovo'); return { n: n && { title: n.title, folder: folderLabel(n.folderId), local: n.local }, cat: db.scores.filter(x => x.catId && x.catId !== 'pdfNovo').length, at: !!db.libPartAt }; })()");
  conf(pz.n && pz.n.title === 'Canção Nova de Teste' && pz.n.folder === 'Adoradores › Adoradores 9', 'partitura nova do Drive entra na pasta certa, com título arrumado');
  conf(pz.cat === 0 && pz.at, 'a lista fixa antiga sai quando o Drive responde (só o que está no Drive)');
  conf(/Acervo do Drive atualizado/.test(await pg.textContent('#pdf-sync-st')), 'Partituras mostra quando o acervo foi atualizado');
  await foto('9-partituras');
  extraPdf = true; await pg.click('#pdf-sync'); await pg.waitForTimeout(600);
  conf(await pg.evaluate("db.scores.some(x => x.catId === 'pdfExtra')"), 'Sincronizar traz a partitura que entrou depois no Drive');
  await pg.evaluate("go('partitura', { id: 'cat-pdfNovo', back: { name: 'partituras' } })"); await pg.waitForTimeout(600);
  await pg.click('#dl-go'); await pg.waitForTimeout(1500);
  conf(await pg.evaluate("db.scores.find(x => x.catId === 'pdfNovo').local"), 'baixa o PDF pelo script (pasta não precisa ser pública)');
  await foto('10-pdf');
  await pg.evaluate("db.role = 'musico'; save(); applyRole(); go('cifras')"); await pg.waitForTimeout(200);
  conf(await pg.isVisible('#fab') && !(await pg.evaluate("$('fab-new').hidden === false")), 'músico: tem o + em Cifras só com Importar');
  await pg.evaluate("go('config')"); await pg.waitForTimeout(150);
  conf(!(await pg.isVisible('#cfg-bib-box')), 'músico não vê o endereço da biblioteca');
  conf(!erros.length, 'sem erros no app' + (erros.length ? ': ' + erros.join(' | ') : ''));
  console.log(`\n${ok} de ${ok + falhas}`);
  await b.close(); process.exit(falhas ? 1 : 0);
})();
