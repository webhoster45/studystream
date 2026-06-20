const pdfParse = require('pdf-parse');
const { processDocument } = require('../server/processDocument');

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

module.exports = async (request, response) => {
  try {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed.' });
    }

    const fileName = String(request.query.filename || request.headers['x-file-name'] || 'uploaded.pdf');
    const contentType = String(request.headers['content-type'] || '').toLowerCase();

    if (!contentType.includes('application/pdf')) {
      return response.status(400).json({ error: 'Only PDF files are supported.' });
    }

    const buffer = await readRequestBody(request);
    if (!buffer || buffer.length === 0) {
      return response.status(400).json({ error: 'Please upload a PDF file.' });
    }

    const parsed = await pdfParse(buffer);
    const processed = processDocument(parsed.text || '');

    return response.status(200).json({
      fileName,
      pageCount: parsed.numpages || 0,
      ...processed
    });
  } catch (error) {
    console.error('PDF processing failed:', error);
    return response.status(500).json({
      error: 'The PDF could not be processed. Please try another file.'
    });
  }
};
