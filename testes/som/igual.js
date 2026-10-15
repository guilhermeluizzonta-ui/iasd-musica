// Confere que o motor de som (Som) é igual no app e na pauta (as duas páginas não compartilham arquivo)
// Uso (na raiz): node testes/som/igual.js
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..', '..');
const pega = (arq) => {
  const s = fs.readFileSync(path.join(raiz, arq), 'utf8');
  const m = s.match(/\/\* SOM:INÍCIO[^\n]*\n([\s\S]*?)\n\s*\/\* SOM:FIM \*\//);
  if (!m) throw new Error('Marcadores SOM:INÍCIO / SOM:FIM não encontrados em ' + arq);
  return m[1].split('\n').map(l => l.trim()).filter(Boolean).join('\n');
};
const a = pega('src/app.html'), b = pega('src/pauta/pauta-mao-livre.html');
if (a !== b) { console.error('✗ O motor de som está diferente no app e na pauta. Copie a versão nova para os dois.'); process.exit(1); }
console.log('✓ Motor de som igual no app e na pauta (' + a.split('\n').length + ' linhas).');
