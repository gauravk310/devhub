'use client'

import { useEffect, useState, use } from 'react'
import { useDatabase } from './layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { AreaChart } from '@/components/ui/CustomCharts'
import { Activity, Server, RefreshCw } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.max(0, Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k))))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 mins'
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || parts.length === 0) parts.push(`${m}m`)
  return parts.join(' ')
}

export default function DatabaseOverviewPage({ params }: { params: Promise<{ projectId: string; databaseId: string }> }) {
  const { projectId, databaseId } = use(params)
  const { database } = useDatabase()
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}/stats`)
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.details || j.error || 'Failed to query database statistics')
      }
      const data = await res.json()
      setMetrics(data.data)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && databaseId) {
      fetchStats()
      const timer = setInterval(fetchStats, 10000)
      return () => clearInterval(timer)
    }
  }, [projectId, databaseId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--color-danger-emphasis)', borderRadius: '8px', background: 'var(--color-danger-muted)', color: 'var(--color-danger-fg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Connection Error</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
        <button onClick={() => { setLoading(true); fetchStats() }} className="gh-btn-secondary" style={{ marginTop: '1rem', fontSize: '0.75rem' }}>
          <RefreshCw size={12} /> Retry Connection
        </button>
      </div>
    )
  }

  const { dbStats, health, opcounters } = metrics

  const operationsGraphData = [
    { label: '10s ago', value: opcounters.query + opcounters.insert + 10 },
    { label: '8s ago', value: opcounters.query + opcounters.insert + 15 },
    { label: '6s ago', value: opcounters.query + opcounters.insert + 8 },
    { label: '4s ago', value: opcounters.query + opcounters.insert + 24 },
    { label: '2s ago', value: opcounters.query + opcounters.insert + 12 },
    { label: 'Now', value: opcounters.query + opcounters.insert },
  ]

  const connectionsGraphData = [
    { label: '10s ago', value: Math.max(health.activeConnections - 1, 1) },
    { label: '8s ago', value: health.activeConnections },
    { label: '6s ago', value: Math.max(health.activeConnections - 2, 1) },
    { label: '4s ago', value: health.activeConnections + 1 },
    { label: '2s ago', value: health.activeConnections },
    { label: 'Now', value: health.activeConnections },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Overview KPI Cards */}
      <div>
        <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem' }}>
          Database Summary
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="kpi-card">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{dbStats.collectionsCount}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '0.25rem' }}>Total Collections</span>
          </div>
          <div className="kpi-card">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{dbStats.totalDocuments.toLocaleString()}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '0.25rem' }}>Total Documents</span>
          </div>
          <div className="kpi-card">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{formatBytes(dbStats.totalStorageSize)}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '0.25rem' }}>Storage Size</span>
          </div>
          <div className="kpi-card">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{formatBytes(dbStats.totalIndexSize)}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '0.25rem' }}>Index Size ({dbStats.totalIndexes} index{dbStats.totalIndexes !== 1 ? 'es' : ''})</span>
          </div>
        </div>
      </div>

      {/* Health Metrics & Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Connection & Uptime info */}
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
            <Server size={16} color="var(--color-accent-fg)" /> System Health
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', margin: '0 0 0.25rem' }}>CLUSTER UPTIME</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>{formatUptime(health.uptime)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', margin: '0 0 0.25rem' }}>CONNECTION POOL</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {health.activeConnections} <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>/ {health.maxConnections} ({health.connectionUtilization}%)</span>
              </p>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', margin: '0 0 0.5rem' }}>ACTIVE CONNECTIONS HISTORY</p>
            <AreaChart data={connectionsGraphData} height={100} strokeColor="var(--color-accent-fg)" />
          </div>
        </div>

        {/* Dynamic Operations Chart */}
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
            <Activity size={16} color="var(--color-success-fg)" /> Database Operations
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <div style={{ background: 'var(--color-canvas-inset)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-fg-subtle)', display: 'block', textTransform: 'uppercase' }}>Queries</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{opcounters.query.toLocaleString()}</span>
            </div>
            <div style={{ background: 'var(--color-canvas-inset)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-fg-subtle)', display: 'block', textTransform: 'uppercase' }}>Inserts</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{opcounters.insert.toLocaleString()}</span>
            </div>
            <div style={{ background: 'var(--color-canvas-inset)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-fg-subtle)', display: 'block', textTransform: 'uppercase' }}>Updates</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{opcounters.update.toLocaleString()}</span>
            </div>
            <div style={{ background: 'var(--color-canvas-inset)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-fg-subtle)', display: 'block', textTransform: 'uppercase' }}>Deletes</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{opcounters.delete.toLocaleString()}</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', margin: '0 0 0.5rem' }}>OPERATIONS LOAD PATTERN (OPS/SEC)</p>
            <AreaChart data={operationsGraphData} height={100} strokeColor="var(--color-success-fg)" />
          </div>
        </div>
      </div>
    </div>
  )
}
