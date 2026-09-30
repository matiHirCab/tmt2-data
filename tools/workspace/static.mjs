import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
const root = await fs.realpath(process.argv[2]);
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.woff2': 'font/woff2'};
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.split('/').some(p => p.startsWith('.')) || /\.(php|map)$/i.test(pathname)) throw Error('source file');
    const file = await fs.realpath(path.join(root, pathname === '/' ? 'testclient-new.html' : pathname));
    if (!file.startsWith(root + path.sep)) throw Error('outside root');
    const relative = path.relative(root, file);
    if (relative.split(path.sep).some(p => p.startsWith('.')) || /\.(php|map)$/i.test(file)) throw Error('source file');
    const bytes = await fs.readFile(file);
    res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(Number(process.argv[3]), '127.0.0.1', () => console.log(`[workspace] client HTTP listening on ${server.address().port}`));
