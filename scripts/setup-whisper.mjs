import {installWhisperCpp, downloadWhisperModel} from '@remotion/install-whisper-cpp';
import {existsSync, renameSync, statSync} from 'node:fs';
import {resolve, join} from 'node:path';
const folder=resolve('.runtime/whisper.cpp');
const backup=(p)=>renameSync(p,`${p}.unvollstaendig-${Date.now()}`);
if (existsSync(folder) && !existsSync(join(folder,'main'))) {console.log('Unvollständiger Whisper-Build wird gesichert und neu begonnen.');backup(folder);}
await installWhisperCpp({to:folder,version:'1.6.0'});
const model=join(folder,'ggml-base.bin');
if(existsSync(model)&&statSync(model).size!==147951465) {console.log('Unvollständiger Modell-Download wird gesichert und wiederholt.');backup(model);}
await downloadWhisperModel({folder,model:'base'});
