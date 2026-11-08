const ADMISSION_RE = /^[A-Z]{2,10}\/\d{1,4}\/\d{2,4}$/;

function normalizeAdmission(raw) {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\/\-\s]+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

function isValidAdmission(raw) {
  const normalized = normalizeAdmission(raw);
  if (!ADMISSION_RE.test(normalized)) return false;

  const [, number, year] = normalized.split('/');
  const numeric = Number(number);
  if (!Number.isInteger(numeric) || numeric < 1) return false;

  const yearNumber = Number(year);
  if (year.length === 2) return yearNumber >= 0 && yearNumber <= 99;
  if (year.length === 4) return yearNumber >= 2000 && yearNumber <= 2100;
  return false;
}

function canonicalizeAdmission(raw) {
  if (!isValidAdmission(raw)) return null;
  const [program, number, year] = normalizeAdmission(raw).split('/');
  const normalizedYear = year.length === 2 ? `20${year}` : year;
  return `${program}/${Number(number)}/${normalizedYear}`;
}

module.exports = {
  ADMISSION_RE,
  normalizeAdmission,
  isValidAdmission,
  canonicalizeAdmission,
};
