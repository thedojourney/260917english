import type { NewWordInput } from '../types';

// Parses a simple CSV of english,meaning,example,tags(|-separated).
// Header row (if present, detected by non-matching first cell "english") is skipped.
export function parseWordsCSV(csv: string): NewWordInput[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const rows = lines.map(splitCSVLine);
  const first = rows[0].map((c) => c.trim().toLowerCase());
  const hasHeader = first[0] === 'english' || first[0] === 'word';
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .filter((cols) => cols[0]?.trim())
    .map((cols) => ({
      english: cols[0]?.trim() ?? '',
      meaning: cols[1]?.trim() ?? '',
      example: cols[2]?.trim() || undefined,
      tags: cols[3]
        ?.split('|')
        .map((t) => t.trim())
        .filter(Boolean),
    }));
}

function splitCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cols.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cols.push(current);
  return cols;
}
