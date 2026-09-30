import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readSeed} from './validate.mjs';
try {
 const args=process.argv.slice(2);
 if(args.length>1)throw Error('Usage: data/cli.mjs [dataset.json]');
 const file=args[0]??fileURLToPath(new URL('../../normalized/seed.json',import.meta.url));
 const result=readSeed(path.resolve(file));console.log(JSON.stringify(result,null,2));
 if(!result.valid)process.exitCode=1;
} catch(e){console.error(`[seed] ${e.message}`);process.exitCode=1;}
