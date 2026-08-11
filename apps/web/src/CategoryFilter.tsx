import { emojiForCategory } from "./categoryEmoji";

interface CategoryFilterProps {
  /** Every category currently present among the fetched places. */
  categories: string[];
  /** Categories the user has toggled off — everything else is shown. */
  excluded: Set<string>;
  onToggle: (category: string) => void;
}

function toggleButtonStyle(active: boolean) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.35rem 0.85rem",
    borderRadius: "999px",
    border: `1px solid ${active ? "#4285f4" : "#dadce0"}`,
    backgroundColor: active ? "#4285f4" : "#f1f3f4",
    color: active ? "#fff" : "#5f6368",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    cursor: "pointer",
    transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
  };
}

export function CategoryFilter({
  categories,
  excluded,
  onToggle,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
      }}
    >
      {categories.map((category) => {
        const active = !excluded.has(category);
        return (
          <button
            key={category}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(category)}
            style={toggleButtonStyle(active)}
          >
            <span aria-hidden="true">{emojiForCategory(category)}</span>
            {category}
          </button>
        );
      })}
    </div>
  );
}
