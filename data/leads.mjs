// Discovery-only examples; none are accepted trek-data-core research assertions.
const LEADS = Object.freeze([
  Object.freeze({id: 'external:star-trek-badgey-guide', title: 'Official Star Trek guide: megalomaniacal AI (Badgey)', status: 'DISCOVERED', source_url: 'https://www.startrek.com/news/star-trek-megalomaniacal-ai-guide', terms: ['badgey', 'rutherford', 'goodgey', 'logic-y']}),
  Object.freeze({id: 'external:lower-decks-s4e7', title: 'Official Star Trek: A Few Badgeys More episode commentary', status: 'DISCOVERED', source_url: 'https://www.startrek.com/news/below-deck-lower-decks-407-good-badge-and-ugly', terms: ['badgey', 'lower decks', 'few badgeys', 'agimus', 'peanut hamper', 'daystrom']})
]);

export function lookupLeads(query) {
  if (!/\b(find|source|research|look up|tell me about|information on|about)\b/i.test(query)) return [];
  const search = query.toLowerCase();
  return LEADS.filter(row => row.terms.some(term => search.includes(term)))
    .map(({id, title, status, source_url}) => ({id, title, status, source_url}));
}
