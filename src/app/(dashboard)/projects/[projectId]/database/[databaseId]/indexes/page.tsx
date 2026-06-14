'use client'

import { useEffect, useState, use } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Key, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.max(0, Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k))))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DatabaseIndexesPage({ params }: { params: Promise<{ projectId: string; databaseId: string }> }) {
  const { projectId, databaseId } = use(params)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchIndexes = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}/stats`)
      if (!res.ok) throw new Error('Failed to query index details')
      const json = await res.json()
      setMetrics(json.data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && databaseId) {
      fetchIndexes()
    }
  }, [projectId, databaseId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--color-danger-emphasis)', borderRadius: '8px', background: 'var(--color-danger-muted)', color: 'var(--color-danger-fg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Index Analytics Error</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
      </div>
    )
  }

  const { dbStats, collections = [] } = metrics

  const allIndexes: any[] = []
  const redundantIndexes: any[] = []
  const unusedIndexes: any[] = []

  collections.forEach((col: any) => {
    const idxs = col.indexes || []
    
    idxs.forEach((idx: any) => {
      allIndexes.push({
        collectionName: col.name,
        ...idx,
      })

      if (idx.name !== '_id_' && idx.usageCount === 0) {
        unusedIndexes.push({
          collectionName: col.name,
          ...idx,
        })
      }
    })

    for (let i = 0; i < idxs.length; i++) {
      const idxA = idxs[i]
      if (idxA.name === '_id_') continue
      const keysA = Object.keys(idxA.key)

      for (let j = 0; j < idxs.length; j++) {
        if (i === j) continue
        const idxB = idxs[j]
        const keysB = Object.keys(idxB.key)

        if (keysA.length < keysB.length) {
          let isPrefix = true
          for (let k = 0; k < keysA.length; k++) {
            if (keysA[k] !== keysB[k] || idxA.key[keysA[k]] !== idxB.key[keysB[k]]) {
              isPrefix = false
              break
            }
          }

          if (isPrefix && !idxA.unique) {
            redundantIndexes.push({
              collectionName: col.name,
              redundantIndex: idxA.name,
              compoundIndex: idxB.name,
              keys: keysA.join(', '),
            })
          }
        }
      }
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      {(redundantIndexes.length > 0 || unusedIndexes.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
          {redundantIndexes.length > 0 && (
            <div style={{ border: '1px solid var(--color-attention-emphasis)', borderRadius: '10px', background: 'var(--color-attention-muted)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <AlertTriangle size={16} color="var(--color-attention-fg)" /> Redundant Indexes ({redundantIndexes.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                {redundantIndexes.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--color-fg-default)' }}>
                    In <strong style={{ color: 'var(--color-accent-fg)' }}>{item.collectionName}</strong>: Index <code>{item.redundantIndex}</code> is redundant with <code>{item.compoundIndex}</code>.
                  </div>
                ))}
              </div>
            </div>
          )}

          {unusedIndexes.length > 0 && (
            <div style={{ border: '1px solid var(--color-accent-emphasis)', borderRadius: '10px', background: 'var(--color-accent-muted)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Lightbulb size={16} color="var(--color-accent-fg)" /> Unused Index Cleanup ({unusedIndexes.length})
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: 0 }}>
                Unused indexes degrade write latency. Consider removing them:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {unusedIndexes.slice(0, 4).map((idx, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', fontWeight: 600, background: 'var(--color-neutral-emphasis)', color: 'var(--color-fg-default)', padding: '0.125rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border-default)' }}>
                    {idx.collectionName}.{idx.name}
                  </span>
                ))}
                {unusedIndexes.length > 4 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', alignSelf: 'center' }}>
                    + {unusedIndexes.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Index Inventory ({allIndexes.length})
          </h2>
          <button onClick={() => { setLoading(true); fetchIndexes() }} className="gh-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-canvas-subtle)' }}>
          <table className="gh-table">
            <thead>
              <tr>
                <th>Index Name</th>
                <th>Collection</th>
                <th>Keys Shape</th>
                <th>Type</th>
                <th>Usage Count</th>
                <th style={{ textAlign: 'right' }}>Unique</th>
              </tr>
            </thead>
            <tbody>
              {allIndexes.map((idx, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Key size={13} color="var(--color-fg-subtle)" />
                      <span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>{idx.name}</span>
                    </div>
                  </td>
                  <td>{idx.collectionName}</td>
                  <td>
                    <code style={{ fontSize: '0.75rem', color: 'var(--color-accent-fg)' }}>
                      {JSON.stringify(idx.key)}
                    </code>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      border: '1px solid var(--color-border-default)',
                      color: idx.name === '_id_' ? 'var(--color-fg-subtle)' : 'var(--color-fg-default)',
                      backgroundColor: idx.name === '_id_' ? 'transparent' : 'var(--color-neutral-emphasis)',
                    }}>
                      {idx.name === '_id_' ? 'Primary' : 'Secondary'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: idx.usageCount > 0 ? 'var(--color-success-fg)' : 'var(--color-fg-subtle)' }}>
                    {idx.name === '_id_' ? '—' : idx.usageCount.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: idx.unique ? 'var(--color-success-fg)' : 'var(--color-fg-subtle)', fontWeight: idx.unique ? 600 : 400 }}>
                    {idx.unique ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
