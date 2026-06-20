const STOPWORDS = new Set([
  'a', 'about', 'after', 'again', 'against', 'all', 'also', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'between', 'but', 'by', 'can', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'had', 'has',
  'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i', 'if', 'in', 'into',
  'is', 'it', 'its', 'itself', 'just', 'may', 'me', 'more', 'most', 'my', 'no', 'not', 'of',
  'on', 'once', 'one', 'only', 'or', 'our', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will',
  'with', 'within', 'without', 'would', 'you', 'your'
]);

const STRUCTURE_KEYWORDS = [
  'definition',
  'means',
  'refers to',
  'is',
  'are',
  'types',
  'causes',
  'example',
  'objective',
  'purpose',
  'benefit',
  'results',
  'conclusion',
  'summary',
  'introduction',
  'method',
  'methods',
  'process',
  'steps',
  'features',
  'importance',
  'advantages',
  'disadvantages'
];

const DEFINITION_PATTERNS = [
  /\bmeans\b/i,
  /\brefers to\b/i,
  /\bis defined as\b/i,
  /\bare defined as\b/i,
  /\bdefinition\b/i,
  /\bdefined as\b/i,
  /\bis a\b/i,
  /\bis an\b/i,
  /\bare a\b/i,
  /\bare an\b/i
];

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[\u2022•]/g, '\n- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/^[\s\-*\u2022\d.)]+/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && !STOPWORDS.has(word) && word.length > 2);
}

function isBulletLine(line) {
  return /^(\s*[-*\u2022]|\s*\d+[.)]|\s*[a-zA-Z][.)])\s+/.test(line);
}

function stripBulletPrefix(line) {
  return line.replace(/^(\s*[-*\u2022]|\s*\d+[.)]|\s*[a-zA-Z][.)])\s+/, '').trim();
}

function splitSentences(text) {
  const matches = String(text || '').match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return (matches || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .map((sentence) => sentence.replace(/\s+/g, ' '));
}

function isHeading(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  if (trimmed.length > 120) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 12) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  const letters = words.filter((word) => /[a-z]/i.test(word));
  if (letters.length === 0) return false;
  const mostlyTitleCase = letters.filter((word) => /^[A-Z]/.test(word)).length / letters.length >= 0.6;
  const mostlyCaps = letters.filter((word) => word === word.toUpperCase()).length / letters.length >= 0.6;
  return mostlyTitleCase || mostlyCaps;
}

function isLikelyMetadata(text) {
  const value = String(text || '').trim();
  const wordCount = countWords(value);
  return /^(dear sir|dear madam|yours faithfully|yours sincerely|regards|submitted on)$/i.test(value)
    || /\b(campus lead|phone|tel|email|faculty|department|course|level|lecturer|date|time|attendance)\b/i.test(value)
    || /\b(university|college|school|chapter|campus|address|venue)\b/i.test(value) && wordCount <= 8
    || /^\d{2}\/\d{2}\/\d{4}$/.test(value)
    || /^[\d\s+\-()]{8,}$/.test(value)
    || /^[A-Z\s]{2,}$/.test(value) && value.length < 80;
}

function isBoldLike(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  const stripped = value.replace(/[”"'`)]+$/g, '');
  if (stripped.length > 90) return false;
  if (/[.!?]$/.test(stripped)) return false;
  if (stripped.endsWith(':')) return true;

  const wordCount = countWords(stripped);
  if (wordCount > 8) return false;

  const letters = stripped.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  if (letters.length === 0) return false;

  const titleCase = letters.filter((word) => /^[A-Z]/.test(word)).length / letters.length >= 0.7;
  const allCaps = letters.filter((word) => word === word.toUpperCase()).length / letters.length >= 0.7;
  const shortLabel = wordCount <= 4 && /^[A-Z][A-Za-z0-9\s&/-]*$/.test(stripped);
  return titleCase || allCaps || shortLabel;
}

function isSectionLabel(text) {
  const value = String(text || '').trim().toLowerCase();
  return /:$/.test(value)
    || /\b(details?|summary|overview|introduction|conclusion|objectives?|purpose|methods?|results?|features?|key points?|definitions?|background|impact|benefits?|importance|event details)\b/.test(value);
}

function extractCandidates(rawText) {
  const text = normalizeWhitespace(rawText);
  const lines = text.split('\n').map((line) => line.trim());
  const candidates = [];
  let paragraphBuffer = [];
  let index = 0;

  const pushCandidate = (candidateText, options = {}) => {
    const normalized = String(candidateText || '').trim();
    if (!normalized || normalized.length < 3) return;
    candidates.push({
      index: index++,
      text: normalized,
      bullet: Boolean(options.bullet),
      source: options.source || 'paragraph'
    });
  };

  const flushParagraph = () => {
    const paragraph = paragraphBuffer.join(' ').replace(/\s+/g, ' ').trim();
    paragraphBuffer = [];
    if (!paragraph) return;

    for (const sentence of splitSentences(paragraph)) {
      pushCandidate(sentence, { source: 'paragraph' });
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line) {
      flushParagraph();
      continue;
    }

    const nextLine = lines[lineIndex + 1] || '';
    if (isHeading(line) && isHeading(nextLine) && !/[.!?]$/.test(line) && !/[.!?]$/.test(nextLine)) {
      pushCandidate(`${line} ${nextLine}`, { source: 'heading' });
    }

    if (isBulletLine(line)) {
      flushParagraph();
      pushCandidate(stripBulletPrefix(line), { bullet: true, source: 'bullet' });
      continue;
    }

    if (isHeading(line)) {
      flushParagraph();
      pushCandidate(line, { source: 'heading' });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return candidates.filter((candidate) => candidate.text.length > 0);
}

function buildTermFrequency(candidates) {
  const frequencyMap = new Map();
  for (const candidate of candidates) {
    for (const token of tokenize(candidate.text)) {
      frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
    }
  }
  return frequencyMap;
}

function buildSalientTerms(frequencyMap) {
  return [...frequencyMap.entries()]
    .filter(([, frequency]) => frequency >= 2)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([term]) => term);
}

function scoreCandidate(candidate, termFrequency, salientTerms) {
  const lowerText = candidate.text.toLowerCase();
  const wordCount = countWords(candidate.text);
  const candidateTerms = new Set(tokenize(candidate.text));
  let score = 0;

  if (candidate.bullet) score += 3;
  if (candidate.source === 'heading') score += 2;
  if (wordCount >= 6 && wordCount <= 22) score += 1;
  if (wordCount > 24) score -= 1;
  if (isLikelyMetadata(candidate.text)) score -= 5;

  let overlap = 0;
  for (const term of salientTerms) {
    if (candidateTerms.has(term)) {
      overlap += 1;
    }
  }
  score += Math.min(4, overlap);

  for (const keyword of STRUCTURE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      score += 1;
    }
  }

  const localFrequency = [...candidateTerms].reduce((total, term) => total + (termFrequency.get(term) || 0), 0);
  if (localFrequency > 0) {
    score += Math.min(2, Math.floor(localFrequency / 4));
  }

  if (candidate.text.includes(':')) {
    score += 1;
  }

  if (/^\s*\d+[.)]/.test(candidate.text)) {
    score += 1;
  }

  const isDefinition = DEFINITION_PATTERNS.some((pattern) => pattern.test(lowerText));
  if (isDefinition) {
    score += 2;
  }

  return {
    ...candidate,
    score,
    wordCount,
    isDefinition,
    isBoldLike: isBoldLike(candidate.text)
  };
}

function uniqueByText(items) {
  const seen = new Set();
  const uniqueItems = [];

  for (const item of items) {
    const key = normalizeKey(item.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function jaccardSimilarity(leftText, rightText) {
  const leftTerms = new Set(tokenize(leftText));
  const rightTerms = new Set(tokenize(rightText));
  if (leftTerms.size === 0 || rightTerms.size === 0) return 0;

  let intersection = 0;
  for (const term of leftTerms) {
    if (rightTerms.has(term)) {
      intersection += 1;
    }
  }

  const union = new Set([...leftTerms, ...rightTerms]).size;
  return union === 0 ? 0 : intersection / union;
}

function dedupeBySimilarity(items, threshold = 0.72) {
  const selected = [];

  for (const item of items) {
    const isTooSimilar = selected.some((existing) => {
      const shortText = item.text.length <= existing.text.length ? item.text : existing.text;
      const longText = item.text.length > existing.text.length ? item.text : existing.text;
      return jaccardSimilarity(shortText, longText) >= threshold || longText.includes(shortText);
    });

    if (!isTooSimilar) {
      selected.push(item);
    }
  }

  return selected;
}

function trimTrailingFragments(text) {
  return String(text || '')
    .replace(/\s+[A-Za-z]{1,3}$/, '')
    .trim();
}

function truncateWords(text, maxWords) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return trimTrailingFragments(text);
  }
  return trimTrailingFragments(`${words.slice(0, maxWords).join(' ')}...`);
}

function buildSummary(scoredCandidates, originalText) {
  const topCandidates = dedupeBySimilarity(
    uniqueByText(
    scoredCandidates
      .filter((candidate) => candidate.score > 0 && !candidate.isDefinition && !isLikelyMetadata(candidate.text) && candidate.wordCount >= 8 && candidate.source !== 'heading')
      .sort((left, right) => right.score - left.score || left.index - right.index)
    )
  ).slice(0, 5);

  if (topCandidates.length > 0) {
    const ordered = topCandidates.sort((left, right) => left.index - right.index);
    const summaryParts = [];
    let wordTotal = 0;

    for (const candidate of ordered) {
      const candidateWords = countWords(candidate.text);
      if (summaryParts.length > 0 && wordTotal + candidateWords > 45) {
        break;
      }

      summaryParts.push(candidate.text);
      wordTotal += candidateWords;
    }

    const summaryText = summaryParts.join(' ');
    if (summaryText) {
      return truncateWords(summaryText, 45);
    }
  }

  const fallbackSentences = splitSentences(normalizeWhitespace(originalText)).slice(0, 3);
  return truncateWords(fallbackSentences.join(' ') || originalText.replace(/\s+/g, ' ').trim(), 45);
}

function buildKeyPoints(scoredCandidates) {
  return dedupeBySimilarity(
    uniqueByText(
    scoredCandidates
      .filter((candidate) => candidate.score >= 3 && !isLikelyMetadata(candidate.text) && candidate.wordCount >= 4)
      .sort((left, right) => right.score - left.score || left.index - right.index)
    )
  )
    .slice(0, 8)
    .sort((left, right) => left.index - right.index)
    .map((candidate) => candidate.text);
}

function buildDefinitions(scoredCandidates) {
  const ordered = scoredCandidates
    .sort((left, right) => left.index - right.index);
  const usable = ordered
    .filter((candidate) => !isLikelyMetadata(candidate.text))
    .sort((left, right) => left.index - right.index);

  const generatedDefinitions = [];

  const summarizeNearbyLabels = (candidate) => {
    const nearbyLabels = ordered
      .filter((item) => item.index > candidate.index && item.index - candidate.index <= 4 && countWords(item.text) <= 8)
      .slice(0, 3)
      .map((item) => item.text.replace(/[:\s]+$/, '').replace(/\s*[:\-–—].*$/, '').trim())
      .filter(Boolean);

    if (nearbyLabels.length === 0) {
      return '';
    }

    if (nearbyLabels.length === 1) {
      return `${nearbyLabels[0]} details`;
    }

    if (nearbyLabels.length === 2) {
      return `${nearbyLabels[0]} and ${nearbyLabels[1]} details`;
    }

    return `${nearbyLabels[0]}, ${nearbyLabels[1]}, and ${nearbyLabels[2]} details`;
  };

  for (const candidate of usable) {
    if (!(candidate.isBoldLike && isSectionLabel(candidate.text))) {
      continue;
    }

    const label = candidate.text.replace(/[:\s]+$/, '').trim();
    if (!label) continue;

    if (isLikelyMetadata(label)) {
      continue;
    }

    let explanation = '';
    const nearbySummary = summarizeNearbyLabels(candidate);
    if (nearbySummary) {
      explanation = nearbySummary;
    }

    if (!explanation) {
      explanation = 'short concept or section label';
    }

    generatedDefinitions.push({
      index: candidate.index,
      text: `${label}: ${truncateWords(explanation, 14)}`
    });
  }

  return dedupeBySimilarity(
    uniqueByText(generatedDefinitions)
  )
    .slice(0, 8)
    .sort((left, right) => left.index - right.index)
    .map((candidate) => candidate.text);
}

function processDocument(rawText) {
  const candidates = extractCandidates(rawText);

  if (candidates.length === 0) {
    return {
      summary: 'No readable text was extracted from the uploaded PDF.',
      keyPoints: [],
      definitions: []
    };
  }

  const termFrequency = buildTermFrequency(candidates);
  const salientTerms = buildSalientTerms(termFrequency);
  const scoredCandidates = candidates.map((candidate) => scoreCandidate(candidate, termFrequency, salientTerms));

  return {
    summary: buildSummary(scoredCandidates, rawText),
    keyPoints: buildKeyPoints(scoredCandidates),
    definitions: buildDefinitions(scoredCandidates)
  };
}

module.exports = {
  processDocument,
  splitSentences,
  normalizeWhitespace,
  normalizeKey
};
