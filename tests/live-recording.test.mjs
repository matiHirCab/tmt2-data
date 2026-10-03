import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from '../tools/integration/catalog.mjs';
import {verifyLiveRecording} from '../tools/regression/live-recording.mjs';
const bytes=fs.readFileSync(new URL('./fixtures/tmt07-live-sprites.json',import.meta.url));
const evidence=JSON.parse(fs.readFileSync(new URL('../provenance/tmt07-live-recording.json',import.meta.url)));
const current=catalog(JSON.parse(fs.readFileSync(new URL('../normalized/seed.json',import.meta.url))));
function changed(mutate){
  const replay=JSON.parse(bytes),proof=structuredClone(evidence);mutate(replay);
  const changedBytes=Buffer.from(JSON.stringify(replay));
  proof.fixtureSha256=createHash('sha256').update(changedBytes).digest('hex');
  return [changedBytes,proof,current];
}
test('actual captured browser replay retains bytes, compatible dataset and completed premades',()=>{
  assert.equal(verifyLiveRecording(bytes,evidence,current).log.at(-1),'|win|SpriteBeta');
  assert.deepEqual(current.seed.species.find(s=>s.id==='pidgeot').types,['bird','bird','bird']);
});
test('capture rejects tampered bytes independently of JSON meaning',()=>{
  assert.throws(()=>verifyLiveRecording(Buffer.concat([bytes,Buffer.from('\n')]),evidence,current),/bytes changed/);
});
test('capture rejects current dataset and missing identity drift',()=>{
  for(const key of Object.keys(current.metadata)){
    assert.throws(()=>verifyLiveRecording(...changed(r=>delete r[key])),/dataset drift/);
  }
  const newer=structuredClone(current);newer.metadata.version='different';
  assert.throws(()=>verifyLiveRecording(bytes,evidence,newer),/dataset drift/);
});
test('capture rejects changed roster, levels, player, generation and unfinished outcome',()=>{
  for(const [from,to]of [['|poke|p2|Pidgeot, L50|','|poke|p2|Pidgeot-Mega, L50|'],
    ['|poke|p1|Rattata, L50|','|poke|p1|Rattata, L100|'],['|win|SpriteBeta','|win|SpriteAlpha'],
    ['|gen|9','|gen|3'],['|turn|22','|turn|23'],['|player|p1|SpriteAlpha|102|','|player|p1|Other|102|']]){
    assert.throws(()=>verifyLiveRecording(...changed(r=>r.log[r.log.indexOf(from)]=to)));
  }
  assert.throws(()=>verifyLiveRecording(...changed(r=>r.log.pop())));
});
test('capture rejects private authentication messages and protocol errors even with refreshed digest',()=>{
  for(const command of ['request','challstr','pm','updateuser','error']){
    assert.throws(()=>verifyLiveRecording(...changed(r=>r.log.unshift(`|${command}|forbidden`))),/forbidden/);
  }
});
test('recording cannot become ROM or human proof or conceal original harness failure',()=>{
  for(const key of ['romOracle','humanPlaytesting','fullCatalog']){
    const proof=structuredClone(evidence);proof[key]=true;
    assert.throws(()=>verifyLiveRecording(bytes,proof,current));
  }
  const proof=structuredClone(evidence);proof.liveEvidence.overallConclusion='success';
  assert.throws(()=>verifyLiveRecording(bytes,proof,current),/failure/);
});
