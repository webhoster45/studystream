# StudyStream

StudyStream is a lightweight full-stack app that turns academic PDF files into structured revision notes using deterministic text processing.

## What it does

- Uploads a PDF in the browser
- Extracts text with `pdf-parse`
- Processes the text with rule-based heuristics
- Returns:
  - a short summary
  - ranked key points
  - short definitions or label-based explanations

## Tech Stack

- Frontend: HTML, Tailwind CSS, vanilla JavaScript
- Backend: Vercel serverless functions
- Text extraction: `pdf-parse`

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```
3. Open:
   - `http://localhost:3000/`

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repository into Vercel.
3. Keep the default framework choice or select `Other`.
4. Deploy the `main` branch.
5. Vercel will serve:
   - the landing page at `/`
   - the upload page at `/upload`
   - the results page at `/results`

The included `vercel.json` handles the clean URLs for those screens.

## API

### `POST /api/process`

Send the raw PDF file as the request body with `Content-Type: application/pdf`.

Response shape:

```json
{
  "fileName": "lecture.pdf",
  "pageCount": 12,
  "summary": "Short cleaned version of the PDF",
  "keyPoints": ["Point 1", "Point 2"],
  "definitions": ["Label: short explanation"]
}
```

### `GET /api/health`

Returns a basic health check payload.

## Notes

- Files are processed in memory only.
- No database is used.
- No AI or LLM APIs are used.
- Uploads are PDF-only for now.

## Project Structure

```text
api/
  health.js
  process.js
public/
  app.js
  index.html
  results.html
  styles.css
  upload.html
server/
  processDocument.js
vercel.json
```
