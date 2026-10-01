import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../tools/workspace/server.cjs',import.meta.url),'utf8');
function launch(option) {
 const config={noguestsecurity:false,nothrottle:false,noipchecks:false};
 let started=false;
 vm.runInNewContext(code,{process:{cwd:()=>'/virtual',argv:['node','server.cjs','8000',...(option?[option]:[])]},console:{warn(){}},require(name){
  if(name==='node:path')return {join:(...parts)=>parts.join('/')};
  if(name.endsWith('/config/config.js'))return config;
  if(name.endsWith('/dist/server/index.js')){assert.equal(config.bindaddress,'127.0.0.1');started=true;return {};}
  throw Error('Unexpected require');
 }});
 return {config,started};
}
test('unsigned local names require explicit opt-in after loopback bind; other security remains unchanged',()=>{
 const ordinary=launch();assert.equal(ordinary.config.noguestsecurity,false);
 const local=launch('--local-guests');assert.equal(local.started,true);assert.equal(local.config.noguestsecurity,true);
 assert.equal(local.config.nothrottle,false);assert.equal(local.config.noipchecks,false);
 assert.equal(local.config.bindaddress,'127.0.0.1');
});
test('local guest launcher rejects unsupported flags instead of broadening security',()=>{
 assert.throws(()=>launch('--no-security'),/Unsupported/);
});
