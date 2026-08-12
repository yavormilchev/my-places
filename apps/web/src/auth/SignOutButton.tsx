import { logout } from "./auth";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void logout()}
      style={{
        position: "fixed",
        top: "0.75rem",
        right: "1rem",
        zIndex: 10,
        display: "inline-flex",
        alignItems: "center",
        padding: "0.35rem 0.85rem",
        borderRadius: "999px",
        border: "1px solid #dadce0",
        backgroundColor: "#fff",
        color: "#5f6368",
        fontSize: "0.9rem",
        lineHeight: 1.4,
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
