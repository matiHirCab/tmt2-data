import fs from 'node:fs';
import {createHash} from 'node:crypto';
const schema = JSON.parse(fs.readFileSync(new URL('../../schemas/seed.schema.json', import.meta.url)));
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export function serializeSeed(d) {
  return '{\n'+Object.entries(d).map(([k,v])=>`  ${JSON.stringify(k)}: ${Array.isArray(v) ? '[\n'+v.map(x=>'    '+JSON.stringify(x)).join(',\n')+'\n  ]' : JSON.stringify(v)}`).join(',\n')+'\n}\n';
}
export const stableHash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
// Validate only the Draft-07 keywords used by the checked-in schema; no eval, network or mutation.
function shape(s, v, at, errors) {
  if (s.$ref) return shape(schema.definitions[s.$ref.split('/').at(-1)], v, at, errors);
  const bad = message => errors.push(`${at}: ${message}`);
  if (s.anyOf && !s.anyOf.some(choice => { const e = []; shape(choice, v, at, e); return !e.length; })) bad('no allowed shape matches');
  if ('const' in s && v !== s.const) bad(`expected ${JSON.stringify(s.const)}`);
  if (s.enum && !s.enum.includes(v)) bad('unsupported value');
  const type = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
  if (s.type && !(Array.isArray(s.type) ? s.type : [s.type]).some(t => t === type || (t === 'integer' && Number.isInteger(v)))) { bad(`expected ${s.type}`); return; }
  if (typeof v === 'string') {
    if (s.minLength && v.length < s.minLength) bad('empty string');
    if (s.pattern && !new RegExp(s.pattern).test(v)) bad('invalid ID/hash');
  }
  if (typeof v === 'number' && ((s.minimum !== undefined && v < s.minimum) || (s.maximum !== undefined && v > s.maximum))) bad('number outside range');
  if (Array.isArray(v)) {
    if (v.length < (s.minItems ?? 0) || v.length > (s.maxItems ?? Infinity)) bad('invalid array length');
    if (s.items) v.forEach((x, i) => shape(s.items, x, `${at}[${i}]`, errors));
  } else if (v && typeof v === 'object') {
    for (const k of s.required ?? []) if (!(k in v)) bad(`missing ${k}`);
    if (Object.keys(v).length < (s.minProperties ?? 0)) bad('missing provenance');
    for (const [k, x] of Object.entries(v)) {
      if (s.properties?.[k]) shape(s.properties[k], x, `${at}.${k}`, errors);
      else if (s.additionalProperties === false) bad(`unknown key ${k}`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object') shape(s.additionalProperties, x, `${at}.${k}`, errors);
    }
  }
}
export function inheritedPayload(d) {
  return {species:d.species.map(s=>({...s,types:undefined,fieldSources:undefined})),
    moves:d.moves,abilities:d.abilities,types:d.types,chart:d.chart.filter(p=>p.source==='showdown')};
}
export function validateSeed(d, {allowFixture = false} = {}) {
  const errors = []; shape(schema, d, '$', errors);
  if (errors.length) return {valid: false, errors};
  const bad = message => errors.push(message);
  if (d.kind === 'test-fixture' && !allowFixture) bad('Test fixture cannot validate as a selected production seed');
  const maps = {};
  for (const kind of ['sources', 'types', 'species', 'moves', 'abilities', 'items']) {
    maps[kind] = new Map();
    for (const record of d[kind]) {
      if (maps[kind].has(record.id)) bad(`${kind}: duplicate ID ${record.id}`);
      maps[kind].set(record.id, record);
    }
  }
  const exists = (kind, id, at) => { if (!maps[kind].has(id)) bad(`${at}: broken ${kind} reference ${id}`); };
  const evidence = (id, at, {creatorOnly = false} = {}) => {
    exists('sources', id, at); const s = maps.sources.get(id); if (!s) return;
    if (s.kind === 'unknown') bad(`${at}: unresolved evidence`);
    if (s.kind === 'test-fixture' && (d.kind !== 'test-fixture' || !allowFixture)) bad(`${at}: fixture evidence in production`);
    if (s.kind !== 'unknown' && !s.sha256) bad(`${at}: missing evidence hash`);
    if (creatorOnly && s.kind !== 'creator' && !(d.kind === 'test-fixture' && s.kind === 'test-fixture')) bad(`${at}: species types require creator evidence`);
  };
  evidence(d.rules.source, 'rules');
  if(d.rules.source!=='policy') bad('Rules must cite the approved adaptation policy');
  const pins=JSON.parse(fs.readFileSync(new URL('../../ci/pins.json',import.meta.url)));
  const inherited=maps.sources.get('showdown');
  if(!inherited || inherited.kind!=='showdown' || inherited.version!==pins.server.commit) bad('Showdown source must use the approved exact server commit');
  else if(inherited.sha256!==stableHash(inheritedPayload(d))) bad('Inherited snapshot hash mismatch');
  const register=JSON.parse(fs.readFileSync(new URL('../../provenance/sources.json',import.meta.url)));
  const chartSource=maps.sources.get('creatorchart');
  if(!chartSource || chartSource.kind!=='creator' || chartSource.sha256!==stableHash(register.chartObservations)) bad('Creator chart evidence hash mismatch');
  const policy=maps.sources.get('policy');
  if(!policy || policy.kind!=='policy' || policy.sha256!==stableHash(register.userApprovals)) bad('Approved policy evidence hash mismatch');
  for(const p of d.chart.filter(p=>p.source==='creatorchart')) {
    if(!register.chartObservations.pairs.some(q=>q.attacker.toLowerCase()===p.attacker && q.defender.toLowerCase()===p.defender && q.multiplier===p.multiplier)) bad('Chart pair contradicts registered creator observation');
  }
  for (const kind of ['types', 'species', 'moves', 'abilities', 'items']) for (const r of d[kind]) {
    for (const field of Object.keys(r).filter(k => k !== 'fieldSources')) {
      if (!r.fieldSources[field]) bad(`${kind}.${r.id}.${field}: missing field provenance`);
      else evidence(r.fieldSources[field], `${kind}.${r.id}.${field}`, {creatorOnly: kind === 'species' && field === 'types'});
    }
    for (const field of Object.keys(r.fieldSources)) if (!(field in r) || field === 'fieldSources') bad(`${kind}.${r.id}: unused provenance field ${field}`);
    if (kind === 'types' && r.passive === 'unsupported-custom') bad(`type ${r.id}: custom passive unsupported`);
    if (kind === 'species') {
      if (!r.types) bad(`species ${r.id}: creator type row missing`);
      else {
        r.types.forEach(id => exists('types', id, r.id)); // preserve order/repetition; never Set() this array
        if (d.kind === 'production') {
          const rows=JSON.parse(fs.readFileSync(new URL('../../provenance/seed-types.json',import.meta.url)));
          const source=maps.sources.get(r.fieldSources.types);
          const row=rows.rows.find(x=>x.id===r.id);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(rows.observedOn ?? '') || !source || source.id!=='creatorspecies' || source.sha256!==stableHash(rows) || !row || JSON.stringify(row.types)!==JSON.stringify(r.types) || !row.locator) bad(`species ${r.id}: no matching registered creator row`);
        }
      }
      r.abilities.forEach(id => exists('abilities', id, r.id)); r.learnset.forEach(id => exists('moves', id, r.id));
    }
    if (kind === 'moves') exists('types', r.type, r.id);
  }
  const pairs = new Map();
  for (const p of d.chart) {
    exists('types', p.attacker, 'chart'); exists('types', p.defender, 'chart'); evidence(p.source, 'chart');
    const key = `${p.attacker}/${p.defender}`; if (pairs.has(key)) bad(`duplicate chart pair ${key}`); pairs.set(key, p.multiplier);
  }
  const ids = new Set(), roster = new Set();
  for (const team of d.teams) {
    if (ids.has(team.id)) bad(`duplicate team ${team.id}`); ids.add(team.id);
    for (const set of team.sets) {
      for (const [kind, id] of [['species',set.species],['abilities',set.ability],['items',set.item]]) exists(kind,id,'team');
      if (roster.has(set.species)) bad(`duplicate premade species ${set.species}`); roster.add(set.species);
      if (new Set(set.moves).size !== set.moves.length) bad(`duplicate moves in ${set.species}`);
      const sp = maps.species.get(set.species);
      if (sp && !sp.abilities.includes(set.ability)) bad(`illegal ability for ${sp.id}`);
      for (const id of set.moves) {
        exists('moves',id,'team'); const move=maps.moves.get(id);
        if (sp && !sp.learnset.includes(id)) bad(`illegal move ${id} for ${sp.id}`);
        if (move && move.category !== 'Status') for (const defender of d.species) for (const type of defender.types ?? []) {
          if (!pairs.has(`${move.type}/${type}`)) bad(`missing chart pair ${move.type}/${type}`);
        }
      }
    }
  }
  for (const s of d.species) if (!roster.has(s.id)) bad(`unused roster species ${s.id}`);
  return {valid: !errors.length, errors, contract: d.contract, kind: d.kind, version: d.version,
    sha256: stableHash(d), fullCatalogValidated: false, romFidelityProven: false};
}
export function readSeed(filename, options) {
  const bytes=fs.readFileSync(filename); if(bytes.length>4*1024*1024) throw Error('Seed exceeds 4 MiB');
  return validateSeed(JSON.parse(bytes), options);
}
