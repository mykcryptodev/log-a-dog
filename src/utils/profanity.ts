const bannedWords = [
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'asshole',
  'dick',
  'bastard',
  'slut',
  'whore',
  'fag',
  'nigger'
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return bannedWords.some(word => lower.includes(word));
}
