// Friendly password generator for first-time worker accounts.
// Words are easy to read aloud over the phone, suffix adds entropy.

const WORDS = [
  "paleti", "noliktava", "skirot", "manifests", "veikals", "atlaide",
  "kontrole", "kratele", "robots", "rinda", "kraulis", "augskramts",
  "tirgus", "krajums", "produkts", "etikete", "kaste", "pakka",
];

export function generateFriendlyPassword(): string {
  const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = Math.floor(100 + Math.random() * 900); // 100–999
  return `${w1}-${w2}-${num}`;
}
