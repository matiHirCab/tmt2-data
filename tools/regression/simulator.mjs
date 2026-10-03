// Characterization of the approved pinned adaptation, never a ROM oracle.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {config,preflight} from '../workspace/core.mjs';
import {verifyPins} from '../ci/pins.mjs';
import {assertGenerated} from '../integration/cli.mjs';
import {stableHash} from '../data/validate.mjs';

export const cases = [
  {id:'alpha-beta',p1:'alpha',p2:'beta',leads:[1,3],seed:[1,2,3,4]},
  {id:'beta-gamma',p1:'beta',p2:'gamma',leads:[2,3],seed:[5,6,7,8]},
  {id:'gamma-alpha',p1:'gamma',p2:'alpha',leads:[3,3],seed:[9,10,11,12]},
  {id:'beta-mega-alpha',p1:'beta',p2:'alpha',leads:[3,1],first:['move gust mega','move bite'],seed:[1,2,3,4]},
];
export function summary(replays) {
  return replays.map(r=>({id:r.caseID,seed:r.evidence.seed,winner:r.log.find(l=>l.startsWith('|win|'))?.slice(5),
    turns:r.log.filter(l=>l.startsWith('|turn|')).length,eventCount:r.log.length,logSha256:stableHash(r.log)}));
}
export function verifyGolden(golden,replays) {
  assert.equal(golden.kind,'tmt11-pinned-adaptation-characterization-v1');
  assert.equal(golden.romOracle,false,'Characterization cannot become a ROM claim');
  assert.equal(golden.fullCatalog,false);
  assert.equal(replays.length,cases.length,'No empty or partial regression success');
  for(const r of replays) {
    assert.equal(r.datasetHash,golden.datasetHash,'Dataset drift needs reviewed new expectations');
    assert.equal(r.evidence.classification,'approved-showdown-adaptation');
    assert(r.log.at(-1).startsWith('|win|'),'Battle must finish');
    assert(!r.log.some(l=>l.startsWith('|error|')),'Protocol errors are failures');
  }
  assert.deepEqual(summary(replays),golden.cases,'Deterministic battle event/outcome drift');
}
export function reproduce() {
  const c=config();preflight(c);verifyPins(c);assertGenerated(c);
  const catalog=JSON.parse(fs.readFileSync(path.join(c.client,'tmt2/catalog.json')));
  const require=createRequire(import.meta.url);
  const {Battle,extractChannelMessages}=require(path.join(c.server,'dist/sim/battle.js'));
  const {Dex}=require(path.join(c.server,'dist/sim/dex.js'));
  const {TeamValidator}=require(path.join(c.server,'dist/sim/team-validator.js'));
  const team=id=>structuredClone(catalog.seed.teams.find(t=>t.id===id).sets).map(s=>({...s,item:s.item==='none'?'':s.item}));
  function ordinaryControl() {
    const b=new Battle({formatid:'gen9customgame',seed:[1,2,3,4],p1:{name:'Ordinary',team:[{species:'Mew',ability:'Synchronize',item:'Leftovers',moves:['Earthquake'],level:75,evs:{spa:252},ivs:{spa:0},nature:'Modest'}]},p2:{name:'OrdinaryTarget',team:[{species:'Pidgeot',ability:'Keen Eye',moves:['Tackle'],level:50}]}});
    try {
      b.makeChoices('team 1','team 1');
      assert.deepEqual(b.p2.active[0].getTypes(),['Normal','Flying']);
      assert.equal(b.p2.active[0].runImmunity('Ground'),false);
      assert.equal(b.p1.active[0].set.evs.spa,252);assert.equal(b.p1.active[0].level,75);
      assert(b.p1.active[0].canTerastallize,'Seed gimmick ban must not leak');
      return {stats:b.p1.active[0].storedStats,types:b.p2.active[0].getTypes(),tera:b.p1.active[0].canTerastallize};
    }finally{b.destroy();}
  }
  const before=ordinaryControl();
  const ordinaryTypes=['gen9ou','gen8ou'].map(id=>[id,[...Dex.forFormat(id).species.get('pidgeot').types]]);
  const replays=cases.map(def=>{
    const sets=[team(def.p1),team(def.p2)];
    for(const set of sets)assert.equal(TeamValidator.get(catalog.metadata.formatID).validateTeam(structuredClone(set)),null);
    const b=new Battle({formatid:catalog.metadata.formatID,seed:def.seed,p1:{name:def.p1,team:sets[0]},p2:{name:def.p2,team:sets[1]}});
    try {
      b.makeChoices(`team ${def.leads[0]}`,`team ${def.leads[1]}`);
      if(def.first)b.makeChoices(...def.first);
      for(let turns=0;!b.ended&&turns<300;turns++)b.makeChoices();
      assert(b.ended,`Battle did not finish: ${def.id}`);
      if(def.first)assert(b.log.some(l=>l.startsWith('|-mega|')),'Selected mega must execute');
      return {kind:'tmt2-local-replay-v1',...catalog.metadata,caseID:def.id,
        evidence:{classification:'approved-showdown-adaptation',method:'deterministic direct simulator, not browser or ROM',seed:def.seed,
          normalization:'Spectator channel; only wall-clock t: lines removed'},
        log:extractChannelMessages(b.log.join('\n'),[0])[0].filter(l=>!l.startsWith('|t:|'))};
    }finally{b.destroy();}
  });
  assert.deepEqual(ordinaryControl(),before,'TMT battles must not mutate ordinary battle rules/stats');
  assert.deepEqual(['gen9ou','gen8ou'].map(id=>[id,[...Dex.forFormat(id).species.get('pidgeot').types]]),ordinaryTypes);
  assert.equal(Dex.forFormat(catalog.metadata.formatID).species.get('mew').exists,false);
  assert.equal(Dex.forFormat('gen9customgame').species.get('mew').exists,true);
  return replays;
}
export function checkRegression() {
  const golden=JSON.parse(fs.readFileSync(new URL('../../tests/fixtures/tmt11-adaptation.json',import.meta.url)));
  const first=reproduce();verifyGolden(golden,first);
  const second=reproduce();assert.deepEqual(second,first,'Repeated isolated battles must reproduce byte-identical replay objects');
  return first;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{
  if(process.argv.length!==2)throw Error('Usage: simulator.mjs (read-only golden check; no automatic update)');
  console.log(JSON.stringify({kind:'TMT-11 regression results',romOracle:false,cases:summary(checkRegression()),ordinaryFormatsIsolated:true},null,2));
}catch(e){console.error(`[regression] ${e.message}`);process.exitCode=1;}
