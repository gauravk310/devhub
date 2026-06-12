'use client'

import { use, useEffect, useState } from 'react'
import type { IProjectWithMembers, IFeature, FeatureStatus, FeatureType } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { timeAgo, getInitials } from '@/lib/utils'
import { Activity } from 'lucide-react'

const STATUS_ORDER: FeatureStatus[] = ['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD']
const TYPE_ORDER: FeatureType[] = ['FEATURE', 'BUG FIX', 'UPDATE', 'DISCARD', 'OTHER']

const KPI_CONFIG: { status: FeatureStatus; label: string; border: string }[] = [
  { status: 'PENDING',  label: 'Pending',  border: 'var(--color-attention-emphasis)' },
  { status: 'READY',    label: 'Ready',    border: 'var(--color-accent-emphasis)'    },
  { status: 'TESTING',  label: 'Testing',  border: 'var(--color-done-emphasis)'      },
  { status: 'DEPLOYED', label: 'Deployed', border: 'var(--color-success-emphasis)'   },
  { status: 'DISCARD',  label: 'Discarded',border: 'var(--color-border-default)'     },
]

const TYPE_KPI_CONFIG: { type: FeatureType; label: string; border: string }[] = [
  { type: 'FEATURE',  label: 'Features',  border: 'var(--color-accent-emphasis)'    },
  { type: 'BUG FIX',  label: 'Bug Fixes', border: 'var(--color-danger-emphasis)'    },
  { type: 'UPDATE',   label: 'Updates',   border: 'var(--color-done-emphasis)'      },
  { type: 'DISCARD',  label: 'Discarded', border: 'var(--color-border-default)'     },
  { type: 'OTHER',    label: 'Others',    border: 'var(--color-attention-emphasis)' },
]

export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [features, setFeatures] = useState<IFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | FeatureType>('all')

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

  const now = new Date()
  const filteredFeatures = features.filter((f) => {
    // 1. Time Filter
    if (timeFilter !== 'all') {
      const updatedTime = new Date(f.updatedAt).getTime()
      const diffMs = now.getTime() - updatedTime
      if (timeFilter === '24h' && diffMs > 24 * 60 * 60 * 1000) return false
      if (timeFilter === '7d' && diffMs > 7 * 24 * 60 * 60 * 1000) return false
      if (timeFilter === '30d' && diffMs > 30 * 24 * 60 * 60 * 1000) return false
    }

    // 2. Type Filter
    if (typeFilter !== 'all') {
      const fType = f.type || 'FEATURE'
      if (fType !== typeFilter) return false
    }

    return true
  })

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = filteredFeatures.filter((f) => f.status === s).length
    return acc
  }, {} as Record<FeatureStatus, number>)

  const typeCounts = TYPE_ORDER.reduce((acc, t) => {
    acc[t] = filteredFeatures.filter((f) => (f.type || 'FEATURE') === t).length
    return acc
  }, {} as Record<FeatureType, number>)

  const recentActivity = [...filteredFeatures].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* KPI Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-muted)', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Status Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem' }}>
            {/* Total */}
            <div className="kpi-card" style={{ borderColor: 'var(--color-accent-emphasis)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>
                {filteredFeatures.length}
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

        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-muted)', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Type Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem' }}>
            {TYPE_KPI_CONFIG.map(({ type, label, border }) => (
              <div key={type} className="kpi-card" style={{ borderTopColor: border, borderTopWidth: 3 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>
                  {typeCounts[type]}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14} /> Recent Activity
          </h2>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="type-filter" style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontWeight: 500 }}>
                Type:
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="gh-select"
                style={{
                  width: 'auto',
                  fontSize: '0.75rem',
                  padding: '0.25rem 1.75rem 0.25rem 0.5rem',
                  borderRadius: '6px',
                  height: '28px',
                }}
              >
                <option value="all">All Types</option>
                <option value="FEATURE">Feature</option>
                <option value="BUG FIX">Bug Fix</option>
                <option value="UPDATE">Update</option>
                <option value="DISCARD">Discard</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Time Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="time-filter" style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontWeight: 500 }}>
                Time:
              </label>
              <select
                id="time-filter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="gh-select"
                style={{
                  width: 'auto',
                  fontSize: '0.75rem',
                  padding: '0.25rem 1.75rem 0.25rem 0.5rem',
                  borderRadius: '6px',
                  height: '28px',
                }}
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--color-border-default)', borderRadius: '8px', background: 'var(--color-canvas-subtle)', color: 'var(--color-fg-subtle)', fontSize: '0.875rem' }}>
            {features.length === 0 ? 'No features added yet.' : 'No recent activity found matching filters.'}
          </div>
        ) : (
          <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-canvas-subtle)' }}>
            <table className="gh-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Feature</th>
                  <th style={{ width: '20%' }}>Type</th>
                  <th style={{ width: '20%' }}>Author</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((f) => {
                  const author = f.authorId as any
                  const fType = f.type || 'FEATURE'
                  return (
                    <tr key={f._id.toString()}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>
                            {f.name}
                          </span>
                          {f.codebaseBranches && f.codebaseBranches.length > 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                              {f.codebaseBranches.map(b => `${b.codebaseName}:${b.branchName || 'main'}`).join(', ')}
                            </span>
                          ) : (
                            f.description && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                {f.description}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          border: '1px solid',
                          borderColor: fType === 'BUG FIX' ? 'var(--color-danger-emphasis)' :
                                       fType === 'FEATURE' ? 'var(--color-accent-emphasis)' :
                                       fType === 'UPDATE' ? 'var(--color-done-emphasis)' :
                                       fType === 'DISCARD' ? 'var(--color-border-default)' :
                                       'var(--color-attention-emphasis)',
                          color: fType === 'BUG FIX' ? 'var(--color-danger-fg)' :
                                 fType === 'FEATURE' ? 'var(--color-accent-fg)' :
                                 fType === 'UPDATE' ? 'var(--color-done-fg)' :
                                 fType === 'DISCARD' ? 'var(--color-fg-subtle)' :
                                 'var(--color-attention-fg)',
                          backgroundColor: fType === 'BUG FIX' ? 'var(--color-danger-muted)' :
                                           fType === 'FEATURE' ? 'var(--color-accent-muted)' :
                                           fType === 'UPDATE' ? 'var(--color-done-muted)' :
                                           fType === 'DISCARD' ? 'var(--color-neutral-muted)' :
                                           'var(--color-attention-muted)',
                          whiteSpace: 'nowrap',
                        }}>
                          {fType}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {author?.image ? (
                            <img
                              src={author.image}
                              alt={author.name ?? ''}
                              className="gh-avatar"
                              style={{ width: 20, height: 20 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'var(--color-accent-emphasis)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: '#fff',
                              }}
                            >
                              {getInitials(author?.name ?? 'U')}
                            </div>
                          )}
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-default)' }}>
                            {author?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge status={f.status} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-fg-subtle)', fontSize: '0.8125rem' }}>
                        {timeAgo(f.updatedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
