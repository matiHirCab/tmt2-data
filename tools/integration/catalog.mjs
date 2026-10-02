import fs from 'node:fs';
import {validateSeed, stableHash, canonical} from '../data/validate.mjs';
export const formatID = 'gen9tmt2seed';
export const formatName = '[Gen 9] TMT2 Seed';
// Explicit pinned engine intrinsic, separate from selectable seed moves/learnsets.
const engine = JSON.parse(fs.readFileSync(new URL('../../provenance/engine-moves.json', import.meta.url)));
export function catalog(seed) {
  const checked=validateSeed(seed);if(!checked.valid)throw Error(checked.errors.join('; '));
  const names=Object.fromEntries(seed.types.map(t=>[t.id,t.name]));
  const speciesNames=Object.fromEntries([...seed.species,...(seed.forms??[])].map(s=>[s.id,s.name]));
  const itemNames=Object.fromEntries(seed.items.map(i=>[i.id,i.name]));
  const abilityNames=Object.fromEntries(seed.abilities.map(a=>[a.id,a.name]));
  const fields=r=>Object.fromEntries(Object.entries(r).filter(([k])=>k!=='fieldSources'));
  const table={
    engineMoves: structuredClone(engine.moves),
    species:Object.fromEntries([...seed.species,...(seed.forms??[])].map(s=>[s.id,{...fields(s),...(s.baseSpecies?{baseSpecies:speciesNames[s.baseSpecies],requiredItem:itemNames[s.requiredItem]}:{}),types:s.types.map(t=>names[t]),abilities:{0:abilityNames[s.abilities[0]]},tier:'TMT2',gen:9,exists:true}])),
    moves:Object.fromEntries(seed.moves.map(m=>[m.id,{...fields(m),type:names[m.type],gen:9,exists:true}])),
    abilities:Object.fromEntries(seed.abilities.map(a=>[a.id,{...fields(a),gen:9,exists:true}])),
    items:Object.fromEntries(seed.items.map(i=>[i.id,{...fields(i),gen:9,exists:true}])),
    types:Object.fromEntries(seed.types.map(t=>[t.id,{...fields(t),effectType:'Type',exists:true,damageTaken:Object.fromEntries(seed.chart.filter(p=>p.defender===t.id).map(p=>[names[p.attacker],({0:3,0.5:2,1:0,2:1})[p.multiplier]]))}])),
  };
  const metadata={generator:'tmt2-data/tmt05-v1',version:seed.version,datasetHash:stableHash(seed),catalogHash:stableHash({seed,table}),baseServerCommit:seed.sources.find(s=>s.id==='showdown').version,formatID,formatName,modID:formatID};
  return {metadata,seed,table};
}
export const encode = value => JSON.stringify(canonical(value),null,2)+'\n';
export const readSelected = file => JSON.parse(fs.readFileSync(file,'utf8'));
