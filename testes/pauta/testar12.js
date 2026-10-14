const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf8').replace('  // ---------- Início ----------',
 '  window.__t={M,itens,adicionar,usar,renderizar,aplicarViga,apagarTrecho,desfazer,CAIXAS,baseDe,set apagouAlgo(v){apagouAlgo=v;},trocarModo};\n  // ---------- Início ----------');
const banco={musicas:[{id:'m1',titulo:'Borracha',autor:'',clave:'sol',tom:'C',compasso:{num:4,den:4,simbolo:''},unidade:{tipo:'seminima',ponto:false},andamento:null,itens:[]}],atual:'m1',guiaNaoMostrar:true};
const erros=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://exemplo.test/',beforeParse(w){w.localStorage.setItem('pauta-mao-livre.v2',JSON.stringify(banco));
  // caixa aproximada de cada nota a partir do que foi desenhado (o simulador não mede SVG)
  w.SVGElement.prototype.getBBox=function(){const e=[...this.querySelectorAll('ellipse,line,path,circle')];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const el of e){const a=k=>parseFloat(el.getAttribute(k));if(el.tagName==='ellipse'||el.tagName==='circle'){const cx=a('cx'),cy=a('cy'),r=a('rx')||a('r')||1,ry=a('ry')||r;x0=Math.min(x0,cx-r);x1=Math.max(x1,cx+r);y0=Math.min(y0,cy-ry);y1=Math.max(y1,cy+ry);}else if(el.tagName==='line'){x0=Math.min(x0,a('x1'),a('x2'));x1=Math.max(x1,a('x1'),a('x2'));y0=Math.min(y0,a('y1'),a('y2'));y1=Math.max(y1,a('y1'),a('y2'));}}return x0<1e9?{x:x0,y:y0,width:x1-x0,height:y1-y0}:{x:0,y:0,width:0,height:0};};
  w.Element.prototype.setPointerCapture=()=>{};w.addEventListener('error',e=>erros.push(e.message));}});
const t=dom.window.__t;
let ok=0,tot=0;const chk=(n,c,info)=>{tot++;if(c)ok++;console.log((c?'OK   ':'FALHA')+' '+n+(info?' → '+info:''));};
t.usar(0,0);
const nota=(id,s,x,ss)=>t.adicionar({id,tipo:'seminima',s,ss:ss||[s],x,dir:'up'});
nota('a',2,40);nota('b',4,48);nota('c',3,56);nota('d',2,64);nota('e',4,72);nota('f',0,90,[0,2,4]);
t.adicionar({id:'lg',tipo:'ligadura',a:'d',b:'e',l:0,p:0});
const total=t.itens().length;
const B=t.baseDe({l:0,p:0}), y=s=>B-s*1.25;
// um risco horizontal passando pelas cabeças de a, b, c, d (um gesto só)
t.apagouAlgo=false;
let ult={x:36,y:y(3)};
for(let x=37;x<=66;x+=4){const q={x,y:y(3)};t.apagarTrecho(ult,q);ult=q;} // passos grandes: precisa varrer o meio
const restantes=t.itens().map(i=>i.id).join(',');
chk('um risco arrastado apaga tudo o que encosta', !['a','b','c','d'].some(id=>t.itens().some(i=>i.id===id)), 'restaram: '+restantes);
chk('ligadura de nota apagada some junto', !t.itens().some(i=>i.id==='lg'));
chk('nota fora do risco fica', t.itens().some(i=>i.id==='e'));
t.desfazer();
chk('um Desfazer devolve tudo o que o risco apagou', t.itens().length===total, `${t.itens().length} de ${total}`);
// acorde: risco só pela cabeça de cima tira só ela
t.apagouAlgo=false; t.apagarTrecho({x:86,y:y(4)},{x:94,y:y(4)});
const f=t.itens().find(i=>i.id==='f');
chk('no acorde, o risco tira só a cabeça que tocou', f && f.ss.join()==='0,2', f&&f.ss.join());
chk('sem erros', !erros.length, erros.join(';'));
console.log(`\n${ok} de ${tot}`);
