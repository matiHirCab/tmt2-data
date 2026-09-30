// Read-only pinned Dex extraction; writes a NEW draft/fixture file only with explicit output.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {config, preflight, root} from '../workspace/core.mjs';
import {verifyPins} from '../ci/pins.mjs';
import {stableHash, serializeSeed} from '../data/validate.mjs';
try {
  const args=process.argv.slice(2); const fixture=args[0]==='--fixture'; if(fixture)args.shift();
  if(args.length!==2 || args[0]!=='--output') throw Error('Usage: prepare-seed.mjs [--fixture] --output NEW.json');
  const c=config(); preflight(c); verifyPins(c);
  const expected=JSON.parse(fs.readFileSync(path.join(root,'ci/pins.json')));
  const {Dex}=createRequire(import.meta.url)(path.join(c.server,'dist/sim/dex.js')); const dex=Dex.mod('gen9');
  const creatorRows=JSON.parse(fs.readFileSync(path.join(root,'provenance/seed-types.json')));
  const selected=JSON.parse(fs.readFileSync(path.join(root,'overrides/seed-selection.json')));
  const register=JSON.parse(fs.readFileSync(path.join(root,'provenance/sources.json')));
  const provenance=(record, source) => ({...record,fieldSources:Object.fromEntries(Object.keys(record).map(k=>[k,source]))});
  const moves=new Map(), abilities=new Map(), types=new Map();
  const species=selected.species.map(input=>{
    const sp=dex.species.get(input.id); if(!sp.exists)throw Error(`Missing pinned species ${input.id}`);
    if(!Object.values(sp.abilities).some(a=>dex.abilities.get(a).id===input.ability))throw Error(`Ability not inherited for ${input.id}`);
    const inherited=dex.species.getLearnsetData(input.id).learnset;
    for(const id of input.moves){
      if(!inherited?.[id]?.length)throw Error(`Move absent from pinned learnset: ${input.id}/${id}`);
      const m=dex.moves.get(id); if(!m.exists)throw Error(`Missing move ${id}`);
      moves.set(id,provenance({id:m.id,name:m.name,type:dex.types.get(m.type).id,category:m.category,basePower:m.basePower,accuracy:m.accuracy,pp:m.pp,priority:m.priority,flags:m.flags,behaviorRef:`server@${expected.server.commit}:data/moves.ts#${id}`},'showdown'));
    }
    const ab=dex.abilities.get(input.ability);abilities.set(ab.id,provenance({id:ab.id,name:ab.name,behaviorRef:`server@${expected.server.commit}:data/abilities.ts#${ab.id}`},'showdown'));
    const record=provenance({id:sp.id,name:sp.name,types:fixture?sp.types.map(t=>dex.types.get(t).id):(creatorRows.rows.find(r=>r.id===sp.id)?.types ?? null),baseStats:sp.baseStats,abilities:[ab.id],learnset:input.moves},'showdown');
    record.fieldSources.types=fixture?'fixture':record.types?'creatorspecies':'missing';return record;
  });
  // Ordinary pinned type catalog only. Custom TMT2 type/passive inputs must be reviewed before selection.
  for(const t of dex.types.all().filter(t=>!['Stellar','???'].includes(t.name))){
    types.set(t.id,provenance({id:t.id,name:t.name,passive:'ordinary-gen9'},'showdown'));
  }
  const chart=[];
  for(const a of types.values())for(const b of types.values()){
    const official=register.chartObservations.pairs.find(p=>p.attacker.toLowerCase()===a.id&&p.defender.toLowerCase()===b.id);
    chart.push({attacker:a.id,defender:b.id,multiplier:official?.multiplier??(dex.getImmunity(a.name,b.name)?2**dex.getEffectiveness(a.name,b.name):0),source:official?'creatorchart':'showdown'});
  }
  const items=[provenance({id:'none',name:'No item',behaviorRef:'policy:no-held-item'},'policy')];
  const inherited={species:species.map(s=>({...s,types:undefined,fieldSources:undefined})),moves:[...moves.values()],abilities:[...abilities.values()],types:[...types.values()],chart:chart.filter(p=>p.source==='showdown')};
  const sources=[
    {id:'showdown',kind:'showdown',version:expected.server.commit,locator:`https://github.com/${expected.server.repository}/tree/${expected.server.commit}/data; selected historical learnset entries allowed by adaptation`,sha256:stableHash(inherited)},
    {id:'creatorchart',kind:'creator',version:'observed-2026-09-30-not-release-bound',locator:register.sources.find(s=>s.id==='SRC-03').url+'; five chart coordinates in chartObservations',sha256:stableHash(register.chartObservations)},
    {id:'policy',kind:'policy',version:'approved-2026-09-30',locator:'provenance/sources.json#userApprovals',sha256:stableHash(register.userApprovals)},
    {id:'creatorspecies',kind:'creator',version:creatorRows.versionBinding??(creatorRows.observedOn?'observed-'+creatorRows.observedOn+'-not-release-bound':'unavailable'),locator:'provenance/seed-types.json: registered creator rows; unavailable until reviewed',sha256:stableHash(creatorRows)},
    {id:'missing',kind:'unknown',version:'unavailable',locator:'Creator species type rows not accessible; no inferred Gen9 fallback',sha256:null},
    {id:'fixture',kind:'test-fixture',version:'synthetic-v1',locator:'Pinned base-Dex types used ONLY for validator fixture',sha256:stableHash(species.map(s=>s.types))}
  ];
  const sets=selected.species.map(s=>({species:s.id,ability:s.ability,item:'none',moves:s.moves,nature:'Hardy',level:50,ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31},evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}}));
  const d={schemaVersion:1,kind:fixture?'test-fixture':'production',version:selected.version,contract:'tmt04-bounded-adaptation-seed-v1',rules:{generation:9,format:'private-unranked-singles-premade',level:50,teamSize:3,iv:31,ev:0,source:'policy'},scope:{fullCatalog:false,romFidelityProven:false,excluded:['custom passives','megas','type changes','fourth type','unreviewed custom moves/abilities/items','all species outside premades']},sources,types:[...types.values()],species,moves:[...moves.values()],abilities:[...abilities.values()],items,chart,teams:[{id:'alpha',sets:sets.slice(0,3)},{id:'beta',sets:sets.slice(3)}]};
  fs.writeFileSync(args[1],serializeSeed(d),{flag:'wx'});
  console.log(fixture?'Wrote labeled test fixture; never production.':'Wrote INCOMPLETE candidate seed; creator type rows unresolved. Not validated production.');
} catch(e){console.error(`[prepare-seed] ${e.message}`);process.exitCode=1;}
