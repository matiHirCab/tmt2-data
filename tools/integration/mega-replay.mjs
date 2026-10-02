// Deterministic simulator evidence, not a browser/human playtest or ROM oracle.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {config,preflight} from '../workspace/core.mjs';
import {assertGenerated} from './cli.mjs';
export function megaReplay() {
  const c=config();preflight(c);assertGenerated(c);
  const catalog=JSON.parse(fs.readFileSync(path.join(c.client,'tmt2/catalog.json')));
  if(!catalog.seed.forms?.length)throw Error('Selected mega absent');
  const {Battle,extractChannelMessages}=createRequire(import.meta.url)(path.join(c.server,'dist/sim/battle.js'));
  const team=n=>structuredClone(catalog.seed.teams[n].sets).map(s=>({...s,item:s.item==='none'?'':s.item}));
  const battle=new Battle({formatid:catalog.metadata.formatID,seed:[1,2,3,4],
    p1:{name:'MegaBeta',team:team(1)},p2:{name:'SeedAlpha',team:team(0)}});
  try {
    battle.makeChoices('team 3','team 1');
    battle.makeChoices('move gust mega','move bite');
    for(let step=0;!battle.ended&&step<300;step++)battle.makeChoices();
    if(!battle.ended||!battle.log.some(l=>l.startsWith('|-mega|')))throw Error('Mega battle did not complete');
    return {kind:'tmt2-local-replay-v1',...catalog.metadata,
      evidence:{method:'deterministic direct simulator; no browser/authentication',seed:[1,2,3,4],reproducer:'tmt2-data/tools/integration/mega-replay.mjs',normalization:'Spectator channel; wall-clock t: lines omitted, battle events unchanged'},log:extractChannelMessages(battle.log.join('\n'),[0])[0].filter(l=>!l.startsWith('|t:|'))};
  }finally{battle.destroy();}
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try {
  if(process.argv.length!==4||process.argv[2]!=='--output')throw Error('Usage: mega-replay.mjs --output NEW.json');
  fs.writeFileSync(process.argv[3],JSON.stringify(megaReplay(),null,2)+'\n',{flag:'wx'});
}catch(e){console.error(e.message);process.exitCode=1;}
