const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf8').replace('  // ---------- Início ----------',
 '  window.__t={M,itens,adicionar,usar,aplicarViga,renderizar,ajustar,TIPS,VIGA_GEO,desenhar(trs){pendente={tracos:trs.map(pts=>({pts,el:mk("path",{},camTinta)})),bx:caixa(trs.flat())};finalizar();}};\n  // ---------- Início ----------');
const banco={musicas:[{id:'m1',titulo:'Barras de colcheias',autor:'',clave:'sol',tom:'G',compasso:{num:4,den:4,simbolo:''},unidade:{tipo:'seminima',ponto:false},andamento:null,itens:[]}],atual:'m1',guiaNaoMostrar:true};
const erros=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://exemplo.test/',beforeParse(w){w.localStorage.setItem('pauta-mao-livre.v2',JSON.stringify(banco));w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:1,height:1});w.Element.prototype.setPointerCapture=()=>{};w.addEventListener('error',e=>erros.push(e.message));}});
const t=dom.window.__t,d=dom.window.document;
let ok=0,tot=0;const chk=(n,c,info)=>{tot++;if(c)ok++;console.log((c?'OK   ':'FALHA')+' '+n+(info?' → '+info:''));};
t.usar(0,0);
const nota=(id,tipo,s,x,ss)=>t.adicionar({id,tipo,s,ss:ss||[s],x,dir:s>=4?'down':'up'});
// compasso 1: quatro semínimas desenhadas sem bandeirola → risco nas pontas vira colcheias
nota('a','seminima',2,36);nota('b','seminima',4,42);nota('c','seminima',3,48);nota('d','seminima',5,54);
t.renderizar();
const A=t.TIPS.get('a'),D=t.TIPS.get('d');
const lin=(p,q)=>Array.from({length:21},(_,i)=>({x:p.x+(q.x-p.x)*i/20,y:p.y+(q.y-p.y)*i/20+(Math.random()-.5)*.2}));
t.desenhar([lin(A,D)]);
const tipos=()=>['a','b','c','d'].map(id=>t.itens().find(i=>i.id===id).tipo).join(',');
chk('risco nas pontas das hastes une as 4 notas', t.itens().filter(i=>i.tipo==='viga').length===1 && t.itens().find(i=>i.tipo==='viga').ns.length===4, d.getElementById('status').textContent);
chk('semínimas viram colcheias', tipos()==='colcheia,colcheia,colcheia,colcheia', tipos());
chk('hastes na mesma direção e sem bandeirolas', d.querySelectorAll('.nota .band').length===1, 'faixas de barra desenhadas: '+d.querySelectorAll('.nota .band').length);
// segundo risco igual: semicolcheias
const A2=t.TIPS.get('a'),D2=t.TIPS.get('d'); t.desenhar([lin(A2,D2)]);
chk('segundo risco vira semicolcheias (2 barras)', tipos()==='semicolcheia,semicolcheia,semicolcheia,semicolcheia', tipos());
chk('compasso de 4 semicolcheias = 1 tempo (falta)', /1 de 4/.test(d.querySelector('.rot.tempos')?.textContent||''), d.querySelector('.rot.tempos')?.textContent);
// compasso 2: colcheia + semicolcheias misturadas e acorde
t.usar(0,0);t.adicionar({id:'b1',tipo:'barra',x:60});
nota('e','colcheia',6,66);nota('f','semicolcheia',7,71);nota('g','semicolcheia',8,76,[4,6,8]);
t.aplicarViga(['e','f','g']);
const geo=[...t.VIGA_GEO.values()].find(v=>v.ns.length===3);
chk('notas agudas: barra com hastes para baixo', geo && geo.cima===false, geo&&('cima='+geo.cima));
// arrastar a barra da Biblioteca entre duas colcheias soltas
nota('h','colcheia',1,90);nota('i','colcheia',3,96);
t.aplicarViga(['h','i']);
chk('barra pela Biblioteca (duas notas)', t.itens().filter(i=>i.tipo==='viga').length===3);
// mínima não leva barra
nota('j','minima',2,110);nota('k','colcheia',2,116);t.aplicarViga(['j','k']);
chk('mínima não leva barra', t.itens().filter(i=>i.tipo==='viga').length===3, d.getElementById('status').textContent);
// apagar uma nota de uma barra de 2 remove a barra
t.M().itens=t.M().itens.filter(i=>i.id!=='h'); t.renderizar();
chk('barra some quando fica com uma nota só', t.itens().filter(i=>i.tipo==='viga').length===2);
t.ajustar();
chk('Ajustar mantém as barras', t.itens().filter(i=>i.tipo==='viga').length===2);
chk('sem erros', !erros.length, erros.join(';'));
console.log(`\n${ok} de ${tot}`);
const svg=d.getElementById('pauta');
const css=`.papel{fill:#fff;stroke:#ccc;stroke-width:.25}.linhas line{stroke:#3B403D;stroke-width:.2}.cab,.band,.glifo,.ponto,.lig,.chave{fill:#141414}.furo{fill:#fff}.haste,.traco-fino{stroke:#141414;stroke-width:.32;fill:none}.traco-grosso{stroke:#141414;stroke-width:.9}.supl{stroke:#141414;stroke-width:.3}.alvo,.alvo-linha,.toque-clave{fill:none;stroke:none}.titulo-mus{font:700 3.4px serif}.num-comp{font:900 6.6px serif}.rot{font:600 2.3px sans-serif;fill:#6B746F}.rot.passou{fill:#C62828}.mais circle{fill:#00A651}.mais path{stroke:#fff;stroke-width:.5}`;
fs.writeFileSync('vigas.svg',svg.outerHTML.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="1584" ').replace(/(<svg[^>]*>)/,`$1<style>${css}</style>`));
