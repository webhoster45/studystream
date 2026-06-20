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
- Backend: Node.js, Express
- PDF upload: `multer`
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

## Deploy to Render

1. Push this repo to GitHub.
2. Go to Render and create a new `Web Service`.
3. Connect the `webhoster45/studystream` repo.
4. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
5. Deploy from the `main` branch.

If you connect Render to this repo, the included `render.yaml` can also be used as the blueprint.

## API

### `POST /api/process`

Upload a PDF using the `pdf` form field.

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
public/
  app.js
  index.html
  results.html
  styles.css
  upload.html
server/
  index.js
  processDocument.js
```
