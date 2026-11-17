import {existsSync,statfsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const checks=[['Node 22.14.0',process.version==='v22.14.0'],['Remotion',existsSync('node_modules/.bin/remotion')],['Whisper-Modell base',existsSync('.runtime/whisper.cpp/ggml-base.bin')],['Whisper-Binary',existsSync('.runtime/whisper.cpp/main')],['Arial Bold',existsSync('public/wisam-arial-bold.ttf')],['Beispiel',existsSync('public/example.mp4')]];
const platform=process.arch==='arm64'?'arm64':'x64';
for(const bin of ['ffmpeg','ffprobe']) {const file=resolve(`node_modules/@remotion/compositor-darwin-${platform}/${bin}`); try {execFileSync(file,['-version'],{stdio:'ignore',env:{...process.env,DYLD_LIBRARY_PATH:resolve(`node_modules/@remotion/compositor-darwin-${platform}`)}});checks.push([bin,true]);} catch {checks.push([bin,false]);}}
try {execFileSync('node_modules/.bin/remotion',['browser','ensure'],{stdio:'ignore'}); checks.push(['Renderbrowser',true]);} catch {checks.push(['Renderbrowser',false]);}
const fs=statfsSync('.'); console.log(`Freier Speicher: ${(fs.bavail*fs.bsize/1e9).toFixed(1)} GB`);
for (const [name,ok] of checks) console.log(`${ok?'OK':'FEHLT'}: ${name}`);
if(checks.some(([,ok])=>!ok)) process.exitCode=1;
