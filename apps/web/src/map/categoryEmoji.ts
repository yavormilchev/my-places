// Category here is whatever Google Maps "saved list" a place belongs to
// (see toPlace.ts's list_name → category mapping) — a name you chose
// yourself in Google Maps, not a fixed taxonomy. Add to this map as you
// add new lists; anything unmapped just falls back to a plain pin.
const CATEGORY_EMOJI: Record<string, string> = {
  Parks: "🌲",
  Club: "🍸",
  Food: "🍗",
  "Loved places": "❤️",
  Coffee: "☕",
  "Want to go": "🎒",
  "Favorite places": "⭐",
  "Travel plans": "🛄",
};

const DEFAULT_EMOJI = "📌";

export function emojiForCategory(category: string): string {
  return CATEGORY_EMOJI[category] ?? DEFAULT_EMOJI;
}
