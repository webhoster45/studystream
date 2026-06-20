const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const { processDocument } = require('./processDocument');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

app.use(express.static(publicDir));
app.use(express.static(rootDir));

app.get('/', (_request, response) => {
  response.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/upload', (_request, response) => {
  response.sendFile(path.join(publicDir, 'upload.html'));
});

app.get('/results', (_request, response) => {
  response.sendFile(path.join(publicDir, 'results.html'));
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'StudyStream' });
});

app.post('/api/process', upload.single('pdf'), async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: 'Please upload a PDF file.' });
    }

    if (request.file.mimetype !== 'application/pdf') {
      return response.status(400).json({ error: 'Only PDF files are supported.' });
    }

    const parsed = await pdfParse(request.file.buffer);
    const processed = processDocument(parsed.text || '');

    response.json({
      fileName: request.file.originalname,
      pageCount: parsed.numpages || 0,
      ...processed
    });
  } catch (error) {
    console.error('PDF processing failed:', error);
    response.status(500).json({
      error: 'The PDF could not be processed. Please try another file.'
    });
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    return response.status(400).json({ error: error.message });
  }

  console.error('Unexpected server error:', error);
  response.status(500).json({ error: 'Unexpected server error.' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`StudyStream running on http://localhost:${port}`);
});
