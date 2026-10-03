// One approved private test; game inputs remain the published sprite heads.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=process.cwd();
const {config,git,manifest}=await import(pathToFileURL(path.join(root,'tools/workspace/core.mjs')));
const {allowedRequest,launchOptions}=await import(pathToFileURL(path.join(root,'tools/regression/browser-policy.mjs')));
const {chromium}=createRequire(path.join(root,'package.json'))('playwright');
const c=config(),dir=path.join(root,'.local/evidence/live-challenge-final-sprites');
fs.mkdirSync(dir,{recursive:true});
const expected={data:'b186cc1d67da28785e1c347a2c73e7fe1625fd2c',client:'75a5cdef759cb30f391ebf7e9dfe6e3384f6c931',server:'db159373b132babf016cf78ced737dec05d23d97'};
const checks=[],errors=[],blocked=[],contexts=[],pages=[],decisions=[];
const configFile=path.join(c.server,'config/config.js'),before=fs.readFileSync(configFile);
let browser,child,ended,battleID,result;
function timeout(promise,ms,label){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label)),ms);})]).finally(()=>clearTimeout(timer));}
async function shot(page,name){await page.screenshot({path:path.join(dir,name+'.png'),fullPage:true});}
async function state(page){return page.evaluate(()=>{
 const room=Object.values(PS.rooms).find(r=>r.type==='battle'&&!r.id.startsWith('battle-uploaded'));
 if(!room?.battle)return null;
 return {id:room.id,ended:room.battle.ended,turn:room.battle.turn,type:room.request?.requestType,rqid:room.request?.rqid,
  done:room.choices?.isDone(),picked:room.choices?.alreadySwitchingIn||[],side:room.side?.id,
  queue:room.battle.stepQueue,request:room.request,
  actives:room.battle.sides.map(s=>s.active.map(p=>p&&({name:p.name,species:p.speciesForme,types:p.getTypes()[0],fainted:p.fainted}))),
  fainted:room.battle.sides.map(s=>s.pokemon.filter(p=>p.fainted).length)};
 });}
async function chooseTeam(page,container,id){
 await container.locator('button[name="team"]').click();
 await page.locator(`.ps-popup button[value="tmt2${id}"]`).click();
}
try {
 assert.equal(process.env.TMT2_APPROVED_LIVE_TEST,'2026-10-03','Fresh bounded approval required');
 assert.equal(process.platform,'darwin','This approved runner requires sandboxed macOS');
 for(const [key,sha]of Object.entries(expected))assert.equal(git(c[key],'rev-parse','HEAD'),sha,`${key} game head drift`);
 assert.equal(createRequire(import.meta.url)(configFile).noguestsecurity,false);
 browser=await chromium.launch(launchOptions()); // No service if sandbox fails.
 child=spawn(process.execPath,['tools/workspace/cli.mjs','dev'],{cwd:root,env:{...process.env,TMT2_LOCAL_GUESTS:'1'},stdio:['ignore','pipe','pipe']});
 ended=new Promise((resolve,reject)=>{child.once('exit',resolve);child.once('error',reject);});ended.catch(()=>{});
 let output='',warning='';child.stderr.on('data',bytes=>{warning+=bytes;process.stderr.write(bytes);});
 await timeout(new Promise((resolve,reject)=>{
  child.stdout.on('data',bytes=>{process.stdout.write(bytes);output=(output+bytes).slice(-4096);if(output.includes('[workspace] READY '))resolve();});
  child.once('error',reject);child.once('exit',code=>reject(Error(`dev exited ${code}`)));
 }),240000,'dev startup timed out');
 assert.match(warning,/Temporary unsigned local names enabled on 127\.0\.0\.1 only/);
 for(const port of [c.serverPort,c.clientPort]){
  const probe=spawnSync('lsof',['-nP',`-iTCP:${port}`,'-sTCP:LISTEN'],{encoding:'utf8'});
  assert.equal(probe.status,0);assert.match(probe.stdout,new RegExp(`127\\.0\\.0\\.1:${port}`));assert(!probe.stdout.includes(`*:${port}`));
 }
 checks.push({check:'approved in-memory guest names and verified loopback listeners',passed:true});
 const url=`http://127.0.0.1:${c.clientPort}/testclient-new.html?~~127.0.0.1:${c.serverPort}`;
 const names=['SpriteAlpha','SpriteBeta'];
 for(let i=0;i<2;i++){
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',acceptDownloads:true});contexts.push(context);
  await context.route('**/*',async route=>{if(allowedRequest(route.request().url(),c))await route.continue();else{blocked.push(route.request().url());await route.abort();}});
  await context.routeWebSocket('**/*',ws=>{if(allowedRequest(ws.url(),c))ws.connectToServer();else{blocked.push(ws.url());ws.close();}});
  const page=await context.newPage();page.setDefaultTimeout(20000);pages.push(page);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('Browser console error');});
  page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`);});
  await page.goto(url);await page.waitForFunction(()=>typeof PS!=='undefined'&&PS.connection.connected);
  assert.match(await page.locator('body').innerText(),/TMT2 private local seed/);
  await page.getByRole('button',{name:'Choose name',exact:true}).first().click();
  await page.locator('.ps-popup input[name="username"]').fill(names[i]);
  await page.locator('.ps-popup').getByRole('button',{name:'Choose name',exact:true}).click();
  await page.waitForFunction(name=>PS.user.named&&PS.user.name===name,names[i]);
  assert.equal(await page.locator('input[type=password]').count(),0);
  await page.evaluate(()=>{window.liveMessages=[];const receive=PS.receive.bind(PS);PS.receive=message=>{if(typeof message==='string'&&message.startsWith('>battle-'))window.liveMessages.push(message);return receive(message);};});
  checks.push({check:'native name UI and independent named connection',session:i+1,name:names[i],passed:true});
 }
 assert.notEqual(contexts[0],contexts[1]);
 const [alpha,beta]=pages;
 await alpha.getByRole('link',{name:'Find a user',exact:true}).click();
 await alpha.locator('input[name="username"]:visible').fill(names[1]);
 await alpha.getByRole('button',{name:'Look up',exact:true}).click();
 await alpha.getByRole('button',{name:'Challenge',exact:true}).last().click();
 const outgoing=alpha.locator('.challenge.outgoing');await outgoing.waitFor();
 await outgoing.locator('button[name="format"]').click();
 await alpha.locator('.ps-popup').getByRole('button',{name:/TMT2 Seed/}).click();
 await chooseTeam(alpha,outgoing,'alpha');
 await outgoing.getByRole('button',{name:'Challenge',exact:true}).click();
 const incoming=beta.locator('.challenge:not(.outgoing)');await incoming.getByRole('button',{name:'Accept',exact:true}).waitFor();
 await chooseTeam(beta,incoming,'beta');
 await shot(alpha,'challenge-sent-alpha');await shot(beta,'challenge-received-beta');
 await incoming.getByRole('button',{name:'Accept',exact:true}).click();
 for(const page of pages)await page.waitForFunction(()=>Object.values(PS.rooms).some(r=>r.type==='battle'&&r.request?.requestType==='team'));
 battleID=(await state(alpha)).id;assert.equal((await state(beta)).id,battleID);
 checks.push({check:'real native premade challenge sent/accepted and same server room',battleID,passed:true});
 // Native team-preview buttons, no direct simulator or protocol choice injection.
 for(const [i,page]of pages.entries()){
  const order=i===0?[1,2,3]:[3,1,2];
  for(const index of order){
   const s=await state(page);if(s.type!=='team'||s.done)break;
   const button=page.locator(`#room-${battleID} button[data-cmd="/switch ${index}"]:visible:not(:disabled)`).first();
   await button.click();decisions.push({session:i+1,phase:'team-preview',index});
  }
 }
 for(const page of pages)await page.waitForFunction(()=>Object.values(PS.rooms).some(r=>r.type==='battle'&&r.request?.requestType==='move'));
 for(const [i,page]of pages.entries()){
  const s=await state(page);assert.equal(s.request.side.pokemon.length,3);
  for(const pokemon of s.request.side.pokemon)assert.match(pokemon.details,/, L50/);
  assert.deepEqual(s.actives[1][0].types,['Bird','Bird','Bird']);
  const room=page.locator(`#room-${battleID}`);
  await room.locator('.battle').waitFor();
  await room.locator('button[data-cmd^="/move "]:visible:not(:disabled)').first().waitFor();
  const images=await room.locator('.battle img').evaluateAll(nodes=>nodes.filter(n=>n.src.includes('/sprites/ani')).map(n=>({src:n.getAttribute('src'),width:n.naturalWidth,height:n.naturalHeight,loaded:n.complete})));
  assert(images.some(f=>f.src.includes('/ani/'))&&images.some(f=>f.src.includes('/ani-back/')));
  assert(images.every(f=>f.loaded&&f.width>0&&f.height>0));
  const files=await page.evaluate(()=>window.BattleTMT2Assets.files);
  for(const image of images)assert(files[image.src.replace(/^tmt2\//,'')],`Unpinned live sprite ${image.src}`);
  await shot(page,`live-start-session${i+1}`);checks.push({check:'real front/back sprites and triple Bird types in live state',session:i+1,images,passed:true});
 }
 const deadline=Date.now()+240000;
 let actions=0;
 while(Date.now()<deadline){
  const states=await Promise.all(pages.map(state));
  if(states.every(s=>s.ended))break;
  assert(actions<400,'Too many native decisions');
  for(const [i,page]of pages.entries()){
   const s=await state(page);if(s.ended||s.done||!['move','switch'].includes(s.type))continue;
   const room=page.locator(`#room-${battleID}`);let command;
   if(s.type==='move'){
    const moves=s.request.active[0].moves;
    const n=moves.findIndex(m=>!m.disabled&&m.pp>0&&!['protect','thunderwave','growl'].includes(m.id));
    assert(n>=0,'No supported damaging decision available');command=`/move ${n+1}`;
   }else{
    const n=s.request.side.pokemon.findIndex(p=>!p.active&&!/ fnt$/.test(p.condition));
    assert(n>=0,'No legal switch');command=`/switch ${n+1}`;
   }
   const button=room.locator(`button[data-cmd="${command}"]:visible:not(:disabled)`).first();
   if(await button.count()){
    await button.click();decisions.push({session:i+1,rqid:s.rqid,turn:s.turn,phase:s.type,command});actions++;
   }
  }
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 for(const page of pages)await page.waitForFunction(()=>Object.values(PS.rooms).some(r=>r.type==='battle'&&r.battle?.ended),null,{timeout:10000});
 const final=await Promise.all(pages.map(state));
 const wins=final.map(s=>s.queue.filter(l=>l.startsWith('|win|')));
 assert.equal(wins[0].length,1);assert.deepEqual(wins[0],wins[1]);assert.equal(final[0].turn,final[1].turn);
 assert.deepEqual(final[0].fainted,final[1].fainted);assert.equal(Math.max(...final[0].fainted),3);
 assert(final.every(s=>!s.queue.some(l=>/^\|error\|/.test(l))));
 assert(decisions.some(d=>d.session===1&&d.phase==='move')&&decisions.some(d=>d.session===2&&d.phase==='move'));
 result={battleID,winner:wins[0][0].slice(5),turn:final[0].turn,fainted:final[0].fainted,decisions:actions};
 checks.push({check:'both players executed native choices to synchronized terminal result',...result,passed:true});
 for(const [i,page]of pages.entries()){
  await shot(page,`live-final-session${i+1}`);
  fs.writeFileSync(path.join(dir,`live-protocol-session${i+1}.json`),JSON.stringify(await page.evaluate(()=>window.liveMessages),null,2)+'\n');
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('link',{name:'Download replay',exact:true}).click();const download=await downloadEvent;
  await download.saveAs(path.join(dir,`live-replay-session${i+1}.json`));
  const replay=JSON.parse(fs.readFileSync(path.join(dir,`live-replay-session${i+1}.json`),'utf8'));
  assert(replay.log.includes(wins[0][0]));
  await page.goto(url);await page.locator('input[aria-label="Load local replay JSON"]').setInputFiles(path.join(dir,`live-replay-session${i+1}.json`));
  await page.waitForFunction(()=>Object.values(PS.rooms).some(r=>r.id.startsWith('battle-uploaded')&&r.battle?.ended));
  await shot(page,`live-replay-session${i+1}`);
  checks.push({check:'actual completed live replay downloaded and viewed locally',session:i+1,datasetHash:replay.datasetHash,passed:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
}catch(error){errors.push(error.message);console.error(error.stack);process.exitCode=1;
 for(const [i,page]of pages.entries())try{await shot(page,`failure-session${i+1}`);fs.writeFileSync(path.join(dir,`failure-dom-session${i+1}.txt`),await page.locator('body').innerText());}catch{}
}finally{
 for(const context of contexts)try{await context.close();}catch(error){errors.push(error.message);process.exitCode=1;}
 try{await browser?.close();}catch(error){errors.push(error.message);process.exitCode=1;}
 if(child){
  if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');
  try{
   assert.equal(await timeout(ended,10000,'dev cleanup timeout'),143);
   assert.equal(fs.existsSync(path.join(root,'.local/operation.lock')),false);
   for(const port of [c.serverPort,c.clientPort])await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve));});
   assert.deepEqual(fs.readFileSync(configFile),before);assert.equal(createRequire(import.meta.url)(configFile).noguestsecurity,false);
   checks.push({check:'temporary auth removed, SIGTERM143, lock/ports released, config unchanged',passed:true});
  }catch(error){errors.push(error.message);process.exitCode=1;if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');}
 }
 const report={kind:'approved live native challenge, final sprite inputs',passed:!process.exitCode,chromiumSandbox:true,authException:'approved temporary loopback-only in-memory noguestsecurity',liveTwoPlayerChallenge:!!result,humanPlaytesting:false,expected,checks,result,decisions,errors,blocked,sources:manifest(c)};
 fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
