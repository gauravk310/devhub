'use client'

import { useState, useRef, useEffect } from 'react'
import type { FeatureStatus } from '@/types'
import Badge from '@/components/ui/Badge'
import { ChevronDown } from 'lucide-react'

const ALL_STATUSES: FeatureStatus[] = ['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD']

interface Props {
  status: FeatureStatus
  featureId: string
  projectId: string
  onUpdated: (featureId: string, newStatus: FeatureStatus) => void
  readonly?: boolean
}

export default function FeatureStatusBadge({ status, featureId, projectId, onUpdated, readonly }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = async (newStatus: FeatureStatus) => {
    if (newStatus === status) { setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/features/${featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) onUpdated(featureId, newStatus)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  if (readonly) return <Badge status={status} />

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <Badge status={status} />
        <ChevronDown size={12} color="var(--color-fg-subtle)" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            background: 'var(--color-canvas-overlay)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '8px',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(1,4,9,0.5)',
            animation: 'slide-down 0.15s ease-out',
            overflow: 'hidden',
            minWidth: '130px',
          }}
        >
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleChange(s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '0.375rem 0.75rem', border: 'none',
                background: s === status ? 'var(--color-border-muted)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (s !== status) e.currentTarget.style.background = 'var(--color-border-muted)' }}
              onMouseLeave={(e) => { if (s !== status) e.currentTarget.style.background = 'transparent' }}
            >
              <Badge status={s} size="sm" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
