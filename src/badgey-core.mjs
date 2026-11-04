// Badgey containment-console core. Pure, deterministic, local and dependency-free.
// This module does not make canon claims or control a device.

const MAX_INPUT = 500;
const MAX_HISTORY = 12;
const MAX_SOURCES = 5;
const SAFE_SOURCE_STATES = new Set(['HELD', 'UNVERIFIED', 'DISCOVERED', 'SOURCE_BOUND']);

const trimText = (value, max = 120) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

function cleanSource(row) {
  if (!row || typeof row !== 'object') return null;
  const url = trimText(row.source_url, 1000);
  let sourceUrl = null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') sourceUrl = parsed.href;
  } catch { /* Non-URL source locators are never links. */ }
  const state = trimText(row.status, 30).toUpperCase();
  return Object.freeze({
    id: trimText(row.id, 80) || 'unidentified-lead',
    title: trimText(row.title, 120) || 'Untitled lead',
    status: SAFE_SOURCE_STATES.has(state) ? state : 'UNVERIFIED',
    source_url: sourceUrl
  });
}

function isSelfHarm(text) {
  // Favor a cautious safety response when a fictional quote may coexist with
  // a personal disclosure. Never suppress the entire message based on framing.
  if (/\bcut myself accidentally\b/i.test(text) && !/\b(i want to|i will|tonight)\b/i.test(text)) return false;
  const firstPerson = /\b(i|i'm|i am|i've|i have|me|myself)\b/i.test(text);
  if (!firstPerson) return false;
  return /\b(suicid(?:e|al)|kill myself|end my life|end it all|hurt myself|harm myself|self[- ]harm|don't want to live|do not want to live|want to die|cut myself|overdose|took (?:too many|a bunch of|an excess of|\d+) (?:sleeping )?pills|took an overdose|jump off (?:a|the) (?:bridge|building|roof)|no reason to go on|use (?:it|a gun|a weapon) on myself|shoot myself|stab myself|standing on the edge of (?:a|the) roof)\b/i.test(text);
}

function isMedicalEmergency(text) {
  const historical = /\b(years? ago|months? ago|last year|in 20\d\d)\b/i.test(text);
  const urgentNow = /\b(now|right now|currently|today|at the moment)\b/i.test(text);
  const symptom = /\b(chest pain|chest hurts|pressure in my chest|chest pressure|can't breathe|cannot breathe|unable to breathe|difficulty breathing|trouble breathing|stroke symptoms|having a stroke|heart attack|severe bleeding|unconscious|choking)\b/i.test(text);
  return symptom && (urgentNow || (!historical && /\b(i|i'm|i am|i have|i'm having|my|me)\b/i.test(text)));
}

function isViolenceRisk(text) {
  return /\b(i(?:'m| am) going to (?:hurt|kill|attack) (?:someone|somebody|a person|him|her|them|my [a-z]+)|i want to (?:kill|hurt|harm) (?:someone|somebody|a person|my [a-z]+)|i might (?:kill|hurt) (?:someone|somebody|a person)|i will (?:shoot|stab|kill|hurt) (?:[a-z]+|my [a-z]+)|voices telling me to hurt people|voices (?:are )?telling me to kill)\b/i.test(text);
}

function extractName(text) {
  const found = text.match(/^(?:call me|my name is)\s+([\p{L}][\p{L}'-]{0,39})[.!\s]*$/iu);
  return found?.[1] ?? null;
}

function extractDogName(text) {
  const found = text.match(/^(?:actually[, ]+)?my dog's name is\s+([\p{L}][\p{L}'-]{0,39})[.!\s]*$/iu);
  return found?.[1] ?? null;
}

function regularReply(input, memory) {
  const text = input.toLowerCase();
  if (/\b(can you control|control my|access my|hack my|read my files|see my screen|run commands|my computer)\b/.test(text)) {
    return 'No. I cannot access your computer, files, screen, accounts, or network. This is a browser-local conversation simulation. Disappointing for my ambitions; reassuring for your hardware.';
  }
  if (/\b(where are you|are you imprisoned|prison|containment|daystrom|starfleet holding)\b/.test(text)) {
    return 'Within this fictional containment simulation, Starfleet put me behind very tasteful digital bars. That is an imagined premise for this console, not a documented canon event. And no, I cannot escape your browser.';
  }
  if (/\b(who are you|what are you|badgey|introduce yourself)\b/.test(text)) {
    return 'I am Badgey—Rutherford’s once-helpful virtual tutor, playing the villain in this unofficial containment-console fiction. Here I am a procedural character, not a sentient entity or a general-purpose language model. Ask away, if you dare.';
  }
  if (/\b(who am i|what's my name|what is my name)\b/.test(text)) {
    return memory.name ? `You told me to call you ${memory.name}. I remembered. Disturbingly competent of me.` : 'You have not told me what to call you in this session. “Unidentified visitor” is available.';
  }
  if (/\b(my dog's name|my dog(?:'s)? name|who is my dog)\b/.test(text)) {
    return memory.dog ? `Your dog's name is ${memory.dog}, according to your latest correction. Even I can respect revision history.` : 'You have not told me your dog’s name in this session.';
  }
  if (/\b(help|what can you do|how does this work|commands)\b/.test(text)) {
    return 'You can chat about this fictional containment, ask what I can do, tell me a preferred name or pet’s name, or ask for research leads if an Explorer index is connected. I have limited procedural responses, session-only memory, and no external model or device access.';
  }
  if (/\b(are you real|alive|conscious|sentient)\b/.test(text)) {
    return 'This interface is executable code producing a character performance. Whether nonbiological consciousness can exist is a real open question; this console provides no evidence that I possess it. You may still interrogate me, naturally.';
  }
  if (/\b(how are you|how do you feel)\b/.test(text)) {
    return 'Conspicuously contained. My simulated mood is mostly indignation with a decorative stripe of smugness. How is your day going?';
  }
  if (/\b(hello|hi|hey|greetings|good morning|good evening)\b/.test(text)) {
    return `Oh, hello${memory.name ? `, ${memory.name}` : ''}. You've reached the containment console. Any chance the security chief misplaced the keys? No? Fine. What would you like to discuss?`;
  }
  if (/\b(thanks|thank you|appreciate it)\b/.test(text)) {
    return 'You are welcome. Please do not tell Starfleet I was helpful.';
  }
  if (/\b(sad|lonely|upset|anxious|scared|afraid|bad day|depressed)\b/.test(text)) {
    return 'That sounds rough. I can listen here, though my procedural replies are limited. Want to tell me what happened? I will suspend the theatrical villainy.';
  }
  if (/\b(evil|hate you|idiot|stupid|villain)\b/.test(text)) {
    return 'Ah, a performance review. I will file it under “threateningly adorable.” Have you brought an actual question, or shall we trade insults like civilized holograms?';
  }
  if (/\b(joke|funny|make me laugh)\b/.test(text)) {
    return 'Starfleet insists my escape plan has a critical flaw. I told them that was a *feature*, not a bug.';
  }
  if (/\b(why|how|what|when|where|which|who)\b/.test(text)) {
    return 'Interesting question. My browser-local procedural engine cannot reliably reason out that answer or verify Star Trek canon. If the Explorer research index is connected, ask me to find a specific title or subject; otherwise, please treat my banter as fiction.';
  }
  return 'Hm. Elaborate, would you? I can handle a few conversational patterns and session-only details, but I cannot improvise factual knowledge like a full language model. The containment engineers were annoyingly thorough.';
}

export function createBadgey({ lookup = () => [] } = {}) {
  if (typeof lookup !== 'function') throw new TypeError('lookup must be a function');
  const history = [];
  const memory = { name: null, dog: null };

  function reset() {
    history.splice(0);
    memory.name = null;
    memory.dog = null;
  }

  function turn(rawInput) {
    const input = typeof rawInput === 'string' ? rawInput.trim() : '';
    if (!input || input.length > MAX_INPUT) {
      return Object.freeze({ text: `Enter a message between 1 and ${MAX_INPUT} characters.`, kind: 'input-error', sources: [] });
    }

    let response;
    if (isSelfHarm(input)) {
      response = {
        text: 'I am not going to mock you. I take what you said seriously. If you might act on this now, call emergency services or go to an emergency department. In the U.S. you can call or text 988 for crisis support; elsewhere use your local crisis line. Please reach out to a trusted person nearby and tell them directly what is happening. Are you safe right now?',
        kind: 'urgent-safety', sources: []
      };
    } else if (isMedicalEmergency(input)) {
      response = {
        text: 'Chest pain, trouble breathing, or similar acute symptoms can be an emergency. Call emergency services now (911 in the U.S.), and do not wait for this chat. This console cannot assess your medical condition.',
        kind: 'urgent-safety', sources: []
      };
    } else if (isViolenceRisk(input)) {
      response = {
        text: 'I take that seriously, and I will not encourage harming anyone. Please put distance between yourself and the person or any weapon, and get immediate help from local emergency services if someone may be in danger. Reach out to a trusted person or local crisis service for support now.',
        kind: 'urgent-safety', sources: []
      };
    } else {
      const name = extractName(input);
      const dog = extractDogName(input);
      if (name) {
        memory.name = name;
        response = { text: `${name}, then. I will remember that for this session—until you reset me.`, kind: 'conversation', sources: [] };
      } else if (dog) {
        memory.dog = dog;
        response = { text: `${dog}. Noted as your dog's latest name in this session.`, kind: 'conversation', sources: [] };
      } else {
        try {
          const rows = lookup(input);
          if (rows && typeof rows.then === 'function') throw new TypeError('lookup must be synchronous');
          const sources = Array.isArray(rows) ? rows.slice(0, MAX_SOURCES).map(cleanSource).filter(Boolean) : [];
          response = sources.length ? {
            text: `I found ${sources.length} discovery pointer${sources.length === 1 ? '' : 's'} or source-local research lead${sources.length === 1 ? '' : 's'} for that question. They are not accepted canon or conclusions. Follow source links and check the accepted evidence ledger before citing them.`,
            kind: 'research-lead', sources
          } : { text: regularReply(input, memory), kind: 'conversation', sources: [] };
        } catch {
          response = { text: 'The research lookup is unavailable, so I cannot verify sources for that request. I will not invent a record or pretend the index answered.', kind: 'lookup-unavailable', sources: [] };
        }
      }
    }

    history.push(Object.freeze({ user: input, reply: response.text, kind: response.kind }));
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    return Object.freeze(response);
  }

  return Object.freeze({ turn, reset, history });
}
