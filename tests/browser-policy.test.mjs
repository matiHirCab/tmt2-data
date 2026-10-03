import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowedRequest,launchOptions} from '../tools/regression/browser-policy.mjs';
const c={clientPort:8080,serverPort:8000};
test('browser network policy permits only exact local services',()=>{
  for(const u of ['http://127.0.0.1:8080/testclient-new.html','http://localhost:8000/showdown/info','ws://localhost:8000/showdown/websocket'])assert.equal(allowedRequest(u,c),true,u);
  for(const u of ['https://play.pokemonshowdown.com','http://127.0.0.1.evil.test:8080','http://u:p@localhost:8080','http://localhost:8081','ws://localhost:8080','file:///etc/passwd','data:text/html,x','javascript:alert(1)','not a URL'])assert.equal(allowedRequest(u,c),false,u);
});
test('browser launch always requires sandbox, independent of CI/env flags',()=>{
  for(const env of [{},{CI:'true',TMT2_NO_SANDBOX:'1'},{TMT2_BROWSER_EXECUTABLE:'/configured/browser'}]){
    const o=launchOptions(env);assert.equal(o.chromiumSandbox,true);assert.equal(o.args,undefined);
  }
});
