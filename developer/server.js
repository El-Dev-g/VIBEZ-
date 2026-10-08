import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3002;
const DIST_DIR = path.join(__dirname, 'dist');
const BACKEND_URL = process.env.VITE_BACKEND_URL || process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://vibez-server.onrender.com';

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqUrl = req.url.split('?')[0];

  // Proxy API requests to backend server directly
  if (reqUrl.startsWith('/api/')) {
    try {
      const cleanBackend = BACKEND_URL.replace(/\/+$/, '').replace(/\/api$/, '');
      const targetUrl = new URL(req.url, cleanBackend);
      const clientReq = (targetUrl.protocol === 'https:' ? https : http).request(
        targetUrl,
        {
          method: req.method,
          headers: {
            ...req.headers,
            host: targetUrl.host,
          },
        },
        (backendRes) => {
          res.writeHead(backendRes.statusCode, backendRes.headers);
          backendRes.pipe(res);
        }
      );

      clientReq.on('error', (err) => {
        console.error('Developer API Proxy Error:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend server unreachable', details: err.message }));
      });

      req.pipe(clientReq);
      return;
    } catch (err) {
      console.error('Developer API Proxy Parse Error:', err.message);
    }
  }

  let filePath = path.join(DIST_DIR, reqUrl);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(filePath, res);
    } else {
      // Fallback to SPA index.html for client-side routing
      const indexPath = path.join(DIST_DIR, 'index.html');
      serveFile(indexPath, res);
    }
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VIBEZ Developer Server listening on port ${PORT}`);
});
