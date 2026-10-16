/**
 * Ponte entre o app IASD Música e o Google Drive do ministério (Google Apps Script).
 *
 * O app pede:
 *   ?acao=lista&raiz=cifras|partituras&chave=...   → árvore de pastas e arquivos (nome, tamanho, data da última mudança)
 *   ?acao=arquivo&id=<id do arquivo>&chave=...       → o arquivo: texto (cifras .txt) ou base64 (PDF)
 *
 * Roda com a conta do dono (Guilherme): as pastas NÃO precisam ficar públicas.
 * Só entrega arquivos que estão dentro das duas pastas abaixo; nada mais do Drive fica acessível.
 * Só lê: não cria, não muda e não apaga nada no Drive.
 *
 * Como publicar: veja docs/BIBLIOTECA.md
 */
const RAIZES = {
  cifras: '138AHx3Q5C7u4vWVbRBTFKRMQ9fCOweZx',      // App de Cifras - Projeto › Cifras
  partituras: '1Yb9-UwOB75I82CNnoqwy-H7N8OQoDXwP'   // App de Cifras - Projeto › Partituras
};
const CHAVE = 'iasd-jgs-central-musica';   // a mesma do app (BIB_CHAVE em src/app.html)
const CACHE_SEG = 300;                      // a lista fica 5 min em cache; "Sincronizar" no app pede uma nova (novo=1)

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.chave !== CHAVE) return saida({ erro: 'chave' });
    if (p.acao === 'lista') return saida(lista(p.raiz, p.novo === '1'));
    if (p.acao === 'arquivo') return saida(arquivo(p.id));
    if (p.acao === 'ping') return saida({ ok: true, raizes: Object.keys(RAIZES) });
    return saida({ erro: 'acao' });
  } catch (err) {
    return saida({ erro: String(err && err.message || err) });
  }
}

function lista(raiz, novo) {
  const id = RAIZES[raiz];
  if (!id) throw new Error('raiz');
  const cache = CacheService.getScriptCache(), k = 'lista-' + raiz;
  if (!novo) { const c = cache.get(k); if (c) return JSON.parse(c); }
  const res = { raiz: raiz, gerado: new Date().toISOString(), arvore: varre(DriveApp.getFolderById(id)) };
  try { cache.put(k, JSON.stringify(res), CACHE_SEG); } catch (e) { /* lista grande demais para o cache: segue sem */ }
  return res;
}

function varre(pasta) {
  const o = { id: pasta.getId(), nome: pasta.getName(), pastas: [], arquivos: [] };
  const ps = pasta.getFolders();
  while (ps.hasNext()) o.pastas.push(varre(ps.next()));
  const as = pasta.getFiles();
  while (as.hasNext()) {
    const a = as.next();
    if (a.isTrashed()) continue;
    o.arquivos.push({ id: a.getId(), nome: a.getName(), tam: a.getSize(), mod: a.getLastUpdated().getTime(), tipo: a.getMimeType() });
  }
  return o;
}

/* O arquivo está dentro de uma das pastas do app? (sobe pelas pastas-mãe até achar uma raiz) */
function dentro(arq) {
  const raizes = Object.keys(RAIZES).map(function (k) { return RAIZES[k]; });
  const fila = [], vistos = {};
  const it = arq.getParents(); while (it.hasNext()) fila.push(it.next());
  while (fila.length) {
    const f = fila.shift(), id = f.getId();
    if (raizes.indexOf(id) >= 0) return true;
    if (vistos[id]) continue; vistos[id] = true;
    const pp = f.getParents(); while (pp.hasNext()) fila.push(pp.next());
  }
  return false;
}

function arquivo(id) {
  const a = DriveApp.getFileById(id);
  if (!dentro(a)) throw new Error('fora');
  const tipo = a.getMimeType(), blob = a.getBlob();
  const base = { id: a.getId(), nome: a.getName(), tam: a.getSize(), mod: a.getLastUpdated().getTime(), tipo: tipo };
  if (/^text\//.test(tipo) || /\.(txt|cho|chordpro)$/i.test(a.getName())) base.texto = blob.getDataAsString('UTF-8');
  else base.b64 = Utilities.base64Encode(blob.getBytes());
  return base;
}

function saida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Rode esta função uma vez pelo editor do Apps Script (botão Executar) para dar a permissão de leitura do Drive. */
function autorizar() {
  Object.keys(RAIZES).forEach(function (k) { Logger.log(k + ': ' + DriveApp.getFolderById(RAIZES[k]).getName()); });
}
