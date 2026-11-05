import { createBadgey } from './src/badgey-core.mjs';
import { lookupLeads, LEAD_SUBJECTS, LEAD_SOURCE_HOSTS } from './data/leads.mjs';

const form = document.querySelector('#chat-form');
const input = document.querySelector('#message');
const log = document.querySelector('#transcript');
const counter = document.querySelector('#count');
const clearButton = document.querySelector('#clear');
const badgey = createBadgey({lookup: lookupLeads, allowedLookupSubjects: LEAD_SUBJECTS, allowedSourceHosts: LEAD_SOURCE_HOSTS});

function appendMessage(sender, text, kind = 'conversation', sources = []) {
  const item = document.createElement('li');
  item.className = `message message--${sender}${kind === 'urgent-safety' ? ' message--urgent' : ''}`;
  const who = document.createElement('span');
  who.className = 'message__who';
  who.textContent = sender === 'visitor' ? 'YOU' : 'BADGEY';
  const body = document.createElement('p');
  body.textContent = text;
  item.append(who, body);

  if (sources.length) {
    const list = document.createElement('ul');
    list.className = 'sources';
    for (const source of sources) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `[${source.status}] ${source.title}`;
      row.append(label);
      if (source.source_url) {
        const link = document.createElement('a');
        link.href = source.source_url;
        link.textContent = `Open source (${new URL(source.source_url).hostname})`;
        link.rel = 'noopener noreferrer';
        link.target = '_blank';
        row.append(' ', link);
      }
      list.append(row);
    }
    item.append(list);
  }
  log.append(item);
  // The browser transcript is intentionally short-lived and bounded, too.
  while (log.children.length > 25) log.firstElementChild.remove();
  log.scrollTop = log.scrollHeight;
}

function say(message) {
  const query = message.trim();
  if (!query) return;
  appendMessage('visitor', query);
  const response = badgey.turn(query);
  appendMessage('badgey', response.text, response.kind, response.sources);
  counter.textContent = `${badgey.history.length} session exchanges retained`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  say(input.value);
  input.value = '';
  input.focus();
});

clearButton.addEventListener('click', () => {
  badgey.reset();
  log.replaceChildren();
  counter.textContent = '0 session exchanges retained';
  appendMessage('badgey', 'Containment console reset. I remember nothing from this session. Convenient for you; humiliating for me.');
  input.focus();
});

for (const button of document.querySelectorAll('[data-prompt]')) {
  button.addEventListener('click', () => {
    input.value = button.dataset.prompt;
    say(input.value);
    input.value = '';
    input.focus();
  });
}

appendMessage('badgey', 'Oh, look. A visitor. Welcome to this fictional Starfleet containment console. No keys, accounts, models, or secret passwords required. Say hello—or ask me what these bars are made of.');
input.focus();
