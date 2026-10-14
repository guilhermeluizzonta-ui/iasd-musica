const fs=require('fs');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf8').replace('  // ---------- Início ----------','  window.__t={adicionar,usar,M,itens,trocarModo,get selId(){return selId;},apagarSelecionado,renderizar};\n  // ---------- Início ----------');
const banco={musicas:[{id:'m1',titulo:'T',autor:'',clave:'sol',tom:'C',compasso:{num:4,den:4,simbolo:'C'},unidade:{tipo:'seminima',ponto:false},andamento:null,itens:[]}],atual:'m1'};
const erros=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://exemplo.test/',beforeParse(w){w.localStorage.setItem('pauta-mao-livre.v2',JSON.stringify(banco));w.SVGElement.prototype.getBBox=()=>({x:0,y:0,width:1,height:1});w.Element.prototype.setPointerCapture=()=>{};w.addEventListener('error',e=>erros.push(e.message));}});
const t=dom.window.__t, d=dom.window.document;
t.usar(0,0); t.adicionar({id:'n1',tipo:'seminima',s:4,ss:[4],x:50,dir:'down'});
t.trocarModo('ponteiro');
console.log('ponteiro ativo:', d.getElementById('bPonteiro').getAttribute('aria-pressed'));
// simula selecionar a nota (elementFromPoint não existe no simulador): define e redesenha
const g=d.querySelector('.nota[data-id="n1"]');
dom.window.document.elementFromPoint=()=>g.querySelector('.cab');
d.getElementById('pauta').dispatchEvent(new dom.window.MouseEvent('pointerdown',{bubbles:true,cancelable:true,clientX:10,clientY:10}));
console.log('selecionada:', t.selId, '| destaque:', !!d.querySelector('.nota.sel'), '| status:', d.getElementById('status').textContent);
d.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Delete',bubbles:true}));
console.log('Delete apagou:', t.itens().length===0, '| erros:', erros.length?erros:'nenhum');
