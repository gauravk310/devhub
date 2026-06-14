'use client'

import { useEffect, useState, use } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { BarChart } from '@/components/ui/CustomCharts'
import { Layers, Database, RefreshCw } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.max(0, Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k))))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DatabaseCollectionsPage({ params }: { params: Promise<{ projectId: string; databaseId: string }> }) {
  const { projectId, databaseId } = use(params)
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCollectionsData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}/stats`)
      if (!res.ok) throw new Error('Failed to fetch collections analytics')
      const json = await res.json()
      setCollections(json.data?.collections ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && databaseId) {
      fetchCollectionsData()
    }
  }, [projectId, databaseId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--color-danger-emphasis)', borderRadius: '8px', background: 'var(--color-danger-muted)', color: 'var(--color-danger-fg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Collections Error</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
      </div>
    )
  }

  const barChartData = collections
    .map((c) => ({ label: c.name, value: c.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
          <Layers size={16} color="var(--color-accent-fg)" /> Document Count Distribution (Top Collections)
        </h3>
        <BarChart data={barChartData} height={160} barColor="var(--color-accent-fg)" />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Collections Details
          </h2>
          <button onClick={() => { setLoading(true); fetchCollectionsData() }} className="gh-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            <RefreshCw size={12} /> Refresh Tables
          </button>
        </div>

        {collections.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--color-border-default)', borderRadius: '8px', background: 'var(--color-canvas-subtle)', color: 'var(--color-fg-subtle)' }}>
            No collections found in this database.
          </div>
        ) : (
          <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-canvas-subtle)' }}>
            <table className="gh-table">
              <thead>
                <tr>
                  <th>Collection Name</th>
                  <th>Documents</th>
                  <th>Avg Doc Size</th>
                  <th>Storage Size</th>
                  <th>Indexes</th>
                  <th style={{ textAlign: 'right' }}>Index Size</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((col) => (
                  <tr key={col.name}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={14} color="var(--color-fg-muted)" />
                        <span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>{col.name}</span>
                      </div>
                    </td>
                    <td>{col.count.toLocaleString()}</td>
                    <td>{formatBytes(col.avgObjSize || 0)}</td>
                    <td>{formatBytes(col.storageSize)}</td>
                    <td>{col.indexCount}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatBytes(col.indexSize)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
