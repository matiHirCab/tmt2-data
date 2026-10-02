// Read-only pinned Dex extraction; validates before writing a NEW seed/fixture file.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {config, preflight, root} from '../workspace/core.mjs';
import {verifyPins} from '../ci/pins.mjs';
import {inheritedSources} from '../integration/cli.mjs';
import {stableHash, serializeSeed, inheritedPayload, validateSeed} from '../data/validate.mjs';
try {
  const args=process.argv.slice(2); const fixture=args[0]==='--fixture'; if(fixture)args.shift();
  if(args.length!==2 || args[0]!=='--output') throw Error('Usage: prepare-seed.mjs [--fixture] --output NEW.json');
  const c=config(); preflight(c); verifyPins(c); inheritedSources(c);
  const expected=JSON.parse(fs.readFileSync(path.join(root,'provenance/inheritance-pins.json')));
  const {Dex}=createRequire(import.meta.url)(path.join(c.server,'dist/sim/dex.js')); const dex=Dex.mod('gen9');
  const creatorRows=JSON.parse(fs.readFileSync(path.join(root,'provenance/seed-types.json')));
  const selected=JSON.parse(fs.readFileSync(path.join(root,'overrides/seed-selection.json')));
  const seedChart=JSON.parse(fs.readFileSync(path.join(root,'provenance/seed-chart.json')));
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
  const mega=JSON.parse(fs.readFileSync(path.join(root,'provenance/mega-pidgeot.json')));
  const forms=(selected.forms??[]).map(input=>{
    const sp=dex.species.get(input.id), base=species.find(s=>s.id===input.baseSpecies);
    if(!base || input.id!=='pidgeotmega' || sp.baseSpecies!=='Pidgeot' || sp.requiredItem!=='Pidgeotite')throw Error('Unsupported mega input');
    if(!fixture && mega.holyDefense.status!=='documented-primary')throw Error('Holy primary chart evidence missing; no production mega generated');
    const ab=dex.abilities.get('noguard');abilities.set(ab.id,provenance({id:ab.id,name:ab.name,behaviorRef:`server@${expected.server.commit}:data/abilities.ts#${ab.id}`},'showdown'));
    const record=provenance({id:sp.id,name:sp.name,baseSpecies:base.id,forme:sp.forme,requiredItem:'pidgeotite',types:fixture?sp.types.map(t=>dex.types.get(t).id):mega.creator.facts.types,baseStats:sp.baseStats,abilities:[ab.id],learnset:base.learnset},'showdown');
    record.fieldSources.types=fixture?'fixture':'creatormega';return record;
  });
  // Ordinary identities inherit Gen9; selected custom identities cite creator rows.
  for(const t of dex.types.all().filter(t=>!['Stellar','???'].includes(t.name))){
    types.set(t.id,provenance({id:t.id,name:t.name,passive:'ordinary-gen9'},'showdown'));
  }
  for(const row of creatorRows.rows)for(const id of row.types)if(!types.has(id)){
    const type=provenance({id,name:id[0].toUpperCase()+id.slice(1),passive:'none-adaptation'},'creatorspecies');type.fieldSources.passive='policy';types.set(id,type);
  }
  if(forms.length&&!fixture){
    const holy=provenance({id:'holy',name:'Holy',passive:'none-adaptation'},'creatormega');holy.fieldSources.passive='policy';types.set('holy',holy);
  }
  const chart=[];
  for(const a of types.values())for(const b of types.values()){
    const observed=seedChart.pairs.find(p=>p.attacker===a.id&&p.defender===b.id);
    if(observed){chart.push({attacker:a.id,defender:b.id,multiplier:observed.multiplier,source:'seedchart'});continue;}
    if(a.fieldSources.id!=='showdown'||b.fieldSources.id!=='showdown')continue;
    const official=register.chartObservations.pairs.find(p=>p.attacker.toLowerCase()===a.id&&p.defender.toLowerCase()===b.id);
    chart.push({attacker:a.id,defender:b.id,multiplier:official?.multiplier??(dex.getImmunity(a.name,b.name)?2**dex.getEffectiveness(a.name,b.name):0),source:official?'creatorchart':'showdown'});
  }
  if(forms.length&&!fixture)for(const [attacker,multiplier] of Object.entries(mega.holyDefense.multipliers))chart.push({attacker,defender:'holy',multiplier,source:'megachart'});
  const items=[provenance({id:'none',name:'No item',behaviorRef:'policy:no-held-item'},'policy')];
  if(forms.length){const item=dex.items.get('pidgeotite');items.push(provenance({id:item.id,name:item.name,behaviorRef:`server@${expected.server.commit}:data/items.ts#${item.id}`,megaStone:item.megaStone,itemUser:item.itemUser},'showdown'));}
  const sources=[
    {id:'showdown',kind:'showdown',version:expected.server.commit,locator:`https://github.com/${expected.server.repository}/tree/${expected.server.commit}/data; selected historical learnset entries allowed by adaptation`,sha256:null},
    {id:'creatorchart',kind:'creator',version:'observed-2026-09-30-not-release-bound',locator:register.sources.find(s=>s.id==='SRC-03').url+'; five chart coordinates in chartObservations',sha256:stableHash(register.chartObservations)},
    {id:'policy',kind:'policy',version:'approved-2026-09-30',locator:'provenance/sources.json#userApprovals',sha256:stableHash(register.userApprovals)},
    {id:'creatorspecies',kind:'creator',version:creatorRows.versionBinding??(creatorRows.observedOn?'observed-'+creatorRows.observedOn+'-not-release-bound':'unavailable'),locator:'provenance/seed-types.json: user transcription corroborated by relayed primary-sheet cell observations',sha256:stableHash(creatorRows)},
    {id:'seedchart',kind:'creator',version:'observed-2026-09-30-not-release-bound',locator:'provenance/seed-chart.json: exact primary chart coordinates',sha256:stableHash(seedChart)},
    ...(forms.length?[{id:'creatormega',kind:'creator',version:'documented-v1.5.0',locator:mega.creator.url+'; creator post #105, types only',sha256:stableHash(mega)},...(!fixture?[{id:'megachart',kind:'creator',version:'observed-2026-10-02-not-release-bound',locator:mega.holyDefense.url+'; BE2, seven attacking rows in provenance/mega-pidgeot.json#holyDefense',sha256:stableHash(mega)}]:[])]:[]),
    ...(fixture?[{id:'fixture',kind:'test-fixture',version:'synthetic-v1',locator:'Pinned base-Dex types used ONLY for validator fixture',sha256:stableHash(species.map(s=>s.types))}]:[])
  ];
  const sets=selected.species.map(s=>({species:s.id,ability:s.ability,item:s.item??'none',moves:s.moves,nature:'Hardy',level:50,ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31},evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}}));
  const d={schemaVersion:1,kind:fixture?'test-fixture':'production',version:selected.version,contract:'tmt04-bounded-adaptation-seed-v1',rules:{generation:9,format:'private-unranked-singles-premade',level:50,teamSize:3,iv:31,ev:0,source:'policy'},scope:{fullCatalog:false,romFidelityProven:false,excluded:['custom passives',...(forms.length?['other megas','selectable type-change moves']:['megas','type changes']),'fourth type','unreviewed custom moves/abilities/items','all species outside premades']},sources,...(forms.length?{forms}:{}),types:[...types.values()],species,moves:[...moves.values()],abilities:[...abilities.values()],items,chart,teams:[{id:'alpha',sets:sets.slice(0,3)},{id:'beta',sets:sets.slice(3)}]};
  d.sources.find(s=>s.id==='showdown').sha256=stableHash(inheritedPayload(d));
  const validation=validateSeed(d,{allowFixture:fixture});if(!validation.valid)throw Error(validation.errors.join('; '));
  fs.writeFileSync(args[1],serializeSeed(d),{flag:'wx'});
  console.log(fixture?'Wrote labeled test fixture; never production.':'Wrote validated bounded adaptation seed; not full catalog or ROM fidelity.');
} catch(e){console.error(`[prepare-seed] ${e.message}`);process.exitCode=1;}
