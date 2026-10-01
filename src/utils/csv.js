// CSV reading and writing for spreadsheet import/export. Handles what Excel
// and Google Sheets actually produce: quoted cells, commas and line breaks
// inside quotes, doubled quotes, a leading byte-order mark, and semicolon
// separators (Excel's default in many European locales).

// Text -> array of rows, each an array of cell strings. Blank rows are dropped.
export const parseCsv = (input) => {
  const text = String(input || '').replace(/^﻿/, '');
  // Whichever of , and ; appears more often in the header row is the separator.
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] || '';
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
};

const escapeCell = (value) => {
  const text = String(value ?? '');
  return /[",;\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Array of rows -> CSV text.
export const toCsv = (rows) => rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');

// Saves text as a .csv download. The byte-order mark makes Excel read
// accented and Japanese characters correctly.
export const downloadCsv = (filename, rows) => {
  const blob = new Blob([`﻿${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
