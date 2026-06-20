const STORAGE_KEY = 'studystream:lastResult';

function saveResult(result) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

function loadResult() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function words(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLandingPage() {
  const button = document.querySelector('[data-action="go-upload"]');
  if (button) {
    button.addEventListener('click', () => {
      window.location.href = '/upload';
    });
  }
}

function renderUploadPage() {
  const dropZone = document.querySelector('[data-dropzone]');
  const fileInput = document.querySelector('#pdf-file');
  const fileLabel = document.querySelector('[data-file-label]');
  const uploadForm = document.querySelector('[data-upload-form]');
  const status = document.querySelector('[data-upload-status]');
  const uploadButton = document.querySelector('[data-upload-button]');
  let selectedFile = null;

  const setFile = (file) => {
    selectedFile = file;
    if (fileLabel) {
      fileLabel.textContent = file ? `${file.name} - ${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'No file selected';
    }
    if (uploadButton) {
      uploadButton.disabled = !file;
      uploadButton.textContent = file ? 'Process PDF' : 'Choose a PDF first';
    }
  };

  if (dropZone && fileInput) {
    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropZone.classList.add('is-active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('is-active');
    });

    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropZone.classList.remove('is-active');
      const [file] = event.dataTransfer.files || [];
      if (file) {
        fileInput.files = event.dataTransfer.files;
        setFile(file);
      }
    });

    dropZone.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const [file] = fileInput.files || [];
      if (file) {
        setFile(file);
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!selectedFile) {
        if (status) status.textContent = 'Please choose a PDF first.';
        return;
      }

      const formData = new FormData();
      formData.append('pdf', selectedFile);
      if (uploadButton) {
        uploadButton.disabled = true;
        uploadButton.textContent = 'Processing...';
      }
      if (status) status.textContent = 'Extracting text and ranking sentences...';

      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Upload failed.');
        }

        saveResult({
          fileName: data.fileName,
          pageCount: data.pageCount,
          summary: data.summary,
          keyPoints: data.keyPoints,
          definitions: data.definitions
        });

        window.location.href = '/results';
      } catch (error) {
        if (status) status.textContent = error.message;
        if (uploadButton) {
          uploadButton.disabled = false;
          uploadButton.textContent = 'Process PDF';
        }
      }
    });
  }

  setFile(null);
}

function renderResultsPage() {
  const result = loadResult();
  const fileName = document.querySelector('[data-result-file]');
  const summaryNode = document.querySelector('[data-summary]');
  const keyPointsNode = document.querySelector('[data-keypoints]');
  const definitionsNode = document.querySelector('[data-definitions]');
  const emptyState = document.querySelector('[data-empty-state]');
  const statsNode = document.querySelector('[data-stats]');
  const uploadAnother = document.querySelector('[data-upload-another]');

  if (uploadAnother) {
    uploadAnother.addEventListener('click', () => {
      window.location.href = '/upload';
    });
  }

  if (!result) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (fileName) fileName.textContent = result.fileName || 'Uploaded PDF';
  if (summaryNode) summaryNode.textContent = result.summary || 'No summary generated.';
  if (statsNode) {
    statsNode.innerHTML = [
      { label: 'Summary words', value: words(result.summary || '') },
      { label: 'Key points', value: Array.isArray(result.keyPoints) ? result.keyPoints.length : 0 },
      { label: 'Definitions', value: Array.isArray(result.definitions) ? result.definitions.length : 0 }
    ]
      .map(
        (stat) => `
          <div class="rounded-2xl soft-border bg-white/70 p-4">
            <div class="text-sm text-slate-500 font-medium">${escapeHtml(stat.label)}</div>
            <div class="mt-2 text-2xl font-bold text-slate-900">${escapeHtml(stat.value)}</div>
          </div>
        `
      )
      .join('');
  }

  const renderList = (items, container) => {
    if (!container) return;
    const safeItems = Array.isArray(items) ? items : [];
    if (safeItems.length === 0) {
      container.innerHTML = '<p class="text-slate-500">Nothing matched the rule set for this section.</p>';
      return;
    }

    container.innerHTML = safeItems
      .map(
        (item) => `
          <li class="rounded-2xl soft-border bg-white/80 p-4 leading-7 text-slate-700">
            ${escapeHtml(item)}
          </li>
        `
      )
      .join('');
  };

  renderList(result.keyPoints, keyPointsNode);
  renderList(result.definitions, definitionsNode);
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'landing') renderLandingPage();
  if (page === 'upload') renderUploadPage();
  if (page === 'results') renderResultsPage();
});
