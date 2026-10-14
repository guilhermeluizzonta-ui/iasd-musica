const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf8');
function abrir(extra){const banco=Object.assign({musicas:[{id:'m1',titulo:'G',autor:'',clave:'sol',tom:'C',compasso:{num:4,den:4,simbolo:''},unidade:{tipo:'seminima',ponto:false},andamento:null,itens:[]}],atual:'m1'},extra);
 const erros=[];const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://exemplo.test/',beforeParse(w){w.localStorage.setItem('pauta-mao-livre.v2',JSON.stringify(banco));w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:1,height:1});w.Element.prototype.setPointerCapture=()=>{};w.addEventListener('error',e=>erros.push(e.message));}});return [dom,erros];}
let [dom,erros]=abrir({});let d=dom.window.document,W=dom.window;
console.log('abre sozinho na primeira vez:', !d.getElementById('janGuia').hidden, '| cartões:', d.querySelectorAll('#cartoes .cartao').length);
d.getElementById('janGuia').dispatchEvent(new W.MouseEvent('pointerdown',{bubbles:true}));
console.log('tocar fora fecha:', d.getElementById('janGuia').hidden);
d.getElementById('bGuia').click(); console.log('ícone abre de novo:', !d.getElementById('janGuia').hidden);
d.getElementById('cGuiaNao').click(); d.getElementById('bGuiaOk').click();
console.log('marcou "não mostrar":', JSON.parse(W.localStorage.getItem('pauta-mao-livre.v2')).guiaNaoMostrar===true, '| fechou:', d.getElementById('janGuia').hidden);
d.getElementById('bTempo').click(); console.log('relógio abre o ajuste:', !d.getElementById('popTempo').hidden, '| valor na barra:', d.getElementById('tTempo').textContent);
const r=d.getElementById('rEspera'); r.value='1000'; r.dispatchEvent(new W.Event('input'));
console.log('ajustar muda a barra:', d.getElementById('tTempo').textContent);
d.body.dispatchEvent(new W.MouseEvent('pointerdown',{bubbles:true})); console.log('tocar fora fecha o ajuste:', d.getElementById('popTempo').hidden, '| erros:', erros.length?erros:'nenhum');
[dom,erros]=abrir({guiaNaoMostrar:true}); console.log('com "não mostrar", não abre:', dom.window.document.getElementById('janGuia').hidden);
