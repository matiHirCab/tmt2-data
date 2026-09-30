import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {validateSeed, stableHash, inheritedPayload} from '../tools/data/validate.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/seed.json',import.meta.url)));
const selected=JSON.parse(fs.readFileSync(new URL('../normalized/seed.json',import.meta.url)));
const clone=()=>structuredClone(fixture);
const check=d=>validateSeed(d,{allowFixture:true});
const fail=(d,regex)=>{const r=check(d);assert.equal(r.valid,false);assert.match(r.errors.join('\n'),regex);};
const rehash=d=>{d.sources.find(s=>s.id==='showdown').sha256=stableHash(inheritedPayload(d));};
test('bounded seed fixture is valid, six complete sets; fixture never production',()=>{
 assert.equal(check(fixture).valid,true);assert.equal(validateSeed(fixture).valid,false);
 assert.equal(validateSeed(selected).valid,true);
 assert.equal(selected.kind,'production');assert.equal(fixture.kind,'test-fixture');
});
test('seed schema rejects missing keys, extra keys, invalid stats and malformed IDs',()=>{
 for(const mutate of [d=>delete d.species[0].baseStats,d=>{d.extra=true;},d=>{d.species[0].baseStats.hp=0;},d=>{d.species[0].id='Bad ID';}]){const d=clone();mutate(d);assert.equal(check(d).valid,false);}
});
test('seed rejects duplicate IDs and broken references',()=>{
 let d=clone();d.species[1].id=d.species[0].id;fail(d,/duplicate ID/);
 d=clone();d.teams[0].sets[0].moves[0]='missing';fail(d,/broken moves reference/);
 d=clone();d.species[0].abilities=['missing'];fail(d,/broken abilities reference/);
});
test('seed rejects nonzero EV, wrong IV/level/team count, unapproved nature and illegal choices',()=>{
 for(const mutate of [d=>{d.teams[0].sets[0].evs.atk=4;},d=>{d.teams[0].sets[0].ivs.hp=0;},d=>{d.rules.level=100;},d=>d.teams[0].sets.pop(),d=>{d.teams[0].sets[0].nature='Adamant';},d=>{d.teams[0].sets[0].ability='torrent';}]){const d=clone();mutate(d);assert.equal(check(d).valid,false);}
});
test('ordered repeated permanent types are preserved, not normalized or deduplicated',()=>{
 const d=clone();d.species[0].types=['water','fire','fire'];const before=JSON.stringify(d);
 assert.equal(check(d).valid,true);assert.equal(JSON.stringify(d),before);
 const altered=clone();altered.species[0].types=['fire','water','fire'];assert.notEqual(stableHash(d),stableHash(altered));
});
test('evidence rejects unknown/fixture in production, missing hashes, unpinned source and contradiction',()=>{
 let d=clone();delete d.species[0].fieldSources.baseStats;fail(d,/missing field provenance/);
 d=clone();d.sources.find(s=>s.id==='showdown').version='master';fail(d,/exact server commit/);
 d=clone();d.species[0].baseStats.hp++;fail(d,/snapshot hash mismatch/);
 d=clone();d.chart.find(p=>p.source==='creatorchart').multiplier=2;fail(d,/contradicts/);
 d=clone();d.types[0].passive='unsupported-custom';rehash(d);fail(d,/custom passive unsupported/);
});
test('hash stable across object key order and sensitive to bytes, arrays and data',()=>{
 const d=Object.fromEntries(Object.entries(fixture).reverse());assert.equal(stableHash(d),stableHash(fixture));
 d.teams=structuredClone(d.teams).reverse();assert.notEqual(stableHash(d),stableHash(fixture));
});
test('selected seed CLI passes bounded production; fixture cannot pass production',()=>{
 for(const [file,status] of [['normalized/seed.json',0],['tests/fixtures/seed.json',1]]){
  const r=spawnSync(process.execPath,['tools/data/cli.mjs',file],{encoding:'utf8'});assert.equal(r.status,status);
 }
});

test('chart coverage, team completeness and creator attribution cannot be fabricated',()=>{
 let d=clone();d.chart=d.chart.filter(p=>!(p.attacker==='normal'&&p.defender==='normal'));rehash(d);fail(d,/missing chart pair/);
 d=clone();d.teams[1].sets[2].species='rattata';fail(d,/duplicate premade species|unused roster/);
 d=clone();d.kind='production';d.sources.find(s=>s.id==='fixture').kind='creator';fail(d,/no matching registered creator row/);
 d=clone();d.rules.source='showdown';fail(d,/approved adaptation policy/);
});

test('production preserves primary-sheet types, triple Bird and explicit passive adaptation',()=>{
 const p=selected.species.find(s=>s.id==='pidgeot');assert.deepEqual(p.types,['bird','bird','bird']);
 assert.equal(selected.species.some(s=>s.id==='koffing'),false);
 assert.deepEqual(selected.species.find(s=>s.id==='nosepass').types,['rock']);
 const rows=JSON.parse(fs.readFileSync(new URL('../provenance/seed-types.json',import.meta.url)));
 assert.match(rows.rows.find(s=>s.id==='pidgeot').locator,/C24:E24/);
 assert.equal(selected.types.find(s=>s.id==='bird').passive,'none-adaptation');
 const d=structuredClone(selected);d.types.find(s=>s.id==='bird').fieldSources.passive='creatorspecies';fail(d,/adaptation policy/);
});
test('bounded chart uses primary cells without neutral fallback, including status coverage',()=>{
 assert.equal(selected.chart.find(p=>p.attacker==='rock'&&p.defender==='bird').multiplier**3,8);
 for(const attack of ['rock','electric']){
  const d=structuredClone(selected);d.chart=d.chart.filter(p=>!(p.attacker===attack&&p.defender==='bird'));fail(d,/missing chart pair/);
 }
 const d=structuredClone(selected);d.chart.find(p=>p.source==='seedchart').multiplier=0;fail(d,/contradicts/);
});

test('production cannot omit or reorder creator types or promote unknown evidence',()=>{
 let d=structuredClone(selected);d.species[0].types=null;fail(d,/creator type row missing/);
 d=structuredClone(selected);d.species.find(s=>s.id==='floragato').types.reverse();fail(d,/no matching registered creator row/);
 d=structuredClone(selected);d.sources.find(s=>s.id==='creatorspecies').kind='unknown';fail(d,/unresolved evidence/);
});
