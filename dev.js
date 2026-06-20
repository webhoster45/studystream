const http = require('http');
const fs = require('fs');
const path = require('path');
const { processDocument } = require('./server/processDocument');
const pdfParse = require('pdf-parse');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function serveFile(response, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(response);
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function handleProcess(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  const contentType = String(request.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/pdf')) {
    sendJson(response, 400, { error: 'Only PDF files are supported.' });
    return;
  }

  try {
    const buffer = await readRequestBody(request);
    if (!buffer.length) {
      sendJson(response, 400, { error: 'Please upload a PDF file.' });
      return;
    }

    const parsed = await pdfParse(buffer);
    const result = processDocument(parsed.text || '');

    sendJson(response, 200, {
      fileName: String(request.headers['x-file-name'] || 'uploaded.pdf'),
      pageCount: parsed.numpages || 0,
      ...result
    });
  } catch (error) {
    console.error('Local PDF processing failed:', error);
    sendJson(response, 500, { error: 'The PDF could not be processed. Please try another file.' });
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, 'http://localhost');
  const pathname = requestUrl.pathname;

  if (pathname === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'StudyStream' });
    return;
  }

  if (pathname === '/api/process') {
    handleProcess(request, response);
    return;
  }

  if (pathname === '/') {
    serveFile(response, path.join(publicDir, 'index.html'));
    return;
  }

  if (pathname === '/upload') {
    serveFile(response, path.join(publicDir, 'upload.html'));
    return;
  }

  if (pathname === '/results') {
    serveFile(response, path.join(publicDir, 'results.html'));
    return;
  }

  const publicPath = path.join(publicDir, pathname.replace(/^\//, ''));
  if (publicPath.startsWith(publicDir)) {
    serveFile(response, publicPath);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`StudyStream running on http://localhost:${port}`);
});
