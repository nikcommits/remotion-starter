import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,copyFileSync} from 'node:fs';
const call=(...args)=>{const r=spawnSync(process.execPath,['scripts/clip.mjs',...args],{stdio:'inherit'});if(r.status!==0) process.exit(r.status||1);};
call('init','example','public/example.mp4','0','4.32');
const newTranscription=!existsSync('public/jobs/example/captions.json');
call('transcribe','example','de');
if(newTranscription) {copyFileSync('public/example.json','public/jobs/example/captions.json'); console.log('Beispiel: Transkription ausgeführt, anschließend vorgeprüfte Beispieluntertitel verwendet.');}
const words=JSON.parse(readFileSync('public/jobs/example/captions.json','utf8'));
console.log('Beispieltranskript:',words.map(w=>w.text).join(' '));
const text=words.map(w=>w.text).join(' ').toLowerCase().replace(/[^a-zäöüß ]/g,'').replace(/\s+/g,' ').trim();
if(text!=='hallo dies ist ein kurzes beispiel für deinen neuen videoshort') {console.log('Die Beispieluntertitel wurden verändert. Bitte gegen den gesprochenen Satz prüfen: „Hallo! Dies ist ein kurzes Beispiel für deinen neuen Video Short.“');process.exit(1);}
call('approve','example');
if(!existsSync('out/example/vorschau.png')) call('preview','example');
if(!existsSync('out/example/final.mp4')) call('render','example');
console.log('Beispiel-Export vorhanden: out/example/final.mp4. Bitte Video und Ton prüfen.');
