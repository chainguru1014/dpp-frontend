// Minimal CSV parser for single-column identifier imports (RFID EPCs, NFC
// tag IDs, etc.), with an optional "note" column and an optional header
// row. Not a general-purpose CSV parser (no embedded-comma/quoted-newline
// support) — the values handled here never legitimately contain a comma, so
// this avoids pulling in a full CSV library for a one-field import.
const HEADER_VALUE_NAMES = ['raw_value', 'rawvalue', 'epc', 'tag', 'value'];
const HEADER_NOTE_NAMES = ['note', 'notes'];

const splitRow = (line) => line.split(',').map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'));

export const parseIdentifierCsv = (text) => {
  const lines = String(text || '')
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const firstRow = splitRow(lines[0]);
  const lowerFirstRow = firstRow.map((cell) => cell.toLowerCase());
  const looksLikeHeader = lowerFirstRow.some((cell) => HEADER_VALUE_NAMES.includes(cell));

  let valueIndex = 0;
  let noteIndex = -1;
  let dataLines = lines;

  if (looksLikeHeader) {
    valueIndex = lowerFirstRow.findIndex((cell) => HEADER_VALUE_NAMES.includes(cell));
    noteIndex = lowerFirstRow.findIndex((cell) => HEADER_NOTE_NAMES.includes(cell));
    dataLines = lines.slice(1);
  }

  return dataLines
    .map((line) => {
      const cells = splitRow(line);
      return {
        raw_value: (cells[valueIndex] || '').trim(),
        note: noteIndex >= 0 ? (cells[noteIndex] || '').trim() : '',
      };
    })
    .filter((row) => row.raw_value);
};
