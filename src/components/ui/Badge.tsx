import type { FeatureStatus } from '@/types'

interface BadgeProps {
  status: FeatureStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<FeatureStatus, { label: string; className: string; dot: string }> = {
  PENDING:  { label: 'Pending',  className: 'badge-pending',  dot: '#d29922' },
  READY:    { label: 'Ready',    className: 'badge-ready',    dot: '#58a6ff' },
  TESTING:  { label: 'Testing',  className: 'badge-testing',  dot: '#a371f7' },
  DEPLOYED: { label: 'Deployed', className: 'badge-deployed', dot: '#3fb950' },
  DISCARD:  { label: 'Discard',  className: 'badge-discard',  dot: '#6e7681' },
}

export default function Badge({ status, size = 'md' }: BadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={config.className}
      style={{ fontSize: size === 'sm' ? '0.7rem' : undefined }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: config.dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  )
}
