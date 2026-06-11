export default function LoadingSpinner({ size = 20, color = 'var(--color-accent-fg)' }: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
      aria-label="Loading"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="var(--color-border-muted)" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} />
    </svg>
  )
}
