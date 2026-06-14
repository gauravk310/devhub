'use client'

import { useEffect, useState, use } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PieChart } from '@/components/ui/CustomCharts'
import { HardDrive, Scale, Archive, Compass, RefreshCw } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.max(0, Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k))))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DatabaseStoragePage({ params }: { params: Promise<{ projectId: string; databaseId: string }> }) {
  const { projectId, databaseId } = use(params)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStorageData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}/stats`)
      if (!res.ok) throw new Error('Failed to fetch storage analytics')
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
      fetchStorageData()
    }
  }, [projectId, databaseId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--color-danger-emphasis)', borderRadius: '8px', background: 'var(--color-danger-muted)', color: 'var(--color-danger-fg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Storage Analytics Error</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
      </div>
    )
  }

  const { dbStats, collections } = metrics
  const compressionRatio = dbStats.totalStorageSize > 0 
    ? (dbStats.totalDataSize / dbStats.totalStorageSize).toFixed(2) 
    : '1.00'

  const sortedCollections = [...collections].sort((a, b) => b.storageSize - a.storageSize)
  const pieData = sortedCollections.map((c) => ({
    label: c.name,
    value: c.storageSize,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Storage Summary Cards */}
      <div>
        <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem' }}>
          Storage Footprint
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="kpi-card">
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={18} color="var(--color-accent-fg)" />
              {formatBytes(dbStats.totalDataSize)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '0.25rem' }}>Total Data Size</span>
          </div>
          <div className="kpi-card">
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Archive size={18} color="var(--color-success-fg)" />
              {formatBytes(dbStats.totalStorageSize)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '0.25rem' }}>Compressed Disk Size</span>
          </div>
          <div className="kpi-card">
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} color="var(--color-done-fg)" />
              {compressionRatio}:1
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '0.25rem' }}>Compression Ratio</span>
          </div>
        </div>
      </div>

      {/* Visualizations and Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
            <Compass size={16} color="var(--color-accent-fg)" /> Space Allocation by Collection
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <PieChart data={pieData} height={160} />
          </div>
        </div>

        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Storage Breakdown
            </h3>
            <button onClick={() => { setLoading(true); fetchStorageData() }} className="gh-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '220px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedCollections.map((col) => {
              const pct = dbStats.totalStorageSize > 0 
                ? ((col.storageSize / dbStats.totalStorageSize) * 100).toFixed(1)
                : '0.0'
              return (
                <div key={col.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>{col.name}</span>
                    <span style={{ color: 'var(--color-fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                      {formatBytes(col.storageSize)} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--color-border-muted)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent-emphasis)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
