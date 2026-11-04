import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.mjs', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');

test('UI offers visible tokenless fictional character chat and explicit limits', () => {
  assert.match(html, /<h1 id="page-title">BADGEY/);
  assert.match(html, /alternate-fiction scenario/i);
  assert.match(html, /not a full language model/i);
  assert.match(html, /No account\. No API key\. No model download/i);
  assert.match(html, /role="log" aria-live="polite"/);
  assert.match(html, /<form id="chat-form"/);
  assert.match(html, /<label for="message">/);
  assert.doesNotMatch(html, /type="password"|session token|lore-chat|http:\/\/127\.0\.0\.1:9877/i);
});

test('strict CSP and DOM text rendering provide static no-network guardrails', () => {
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.match(app, /textContent = text/);
  assert.match(app, /textContent = `\[\$\{source.status\}\]/);
  assert.doesNotMatch(app, /innerHTML|localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
  assert.match(app, /while \(log.children.length > 25\)/);
});

test('responsive layout and keyboard focus styles are present', () => {
  assert.match(css, /@media\(max-width:610px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
