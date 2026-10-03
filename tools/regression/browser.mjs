import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {config,root,manifest} from '../workspace/core.mjs';
import {checkRegression} from './simulator.mjs';
import {allowedRequest,launchOptions} from './browser-policy.mjs';

const timeout=(promise,ms,message)=>{
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms);})])
    .finally(()=>clearTimeout(timer));
};
export async function browserRegression({browser:externalBrowser,onNativeReady}={}) {
const c=config(),dir=path.join(root,externalBrowser?'.local/evidence/tmt11-native-local':'.local/evidence/tmt11-browser');
fs.mkdirSync(dir,{recursive:true});
const checks=[],errors=[],blocked=[],ownedContexts=[];
let browser=externalBrowser,child,ended,report;
const require=createRequire(import.meta.url);
const configFile=path.join(c.server,'config/config.js'),configBefore=fs.readFileSync(configFile);
async function run(){
  assert.equal(process.argv.length,2,'Usage: browser.mjs (sandbox always enabled)');
  assert.equal(require(path.join(c.server,'config/config.js')).noguestsecurity,false,'Persistent guest security must remain enabled');
  const replays=checkRegression();
  // Launch first: sandbox failure starts no services and needs no cleanup exception.
  browser ||= await chromium.launch(launchOptions());
  child=spawn(process.execPath,['tools/workspace/cli.mjs','dev'],{
    cwd:root,env:{...process.env,TMT2_LOCAL_GUESTS:'0'},stdio:['ignore','pipe','pipe'],
  });
  ended=new Promise((resolve,reject)=>{child.once('exit',resolve);child.once('error',reject);});
  ended.catch(()=>{}); // Retain rejection for cleanup without an early unhandled rejection.
  let output='';child.stderr.on('data',bytes=>process.stderr.write(bytes));
  await timeout(new Promise((resolve,reject)=>{
    child.stdout.on('data',bytes=>{
      process.stdout.write(bytes);output=(output+bytes).slice(-4096);
      if(output.includes('Temporary unsigned local names'))reject(Error('No authentication exception in browser CI'));
      if(output.includes('[workspace] READY '))resolve();
    });
    child.once('error',reject);child.once('exit',code=>reject(Error(`dev exited before READY: ${code}`)));
  }),240000,'dev startup timed out');
  const url=`http://127.0.0.1:${c.clientPort}/testclient-new.html?~~127.0.0.1:${c.serverPort}`;
  const pages=[];
  for(let i=0;i<2;i++){
    const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
    ownedContexts.push(context);
    await context.route('**/*',async route=>{
      if(allowedRequest(route.request().url(),c))await route.continue();
      else{blocked.push(route.request().url());await route.abort();}
    });
    await context.routeWebSocket('**/*',ws=>{
      if(allowedRequest(ws.url(),c))ws.connectToServer();
      else{blocked.push(ws.url());ws.close();}
    });
    const page=await context.newPage();page.setDefaultTimeout(15000);
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push('Native browser console error');});
    page.on('response',response=>{if(response.status()>=400)errors.push(`HTTP ${response.status()} ${response.url()}`);});
    await page.goto(url);await page.waitForFunction(()=>typeof PS!=='undefined'&&PS.connection.connected);
    assert.match(await page.locator('body').innerText(),/TMT2 private local seed/);
    if(i===0)await onNativeReady?.(url);
    pages.push(page);
    checks.push({check:'native bootstrap and actual Guest WS',session:i+1,passed:true});
  }
  assert.equal(pages[0].context()===pages[1].context(),false,'Independent browser storage required');
  // Ordinary-format mechanics/Dex isolation remain in the real core simulator
  // and cross-repository tests; avoid unrelated online sample-set UI here.
  const page=pages[0];await page.goto(url+'#teambuilder');
  await page.locator('a[href="team-tmt2beta"]').first().click();
  const editor=page.locator('#room-team-tmt2beta');await editor.waitFor();
  async function select(id){await editor.getByRole('combobox',{name:'TMT2 premade'}).selectOption(id);}
  async function form(){const back=editor.getByRole('button',{name:'Back',exact:true});if(await back.count())await back.click();await editor.getByRole('button',{name:'Form',exact:true}).click();}
  async function text(){await editor.getByRole('button',{name:'Import/Export',exact:true}).first().click();return editor.locator('textarea.teamtextbox:not(.heighttester)');}
  async function validate(pattern){
    await page.waitForFunction(()=>PS.connection.connected);
    await editor.getByRole('button',{name:'Validate'}).click();
    const ok=page.getByRole('button',{name:'OK',exact:true});await ok.waitFor();
    const message=await page.locator('.ps-popup').last().innerText();assert.match(message,pattern);await ok.click();return message;
  }
  for(const id of ['alpha','beta','gamma']){
    await select(id);await form();const box=await text();const value=await box.inputValue();
    assert.match(value,/Level: 50/);assert.doesNotMatch(value,/EVs:|Tera Type:/);
    await box.fill(value);await validate(/Your team is valid/);
    checks.push({check:'native premade roundtrip and authoritative server acceptance',premade:id,passed:true});
  }
  await select('beta');await form();const box=await text();const valid=await box.inputValue();
  await box.fill(valid.replace('Level: 50','Level: 100\nEVs: 252 Atk'));
  const problems=editor.getByRole('status',{name:'TMT2 team problems'});
  await problems.waitFor();const advisory=await problems.innerText();
  const rejected=await validate(/Your team was rejected/);
  for(const line of ['nosepass: Level must be exactly 50.','nosepass: EVS must all be 0.'])assert(advisory.includes(line)&&rejected.includes(line));
  await page.reload();await editor.waitFor();
  assert.match(await problems.innerText(),/EVS must all be 0/);
  assert.equal(await page.evaluate(()=>PS.rooms['team-tmt2beta'].editor.sets[0].level),100);
  checks.push({check:'invalid raw import rejected consistently and retained on reload',passed:true});
  await select('alpha');await select('beta');await form();await validate(/Your team is valid/);
  await editor.getByRole('button',{name:'Stats',exact:true}).first().click();
  const stats=editor.getByRole('dialog',{name:'TMT2 fixed stats'});assert.match(await stats.innerText(),/IV31.*EV0/);
  assert.equal(await stats.locator('input,select').count(),0);await form();
  for(const [type,names] of [['Grass',['Floragato']],['Magic',['Floragato']],['Cat',['Eevee','Floragato']],['Bird',['Pidgeot','Pidgeotto','Pidgey']],['Crab',['Krabby']]]){
    await editor.locator('input[name=pokemon]').first().click();
    await editor.getByRole('searchbox',{name:/Search species/}).fill(type);
    await editor.getByRole('link',{name:`${type} ${type} Filter`,exact:true}).click();
    const results=await editor.locator('.dexlist:visible').innerText();
    for(const name of names)assert(results.includes(name),`${type} missing ${name}`);
    assert(!results.includes('Mega Pidgeot'));await editor.getByRole('button',{name:type,exact:true}).click();
    await editor.getByRole('button',{name:'Back',exact:true}).click();
    checks.push({check:'native ordered-slot type search without starting mega',type,passed:true});
  }
  await page.screenshot({path:path.join(dir,'native-editor.png'),fullPage:true});
  for(const [i,p] of pages.entries()){
    for(const replay of replays){
      await p.goto(url);
      await p.locator('input[type=file]').setInputFiles({name:`${replay.caseID}.json`,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(replay))});
      const room=p.locator('[id^="room-battle-uploaded-"]').last();await room.waitFor();
      // Native load already seeks to the completed outcome; replay then skip.
      await room.locator('[data-cmd="/play"]').click();
      await room.locator('[data-cmd="/ffto end"]').click();
      assert.match(await room.innerText(),new RegExp(`${replay.log.find(x=>x.startsWith('|win|')).slice(5)} won`,'i'));
      assert.equal(await room.locator('.battle').count(),1);assert.equal(await room.locator('.battle-log').count(),1);
      const types=await p.evaluate(()=>Object.values(PS.rooms).find(r=>r.id.startsWith('battle-uploaded-')).battle.dex.species.get('pidgeot').types);
      assert.deepEqual(types,['Bird','Bird','Bird']);
      await room.locator('[data-cmd="/switchsides"]').click();
      await p.screenshot({path:path.join(dir,`${replay.caseID}-session${i+1}.png`),fullPage:true});
      await p.reload();await room.waitFor();
      assert.equal(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('tmt2-native-replay')).datasetHash),replay.datasetHash);
      checks.push({check:'native completed replay, viewpoint and reload with exact identity',caseID:replay.caseID,session:i+1,passed:true});
    }
    await p.goto(url);
    const bad={...replays[0],datasetHash:'0'.repeat(64)};
    await p.locator('input[type=file]').setInputFiles({name:'drift.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
    await p.getByRole('button',{name:'OK',exact:true}).waitFor();
    assert.equal(await p.locator('[id^="room-battle-uploaded-"]').count(),0);
    await p.getByRole('button',{name:'OK',exact:true}).click();
    checks.push({check:'native replay dataset drift rejected',session:i+1,passed:true});
  }
  assert.deepEqual(blocked,[],'Unexpected non-loopback request: no silent remote fallback');
  assert.deepEqual(errors,[],'Native UI errors/missing resources fail browser CI');
}
try{await run();}catch(error){console.error(error.stack);process.exitCode=1;}
finally{
  for(const context of ownedContexts)try{await context.close();}catch(error){console.error('Context cleanup failed:',error.message);process.exitCode=1;}
  try{if(!externalBrowser)await browser?.close();}catch(error){console.error('Browser cleanup failed:',error.message);process.exitCode=1;}
  if(child){
    if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');
    try{
      assert.equal(await timeout(ended,10000,'dev shutdown timed out'),143);
      assert.equal(fs.existsSync(path.join(root,'.local/operation.lock')),false);
      for(const port of [c.serverPort,c.clientPort])await new Promise((resolve,reject)=>{
        const s=net.createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve));
      });
      assert.equal(require(configFile).noguestsecurity,false);
      assert.deepEqual(fs.readFileSync(configFile),configBefore,'Persistent server config must remain byte-identical');
      checks.push({check:'SIGTERM143, lock/ports released, persistent auth unchanged',passed:true});
    }catch(error){console.error(error.message);if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');process.exitCode=1;}
  }
  report={kind:externalBrowser?'TMT-11 local externally managed browser':'TMT-11 sandbox-required browser runner',passed:!process.exitCode,
    chromiumSandbox:externalBrowser?'external launcher; separate evidence required':true,authException:false,
    liveTwoPlayerChallenge:false,humanReview:false,romOracle:false,checks,errors,blocked,sources:manifest(c)};
  fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}

return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await browserRegression();
