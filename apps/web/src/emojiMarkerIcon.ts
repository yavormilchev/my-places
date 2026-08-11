// The classic Marker (still used in PlacesMap.tsx — see its onIdle comment
// re: AdvancedMarkerElement) only accepts an image URL as its icon, not
// arbitrary DOM content — so a custom "icon" means building one as a small
// inline SVG and handing it over as a data: URI.
const SIZE = 25;
const STRIKE_COLOR = "#888888";

export function emojiMarkerIconUrl(emoji: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - 2}" fill="white" stroke="${STRIKE_COLOR}" stroke-width="2" />
      <text x="${SIZE / 2}" y="${SIZE / 2 + 5}" font-size="16" text-anchor="middle">${emoji}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
