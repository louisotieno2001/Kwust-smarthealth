const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidAdmission,
  canonicalizeAdmission,
  normalizeAdmission,
} = require('../src/lib/admission');

test('accepts the expected admission number structure and variations', () => {
  const valid = [
    'BBIT/45/26',
    'BBIT/045/2026',
    'bbit-45-26',
    'BBIT 45 26',
    'KCS/063/24',
    'BCOM/7/2025',
    'BBIT / 45 / 2026',
    'bbit//45//26',
  ];
  for (const value of valid) {
    assert.equal(isValidAdmission(value), true, `${value} should be valid`);
  }
});

test('rejects malformed admission numbers', () => {
  const invalid = ['45/26', 'BBIT/45', 'BBIT/45/26/01', 'STUDENT', 'bbit@kwust.ac.ke', 'BBIT/ABCD/26', 'BBIT/0/26', '', null];
  for (const value of invalid) {
    assert.equal(isValidAdmission(value), false, `${value} should be invalid`);
  }
});

test('normalizes separators and case', () => {
  assert.equal(normalizeAdmission(' bbit-45-26 '), 'BBIT/45/26');
  assert.equal(normalizeAdmission('BBIT 45 26'), 'BBIT/45/26');
  assert.equal(normalizeAdmission('BBIT//45//2026'), 'BBIT/45/2026');
});

test('canonicalizes admission number variations to one value', () => {
  const expected = 'BBIT/45/2026';
  assert.equal(canonicalizeAdmission('BBIT/45/26'), expected);
  assert.equal(canonicalizeAdmission('bbit-045-2026'), expected);
  assert.equal(canonicalizeAdmission('BBIT 45 26'), expected);
  assert.equal(canonicalizeAdmission('BBIT / 045 / 2026'), expected);
  assert.equal(canonicalizeAdmission('KCS/063/24'), 'KCS/63/2024');
  assert.equal(canonicalizeAdmission('not-an-admission'), null);
});
