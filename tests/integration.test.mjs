import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {catalog,encode} from '../tools/integration/catalog.mjs';
import {assertOwnedTarget} from '../tools/integration/cli.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../normalized/seed.json',import.meta.url)));
test('isolated catalog deterministic, versioned and preserves every selected reference',()=>{
 const d=catalog(seed);assert.equal(encode(d),encode(catalog(structuredClone(seed))));
 assert.deepEqual(d.table.species.pidgeot.types,['Bird','Bird','Bird']);
 assert.equal(d.table.species.mew,undefined);assert.equal(d.metadata.modID,'gen9tmt2seed');
 assert.equal(d.table.moves.struggle,undefined);assert.equal(d.table.engineMoves.struggle.basePower,50);
 assert(seed.species.every(s=>!s.learnset.includes('struggle')));
 for(const s of seed.species){assert.deepEqual(d.table.species[s.id].baseStats,s.baseStats);assert.deepEqual(d.table.species[s.id].learnset,s.learnset);}
 for(const p of seed.chart)assert.equal(d.table.types[p.defender].damageTaken[seed.types.find(t=>t.id===p.attacker).name],({0:3,0.5:2,1:0,2:1})[p.multiplier]);
 assert.notEqual(d.table.species.pidgeot.types.join(','),'Normal,Flying');
});
test('generator rejects broken production/fixtures and does not normalize ordered data',()=>{
 assert.throws(()=>catalog(JSON.parse(fs.readFileSync(new URL('./fixtures/seed.json',import.meta.url)))),/fixture/i);
 const bad=structuredClone(seed);bad.species[0].types=null;assert.throws(()=>catalog(bad),/missing/);
 const d=catalog(seed);d.seed.teams.reverse();assert.notEqual(encode(d),encode(catalog(seed)));
});
test('generated-target ownership protects unrelated files and symlink paths',()=>{
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'tmt05-'));
 try{
  const f=path.join(dir,'catalog.json');fs.writeFileSync(f,'{"personal":true}');assert.throws(()=>assertOwnedTarget(f),/unowned/);assert.equal(fs.readFileSync(f,'utf8'),'{"personal":true}');
  fs.symlinkSync(f,path.join(dir,'link.json'));assert.throws(()=>assertOwnedTarget(path.join(dir,'link.json')),/Unsafe/);
  fs.mkdirSync(path.join(dir,'child'));fs.symlinkSync(path.join(dir,'child'),path.join(dir,'linked'));assert.throws(()=>assertOwnedTarget(path.join(dir,'linked/catalog.json')),/Symlink/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
