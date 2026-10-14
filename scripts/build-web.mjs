// Monta www/ (o que vai dentro do APK) a partir de src/app.html (o mesmo app publicado no Claude).
// Troca o que vem da internet por arquivos locais: fontes e leitor de PDF. Assim o app funciona offline.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const www = path.join(root, 'www'), nm = path.join(root, 'node_modules');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, 'fonts'), { recursive: true });
fs.mkdirSync(path.join(www, 'lib'), { recursive: true });

// 1) Fontes (só os alfabetos latino e latino estendido, que cobrem o português)
const FONTS = [
  ['noto-sans', ['400', '500', '600', '700', '800', '400-italic']],
  ['ibm-plex-mono', ['400', '600']],
  ['merriweather', ['400', '700']],
  ['lora', ['400', '500', '600', '700']],
  ['patrick-hand', ['400']],
  ['vt323', ['400']],
];
let css = '/* Fontes locais (Fontsource, licença SIL OFL) */\n';
for (const [fam, weights] of FONTS) {
  for (const w of weights) {
    const src = fs.readFileSync(path.join(nm, '@fontsource', fam, `${w}.css`), 'utf8');
    for (const block of src.match(/@font-face\s*{[^}]*}/g) || []) {
      if (!/-latin(-ext)?-/.test(block)) continue;
      css += block.replace(/url\(\.\/files\/([^)]+)\)/g, (m, f) => {
        if (f.endsWith('.woff2')) fs.copyFileSync(path.join(nm, '@fontsource', fam, 'files', f), path.join(www, 'fonts', f));
        return `url(./${f})`;
      }).replace(/,\s*url\(\.\/[^)]+\.woff\)\s*format\('woff'\)/g, '') + '\n';
    }
  }
}
fs.writeFileSync(path.join(www, 'fonts', 'fonts.css'), css);

// 2) Leitor de PDF (PDF.js) e o runtime do Capacitor (registra os plugins nativos: voltar, compartilhar, tela acesa, tela cheia)
for (const f of ['pdf.min.js', 'pdf.worker.min.js']) fs.copyFileSync(path.join(nm, 'pdfjs-dist', 'build', f), path.join(www, 'lib', f));
fs.copyFileSync(path.join(nm, '@capacitor', 'core', 'dist', 'capacitor.js'), path.join(www, 'lib', 'capacitor.js'));

// 3) App: mesmas telas e lógica; só os endereços externos viram locais
let html = fs.readFileSync(path.join(root, 'src', 'app.html'), 'utf8');
const swap = (from, to) => { const ok = from instanceof RegExp ? from.test(html) : html.includes(from); if (!ok) throw new Error('não achei: ' + from); html = html.replace(from, to); };
swap(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^>]*>\n?/, '<link rel="stylesheet" href="fonts/fonts.css">\n');
swap(/css: 'https:\/\/fonts\.googleapis\.com\/css2\?family=Lora[^']*'/, "css: ''");
swap(/css: 'https:\/\/fonts\.googleapis\.com\/css2\?family=Patrick\+Hand[^']*'/, "css: ''");
swap(/const RETRO_FONT = 'https:[^']*';/, "const RETRO_FONT = '';");
swap(/const PDFJS_URL = 'https:[^']*';/, "const PDFJS_URL = 'lib/pdf.min.js';");
swap(/const PDFJS_WORKER = 'https:[^']*';/, "const PDFJS_WORKER = 'lib/pdf.worker.min.js';");
if (/https:\/\/fonts\.googleapis/.test(html)) throw new Error('ainda há fonte da internet');
const page = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n<script src="lib/capacitor.js"></script>
<meta name="theme-color" content="#FFFFFF">
<style>html,body{margin:0}</style>
</head>
<body>
${html}
</body>
</html>
`;
fs.writeFileSync(path.join(www, 'index.html'), page);
// 4) Pauta a mão livre (escrever partitura com a S Pen): tela separada em www/pauta.html
//    Fonte: src/pauta/pauta-mao-livre.html (o mesmo protótipo publicado no Claude). Fontes locais, sem internet.
let pauta = fs.readFileSync(path.join(root, 'src', 'pauta', 'pauta-mao-livre.html'), 'utf8');
pauta = pauta.replace(/<link rel="preconnect"[^>]*>\n?/, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, '<link rel="stylesheet" href="fonts/fonts.css">\n')
  .replace(/"Source Sans 3", /g, '"Noto Sans", ');
if (/https:\/\/fonts\.googleapis/.test(pauta)) throw new Error('pauta: ainda há fonte da internet');
fs.writeFileSync(path.join(www, 'pauta.html'), `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<script src="lib/capacitor.js"></script>
<style>html,body{margin:0}[hidden]:not([hidden=until-found i]){display:none!important}:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
</head>
<body>
${pauta}
</body>
</html>
`);

const kb = (p) => Math.round(fs.statSync(p).size / 1024);
console.log(`www pronto: index.html ${kb(path.join(www, 'index.html'))} KB · pauta.html ${kb(path.join(www, 'pauta.html'))} KB · ${fs.readdirSync(path.join(www, 'fonts')).length - 1} fontes · PDF.js`);
