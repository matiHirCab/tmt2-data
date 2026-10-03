// Verify the captured, completed live battle without enabling local guest names again.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),require=createRequire(path.join(root,'package.json'));
const {chromium}=require('playwright');
const {config,git}=await import(pathToFileURL(path.join(root,'tools/workspace/core.mjs')));
const {allowedRequest,launchOptions}=await import(pathToFileURL(path.join(root,'tools/regression/browser-policy.mjs')));
const {browserRegression}=await import(pathToFileURL(path.join(root,'tools/regression/browser.mjs')));
const c=config(),dir=path.join(root,'.local/evidence/live-challenge-final-sprites');fs.mkdirSync(dir,{recursive:true});
const replay=JSON.parse(fs.readFileSync(path.join(root,'.local/live-proof/live-completed-replay.json'),'utf8'));
const errors=[],blocked=[],checks=[];
let browser;
try{
 assert.equal(process.env.TMT2_LOCAL_GUESTS,'0');
 assert.equal(git(c.data,'rev-parse','HEAD'),'b186cc1d67da28785e1c347a2c73e7fe1625fd2c');
 assert.equal(git(c.client,'rev-parse','HEAD'),'75a5cdef759cb30f391ebf7e9dfe6e3384f6c931');
 assert(replay.log.includes('|win|SpriteBeta'),'Captured actual terminal result required');
 browser=await chromium.launch(launchOptions());
 const regression=await browserRegression({browser,onNativeReady:async url=>{
  for(let i=0;i<2;i++){
   const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
   try{
    await context.route('**/*',async route=>{if(allowedRequest(route.request().url(),c))await route.continue();else{blocked.push(route.request().url());await route.abort();}});
    await context.routeWebSocket('**/*',ws=>{if(allowedRequest(ws.url(),c))ws.connectToServer();else{blocked.push(ws.url());ws.close();}});
    const page=await context.newPage();page.setDefaultTimeout(20000);
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`);});
    await page.goto(url);await page.waitForFunction(()=>typeof PS!=='undefined'&&PS.connection.connected);
    assert.equal(await page.evaluate(()=>PS.user.named),false,'No renewed name exception');
    await page.locator('input[type="file"]').setInputFiles({name:'actual-live-battle.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(replay))});
    const room=page.locator('[id^="room-battle-uploaded-"]').last();await room.waitFor();
    await room.locator('[data-cmd="/play"]').click();await room.locator('[data-cmd="/ffto end"]').click();
    assert.match(await room.innerText(),/SpriteBeta won/);
    assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('tmt2-native-replay')).datasetHash),replay.datasetHash);
    await room.locator('[data-cmd="/switchsides"]').click();
    await page.screenshot({path:path.join(dir,`actual-live-replay-session${i+1}.png`),fullPage:true});
    await page.reload();await room.waitFor();assert.match(await room.innerText(),/SpriteBeta won/);
    checks.push({check:'actual turn22 live replay imported, played/skipped, viewpoint and reload',session:i+1,datasetHash:replay.datasetHash,passed:true});
   }finally{await context.close();}
  }
 }});
 assert(regression.passed);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
 checks.push({check:'existing23 native sprite/editor/replay checks and auth-disabled cleanup',passed:true});
}catch(error){errors.push(error.message);console.error(error.stack);process.exitCode=1;}
finally{
 await browser?.close();
 const report={passed:!process.exitCode,authException:false,chromiumSandbox:true,originalLiveRun:37151791118,checks,errors,blocked};
 fs.writeFileSync(path.join(dir,'actual-replay-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
