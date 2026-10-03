import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseArgs, validateIDs, IDsFromFile, validateGIF, runDownload, limits, seedIDs} from '../tools/sprites/download.mjs';
import {writeZip} from '../tools/sprites/zip.mjs';

// Synthetic 1x1 GIF unit fixture; not official artwork or TMT2 production data.
const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const options = {ids: ['pidgeot-mega'], timeoutMs: 100, retries: 0};
function temp(t) {
  // Resolve the trusted OS temp-root alias before creating our own fixture.
  // Production output validation still rejects every untrusted symlink.
  const base = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'tmt2 sprites '));
  t.after(() => fs.rmSync(base, {recursive: true, force: true}));
  return base;
}
test('sprite CLI defaults, exact forms and input validation before any writes', t => {
  assert.deepEqual(parseArgs([]).ids, seedIDs);
  assert.deepEqual(parseArgs(['--pokemon', 'rattata,pidgeot-mega']).ids, ['rattata', 'pidgeot-mega']);
  for (const args of [['--url', 'https://example.com'], ['--pokemon'], ['--pokemon', 'Pidgeot'],
    ['--pokemon', '../x'], ['--pokemon', 'rattata,rattata'], ['--retries', '3'],
    ['--timeout-ms', '99'], ['--timeout-ms', '30001'], ['--retries', '-1'],
    ['--pokemon','rattata','--file','unused'], ['--retries','1','--retries','0']]) assert.throws(() => parseArgs(args));
  for (const ids of [[], Array(33).fill('rattata'), ['https://host/x'], ['pidgeot_mega'], ['a\\b'], ['a\n'], null]) assert.throws(() => validateIDs(ids));
  const base = temp(t);
  const txt = path.join(base, 'ids.txt');
  fs.writeFileSync(txt, '# exact filenames\nrattata\npidgeot-mega\n');
  assert.deepEqual(IDsFromFile(txt), ['rattata', 'pidgeot-mega']);
  const json = path.join(base, 'ids.json');
  fs.writeFileSync(json, '["froakie","floragato"]');
  assert.deepEqual(parseArgs(['--file',json]).ids,['froakie','floragato']);
  fs.writeFileSync(json, '{"names":["rattata"]}'); assert.throws(() => IDsFromFile(json));
  fs.writeFileSync(txt, Buffer.alloc(limits.maxInputBytes+1)); assert.throws(() => IDsFromFile(txt), /32 KiB/);
  fs.writeFileSync(txt, Buffer.from([255])); assert.throws(() => IDsFromFile(txt));
});
test('GIF framing rejects HTML, empty/truncated frames, invalid dimensions and oversized bytes', () => {
  assert.deepEqual(validateGIF(gif), {width:1,height:1,frames:1});
  for (const bad of [Buffer.from('<html>blocked</html>'), gif.subarray(0,-1), Buffer.from('GIF89a'),
    Buffer.concat([gif, Buffer.from('trailing')]), Buffer.alloc(limits.maxFileBytes+1)]) assert.throws(() => validateGIF(bad));
  const zero = Buffer.from(gif); zero.writeUInt16LE(0,6); assert.throws(() => validateGIF(zero));
  const wide = Buffer.from(gif); wide.writeUInt16LE(4097,6); assert.throws(() => validateGIF(wide));
});
test('full synthetic download preserves originals, exact official URLs/hashes and unique complete ZIPs', async t => {
  const base = temp(t), requests = [];
  const fetchImpl = async (url, opts) => {
    requests.push(url); assert.equal(opts.redirect,'manual'); assert.equal(opts.credentials,'omit');
    return new Response(gif, {headers:{'content-type':'image/gif','content-length':String(gif.length)}});
  };
  const first = await runDownload(options, {outputBase:base,fetchImpl});
  assert.equal(first.report.complete,true); assert.equal(first.manifest.complete,true);
  assert.deepEqual(requests,['https://play.pokemonshowdown.com/sprites/ani/pidgeot-mega.gif',
    'https://play.pokemonshowdown.com/sprites/ani-back/pidgeot-mega.gif']);
  for (const file of first.manifest.files) {
    assert.equal(file.sha256,hash(gif)); assert.equal(file.sizeBytes,gif.length);
    assert.deepEqual(fs.readFileSync(path.join(first.folder,file.path)),gif);
  }
  assert.match(first.manifest.redistributionRights,/not-verified/);
  const archive = fs.readFileSync(path.join(first.folder,'sprites.zip'));
  assert.equal(first.report.archive.sha256,hash(archive)); assert.equal(archive.readUInt32LE(0),0x04034B50);
  const second = await runDownload(options, {outputBase:base,fetchImpl});
  assert.notEqual(first.folder,second.folder);
  assert.deepEqual(fs.readFileSync(path.join(first.folder,'sprites/ani/pidgeot-mega.gif')),gif);
});
test('partial 404/invalid GIF failures are reported; neither rejected files nor ZIP is published', async t => {
  const base = temp(t);
  let calls=0;
  const result=await runDownload({...options,retries:2},{outputBase:base,fetchImpl:async()=>{
    calls++;return calls===1?new Response('missing',{status:404}):new Response('GIF89a<script>');
  }});
  assert.equal(calls,2);assert.equal(result.report.complete,false);assert.equal(result.manifest.complete,false);
  assert.deepEqual(result.report.failures.map(f=>f.code),['http-404','invalid-gif']);
  assert.equal(result.report.archive,null);assert.equal(fs.existsSync(path.join(result.folder,'sprites.zip')),false);
  assert.equal(fs.existsSync(path.join(result.folder,'sprites')),false);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(result.folder,'report.json'))),result.report);
  let call=0;
  const partial=await runDownload(options,{outputBase:base,fetchImpl:async()=>++call===1?new Response(gif):new Response('missing',{status:404})});
  assert.equal(partial.report.downloadedFiles,1);assert.equal(partial.report.complete,false);
  assert.deepEqual(fs.readFileSync(path.join(partial.folder,'sprites/ani/pidgeot-mega.gif')),gif);
  assert.equal(fs.existsSync(path.join(partial.folder,'sprites.zip')),false);
});
test('transient failures retry within the limit; 403 and redirects are never retried or followed', async t => {
  const base=temp(t);let calls=0;
  const ok=await runDownload({...options,retries:1},{outputBase:base,fetchImpl:async()=>++calls===1?new Response('retry',{status:503}):new Response(gif)});
  assert.equal(ok.report.complete,true);assert.equal(calls,3);assert.equal(ok.manifest.files[0].attempts,2);
  for(const status of [403,302]) {
    calls=0;
    const bad=await runDownload({...options,retries:2},{outputBase:base,fetchImpl:async()=>{calls++;return new Response('blocked',{status,headers:{location:'https://other.example/secret'}});}});
    assert.equal(calls,2);assert.ok(bad.report.failures.every(f=>f.code===`http-${status}`&&f.attempts===1));
  }
  calls=0;
  const bad=await runDownload({...options,retries:1},{outputBase:base,fetchImpl:async()=>{calls++;throw new TypeError('fetch failed');}});
  assert.equal(calls,4);assert.ok(bad.report.failures.every(f=>f.code==='network'&&f.attempts===2));
});
test('advertised and streaming oversized responses fail without preserving invalid assets', async t => {
  const base=temp(t);
  const huge=await runDownload(options,{outputBase:base,fetchImpl:async()=>new Response(gif,{headers:{'content-length':String(limits.maxFileBytes+1)}})});
  assert.ok(huge.report.failures.every(f=>f.code==='too-large'));
  const stream=await runDownload(options,{outputBase:base,fetchImpl:async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(limits.maxFileBytes+1));c.close();}}))});
  assert.ok(stream.report.failures.every(f=>f.code==='too-large'));
  assert.equal(stream.report.archive,null);
});
test('real local HTTP fixture exercises native timeout/abort and preserves existing output', async t => {
  const base=temp(t);const server=http.createServer(()=>{});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  const port=server.address().port;
  const result=await runDownload(options,{outputBase:base,fetchImpl:(_,opts)=>fetch(`http://127.0.0.1:${port}/synthetic.gif`,opts)});
  assert.ok(result.report.failures.every(f=>f.code==='timeout'&&f.attempts===1));assert.equal(result.report.archive,null);
  const controller=new AbortController();controller.abort();let calls=0;
  const cancelled=await runDownload(options,{outputBase:base,signal:controller.signal,fetchImpl:async()=>{calls++;throw Error('must not run');}});
  assert.equal(calls,0);assert.ok(cancelled.report.failures.every(f=>f.code==='cancelled'));
  assert.equal(fs.existsSync(path.join(result.folder,'report.json')),true);
});
test('unsafe outputs and ZIP entries are rejected without overwriting files; ZIP encoding is stable', async t => {
  const base=temp(t);const outside=path.join(base,'outside');fs.mkdirSync(outside);
  const linked=path.join(base,'linked');fs.symlinkSync(outside,linked,'dir');
  await assert.rejects(runDownload(options,{outputBase:linked}),/symlinks/);assert.deepEqual(fs.readdirSync(outside),[]);
  const source=path.join(base,'fixture');fs.writeFileSync(source,'123456789');
  const a=path.join(base,'a.zip'),b=path.join(base,'b.zip');
  assert.throws(()=>writeZip(a,[{name:'../outside',file:source}]),/Unsafe/);assert.equal(fs.existsSync(a),false);
  writeZip(a,[{name:'fixture.txt',file:source}]);writeZip(b,[{name:'fixture.txt',file:source}]);
  assert.deepEqual(fs.readFileSync(a),fs.readFileSync(b));
  assert.equal(fs.readFileSync(a).readUInt32LE(14),0xCBF43926);
  assert.throws(()=>writeZip(a,[{name:'fixture.txt',file:source}]),/EEXIST/);
  const cli=fileURLToPath(new URL('../tools/sprites/download.mjs',import.meta.url));
  assert.match(execFileSync(process.execPath,[cli,'--help'],{encoding:'utf8'}),/Default: rattata/);
  assert.throws(()=>execFileSync(process.execPath,[cli,'--pokemon','../invalid'],{stdio:'pipe'}),/lowercase/);
});
