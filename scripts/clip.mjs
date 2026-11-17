import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve, join} from 'node:path';
import {transcribe,toCaptions} from '@remotion/install-whisper-cpp';

const [cmd,id,...args]=process.argv.slice(2);
const root=process.cwd();
const arch=process.arch==='arm64'?'arm64':'x64';
const mediaDir=resolve(`node_modules/@remotion/compositor-darwin-${arch}`);
const bin=(name)=>join(mediaDir,name);
const run=(exe,a,log)=>{const r=spawnSync(exe,a,{encoding:'utf8',maxBuffer:30*1024*1024,env:{...process.env,DYLD_LIBRARY_PATH:mediaDir}}); if(log) writeFileSync(log,(r.stdout||'')+'\n'+(r.stderr||'')); if(r.status!==0) throw new Error(`${exe} fehlgeschlagen. Technische Details: ${log||'siehe Ausgabe'}\n${(r.stderr||'').slice(-1000)}`); return (r.stdout||'')+'\n'+(r.stderr||'');};
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const read=(p)=>JSON.parse(readFileSync(p,'utf8'));
const valid=(x)=>{if(!/^[a-z0-9][a-z0-9_-]{0,49}$/.test(x||'')) throw Error('Auftragsname: nur Kleinbuchstaben, Zahlen, Bindestrich und Unterstrich.');};
const help=()=>console.log('Befehle: init NAME QUELLE START ENDE | transcribe NAME [SPRACHE] | approve NAME | preview NAME | render NAME | example | doctor\nZeiten in Sekunden, ein Auftrag je Clip. Details: docs/ABLAUF.md');
async function main(){
 if(cmd==='doctor'){await import('./doctor.mjs'); return;}
 if(!cmd || cmd==='help'){help();return;}
 if(cmd==='example') {console.log('Beispiel: siehe docs/ABLAUF.md; ein separater Auftrag example wird angelegt.'); const p=spawnSync(process.execPath,[resolve('scripts/example.mjs')],{stdio:'inherit'}); if(p.status!==0) throw Error('Beispieltest fehlgeschlagen.');return;}
 valid(id); const dir=resolve('public/jobs',id), work=resolve('.work/jobs',id), out=resolve('out',id); mkdirSync(work,{recursive:true}); mkdirSync(out,{recursive:true});
 const log=(name)=>join(work,name+'.log'); const cfg=join(dir,'props.json'), captions=join(dir,'captions.json'), clip=join(dir,'clip.mp4');
 if(cmd==='init'){
  const [source,start,end]=args; if(!source || !existsSync(source)) throw Error('Quelldatei fehlt. Pfad als eigenes Argument übergeben.');
  if(!Number.isFinite(Number(start)) || !Number.isFinite(Number(end)) || Number(start)<0 || Number(end)<=Number(start)) throw Error('Start und Ende müssen Sekunden sein, Ende nach Start.');
  mkdirSync(dir,{recursive:true});
  const manifest=join(work,'auftrag.json');
  if(existsSync(manifest)) {const old=read(manifest); if(old.source!==resolve(source)||old.start!==start||old.end!==end) throw Error('Auftrag besteht bereits mit anderen Daten. Bitte neuen Namen wählen.');}
  else save(manifest,{source:resolve(source),start,end});
  if(!existsSync(clip)) {const tmp=join(dir,'clip.part.mp4'); run(bin('ffmpeg'),['-hide_banner','-loglevel','error','-y','-ss',start,'-i',resolve(source),'-t',String(Number(end)-Number(start)),'-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','fast','-crf','18','-c:a','aac',tmp],log('schnitt')); const {renameSync}=await import('node:fs');renameSync(tmp,clip);}
  if(!existsSync(cfg)) save(cfg,{videoFile:`jobs/${id}/clip.mp4`,captionsFile:`jobs/${id}/captions.json`,...read('profiles/gold-short.json')});
  console.log('Ausschnitt erstellt. Original bleibt erhalten. Grenzen anhören und ansehen; dann transcribe.'); return;
 }
 if(!existsSync(clip)) throw Error('Auftrag fehlt: zuerst init ausführen.');
 if(cmd==='transcribe'){
  if(existsSync(captions)){console.log('Korrekturen existieren bereits und bleiben erhalten. Für neue Transkription neuen Auftrag anlegen.');return;}
  const lang=args[0]||'de'; if(!/^[a-z]{2}$/.test(lang)) throw Error('Sprache als zweistelligen Code angeben, z. B. de.');
  const wav=join(work,'audio.wav');run(bin('ffmpeg'),['-hide_banner','-loglevel','error','-y','-i',clip,'-vn','-ar','16000','-ac','1',wav],log('audio'));
  const result=await transcribe({inputPath:wav,model:'base',tokenLevelTimestamps:true,whisperPath:resolve('.runtime/whisper.cpp'),whisperCppVersion:'1.6.0',printOutput:false,translateToEnglish:false,language:lang,splitOnWord:true});
  save(join(work,'whisper-roh.json'),result);
  const raw=toCaptions({whisperCppOutput:result}).captions; let last=0; const words=raw.map(w=>{const start=Math.max(last,Math.round(w.startMs)); const end=Math.max(start+1,Math.round(w.endMs));last=end;return {text:w.text.trim(),startMs:start,endMs:end};}).filter(w=>w.text);
  save(captions,words); console.log(`Untertitel: ${captions}\nAlle Wörter und Zeiten gegen den Ton prüfen. Unsichere Stellen und Schnittgrenzen mit dem Nutzer klären; erst dann approve.`); return;
 }
 if(cmd==='approve'){
  if(!existsSync(captions)) throw Error('Untertitel fehlen.'); const words=read(captions); if(!Array.isArray(words)||!words.length||words.some((w,i)=>!w.text?.trim()||!Number.isFinite(w.startMs)||!Number.isFinite(w.endMs)||w.startMs<0||w.endMs<=w.startMs||(i&&w.startMs<words[i-1].endMs))) throw Error('Untertitel oder Wortzeiten sind ungültig oder überlappen.');
  const {createHash}=await import('node:crypto');const hash=createHash('sha256').update(readFileSync(captions)).digest('hex');writeFileSync(join(work,'freigabe.json'),JSON.stringify({hash,date:new Date().toISOString()},null,2));console.log('Prüfung gespeichert. Bei späterer Änderung erneut freigeben.');return;
 }
 if(cmd==='preview'||cmd==='render'){
  const {createHash}=await import('node:crypto'); const approval=join(work,'freigabe.json'); if(!existsSync(approval)||read(approval).hash!==createHash('sha256').update(readFileSync(captions)).digest('hex')) throw Error('Untertitel müssen nach menschlicher Inhaltsprüfung freigegeben werden (approve).');
  const target=join(out,cmd==='preview'?'vorschau.png':'render.mp4'); if(existsSync(target)) throw Error(`Ausgabe existiert bereits: ${target}. Neuen Auftrag wählen oder bestehende Ausgabe selbst sichern.`);
  const options=cmd==='preview'?['still','GoldShort',target,`--props=${cfg}`,'--frame=30']:['render','GoldShort',target,`--props=${cfg}`,'--codec=h264','--crf=18','--audio-bitrate=192k','--concurrency=2'];
  run(resolve('node_modules/.bin/remotion'),options,log(cmd)); console.log('Erstellt:',target);
  if(cmd==='render'){
   const stats=run(bin('ffmpeg'),['-hide_banner','-nostats','-i',target,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],log('lautheit-vorher'));
   const match=stats.match(/\{\s*"input_i"[\s\S]*?\}/); if(!match) throw Error('Lautheit nicht messbar; technische Diagnose ansehen.');const s=JSON.parse(match[0]);
   if(!Number.isFinite(Number(s.input_i))) throw Error('Ton ist stumm; Lautheit nicht normalisierbar.');
   const final=join(out,'final.mp4'); if(existsSync(final)) throw Error('Finale Datei existiert bereits.');
   const filter=`loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true`;
   run(bin('ffmpeg'),['-hide_banner','-loglevel','error','-n','-i',target,'-map','0:v','-map','0:a','-c:v','copy','-af',filter,'-c:a','aac','-b:a','192k',final],log('normalisierung'));
   const checked=run(bin('ffmpeg'),['-hide_banner','-nostats','-i',final,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],log('lautheit-nachher')); const measured=checked.match(/\{\s*"input_i"[\s\S]*?\}/); console.log(`Final: ${final}; gemessen: ${measured?JSON.parse(measured[0]).input_i:'?'} LUFS (Ziel -16). Video und Ton vollständig prüfen.`);
  } return;
 }
 throw Error('Unbekannter Befehl.');
}
main().catch(e=>{console.error('Fehler:',e.message);process.exitCode=1;});
