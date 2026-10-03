import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {deflateSync} from 'node:zlib';
import {crc32} from '../tools/provenance/bps.mjs';
import {config} from '../tools/workspace/core.mjs';
import {installPinned} from '../tools/sprites/install-pinned.mjs';
const validator=createRequire(import.meta.url)(path.join(config().client,'build-tools/tmt2-native-artwork.js'));
const gitHash=b=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
function fixture(t) {
 const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'pinned-artwork-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const gif=Buffer.from('R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==','base64');
 function chunk(type,data){const b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,-4)),b.length-4);return b;}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(1);ihdr.writeUInt32BE(1,4);ihdr[8]=8;ihdr[9]=6;
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,1,2,3,0]))),chunk('IEND',Buffer.alloc(0))]);
 const bytes=[gif,gif,png];
 const files=['ani','ani-back','home-centered'].map((f,i)=>({id:'rattata',facing:f,path:`sprites/${f}/rattata.${i===2?'png':'gif'}`,
  sourcePath:i===2?'src/minisprites/pokemon/home/srattata.png':`src/models/srattata${i===1?'-b':''}.gif`,sizeBytes:bytes[i].length,gitBlobSha1:gitHash(bytes[i])}));
 const pin={schemaVersion:1,kind:'official-showdown-matching-art-local-evaluation',sourceRepository:'smogon/sprites',sourceCommit:'a'.repeat(40),mapping:[{id:'rattata',sourceID:'rattata'}],files};
 return {root,pin,bytes,target:path.join(root,'installed'),fetch:async(url,opts)=>{
  assert.match(url,/^https:\/\/raw.githubusercontent.com\/smogon\/sprites\/a{40}\/src\//);assert.equal(opts.redirect,'manual');assert.equal(opts.credentials,'omit');
  const at=files.findIndex(f=>url.endsWith(f.sourcePath));return new Response(bytes[at]);
 }};
}
test('pinned artwork install validates real structural fixtures and is byte-deterministic/cache-only',async t=>{
 const f=fixture(t);const one=await installPinned(f.pin,f.target,validator,{fetchImpl:f.fetch});
 const two=await installPinned(f.pin,path.join(f.root,'second'),validator,{fetchImpl:f.fetch});assert.deepEqual(one,two);
 assert.deepEqual(fs.readFileSync(path.join(f.target,'manifest.json')),fs.readFileSync(path.join(f.root,'second/manifest.json')));
 assert.deepEqual(await installPinned(f.pin,f.target,validator,{fetchImpl:()=>{throw Error('Unexpected network');}}),one);
 assert.equal(one.files[2].png.width,1);assert.equal(one.files[0].gif.frames,1);
});
test('source drift, oversize and redirects never publish partial artwork or follow another host',async t=>{
 const f=fixture(t);
 for(const fetchImpl of [async()=>new Response(Buffer.alloc(10000)),async()=>new Response(Buffer.alloc(f.bytes[0].length)),async()=>new Response('',{status:302,headers:{location:'https://example.com'}})]){
  await assert.rejects(installPinned(f.pin,f.target,validator,{fetchImpl}));assert.equal(fs.existsSync(f.target),false);
 }
 assert.deepEqual(fs.readdirSync(f.root),[]);
});
test('untrusted pin URLs/paths, duplicate IDs and changed optional SHA256 fail closed',async t=>{
 const f=fixture(t);
 for(const mutate of [p=>p.files[0].sourcePath='../escape',p=>p.sourceRepository='other/repo',p=>p.mapping.push(p.mapping[0]),p=>p.files[0].sha256='0'.repeat(64)]){
  const pin=structuredClone(f.pin);mutate(pin);await assert.rejects(installPinned(pin,f.target,validator,{fetchImpl:f.fetch}));assert.equal(fs.existsSync(f.target),false);
 }
});
test('existing unrelated directories, symlinks and tampered cache remain untouched',async t=>{
 const f=fixture(t);fs.mkdirSync(f.target);fs.writeFileSync(path.join(f.target,'keep'),'user');
 await assert.rejects(installPinned(f.pin,f.target,validator,{fetchImpl:f.fetch}));assert.equal(fs.readFileSync(path.join(f.target,'keep'),'utf8'),'user');
 const link=path.join(f.root,'link');fs.symlinkSync(f.target,link);await assert.rejects(installPinned(f.pin,link,validator,{fetchImpl:f.fetch}),/Unsafe/);
 const good=path.join(f.root,'good');await installPinned(f.pin,good,validator,{fetchImpl:f.fetch});fs.writeFileSync(path.join(good,f.pin.files[0].path),'bad');
 await assert.rejects(installPinned(f.pin,good,validator,{fetchImpl:f.fetch}),/mismatch/);
});
test('aborted installation removes staging without changing supplied artwork',async t=>{
 const f=fixture(t),controller=new AbortController();controller.abort();
 await assert.rejects(installPinned(f.pin,f.target,validator,{fetchImpl:f.fetch,signal:controller.signal}));assert.deepEqual(fs.readdirSync(f.root),[]);
});
