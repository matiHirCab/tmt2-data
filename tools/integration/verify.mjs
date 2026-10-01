import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {config,preflight} from '../workspace/core.mjs';
import {assertGenerated} from './cli.mjs';
const c=config();preflight(c);
assertGenerated(c);
const catalog=JSON.parse(fs.readFileSync(path.join(c.client,'tmt2/catalog.json')));
const {Dex}=createRequire(import.meta.url)(path.join(c.server,'dist/sim/dex.js'));
const mod=Dex.forFormat(catalog.metadata.formatID);
assert.equal(mod.currentMod,catalog.metadata.modID);
for(const s of catalog.seed.species)assert.deepEqual(mod.species.get(s.id).types,catalog.table.species[s.id].types);
assert.equal(mod.species.get('Mew').exists,false);
assert.deepEqual(Dex.forFormat('gen9ou').species.get('Pidgeot').types,['Normal','Flying']);
for(const [id, record] of Object.entries(catalog.table.engineMoves)) {
  const original=Dex.mod('gen9').moves.get(id), actual=mod.moves.get(id);
  for(const [field,value] of Object.entries(record)) {
    assert.deepEqual(actual[field],value,`mod engine intrinsic ${id}.${field}`);
    assert.deepEqual(original[field],value,`pinned engine intrinsic ${id}.${field}`);
  }
  assert.equal(catalog.table.moves[id],undefined,'engine intrinsic must not become selectable');
}
const require=createRequire(import.meta.url);
global.window=global; global.Config={routes:{root:'localhost'},whitelist:[]}; global.BattleTMT2=catalog;
require(path.join(c.client,'play.pokemonshowdown.com/js/battle-dex-data.js'));
require(path.join(c.client,'play.pokemonshowdown.com/js/battle-dex.js'));
const {Teams}=require(path.join(c.server,'dist/sim/teams.js'));
const {TeamValidator}=require(path.join(c.server,'dist/sim/team-validator.js'));
const {Battle}=require(path.join(c.server,'dist/sim/battle.js'));
const teams=catalog.seed.teams.map(t=>Teams.import(global.TMT2.exportPremade(t.id)));
for(const team of teams)assert.equal(TeamValidator.get(catalog.metadata.formatID).validateTeam(team),null,'client export must pass authoritative server');
const battle=new Battle({formatid:catalog.metadata.formatID,seed:[1,2,3,4],p1:{name:'A',team:teams[0]},p2:{name:'B',team:teams[1]}});
try {
  for(const p of [...battle.p1.pokemon,...battle.p2.pokemon]) {
    assert.deepEqual(global.TMT2.stats(p.species.id),{...p.storedStats,hp:p.maxhp},'client stats must equal actual battle stats');
  }
}finally{battle.destroy();}
console.log('TMT-05/06 cross-repository identity, isolated catalog and pinned engine intrinsic passed; client/runtime tests run in consumer suites.');
