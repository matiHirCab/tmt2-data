// Private source-checkout readiness; never a redistribution/ROM certification.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {config,root,hash,git,manifest,localDirectory,lockWorkspace,supervise} from '../workspace/core.mjs';
import {verifyPins,loadPins} from '../ci/pins.mjs';
import {assertGenerated} from '../integration/cli.mjs';
import {readVerifiedLiveReplay} from '../regression/live-recording.mjs';

export function verifyPrivatePolicy(env=process.env) {
  assert(!env.TMT2_LOCAL_GUESTS||env.TMT2_LOCAL_GUESTS==='0','Private beta commands do not authorize unsigned names');
}
export function checkedAssetFile(base,name,digest) {
  assert(typeof name==='string'&&name.length>0&&!name.includes('\\')&&
    !name.startsWith('/')&&!name.split('/').some(p=>!p||p==='.'||p==='..'),'Unsafe asset path');
  assert.match(digest,/^[a-f0-9]{64}$/);
  let at=base;
  assert(!fs.lstatSync(at).isSymbolicLink(),'Asset root symlink');
  for(const part of name.split('/')){at=path.join(at,part);assert(!fs.lstatSync(at).isSymbolicLink(),'Asset symlink');}
  assert.equal(hash(fs.readFileSync(at)),digest,`Asset drift: ${name}`);
  return [name,digest];
}
export function entrypointFiles(html) {
  const names=[...html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]);
  assert(names.length>0,'Empty native entrypoint');
  for(const name of names)assert(!name.includes(':')&&!name.startsWith('//'),'Remote entrypoint resource');
  return [...new Set(['testclient-new.html',...names])].sort();
}
export function betaSnapshot(c=config()) {
  verifyPrivatePolicy();verifyPins(c);assertGenerated(c);readVerifiedLiveReplay(c);
  const source=manifest(c);
  for(const repo of Object.values(source.repositories))assert.equal(repo.dirty,false,'Beta snapshot requires clean source trees');
  const require=createRequire(import.meta.url);
  assert.equal(require(path.join(c.server,'config/config.js')).noguestsecurity,false,'Persistent guest security must remain enabled');
  const catalog=JSON.parse(fs.readFileSync(path.join(c.client,'tmt2/catalog.json')));
  const base=path.join(c.client,'play.pokemonshowdown.com');
  const native=JSON.parse(fs.readFileSync(path.join(base,'data/tmt2-native-assets.json')));
  assert.equal(native.datasetHash,catalog.metadata.datasetHash,'Native asset dataset drift');
  assert.equal(native.generator,'tmt2-native-v1');
  for(const required of ['js/server/chat-formatter.js','data/tmt2-native-assets.js'])assert(native.outputs[required],'Incomplete native asset manifest');
  const runtime=Object.fromEntries(entrypointFiles(fs.readFileSync(path.join(base,'testclient-new.html'),'utf8'))
    .map(name=>checkedAssetFile(base,name,hash(fs.readFileSync(path.join(base,name))))));
  const outputs=Object.fromEntries(Object.entries(native.outputs).sort().map(([name,digest])=>checkedAssetFile(base,name,digest)));
  const art=Object.fromEntries(Object.entries(native.artwork.files).sort().map(([id,file])=>
    [id,Object.fromEntries([checkedAssetFile(base,file.path,file.sha256)])]));
  return {kind:'tmt12-private-beta-snapshot-v1',scope:'private-local-approved-adaptation',
    publicRedistributionApproved:false,romFidelityProven:false,authException:false,
    sources:source.repositories,tools:{node:loadPins().node,npm:loadPins().npm},
    lockfiles:Object.fromEntries(['data','server','client'].map(role=>[role,hash(fs.readFileSync(path.join(c[role],'package-lock.json')))])),
    catalog:catalog.metadata,assets:{mode:native.artwork.mode,sources:native.artwork.sources,
      placeholderSpecies:native.artwork.placeholderSpecies,manifestSha256:hash(fs.readFileSync(path.join(base,'data/tmt2-native-assets.json'))),outputs,runtime,files:art},
    service:{bind:'127.0.0.1',serverPort:c.serverPort,clientPort:c.clientPort},
    evidence:{liveRecordingSha256:hash(fs.readFileSync(path.join(root,'tests/fixtures/tmt07-live-sprites.json'))),
      freshNamedBattleNotRepeated:true,humanPlaytesting:false}};
}
export function checkSnapshot(expected,actual) {
  assert.equal(expected.kind,'tmt12-private-beta-snapshot-v1');
  for(const key of ['publicRedistributionApproved','romFidelityProven','authException'])assert.equal(expected[key],false);
  assert.deepEqual(actual,expected,'Private beta source/dataset/assets/config drift; inspect before preparing a new snapshot');
}
export function writeBetaSnapshot(snapshot,base=root) {
  const directory=localDirectory(base),target=path.join(directory,'private-beta.json');
  assert(!fs.lstatSync(target,{throwIfNoEntry:false})?.isSymbolicLink(),'Snapshot target symlink');
  const temp=path.join(directory,`private-beta.${randomUUID()}.tmp`);
  try{fs.writeFileSync(temp,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(temp,target);}
  finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
export function feedbackContext(snapshot) {
  assert.equal(snapshot.kind,'tmt12-private-beta-snapshot-v1');
  return {kind:'tmt12-private-feedback-v1',scope:snapshot.scope,
    commits:Object.fromEntries(['data','server','client'].filter(role=>snapshot.sources[role]).map(role=>[role,snapshot.sources[role].commit])),
    catalog:Object.fromEntries(['version','datasetHash','catalogHash','formatID'].map(key=>[key,snapshot.catalog[key]])),assetManifestSha256:snapshot.assets.manifestSha256,
    placeholderSpecies:snapshot.assets.placeholderSpecies,
    reproduction:{steps:[],expected:'',actual:'',screenshotsOrSpectatorReplay:[]},
    warning:'Review/redact attachments. Never include credentials, auth/private protocol, config files or ROM/BPS/assets.'};
}
export async function main(command) {
  assert(['prepare','snapshot','check','dev','feedback'].includes(command),'Usage: private.mjs prepare|snapshot|check|dev|feedback');
  verifyPrivatePolicy();const c=config();verifyPins(c);
  assert(!git(c.data,'status','--porcelain','--untracked-files=all'),'Preserve edits; use a clean data checkout');
  if(command==='feedback'){
    console.log(JSON.stringify(feedbackContext(JSON.parse(fs.readFileSync(path.join(root,'.local/private-beta.json')))),null,2));return 0;
  }
  if(command==='dev'){
    checkSnapshot(JSON.parse(fs.readFileSync(path.join(root,'.local/private-beta.json'))),betaSnapshot(c));
    process.env.TMT2_PRIVATE_BETA_CHECK='1'; // Child rechecks after its locked build, before starting listeners.
    return supervise([{file:process.execPath,args:['tools/workspace/cli.mjs','dev'],cwd:root,label:'private native beta (normal authentication)'}]);
  }
  const release=lockWorkspace();
  try{
    if(command==='prepare'){
      const cache=path.join(localDirectory(),'npm-cache');
      assert(!fs.lstatSync(cache,{throwIfNoEntry:false})?.isSymbolicLink(),'npm cache symlink');
      const commands=['data','server','client'].map(role=>({file:'npm',args:['ci','--cache',cache,'--no-audit','--no-fund'],cwd:c[role],label:`${role} lockfile install`}));
      for(const [cwd,args,label]of [[c.server,['build'],'server build'],
        [c.client,['build-tools/build-indexes','--server',c.server,'--commit',git(c.server,'rev-parse','HEAD')],'offline pinned indexes'],
        [c.client,['build'],'native client build'],[c.data,['tools/integration/verify.mjs'],'consumer parity and isolation']]){
        commands.push({file:process.execPath,args,cwd,label});
      }
      const code=await supervise(commands);if(code)return code;
    }
    const snapshot=betaSnapshot(c);
    if(command==='check')checkSnapshot(JSON.parse(fs.readFileSync(path.join(root,'.local/private-beta.json'))),snapshot);
    else writeBetaSnapshot(snapshot);
    console.log(JSON.stringify({kind:snapshot.kind,checked:command==='check',sources:snapshot.sources,
      datasetHash:snapshot.catalog.datasetHash,assetProfile:snapshot.assets.mode,authException:false},null,2));
    return 0;
  }finally{release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{assert.equal(process.argv.length,3,'Usage: private.mjs prepare|snapshot|check|dev|feedback');process.exitCode=await main(process.argv[2]);}
  catch(error){console.error(`[private beta] ${error.message}`);process.exitCode=1;}
}
