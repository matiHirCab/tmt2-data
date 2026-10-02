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
test('production Holy defenses fail closed without a recorded approval or primary chart evidence',()=>{
 const d=JSON.parse(fs.readFileSync(new URL('../normalized/seed.json',import.meta.url)));
 const mega=JSON.parse(fs.readFileSync(new URL('../provenance/mega-pidgeot.json',import.meta.url)));
 const fields=r=>({...r,fieldSources:Object.fromEntries(Object.keys(r).map(k=>[k,'showdown']))});
 const base=d.species.find(s=>s.id==='pidgeot');
 const form=fields({...mega.inheritance.form,types:mega.creator.facts.types,learnset:base.learnset});
 form.fieldSources.types='creatormega';d.forms=[form];
 d.types.push({id:'holy',name:'Holy',passive:'none-adaptation',fieldSources:{id:'creatormega',name:'creatormega',passive:'policy'}});
 d.abilities.push(fields({...mega.inheritance.ability,behaviorRef:'pinned:NoGuard'}));
 d.items.push(fields({...mega.inheritance.item,behaviorRef:'pinned:Pidgeotite'}));
 d.teams[1].sets.find(s=>s.species==='pidgeot').item='pidgeotite';
 d.sources.push({id:'creatormega',kind:'creator',version:'v1.5.0',locator:mega.creator.url,sha256:stableHash(mega)},
  {id:'policymega',kind:'policy',version:'pending',locator:'pending-user-decision',sha256:stableHash(mega)});
 for(const attacker of mega.holyDefense.attackers)d.chart.push({attacker,defender:'holy',multiplier:1,source:'showdown'});
 rehash(d);assert.match(validateSeed(d).errors.join(';'),/Custom chart pair cannot masquerade/);
 for(const pair of d.chart.filter(p=>p.defender==='holy'))pair.source='policymega';
 rehash(d);assert.match(validateSeed(d).errors.join(';'),/Holy matchup lacks approved adaptation policy/);
});
