import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {config, preflight, root, git, lockWorkspace} from '../workspace/core.mjs';
import {catalog, encode, readSelected} from './catalog.mjs';
export function assertOwnedTarget(file) {
  for(let at=path.dirname(file);at!==path.dirname(at);at=path.dirname(at)) {
    if(fs.existsSync(at)&&fs.lstatSync(at).isSymbolicLink())throw Error(`Symlink output directory: ${at}`);
  }
  if(fs.existsSync(file)||fs.lstatSync(path.dirname(file),{throwIfNoEntry:false})?.isSymbolicLink()) {
    if(fs.lstatSync(file).isSymbolicLink()||!fs.lstatSync(file).isFile())throw Error(`Unsafe output: ${file}`);
    const prior=JSON.parse(fs.readFileSync(file,'utf8'));
    if(prior.metadata?.generator!=='tmt2-data/tmt05-v1')throw Error(`Refusing to overwrite unowned file: ${file}`);
  }
}
export function inheritedSources(c) {
  const base=JSON.parse(fs.readFileSync(path.join(root,'provenance/inheritance-pins.json'))).server.commit;
  // Integration may change, but facts inherited by this seed must remain the reviewed pinned inputs.
  git(c.server,'merge-base','--is-ancestor',base,'HEAD');
  const inputs=['data/pokedex.ts','data/moves.ts','data/abilities.ts','data/items.ts','data/learnsets.ts','data/typechart.ts','data/formats-data.ts','data/text','data/aliases.ts','data/scripts.ts','sim/dex.ts','sim/dex-*.ts'];
  if(git(c.server,'diff',base,'--',...inputs)||git(c.server,'status','--porcelain','--',...inputs))throw Error('Inherited server inputs changed from the seed pin; review/version data before generation');
}
export function outputs(c) {
  inheritedSources(c);
  const bytes=encode(catalog(readSelected(c.dataset)));
  return [[path.join(c.server,'data/mods/gen9tmt2seed/catalog.json'),bytes],[path.join(c.client,'tmt2/catalog.json'),bytes]];
}
export function assertGenerated(c) {
  for(const [file,bytes] of outputs(c)) {
    assertOwnedTarget(file);
    if(fs.readFileSync(file,'utf8')!==bytes)throw Error(`Generated catalog drift: ${file}`);
  }
}
const direct=process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct)try {
  const [mode,...extra]=process.argv.slice(2);if(!['generate','check'].includes(mode)||extra.length)throw Error('Usage: integration/cli.mjs generate|check');
  const c=config();preflight(c);const release=lockWorkspace();
  try {
    const result=outputs(c);
    if(mode==='check') {
      assertGenerated(c);
    } else {
      for(const [file] of result)assertOwnedTarget(file);
      for(const [file,bytes] of result){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes,{flag:fs.existsSync(file)?'w':'wx'});}
    }
    console.log(`TMT-05 ${mode}: identical server/client catalog ${catalog(readSelected(c.dataset)).metadata.datasetHash}; no upstream pulls`);
  }finally{release();}
}catch(e){console.error(`[integration] ${e.message}`);process.exitCode=1;}
