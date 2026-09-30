// Override only the in-memory local config; never edit a user's config file.
const path = require('node:path');
const root = process.cwd();
const config = require(path.join(root, 'config/config.js'));
config.bindaddress = '127.0.0.1';
config.port = Number(process.argv[2]);
config.ssl = null;
config.watchconfig = false;
require(path.join(root, 'dist/server/index.js'));
