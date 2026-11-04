import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupLeads} from '../data/leads.mjs';

test('only explicit research questions produce publisher editorial discovery leads', () => {
  assert.deepEqual(lookupLeads('I am Badgey'), []);
  const matches = lookupLeads('Find sources about Badgey');
  assert.equal(matches.length, 2);
  for (const row of matches) {
    assert.equal(row.status, 'DISCOVERED');
    assert.match(row.source_url, /^https:\/\/www\.startrek\.com\//);
    assert.ok(!('terms' in row));
  }
});

test('unrelated questions do not fabricate discovery results', () => {
  assert.deepEqual(lookupLeads('Tell me about an imaginary episode title'), []);
});
