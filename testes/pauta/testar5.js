const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf8');
const banco={musicas:[{id:'m1',titulo:'T',autor:'',clave:'sol',tom:'C',compasso:{num:4,den:4,simbolo:'C'},unidade:{tipo:'seminima',ponto:false},andamento:null,itens:[]}],atual:'m1'};
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://exemplo.test/',beforeParse(w){w.localStorage.setItem('pauta-mao-livre.v2',JSON.stringify(banco));w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:0,height:0});}});
const d=dom.window.document, W=dom.window;
d.getElementById('bBiblio').click();
console.log('biblioteca aberta:', !d.getElementById('biblio').hidden);
d.getElementById('pauta').dispatchEvent(new W.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));
console.log('depois de tocar na partitura, fechada:', d.getElementById('biblio').hidden, '| botão solto:', d.getElementById('bBiblio').getAttribute('aria-pressed'));
