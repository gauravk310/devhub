'use client'

import { use, useEffect, useState } from 'react'
import type { IProjectWithMembers, IFeature, FeatureStatus } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils'
import { Activity } from 'lucide-react'

const STATUS_ORDER: FeatureStatus[] = ['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD']

const KPI_CONFIG: { status: FeatureStatus; label: string; border: string }[] = [
  { status: 'PENDING',  label: 'Pending',  border: 'var(--color-attention-emphasis)' },
  { status: 'READY',    label: 'Ready',    border: 'var(--color-accent-emphasis)'    },
  { status: 'TESTING',  label: 'Testing',  border: 'var(--color-done-emphasis)'      },
  { status: 'DEPLOYED', label: 'Deployed', border: 'var(--color-success-emphasis)'   },
  { status: 'DISCARD',  label: 'Discarded',border: 'var(--color-border-default)'     },
]

export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [features, setFeatures] = useState<IFeature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/features`).then((r) => r.json()),
    ]).then(([p, f]) => {
      setProject(p.data)
      setFeatures(f.data ?? [])
    }).finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = features.filter((f) => f.status === s).length
    return acc
  }, {} as Record<FeatureStatus, number>)

  const recentActivity = [...features].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* KPI Cards */}
      <div>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-muted)', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem' }}>
          {/* Total */}
          <div className="kpi-card" style={{ borderColor: 'var(--color-accent-emphasis)' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>
              {features.length}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>Total Features</span>
          </div>
          {KPI_CONFIG.map(({ status, label, border }) => (
            <div key={status} className="kpi-card" style={{ borderTopColor: border, borderTopWidth: 3 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>
                {counts[status]}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-muted)', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={14} /> Recent Activity
        </h2>
        {recentActivity.length === 0 ? (
          <p style={{ color: 'var(--color-fg-subtle)', fontSize: '0.875rem' }}>No features added yet.</p>
        ) : (
          <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden' }}>
            {recentActivity.map((f, i) => (
              <div
                key={f._id.toString()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', gap: '1rem',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                  background: 'var(--color-canvas-subtle)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-canvas-subtle)')}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <Badge status={f.status} size="sm" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', whiteSpace: 'nowrap' }}>
                    {timeAgo(f.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
