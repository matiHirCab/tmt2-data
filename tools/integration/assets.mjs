import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {config,preflight,git,lockWorkspace} from '../workspace/core.mjs';
import {assertGenerated} from './cli.mjs';
const c=config();preflight(c);assertGenerated(c);
const release=lockWorkspace();
try {
 execFileSync(process.execPath,[path.join(c.client,'build-tools/build-indexes'),'--server',c.server,'--commit',git(c.server,'rev-parse','HEAD')],{cwd:c.client,stdio:'inherit'});
 execFileSync(process.execPath,[path.join(c.client,'build-tools/build-tmt2')],{cwd:c.client,stdio:'inherit'});
}finally{release();}
