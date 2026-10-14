const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf8').replace('  // ---------- Início ----------',
 '  window.__t={M,itens,adicionar,usar,aprender,abrirTreino,get BASE(){return BASE;},desenhar(trs){pendente={tracos:trs.map(pts=>({pts,el:mk("path",{},camTinta)})),bx:caixa(trs.flat())};finalizar();}};\n  // ---------- Início ----------');
const banco={musicas:[{id:'m1',titulo:'Treino',autor:'',clave:'sol',tom:'C',compasso:{num:4,den:4,simbolo:''},unidade:{tipo:'seminima',ponto:false},andamento:null,itens:[]}],atual:'m1'};
const erros=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://exemplo.test/',beforeParse(w){w.localStorage.setItem('pauta-mao-livre.v2',JSON.stringify(banco));w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:1,height:1});w.Element.prototype.setPointerCapture=()=>{};w.addEventListener('error',e=>erros.push(e.message));}});
const t=dom.window.__t,d=dom.window.document;
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const lin=(x0,y0,x1,y1,n=14)=>Array.from({length:n+1},(_,i)=>({x:x0+(x1-x0)*i/n,y:y0+(y1-y0)*i/n}));
const tre=(tr,a=0.3)=>tr.map(s=>s.map(p=>({x:p.x+(rnd()-.5)*a,y:p.y+(rnd()-.5)*a})));
const B=t.BASE, yS=s=>B-s*1.25;
const sust=(x,s,v=rnd()-.5)=>{const c=yS(s);return tre([lin(x,c-3.6,x+.2,c+3.4),lin(x+1.4,c-4,x+1.6+.2*v,c+3),lin(x-.5,c-.7,x+2.1,c-1.3-.3*v),lin(x-.5,c+1.3,x+2.1,c+.7)]);};
const bem=(x,s,v=rnd()-.5)=>{const c=yS(s);return tre([lin(x,c-5.3,x,c+1.2),[...Array(16)].map((_,i)=>{const a=Math.PI*(1-i/15)*1.15-.2;return{x:x+1.2*(1+v*.2)*(1-Math.cos(a))*.9,y:c-.3-1.4*Math.sin(a)+(i/15)*1.5};})]);};
const tipos=()=>t.itens().map(i=>i.tipo+(i.s!=null?'@'+i.s:'')).join(' ');
let ok=0,tot=0;const chk=(n,c,info)=>{tot++;if(c)ok++;console.log((c?'OK   ':'FALHA')+' '+n+(info?' → '+info:''));};
t.usar(0,0);
for(let k=0;k<4;k++){t.aprender('sustenido',sust(40,4));t.aprender('bemol',bem(40,4));}
console.log('lápis com número no cartão:', [...d.querySelectorAll('.item')].filter(i=>i.dataset.chave==='sustenido').map(i=>i.querySelector('.ensinar').textContent).join(','));
const antes=t.itens().length;
t.desenhar(sust(60,6));
let novo=t.itens().slice(antes);
chk('sustenido desenhado vira sustenido (na altura certa)', novo.length===1&&novo[0].tipo==='sustenido'&&Math.abs(novo[0].s-6)<=1, tipos());
t.desenhar(bem(75,2));
novo=t.itens().slice(antes+1);
chk('bemol desenhado vira bemol (e não mínima)', novo.length===1&&novo[0].tipo==='bemol'&&Math.abs(novo[0].s-2)<=1, tipos()+' | escolha aberta: '+!d.getElementById('escolha').hidden);
// mínima de verdade continua mínima
const c=yS(3), loop=[...Array(18)].map((_,i)=>({x:91+1.4*Math.cos(i/17*6.4),y:c+1*Math.sin(i/17*6.4)}));
const n0=t.itens().length; t.desenhar([loop, lin(92.3,c,92.3,c-9)]);
const r3=t.itens().slice(n0);
chk('mínima desenhada continua mínima (ou o app pergunta)', (r3.length===1&&r3[0].tipo==='minima')||!d.getElementById('escolha').hidden, r3.map(i=>i.tipo).join(',')+' | pergunta: '+!d.getElementById('escolha').hidden);
d.getElementById('escolhaNenhum').click();
// pontos: aumento × staccato
t.adicionar({id:'q1',tipo:'seminima',s:4,ss:[4],x:110,dir:'down',l:0,p:0});
const dot=(x,y)=>[[{x,y},{x:x+.1,y:y+.05}]];
let n1=t.itens().length; t.desenhar(dot(112.5,yS(5)));
chk('toque à direita da nota = ponto de aumento', t.itens().slice(n1)[0]?.tipo==='ponto', t.itens().slice(n1).map(i=>i.tipo+'@'+i.s).join(','));
n1=t.itens().length; t.desenhar(dot(110.2,yS(9)));
chk('toque acima da nota = staccato', t.itens().slice(n1)[0]?.tipo==='staccato', t.itens().slice(n1).map(i=>i.tipo+'@'+i.s).join(','));
// tela de treino abre
t.abrirTreino('pSeminima');
chk('tela de treino abre com o modelo de referência', !d.getElementById('janTreino').hidden && d.querySelector('#treinoSvg .treino-ref .glifo')!==null, d.getElementById('treinoConta').textContent);
chk('sem erros', !erros.length, erros.join(';'));
console.log(`\n${ok} de ${tot}`);
