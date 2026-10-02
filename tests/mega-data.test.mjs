import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateSeed, stableHash, inheritedPayload} from '../tools/data/validate.mjs';
const original=JSON.parse(fs.readFileSync(new URL('./fixtures/seed.json',import.meta.url)));
function fixture() {
 const d=structuredClone(original), base=d.species.find(s=>s.id==='pidgeot');
 const fields=r=>({...r,fieldSources:Object.fromEntries(Object.keys(r).map(k=>[k,'showdown']))});
 const {fieldSources: _sources,...baseFields}=structuredClone(base);
 const form=fields({...baseFields,id:'pidgeotmega',name:'Pidgeot-Mega',baseSpecies:'pidgeot',forme:'Mega',requiredItem:'pidgeotite',abilities:['noguard']});
 form.types=['water','fire','fire'];form.fieldSources.types='fixture';d.forms=[form];
 d.abilities.push(fields({id:'noguard',name:'No Guard',behaviorRef:'pinned:NoGuard'}));
 d.items.push(fields({id:'pidgeotite',name:'Pidgeotite',behaviorRef:'pinned:Pidgeotite',megaStone:{Pidgeot:'Pidgeot-Mega'},itemUser:['Pidgeot']}));
 d.teams[1].sets.find(s=>s.species==='pidgeot').item='pidgeotite';
 rehash(d);return d;
}
const rehash=d=>{d.sources.find(s=>s.id==='showdown').sha256=stableHash(inheritedPayload(d));};
const check=d=>validateSeed(d,{allowFixture:true});
test('runtime-only form schema preserves ordered duplicate types, inheritance hash and base roster',()=>{
 const d=fixture();assert.deepEqual(check(d).errors,[]);
 assert.deepEqual(d.forms[0].types,['water','fire','fire']);
 const copy=structuredClone(d);copy.forms[0].baseStats.def++;assert.notEqual(stableHash(inheritedPayload(copy)),stableHash(inheritedPayload(d)));
 assert.equal(validateSeed(d).valid,false,'synthetic form fixture never production');
});
test('mega forms reject missing links, unsupported starting forms, wrong stone/HP/learnset and duplicate IDs',()=>{
 for(const mutate of [d=>{d.forms[0].baseSpecies='missing';},d=>{d.forms[0].requiredItem='missing';},
  d=>{d.forms[0].baseStats.hp++;},d=>{d.forms[0].types=['water','fire','fire','grass'];},d=>{d.forms[0].learnset.pop();},d=>{d.forms[0].id='pidgeot';},
  d=>{d.items[1].megaStone={Eevee:'Pidgeot-Mega'};},d=>{d.teams[1].sets[2].species='pidgeotmega';},
  d=>{d.teams[1].sets[2].item='none';},d=>{delete d.forms[0].fieldSources.requiredItem;}]) {
  const d=fixture();mutate(d);rehash(d);assert.equal(check(d).valid,false);
 }
});
test('mega chart coverage includes every temporary form defensive type',()=>{
 const d=fixture();d.chart=d.chart.filter(p=>!(p.attacker==='normal'&&p.defender==='fire'));rehash(d);
 assert.match(check(d).errors.join(';'),/missing chart pair normal\/fire/);
});
test('production Holy defenses reject inherited attribution, forged evidence and changed primary values',()=>{
 const original=JSON.parse(fs.readFileSync(new URL('../normalized/seed.json',import.meta.url)));
 const mega=JSON.parse(fs.readFileSync(new URL('../provenance/mega-pidgeot.json',import.meta.url)));
 assert.equal(mega.holyDefense.status,'documented-primary');
 assert.deepEqual(mega.holyDefense.multipliers,{normal:1,dark:2,water:0.5,rock:2,electric:1,grass:1,flying:1});
 assert.deepEqual(validateSeed(original).errors,[]);
 for(const mutate of [d=>{d.chart.find(p=>p.defender==='holy').source='showdown';},
  d=>{d.chart.find(p=>p.defender==='holy').source='creatormega';},
  d=>{d.chart.find(p=>p.defender==='holy'&&p.attacker==='rock').multiplier=1;},
  d=>{d.sources.find(s=>s.id==='megachart').sha256='0'.repeat(64);},
  d=>{d.sources.find(s=>s.id==='megachart').kind='policy';}]) {
  const d=structuredClone(original);mutate(d);rehash(d);assert.equal(validateSeed(d).valid,false);
 }
});
