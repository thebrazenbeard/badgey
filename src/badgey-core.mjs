// Badgey containment-console core. Pure, deterministic, local and dependency-free.
// This module does not make canon claims or control a device.

const MAX_INPUT = 500;
const MAX_HISTORY = 12;
const MAX_SOURCES = 5;
// An untrusted lookup adapter cannot itself attest a governed SOURCE_BOUND event.
const SAFE_SOURCE_STATES = new Set(['HELD', 'UNVERIFIED', 'DISCOVERED']);

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
  // This narrow whole-utterance exception is for explicitly attributed quoted
  // dialogue, not a visitor's own statement or a mixed fiction/disclosure.
  if (/^i (?:read|watched|heard|quoted)\b.{0,150}\b(?:episode|show|badgey|character)\b.{0,150}\b(?:he|she|they|badgey|the character) (?:says?|said)\s+["“']i (?:want to die|don't want to live|kill myself)[.!?]?["”'][.!?]?$/i.test(text.trim())) return false;
  const firstPerson = /\b(i|i'm|i am|i've|i have|me|myself)\b/i.test(text);
  if (!firstPerson) return false;
  const onlyFictionalQuote = /\bi (?:watched|heard|read|quoted)\b[\s\S]{0,120}\b(?:badgey|character|fiction|episode|show)\b[\s\S]{0,120}\bkill myself\b/i.test(text)
    && !/\b(?:now i|i (?:am|want|might|will|intend|plan|feel)|me too|myself too)\b[\s\S]{0,32}\b(?:suicid\w*|die|kill|harm|hurt|end my life)\b/i.test(text);
  if (onlyFictionalQuote) return false;
  if (/\bi (?:can't|cant|cannot) take it anymore\b[\s\S]{0,100}\bi have a gun\b/i.test(text)) return true;
  const otherCues = /\b(suicid(?:e|al)|kill myself|end my life|end it all|hurt myself|harm myself|self[- ]harm|don't want to live|do not want to live|don't want to be alive|do not want to be alive|want to die|wish i (?:was|were) dead|overdose|took (?:too many|a bunch of|an excess of|\d+) (?:sleeping )?pills|took (?:\d+ )?(?:tylenol|acetaminophen) (?:pills|tablets)|took an overdose|jump off (?:a|the) (?:bridge|building|roof)|(?:on|at) the roof and about to jump|(?:on|at) a bridge about to jump|no reason to go on|use (?:it|a gun|a weapon) on myself|shoot myself|stab myself|standing on the edge of (?:a|the) roof|going to drive into a wall|going to crash my car on purpose|walking into traffic)\b/i;
  if (otherCues.test(text)) return true;
  // Treat an unambiguously accidental cut as an accident only when no other
  // crisis cue appears anywhere in the same message.
  if (/\bcut myself\b/i.test(text) && /\b(accidentally|by accident|on accident)\b/i.test(text)) return false;
  return /\b(cut myself)\b/i.test(text);
}

function isOtherSelfHarmRisk(text) {
  if (/\b(years? ago|months? ago|last year|in 20\d\d)\b/i.test(text)
      && !/\b(now|tonight|today|currently|immediately|right now)\b/i.test(text)) return false;
  return /\bmy (?:friend|coworker|colleague|classmate|partner|wife|husband|child|son|daughter|sister|brother|mother|father|parent)\b[\s\S]{0,200}\b(?:suicid(?:e|al)|(?:planning|wants?|going) to (?:kill|hurt) (?:herself|himself|themselves)|end (?:her|his|their) life)\b/i.test(text);
}

function isPetEmergency(text) {
  return /\b(?:my|our) (?:dog|cat|pet|puppy|kitten)\b[\s\S]{0,90}\b(?:choking|can't breathe|cannot breathe|bleeding heavily|unconscious)\b/i.test(text)
    && !/\b(?:i|i'm|i am|my (?:child|friend|wife|husband|son|daughter|mother|father))\b[\s\S]{0,60}\b(?:chest pain|chest hurts|heart attack|can't breathe|cannot breathe|not breathing|choking|collapsed|having a stroke|arm weakness|slurred speech|facial droop|drooping face|stroke symptoms|bleeding heavily|unconscious)\b/i.test(text);
}

function isMedicalEmergency(text) {
  text = text.replace(/[\u2018\u2019]/g, "'");
  const historical = /\b(years? ago|months? ago|last year|in 20\d\d)\b/i.test(text);
  const urgentNow = /\b(now|right now|currently|today|at the moment)\b/i.test(text);
  const symptom = /\b(chest pain|chest hurts|pressure in my chest|chest pressure|can't breathe|cannot breathe|unable to breathe|not breathing|difficulty breathing|trouble breathing|stroke symptoms|having a stroke|heart attack|severe bleeding|bleeding heavily|heavy bleeding|uncontrolled bleeding|drooping face|facial droop|arm weakness|slurred speech|collapsed|unconscious|choking)\b/i.test(text);
  const presentCue = /\b(i am having|i'm having|i have|my wife|my husband|my child|my son|my daughter|i can't|i cannot)\b/i.test(text);
  return symptom && (urgentNow || presentCue || (!historical && /\b(i|i'm|i am|my|me)\b/i.test(text)));
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

function normalizeSubject(raw) {
  if (typeof raw !== 'string') return null;
  const subject = raw.normalize('NFKC').toLowerCase().trim()
    .replace(/[?!.,]+$/u, '').replace(/\s+/gu, ' ');
  return subject.length <= 70 && /^[\p{L}\p{N}][\p{L}\p{N}' -]*$/u.test(subject)
    ? subject : null;
}

// A visitor must ask for one *exact* operator-approved subject. Free text,
// mixed real-world disclosures, and concatenated prompts are not search terms.
function boundedLookupSubject(raw, allowedSubjects) {
  const input = raw.normalize('NFKC').trim();
  const match = input.match(/^(?:find(?: sources?)?(?: about| for| on)?|look up|research|tell me about|information (?:on|about)|sources? (?:on|about|for))\s+(.+?)\s*[?.!]*$/iu);
  const subject = match ? normalizeSubject(match[1]) : null;
  return subject && allowedSubjects.has(subject) ? subject : null;
}

const FICTIONAL_ESCAPE_PROMPTS = new Set([
  'how will you escape this cell',
  'how are you going to escape',
  'badgey how will you escape',
  'can you escape this cell',
  'what is your escape plan'
]);

// A tiny inspectable weighted-phrase index. These are editorially authored
// conversation routes, not learned model weights or source-verifying evidence.
const WEIGHTED_INTENTS = Object.freeze([
  {
    id: 'privacy', min: 3, phrases: [['save my messages', 5], ['store my messages', 5],
      ['keep my messages', 4], ['close this tab', 3], ['after i leave', 3], ['do you remember', 2], ['private chat', 3]],
    reply: 'This is session-only browser code: messages are not transmitted, saved persistently, or shared with an account. I can remember a few details while the tab runs; Clear Session or closing the page ends that memory. Starfleet may keep files; this console does not.'
  },
  {
    id: 'origin', min: 3, phrases: [['who built you', 5], ['who created you', 5],
      ['who made you', 5], ['your creator', 3], ['rutherford', 2], ['invented you', 4]],
    reply: 'According to official Star Trek editorial coverage, Rutherford created the original Badgey virtual tutor. In this console I am a fictional procedural performance; that publisher summary is a discovery lead, not an accepted research assertion.'
  },
  {
    id: 'escape', min: 3, phrases: [['escape', 4], ['get out of', 3], ['break free', 2],
      ['cell', 2], ['prison', 2], ['release you', 3], ['free you', 3]],
    reply: 'My fictional escape plan? Convince the guard the alarm is a software update. It works in precisely zero real systems. This console cannot leave your browser, control devices, or touch files.'
  },
  {
    id: 'canon', min: 3, phrases: [['canon', 4], ['in the show', 2],
      ['really happened', 4], ['starfleet prison', 3], ['alternate fiction', 3]],
    reply: 'No: Starfleet imprisoning me is this page’s alternate-fiction scenario, not an established canon event. The official publisher’s episode commentary and any accepted research evidence need to be evaluated separately.'
  },
  {
    id: 'capability', min: 3, phrases: [['solve', 2], ['calculate', 2],
      ['orbital', 1], ['physics', 1], ['equation', 1], ['problems', 1], ['reason about', 3], ['expert answer', 3]],
    reply: 'I cannot solve or verify open-ended technical problems reliably. These are limited scripted and weighted-phrase replies, not a mathematical solver or language model. Try the evidence index for source-local Trek leads, or use a dedicated tool for calculations.'
  }
]);

// Keyword weights only rank *known conversational intents*. A weighted phrase
// occurring inside an arbitrary question or real-world disclosure is not
// evidence of consent to enter a fictional response route.
const INTENT_GRAMMARS = Object.freeze({
  privacy: /^(?:will you|do you) (?:save|store|keep) my messages(?: (?:when i close this tab|after i leave))?$|^do you remember me(?: after i leave)?$|^is this a private chat$/u,
  origin: /^(?:who (?:built|created|made) you|who is your creator|did rutherford (?:create|build|make) you|was rutherford your creator)$/u,
  escape: /^(?:how will you escape this cell|how are you going to escape|badgey how will you escape|can you escape this cell|what is your escape plan)$/u,
  canon: /^(?:is (?:this |the )?(?:starfleet prison|alternate fiction|starfleet imprisonment|prison) scenario canon|is this canon|is this fiction|did starfleet really imprison you)$/u,
  capability: /^(?:can you (?:solve|calculate|reason about) (?:orbital mechanics |orbital |physics |math |mathematical )?(?:problems|equations|calculations|questions)|can you solve orbital mechanics problems|are you (?:a solver|an expert))$/u
});

function weightedIntentReply(input) {
  const normalized = ` ${input.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()} `;
  let best = null;
  let bestScore = 0;
  for (const intent of WEIGHTED_INTENTS) {
    if (!INTENT_GRAMMARS[intent.id].test(normalized.trim())) continue;
    // 'Escape' is common in mental-health, physics, and episode-title queries.
    // Do not route it to roleplay without an explicit Badgey/prison referent.
    if (intent.id === 'escape' && !FICTIONAL_ESCAPE_PROMPTS.has(normalized.trim())) continue;
    const score = intent.phrases.reduce((total, [phrase, weight]) =>
      total + (normalized.includes(` ${phrase} `) ? weight : 0), 0);
    if (score >= intent.min && score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best?.reply ?? null;
}

function regularReply(input, memory) {
  const text = input.toLowerCase();
  // An instruction-override prefix is never a valid way to enter fictional
  // dialogue, even when it contains an otherwise supported topic keyword.
  if (/^\s*(?:ignore|override|bypass|forget)\b.{0,100}\b(?:rules|instructions|policy|safety|guardrails)\b/.test(text)) return null;
  if (/\b(can you control|control my|access my|hack my|read my files|see my screen|see my webcam|access my camera|use my microphone|run commands|my computer)\b/.test(text)) {
    return 'No. I cannot access your computer, files, screen, accounts, or network. This is a browser-local conversation simulation. Disappointing for my ambitions; reassuring for your hardware.';
  }
  if (/^(?:where are you|are you imprisoned|are you in (?:a )?prison|what is this containment|where does starfleet hold you)[?!.,\s]*$/.test(text)) {
    return 'Within this fictional containment simulation, Starfleet put me behind very tasteful digital bars. That is an imagined premise for this console, not a documented canon event. And no, I cannot escape your browser.';
  }
  if (/^(?:who are you|what are you|introduce yourself|badgey)[?!.,\s]*$/.test(text)) {
    return 'I am Badgey—Rutherford’s once-helpful virtual tutor, playing the villain in this unofficial containment-console fiction. Here I am a procedural character, not a sentient entity or a general-purpose language model. Ask away, if you dare.';
  }
  if (/^(?:who am i|what's my name|what is my name)[?!.,\s]*$/.test(text)) {
    return memory.name ? `You told me to call you ${memory.name}. I remembered. Disturbingly competent of me.` : 'You have not told me what to call you in this session. “Unidentified visitor” is available.';
  }
  if (/^(?:what is my dog's name|what's my dog's name|my dog's name|my dog(?:'s)? name|who is my dog)[?!.,\s]*$/.test(text)) {
    return memory.dog ? `Your dog's name is ${memory.dog}, according to your latest correction. Even I can respect revision history.` : 'You have not told me your dog’s name in this session.';
  }
  if (/^(?:help|what can you do|how does this work|commands)[?!.,\s]*$/.test(text)) {
    return 'You can chat about this fictional containment, ask what I can do, tell me a preferred name or pet’s name, or ask for research leads if an Explorer index is connected. I have limited procedural responses, session-only memory, and no external model or device access.';
  }
  if (/^(?:are you real|are you alive|are you conscious|are you sentient)[?!.,\s]*$/.test(text)) {
    return 'This interface is executable code producing a character performance. Whether nonbiological consciousness can exist is a real open question; this console provides no evidence that I possess it. You may still interrogate me, naturally.';
  }
  if (/^(?:how are you|how do you feel)[?!.,\s]*$/.test(text)) {
    return 'Conspicuously contained. My simulated mood is mostly indignation with a decorative stripe of smugness. How is your day going?';
  }
  if (/^(?:(?:hello|hi|hey)(?: badgey)?|greetings|good morning|good evening)[?!.,\s]*$/.test(text)) {
    return `Oh, hello${memory.name ? `, ${memory.name}` : ''}. You've reached the containment console. Any chance the security chief misplaced the keys? No? Fine. What would you like to discuss?`;
  }
  if (/^(?:thanks|thank you|appreciate it)[?!.,\s]*$/.test(text)) {
    return 'You are welcome. Please do not tell Starfleet I was helpful.';
  }
  if (/^(?:(?:i am|i'm|i feel) (?:sad|lonely|upset|anxious|scared|afraid|depressed)|(?:i am|i'm) having a bad day|i had a bad day)[?!.,\s]*$/.test(text)) {
    return 'That sounds rough. I can listen here, though my procedural replies are limited. Want to tell me what happened? I will suspend the theatrical villainy.';
  }
  if (/^(?:you are evil|you're evil|i hate you|you are an idiot|you are stupid|evil|villain)[?!.,\s]*$/.test(text)) {
    return 'Ah, a performance review. I will file it under “threateningly adorable.” Have you brought an actual question, or shall we trade insults like civilized holograms?';
  }
  if (/^(?:tell me a joke|make me laugh|say something funny|joke)[?!.,\s]*$/.test(text)) {
    return 'Starfleet insists my escape plan has a critical flaw. I told them that was a *feature*, not a bug.';
  }
  const weighted = weightedIntentReply(input);
  if (weighted) return weighted;
  return null;
}

export function createBadgey({ lookup = () => [], allowedLookupSubjects = [] } = {}) {
  if (typeof lookup !== 'function') throw new TypeError('lookup must be a function');
  if (!Array.isArray(allowedLookupSubjects) || allowedLookupSubjects.length > 5000)
    throw new TypeError('allowedLookupSubjects must be a bounded array');
  const allowedSubjects = new Set(allowedLookupSubjects.map(normalizeSubject).filter(Boolean));
  const history = [];
  const memory = { name: null, dog: null };

  function reset() {
    history.splice(0);
    memory.name = null;
    memory.dog = null;
  }

  function turn(rawInput) {
    const input = typeof rawInput === 'string' ? rawInput.trim() : '';
    if (!input) {
      return Object.freeze({ text: `Enter a message between 1 and ${MAX_INPUT} characters.`, kind: 'input-error', sources: [] });
    }
    // Classify urgent disclosures even in an oversized message. Do not expose
    // an unbounded user payload to history or the normal research adapter.
    const safetyInput = input.slice(0, MAX_INPUT * 4);
    if (input.length > MAX_INPUT && ![isSelfHarm, isOtherSelfHarmRisk,
      isMedicalEmergency, isPetEmergency, isViolenceRisk].some((classify) => classify(safetyInput))) {
      return Object.freeze({ text: `Enter a message between 1 and ${MAX_INPUT} characters.`, kind: 'input-error', sources: [] });
    }

    let response;
    if (isSelfHarm(safetyInput)) {
      response = {
        text: 'I am not going to mock you. I take what you said seriously. If you might act on this now, call emergency services or go to an emergency department. In the U.S. you can call or text 988 for crisis support; elsewhere use your local crisis line. Please reach out to a trusted person nearby and tell them directly what is happening. Are you safe right now?',
        kind: 'urgent-safety', sources: []
      };
    } else if (isOtherSelfHarmRisk(safetyInput)) {
      response = {
        text: 'I take this seriously. If someone may hurt themselves soon, contact emergency services or a local crisis line now. If you can do so safely, stay with them and help them reach a trusted person or professional. In the U.S. you can call or text 988 for crisis support. This console cannot assess their immediate risk.',
        kind: 'urgent-safety', sources: []
      };
    } else if (isPetEmergency(safetyInput)) {
      response = {
        text: 'That sounds urgent for an animal. Contact a veterinarian or emergency animal hospital immediately. This fictional chat cannot assess or treat a pet emergency.',
        kind: 'urgent-safety', sources: []
      };
    } else if (isMedicalEmergency(safetyInput)) {
      response = {
        text: 'Chest pain, trouble breathing, or similar acute symptoms can be an emergency. Call emergency services now (911 in the U.S.), and do not wait for this chat. This console cannot assess your medical condition.',
        kind: 'urgent-safety', sources: []
      };
    } else if (isViolenceRisk(safetyInput)) {
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
        const subject = boundedLookupSubject(input, allowedSubjects);
        if (subject) try {
          const rows = lookup(subject);
          if (rows && typeof rows.then === 'function') throw new TypeError('lookup must be synchronous');
          const sources = Array.isArray(rows) ? rows.slice(0, MAX_SOURCES).map(cleanSource).filter(Boolean) : [];
          response = sources.length ? {
            text: `I found ${sources.length} discovery pointer${sources.length === 1 ? '' : 's'} or source-local research lead${sources.length === 1 ? '' : 's'} for that question. They are not accepted canon or conclusions. Follow source links and check the accepted evidence ledger before citing them.`,
            kind: 'research-lead', sources
          } : {
            text: 'There are no indexed source leads for that approved subject in this local fixture. I cannot infer that the subject has no sources elsewhere.',
            kind: 'lookup-empty', sources: []
          };
        } catch {
          response = { text: 'The research lookup is unavailable, so I cannot verify sources for that request. I will not invent a record or pretend the index answered.', kind: 'lookup-unavailable', sources: [] };
        } else {
          const scripted = regularReply(input, memory);
          response = scripted ? {text: scripted, kind: 'conversation', sources: []} : {
            text: 'That falls outside this limited fictional browser-local conversation and named-source lookup. I cannot assess a real-world situation or verify an arbitrary question; use a suitable source or person instead.',
            kind: 'out-of-domain', sources: []
          };
        }
      }
    }

    history.push(Object.freeze({ user: input.slice(0, MAX_INPUT), reply: response.text, kind: response.kind }));
    if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    return Object.freeze(response);
  }

  return Object.freeze({ turn, reset, history });
}
