// Immutable spectator capture, separate from seeded simulator characterization.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {config} from '../workspace/core.mjs';
import {assertGenerated} from '../integration/cli.mjs';

export function verifyLiveRecording(bytes, evidence, catalog) {
  assert.equal(evidence.kind,'tmt07-recorded-browser-battle-v1');
  assert.equal(evidence.classification,'recorded-live-approved-showdown-adaptation');
  for(const flag of ['romOracle','humanPlaytesting','fullCatalog'])assert.equal(evidence[flag],false);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),evidence.fixtureSha256,'Recorded bytes changed');
  assert(bytes.length>0&&bytes.length<100000,'Bounded nonempty spectator recording');
  const replay=JSON.parse(bytes.toString());
  assert.equal(replay.kind,'tmt2-local-replay-v1');
  for(const [key,value]of Object.entries(catalog.metadata))assert.equal(replay[key],value,`Recorded dataset drift: ${key}`);
  assert.deepEqual(evidence.players,['SpriteAlpha','SpriteBeta']);
  assert.deepEqual(evidence.premades,['alpha','beta']);
  assert.equal(evidence.winner,'SpriteBeta');assert.equal(evidence.turns,22);
  assert.equal(evidence.liveEvidence.overallConclusion,'failure','Retain post-match harness failure');
  assert.equal(evidence.replayEvidence.overallConclusion,'success');
  assert.equal(evidence.replayEvidence.authException,false);
  for(const sha of Object.values(evidence.sources))assert.match(sha,/^[a-f0-9]{40}$/);
  const log=replay.log;
  assert(Array.isArray(log)&&log.length>0&&log.length<10000);
  for(const line of log){
    assert.equal(typeof line,'string');assert(line.startsWith('|')&&!/[\r\n\0]/.test(line));
    assert(!/^\|(request|challstr|pm|updateuser|error)\|/.test(line),'Private/auth/error protocol is forbidden');
  }
  assert.deepEqual(log.filter(l=>l.startsWith('|player|')).map(l=>l.split('|').slice(2,4)),
    [['p1','SpriteAlpha'],['p2','SpriteBeta']]);
  assert.deepEqual(log.filter(l=>l.startsWith('|gametype|')),['|gametype|singles']);
  assert.deepEqual(log.filter(l=>l.startsWith('|gen|')),['|gen|9']);
  assert.deepEqual(log.filter(l=>l.startsWith('|tier|')),[`|tier|${catalog.metadata.formatName}`]);
  const roster=[];
  for(const [i,id]of evidence.premades.entries()){
    const team=catalog.seed.teams.find(t=>t.id===id);assert(team,'Missing recorded premade');
    for(const set of team.sets){
      const species=catalog.seed.species.find(s=>s.id===set.species);assert(species);
      assert.equal(set.level,50);
      roster.push(`|poke|p${i+1}|${species.name}, L50|`);
    }
  }
  assert.deepEqual(log.filter(l=>l.startsWith('|poke|')),roster,'Recorded premade/level/form drift');
  assert.deepEqual(log.filter(l=>l.startsWith('|turn|')),Array.from({length:22},(_,i)=>`|turn|${i+1}`));
  assert.deepEqual(log.filter(l=>l.startsWith('|win|')),['|win|SpriteBeta']);
  assert.equal(log.at(-1),'|win|SpriteBeta','Finished recording required');
  assert(log.some(l=>l.startsWith('|move|'))&&log.some(l=>l.startsWith('|faint|')));
  return replay;
}

export function readVerifiedLiveReplay(c=config()) {
  assertGenerated(c);
  const bytes=fs.readFileSync(new URL('../../tests/fixtures/tmt07-live-sprites.json',import.meta.url));
  const evidence=JSON.parse(fs.readFileSync(new URL('../../provenance/tmt07-live-recording.json',import.meta.url)));
  const catalog=JSON.parse(fs.readFileSync(path.join(c.client,'tmt2/catalog.json')));
  return {...verifyLiveRecording(bytes,evidence,catalog),caseID:'recorded-live-alpha-beta'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{assert.equal(process.argv.length,2);const replay=readVerifiedLiveReplay();
    console.log(JSON.stringify({caseID:replay.caseID,datasetHash:replay.datasetHash,winner:'SpriteBeta',turns:22,
      classification:'recorded-live-approved-showdown-adaptation',newLiveChallenge:false,romOracle:false}));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
