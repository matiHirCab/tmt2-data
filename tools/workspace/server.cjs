// Override only the in-memory local config; never edit a user's config file.
const path = require('node:path');
const root = process.cwd();
const config = require(path.join(root, 'config/config.js'));
config.bindaddress = '127.0.0.1';
config.port = Number(process.argv[2]);
config.ssl = null;
config.watchconfig = false;
if (process.argv[3] === '--local-guests') {
  if (config.bindaddress !== '127.0.0.1') throw Error('Local guests require verified loopback binding');
  config.noguestsecurity = true;
  console.warn('[workspace] Temporary unsigned local names enabled on 127.0.0.1 only; no extra authority');
} else if (process.argv[3]) {
  throw Error('Unsupported local server option');
}
require(path.join(root, 'dist/server/index.js'));
