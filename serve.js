const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'content');
const exts = { html:'text/html', js:'application/javascript', css:'text/css', png:'image/png', jpg:'image/jpeg' };
http.createServer((req, res) => {
  const f = path.join(root, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('Not found'); return; }
    const ct = exts[path.extname(f).slice(1)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(d);
  });
}).listen(55178, () => console.log('serving on 55178'));
