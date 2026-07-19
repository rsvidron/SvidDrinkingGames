interface Props {
  until: Date | null;
}

function formatEnd(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FreeWeekendBanner({ until }: Props) {
  if (!until) return null;
  return (
    <div
      style={{
        background: "linear-gradient(90deg, var(--gold), #ffb703)",
        color: "#3a2c00",
        padding: "10px 14px",
        borderRadius: 12,
        fontSize: "0.9rem",
        fontWeight: 700,
        textAlign: "center",
        marginBottom: 12,
      }}
    >
      🎉 FREE WEEKEND — full access until {formatEnd(until)}
    </div>
  );
}
