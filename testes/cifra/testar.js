// Testes do "Criar cifra": ChordPro ida e volta, acordes acompanhando a letra, colocar/mover/tirar, transpor pela ficha.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const file = process.argv[2] || '../../src/cifra/criar-cifra.html';
const dom = new JSDOM(fs.readFileSync(file, 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://exemplo.local/' });
const w = dom.window; let ok = 0, bad = 0;
const t = (name, cond, extra) => { if (cond) ok++; else { bad++; console.log('FALHOU:', name, extra ?? ''); } };
setTimeout(() => {
  const ex = w.eval('EXAMPLE'), cp = w.eval('toChordPro(song)');
  t('exemplo abre e volta igual', cp.trim() === ex.trim(), '\n' + cp);
  t('modo acordes desenha sílabas', w.document.querySelectorAll('#doc .ch').length > 50);
  t('acordes aparecem por cima', w.document.querySelectorAll('#doc .cd').length === 13, w.document.querySelectorAll('#doc .cd').length);
  t('paleta tem campo harmônico de G', w.document.querySelectorAll('#pal .pc[data-ch]').length >= 16);
  // letra editada: acorde acompanha
  w.eval(`window.S = { text: 'eu canto ao Senhor', chords: [{at:3,ch:'Em'},{at:12,ch:'C'}] }; applyText(S, 'e eu canto ao Senhor')`);
  t('inserir no começo empurra os acordes', JSON.stringify(w.S.chords) === '[{"at":5,"ch":"Em"},{"at":14,"ch":"C"}]', JSON.stringify(w.S.chords));
  w.eval(`applyText(S, 'e eu canto Senhor')`);
  t('apagar palavra no meio mantém acordes certos', w.S.chords[1].at === 11 && w.S.text.slice(11).startsWith('Senhor'), JSON.stringify(w.S.chords));
  // colocar, mover, tirar
  w.eval(`dropOn({type:'pal', ch:'A7'}, {s:1, i:2})`);
  t('soltar acorde da paleta', w.eval(`song.sections[1].chords.some(c => c.at===2 && c.ch==='A7')`));
  w.eval(`dropOn({type:'placed', s:1, i:2, ch:'A7'}, {s:2, i:0})`);
  t('mover acorde para outra parte', w.eval(`!song.sections[1].chords.some(c=>c.ch==='A7') && song.sections[2].chords.find(c=>c.at===0).ch==='A7'`));
  w.eval(`dropOn({type:'placed', s:2, i:0, ch:'A7'}, {trash:true})`);
  t('tirar acorde', w.eval(`!song.sections[2].chords.some(c=>c.at===0)`));
  w.eval(`dropOn({type:'pal', ch:'Am'}, {s:0})`);
  t('intro ganha acorde no fim', w.eval(`song.sections[0].chords.join(' ')`) === 'G D Em C Am');
  w.eval(`dropOn({type:'inst', s:0, k:4, ch:'Am'}, {s:0, k:1})`);
  t('reordenar na intro', w.eval(`song.sections[0].chords.join(' ')`) === 'G Am D Em C');
  w.eval('undo(); undo(); undo(); undo(); undo()');
  t('desfazer volta ao exemplo', w.eval('toChordPro(song)').trim() === ex.trim());
  // transpor
  t('transpor G→A', w.eval(`moveChord('C/E', 2, false)`) === 'D/F#' && w.eval(`moveChord('F#m7(b5)', -1, true)`) === 'Fm7(b5)');
  t('tom menor', w.eval(`keyChords('Em').main.map(x=>x[0]).join(' ')`) === 'Em F#° G Am Bm C D');
  t('tom com bemóis', w.eval(`keyChords('F').main.map(x=>x[0]).join(' ')`) === 'F Gm Am Bb C Dm E°');
  // acorde no fim da linha e linha só com texto
  const cp2 = w.eval(`toChordPro({title:'T', artist:'', key:'C', sections:[{id:'a',type:'estrofe',label:'',text:'ah\\nfim',chords:[{at:2,ch:'G'},{at:6,ch:'C'}]}]})`);
  t('acorde no fim da linha', cp2.includes('ah[G]\nfim[C]'), cp2);
  t('modo letra mostra caixas de texto', (w.eval(`setMode('lyrics')`), w.document.querySelectorAll('textarea.lyr').length === 2));
  console.log(`${ok} ok, ${bad} falharam`);
  process.exit(bad ? 1 : 0);
}, 300);
