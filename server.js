const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  // Polyfill Express/Vercel helper methods on res
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    if (!this.getHeader('Content-Type')) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    this.end(JSON.stringify(data));
    return this;
  };

  let reqUrl = req.url.split('?')[0];

  // Route API requests to Vercel Serverless Function handlers in /api/
  if (reqUrl.startsWith('/api/')) {
    const apiName = reqUrl.replace('/api/', '').replace(/\.js$/, '');
    const apiFilePath = path.join(__dirname, 'api', `${apiName}.js`);

    if (fs.existsSync(apiFilePath)) {
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', async () => {
        req.body = bodyData;
        try {
          // Clear require cache for hot-reload in dev
          delete require.cache[require.resolve(apiFilePath)];
          const handler = require(apiFilePath);
          await handler(req, res);
        } catch (err) {
          console.error(`[API Error] ${reqUrl}:`, err);
          res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
      });
      return;
    }
  }

  let filePath;
  if (reqUrl === '/' || reqUrl === '') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  } else if (reqUrl === '/admin') {
    filePath = path.join(PUBLIC_DIR, 'admin.html');
  } else if (reqUrl === '/orcamento') {
    filePath = path.join(PUBLIC_DIR, 'orcamento.html');
  } else {
    filePath = path.join(PUBLIC_DIR, reqUrl);
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n==========================================================`);
  console.log(`🚀 ZUTERE AUDIOVISUAL - SERVIDOR LOCAL RODANDO!`);
  console.log(`   URL Principal: http://127.0.0.1:${PORT}/`);
  console.log(`   Painel Admin:  http://127.0.0.1:${PORT}/admin`);
  console.log(`   Orçamentos:    http://127.0.0.1:${PORT}/orcamento`);
  console.log(`==========================================================\n`);
});

