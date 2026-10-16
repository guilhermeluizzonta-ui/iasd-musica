const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext();
 await ctx.addInitScript(() => { const ok=v=>Promise.resolve(v); const falso = { Plugins: { Filesystem: { writeFile: (o)=>ok({uri:'x'}) }, WhatsApp: { shareFile: ()=>ok({}) } } }; Object.defineProperty(falso, 'isNativePlatform', { value: () => true, writable: false }); Object.defineProperty(window, 'Capacitor', { get: () => falso, set: () => {}, configurable: true }); });
 const pg = await ctx.newPage(); pg.on('pageerror', e=>console.log('ERR', e.message));
 await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(400);
 console.log(await pg.evaluate(() => JSON.stringify({ nat: window.Capacitor.isNativePlatform(), keys: Object.keys(window.Capacitor), X: Object.keys(window.capacitorExports||{}).slice(0,20), fs: !!capPlugin('Filesystem'), cache: Object.keys(capCache) })));
 await b.close(); })();
