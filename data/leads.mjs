// Discovery-only examples; none are accepted trek-data-core research assertions.
const LEADS = Object.freeze([
  Object.freeze({id: 'external:star-trek-badgey-guide', title: 'Official Star Trek guide: megalomaniacal AI (Badgey)', status: 'DISCOVERED', source_url: 'https://www.startrek.com/news/star-trek-megalomaniacal-ai-guide', terms: ['badgey', 'rutherford', 'goodgey', 'logic-y']}),
  Object.freeze({id: 'external:lower-decks-s4e7', title: 'Official Star Trek: A Few Badgeys More episode commentary', status: 'DISCOVERED', source_url: 'https://www.startrek.com/news/below-deck-lower-decks-407-good-badge-and-ugly', terms: ['badgey', 'lower decks', 'few badgeys', 'agimus', 'peanut hamper', 'daystrom']})
]);

export const LEAD_SUBJECTS = Object.freeze([...new Set(LEADS.flatMap(row => row.terms))]);
// Configured independently of callback rows; unknown hosts are never links.
export const LEAD_SOURCE_HOSTS = Object.freeze(['www.startrek.com']);

export function lookupLeads(subject) {
  if (typeof subject !== 'string') return [];
  const search = subject.normalize('NFKC').toLowerCase().trim();
  return LEADS.filter(row => row.terms.includes(search))
    .map(({id, title, status, source_url}) => ({id, title, status, source_url}));
}
