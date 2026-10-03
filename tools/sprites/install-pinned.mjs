import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {config,lockWorkspace} from '../workspace/core.mjs';
import {validateGIF} from './download.mjs';
import {validatePNG} from './png.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function safeParents(target) {
  for(let at=path.resolve(target);at!==path.dirname(at);at=path.dirname(at)) {
    const stat=fs.lstatSync(at,{throwIfNoEntry:false});
    if(stat&&(!stat.isDirectory()||stat.isSymbolicLink()))throw Error('Unsafe artwork output directory');
  }
}
export async function installPinned(pin,target,validator,{fetchImpl=globalThis.fetch,signal=AbortSignal.timeout(600000)}={}) {
  validator.validateShowdownPin(pin);target=path.resolve(target);safeParents(target);
  if(fs.existsSync(target)) {
    validator.loadShowdownArtwork(target,pin);return JSON.parse(fs.readFileSync(path.join(target,'manifest.json'),'utf8'));
  }
  fs.mkdirSync(path.dirname(target),{recursive:true});
  const staging=fs.mkdtempSync(path.join(path.dirname(target),'.showdown-artwork-'));
  const files=[];
  try {
    for(const file of pin.files) {
      signal.throwIfAborted();
      const url=`https://raw.githubusercontent.com/smogon/sprites/${pin.sourceCommit}/${file.sourcePath}`;
      let bytes,last;
      for(let attempt=0;attempt<2;attempt++) {
        try {
          const response=await fetchImpl(url,{redirect:'manual',credentials:'omit',signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])});
          if(response.status!==200) {await response.body?.cancel();throw Error(`Artwork source HTTP ${response.status}: ${file.path}`);}
          const chunks=[];let size=0;
          for await(const chunk of response.body) {
            signal.throwIfAborted();
            size+=chunk.length;if(size>file.sizeBytes)throw Error(`Oversized artwork: ${file.path}`);chunks.push(Buffer.from(chunk));
          }
          bytes=Buffer.concat(chunks);break;
        } catch(error) {last=error;if(signal.aborted||/HTTP|Oversized/.test(error.message))throw error;}
      }
      if(!bytes)throw last;
      validator.verifyShowdownBytes(bytes,file);
      const metadata=file.path.endsWith('.gif')?{gif:validateGIF(bytes)}:{png:validatePNG(bytes)};
      const destination=path.join(staging,file.path);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes,{flag:'wx'});
      files.push({...file,sourceUrl:url,sha256:hash(bytes),...metadata});
    }
    const manifest={schemaVersion:1,kind:pin.kind,sourceCommit:pin.sourceCommit,pinSha256:hash(JSON.stringify(pin)),complete:true,files};
    fs.writeFileSync(path.join(staging,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
    validator.loadShowdownArtwork(staging,pin);
    safeParents(target);fs.mkdirSync(target); // Never replace an existing directory, even empty.
    for(const name of fs.readdirSync(staging))fs.renameSync(path.join(staging,name),path.join(target,name));
    return manifest;
  } finally {fs.rmSync(staging,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let release, interrupted=0;
  const controller=new AbortController();
  const onINT=()=>{interrupted=130;controller.abort();};
  const onTERM=()=>{interrupted=143;controller.abort();};
  process.once('SIGINT',onINT);process.once('SIGTERM',onTERM);
  try {
    if(process.argv.length!==2)throw Error('Usage: npm run sprites:install (optional TMT2_SHOWDOWN_SPRITES_DIR)');
    const c=config();release=lockWorkspace();
    const pin=JSON.parse(fs.readFileSync(path.join(c.client,'tmt2/showdown-artwork.json'),'utf8'));
    const validator=createRequire(import.meta.url)(path.join(c.client,'build-tools/tmt2-native-artwork.js'));
    const target=path.resolve(c.client,process.env.TMT2_SHOWDOWN_SPRITES_DIR||'caches/tmt2-showdown-artwork');
    const manifest=await installPinned(pin,target,validator,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(600000)])});
    console.log('Verified pinned official Showdown matching art (private/local evaluation; no runtime network):');
    console.log(JSON.stringify(manifest,null,2));
  } catch(error) {console.error(error.message);process.exitCode=interrupted||1;}
  finally {release?.();process.removeListener('SIGINT',onINT);process.removeListener('SIGTERM',onTERM);}
}
