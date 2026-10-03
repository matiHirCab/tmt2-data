import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cases, summary, verifyGolden} from '../tools/regression/simulator.mjs';

// Synthetic unit data only: actual battle evidence is checked by regression:check.
function fixture() {
  const replays=cases.map(c=>({caseID:c.id,datasetHash:'synthetic-unit-dataset',
    evidence:{classification:'approved-showdown-adaptation',seed:c.seed},
    log:['|turn|1','|win|synthetic-player']}));
  return {replays,golden:{kind:'tmt11-pinned-adaptation-characterization-v1',romOracle:false,
    fullCatalog:false,datasetHash:'synthetic-unit-dataset',cases:summary(replays)}};
}
test('regression covers all three approved premades and the selected mega',()=>{
  assert.deepEqual([...new Set(cases.flatMap(c=>[c.p1,c.p2]))].sort(),['alpha','beta','gamma']);
  assert.equal(cases.filter(c=>c.first?.some(x=>x.includes(' mega'))).length,1);
  const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/tmt11-adaptation.json',import.meta.url)));
  assert.deepEqual(golden.cases.map(c=>c.id),cases.map(c=>c.id));
  assert.equal(golden.romOracle,false);assert.equal(golden.fullCatalog,false);
});
test('synthetic regression verifier accepts complete explicit adaptation evidence',()=>{
  const {golden,replays}=fixture();verifyGolden(golden,replays);
});
test('regression rejects empty and incomplete results',()=>{
  const {golden,replays}=fixture();
  assert.throws(()=>verifyGolden(golden,[]),/partial/);
  assert.throws(()=>verifyGolden(golden,replays.slice(1)),/partial/);
});
test('regression rejects dataset drift and ROM/full-catalog claims',()=>{
  for(const mutate of [f=>f.replays[0].datasetHash='changed',f=>f.golden.romOracle=true,
    f=>f.golden.fullCatalog=true,f=>f.replays[0].evidence.classification='rom-verified']) {
    const f=fixture();mutate(f);assert.throws(()=>verifyGolden(f.golden,f.replays));
  }
});
test('regression rejects event, outcome, seed and ordering drift',()=>{
  for(const mutate of [r=>r[0].log.unshift('|-damage|synthetic'),r=>r[0].log[1]='|win|other',
    r=>r[0].evidence.seed=[0,0,0,0],r=>r.reverse(),r=>r[0].caseID='unknown']) {
    const {golden,replays}=fixture();mutate(replays);assert.throws(()=>verifyGolden(golden,replays));
  }
});
test('regression rejects unfinished battles and protocol errors even with matching hashes',()=>{
  for(const log of [['|turn|1'],['|error|Invalid choice','|win|synthetic-player']]) {
    const {golden,replays}=fixture();replays[0].log=log;golden.cases=summary(replays);
    assert.throws(()=>verifyGolden(golden,replays));
  }
});
