'use client'

import type { IFeaturePopulated, ICodebase, FeatureStatus } from '@/types'
import FeatureStatusBadge from './FeatureStatusBadge'
import { formatDate, truncate, getInitials } from '@/lib/utils'
import { Trash2, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Props {
  features: IFeaturePopulated[]
  codebases: ICodebase[]
  projectId: string
  ownerId: string
  onAddFeature: () => void
  onStatusUpdated: (featureId: string, status: FeatureStatus) => void
  onDelete: (featureId: string) => void
}

export default function FeaturesTable({
  features, codebases, projectId, ownerId, onAddFeature, onStatusUpdated, onDelete,
}: Props) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id === ownerId

  if (features.length === 0) {
    return (
      <div className="gh-empty-state">
        <Plus size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontWeight: 600 }}>No features yet</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-subtle)' }}>Add the first feature to get started.</p>
        <button onClick={onAddFeature} className="gh-btn-primary">
          <Plus size={14} /> Add Feature
        </button>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-default)', borderRadius: '8px' }}>
      <table className="gh-table" style={{ minWidth: '900px' }}>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Type</th>
            <th>Author</th>
            {codebases.map((cb) => <th key={cb._id.toString()}>{cb.name} Branch</th>)}
            <th>DB Change</th>
            <th>ENV Change</th>
            <th>Deploy Date</th>
            <th>Status</th>
            {isOwner && <th></th>}
          </tr>
        </thead>
        <tbody>
          {features.map((f) => {
            const fType = f.type || 'FEATURE'
            return (
              <tr key={f._id.toString()}>
                {/* Name + description */}
                <td style={{ maxWidth: '200px' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-fg-default)' }}>{f.name}</p>
                  {f.description && (
                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-fg-muted)' }} title={f.description}>
                      {truncate(f.description, 50)}
                    </p>
                  )}
                </td>

                {/* Type */}
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

                {/* Author */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {f.authorId?.image ? (
                      <img src={f.authorId.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} title={f.authorId.name} />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-accent-emphasis)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>
                        {getInitials(f.authorId?.name ?? 'U')}
                      </div>
                    )}
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>{f.authorId?.name}</span>
                  </div>
                </td>

                {/* Dynamic codebase branch columns */}
                {codebases.map((cb) => {
                  const cbBranch = f.codebaseBranches.find(
                    (b) => b.codebaseId.toString() === cb._id.toString()
                  )
                  return (
                    <td key={cb._id.toString()}>
                      <span style={{ fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: cbBranch?.branchName ? 'var(--color-success-fg)' : 'var(--color-fg-subtle)' }}>
                        {cbBranch?.branchName ?? '— No Branch'}
                      </span>
                    </td>
                  )
                })}

                <td style={{ fontSize: '0.8125rem', color: f.dbChange ? 'var(--color-attention-fg)' : 'var(--color-fg-subtle)' }}>
                  {f.dbChange || '—'}
                </td>
                <td style={{ fontSize: '0.8125rem', color: f.envChange ? 'var(--color-attention-fg)' : 'var(--color-fg-subtle)' }}>
                  {f.envChange || '—'}
                </td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(f.deploymentDate)}
                </td>
                <td>
                  <FeatureStatusBadge
                    status={f.status}
                    featureId={f._id.toString()}
                    projectId={projectId}
                    onUpdated={onStatusUpdated}
                  />
                </td>
                {isOwner && (
                  <td>
                    <button
                      onClick={() => onDelete(f._id.toString())}
                      title="Delete feature"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-fg-subtle)', transition: 'color 0.15s, background 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger-fg)'; e.currentTarget.style.background = 'var(--color-danger-muted)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-fg-subtle)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
