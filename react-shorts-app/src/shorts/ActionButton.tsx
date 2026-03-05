import type React from "react";

export const ShareIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export type ActionBtnProps = {
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  useShareIcon?: boolean;
};

export const ActionBtn: React.FC<ActionBtnProps> = ({
  icon,
  label,
  onClick,
  active = false,
  useShareIcon = false,
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
      color: active ? "#b16cea" : "rgba(255,255,255,0.95)",
      transition: "color 0.2s, transform 0.15s",
      transform: active ? "scale(1.15)" : "scale(1)",
    }}
  >
    <span
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        border: `1.5px solid ${
          active ? "rgba(177,108,234,0.6)" : "rgba(255,255,255,0.18)"
        }`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
      }}
    >
      {useShareIcon ? <ShareIcon /> : icon}
    </span>
    {label && (
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: "rgba(255,255,255,0.9)",
          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        minWidth: 56, // keep Follow/Following width constant
        textAlign: "center",
        display: "block",
        }}
      >
        {label}
      </span>
    )}
  </button>
);

