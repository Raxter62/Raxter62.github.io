import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Local static preview only; this is not a production server.
const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex < 0 ? 4173 : Number(args[portIndex + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port.');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const server = createServer(async (request, response) => {
  const send = (status, content, type = 'text/plain; charset=utf-8') => {
    response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  };
  if (!['GET', 'HEAD'].includes(request.method)) return send(405, 'Method not allowed');
  let relative;
  try {
    relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html';
  } catch { return send(400, 'Bad request'); }
  // Keep old local preview tabs working after merging Projects into the home page.
  if (relative === 'projects.html') {
    response.writeHead(302, { Location: '/#projects', 'Cache-Control': 'no-store' });
    return response.end();
  }
  if (!/^(index\.html|(?:css|js|assets)\/[^\\]+)$/.test(relative) || relative.split('/').some(part => part.startsWith('.'))) {
    return send(404, 'Not found');
  }
  try {
    const filename = await realpath(path.resolve(root, relative));
    if (!filename.startsWith(`${root}${path.sep}`)) return send(403, 'Forbidden');
    send(200, await readFile(filename), mime[path.extname(filename)] || 'application/octet-stream');
  } catch (error) {
    send(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500, 'Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}/`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
