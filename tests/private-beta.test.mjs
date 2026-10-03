import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {hash} from '../tools/workspace/core.mjs';
import {verifyPrivatePolicy,checkedAssetFile,checkSnapshot,writeBetaSnapshot,feedbackContext,entrypointFiles} from '../tools/beta/private.mjs';
const fixture=()=>({kind:'tmt12-private-beta-snapshot-v1',publicRedistributionApproved:false,
  romFidelityProven:false,authException:false,sources:{data:{commit:'synthetic-unit-only'}},
  catalog:{datasetHash:'synthetic'},assets:{files:{}},service:{bind:'127.0.0.1',serverPort:18000,clientPort:18080}});
test('private beta never grants an unsigned-name exception',()=>{
  verifyPrivatePolicy({});verifyPrivatePolicy({TMT2_LOCAL_GUESTS:'0'});
  for(const value of ['1','true','anything'])assert.throws(()=>verifyPrivatePolicy({TMT2_LOCAL_GUESTS:value}),/unsigned/);
});
test('snapshot comparison rejects source, dataset, assets and configured-port drift',()=>{
  checkSnapshot(fixture(),fixture());
  for(const mutate of [s=>s.sources.data.commit='changed',s=>s.catalog.datasetHash='different',
    s=>s.assets.files.extra='changed',s=>s.service.clientPort=19080,s=>s.extra=true]){
    const changed=fixture();mutate(changed);assert.throws(()=>checkSnapshot(fixture(),changed),/drift/);
  }
  for(const key of ['publicRedistributionApproved','romFidelityProven','authException']){
    const claim=fixture();claim[key]=true;assert.throws(()=>checkSnapshot(claim,claim));
  }
});
test('asset identity reads exact local bytes and rejects traversal, mutation and symlinks',t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'tmt-beta-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  fs.mkdirSync(path.join(base,'sprites'));fs.writeFileSync(path.join(base,'sprites/pokemon.gif'),'synthetic-not-real-image');
  const digest=hash('synthetic-not-real-image');assert.deepEqual(checkedAssetFile(base,'sprites/pokemon.gif',digest),['sprites/pokemon.gif',digest]);
  for(const name of ['../outside','/absolute','sprites//pokemon.gif','sprites/./pokemon.gif','sprites\\pokemon.gif'])assert.throws(()=>checkedAssetFile(base,name,digest),/Unsafe/);
  assert.throws(()=>checkedAssetFile(base,'sprites/pokemon.gif','0'.repeat(64)),/drift/);
  fs.symlinkSync(path.join(base,'sprites/pokemon.gif'),path.join(base,'link'));assert.throws(()=>checkedAssetFile(base,'link',digest),/symlink/);
  fs.symlinkSync(path.join(base,'sprites'),path.join(base,'folder'));assert.throws(()=>checkedAssetFile(base,'folder/pokemon.gif',digest),/symlink/);
});
test('snapshot writes are deterministic, atomic and refuse symlink destinations',t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'tmt-beta-write-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  writeBetaSnapshot(fixture(),base);const file=path.join(base,'.local/private-beta.json');const first=fs.readFileSync(file);
  writeBetaSnapshot(fixture(),base);assert.deepEqual(fs.readFileSync(file),first);assert.deepEqual(fs.readdirSync(path.dirname(file)),['private-beta.json']);
  fs.unlinkSync(file);const other=path.join(base,'preserve');fs.writeFileSync(other,'original');fs.symlinkSync(other,file);
  assert.throws(()=>writeBetaSnapshot(fixture(),base),/symlink/);assert.equal(fs.readFileSync(other,'utf8'),'original');
});
test('beta CLI rejects extra options and auth flags before executing install/build/services',()=>{
  for(const [args,env,pattern]of [
    [['prepare','--extra'],process.env,/Usage/],
    [['unknown'],process.env,/Usage/],
    [['prepare'],{...process.env,TMT2_LOCAL_GUESTS:'1'},/unsigned/],
  ]){
    const child=spawnSync(process.execPath,['tools/beta/private.mjs',...args],{cwd:new URL('..',import.meta.url),env,encoding:'utf8'});
    assert.equal(child.status,1);assert.match(child.stderr,pattern);
    assert(!child.stdout.includes('lockfile install'));
  }
});

test('feedback context uses pinned identities without exporting paths/config/source payloads',()=>{
  const snapshot=fixture();snapshot.scope='private-local-approved-adaptation';
  snapshot.sources.data.secret='must-not-export';snapshot.catalog.secret='must-not-export';snapshot.sources.data.absolutePath='/private/machine';
  snapshot.assets.manifestSha256='synthetic';snapshot.assets.placeholderSpecies=['synthetic'];
  const report=feedbackContext(snapshot);assert.equal(report.commits.data,'synthetic-unit-only');
  assert(!JSON.stringify(report).includes('must-not-export'));assert(!JSON.stringify(report).includes('/private/machine'));
  assert.deepEqual(report.reproduction.steps,[]);
});

test('native entrypoint inventories local resources deterministically and rejects empty/remote pages',()=>{
  const html='<script src="js/client.js?cache"></script><link href="/style/client.css"><img src="logo.png"><script src="js/client.js"></script>';
  assert.deepEqual(entrypointFiles(html),['js/client.js','logo.png','style/client.css','testclient-new.html']);
  for(const html of ['empty','<script src="https://remote.invalid/a.js"></script>','<script src="//remote.invalid/a.js"></script>'])assert.throws(()=>entrypointFiles(html));
});
