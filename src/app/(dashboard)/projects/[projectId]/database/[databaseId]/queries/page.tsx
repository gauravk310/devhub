'use client'

import { useEffect, useState, use } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { AreaChart } from '@/components/ui/CustomCharts'
import { SquareTerminal, Flame, ShieldAlert, CheckCircle2, Copy, RefreshCw } from 'lucide-react'

export default function DatabaseQueriesPage({ params }: { params: Promise<{ projectId: string; databaseId: string }> }) {
  const { projectId, databaseId } = use(params)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchQueries = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}/queries`)
      if (!res.ok) throw new Error('Failed to query slow operation log')
      const json = await res.json()
      setProfileData(json.data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && databaseId) {
      fetchQueries()
    }
  }, [projectId, databaseId])

  const copyShellCommand = () => {
    navigator.clipboard.writeText('db.setProfilingLevel(1, { slowms: 100 })')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--color-danger-emphasis)', borderRadius: '8px', background: 'var(--color-danger-muted)', color: 'var(--color-danger-fg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Profiler Error</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
      </div>
    )
  }

  const { isProfilingEnabled, profilingLevel, slowQueries = [] } = profileData

  const latencyPoints = slowQueries
    .slice(0, 10)
    .reverse()
    .map((q: any, i: number) => ({
      label: `${i + 1}`,
      value: q.execTimeMs,
    }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      <div 
        style={{ 
          border: '1px solid',
          borderColor: isProfilingEnabled ? 'var(--color-success-emphasis)' : 'var(--color-attention-emphasis)',
          borderRadius: '10px',
          background: isProfilingEnabled ? 'var(--color-success-muted)' : 'var(--color-attention-muted)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          {isProfilingEnabled ? (
            <CheckCircle2 size={20} color="var(--color-success-fg)" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
          ) : (
            <ShieldAlert size={20} color="var(--color-attention-fg)" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Database Profiler status: {isProfilingEnabled ? `Active (Level ${profilingLevel})` : 'Inactive'}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: 0, maxWidth: '560px' }}>
              {isProfilingEnabled 
                ? 'Queries running longer than 100ms are being recorded into system.profile and analyzed below.' 
                : 'Profiling is disabled on this cluster. We cannot query the slow operations logs.'}
            </p>
          </div>
        </div>
        {!isProfilingEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-canvas-inset)', border: '1px solid var(--color-border-default)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
            <code style={{ fontSize: '0.75rem', color: 'var(--color-accent-fg)' }}>db.setProfilingLevel(1, &#123; slowms: 100 &#125;)</code>
            <button onClick={copyShellCommand} className="gh-btn-secondary" style={{ padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {copied ? 'Copied' : <Copy size={12} />}
            </button>
          </div>
        )}
      </div>

      {isProfilingEnabled && slowQueries.length > 0 && (
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
            <Flame size={16} color="var(--color-danger-fg)" /> Recent Slow Query Latencies (ms)
          </h3>
          <AreaChart data={latencyPoints} height={140} strokeColor="var(--color-danger-fg)" />
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Query Logs
          </h2>
          <button onClick={() => { setLoading(true); fetchQueries() }} className="gh-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            <RefreshCw size={12} /> Refresh logs
          </button>
        </div>

        {slowQueries.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', border: '1px solid var(--color-border-default)', borderRadius: '8px', background: 'var(--color-canvas-subtle)', color: 'var(--color-fg-subtle)' }}>
            <SquareTerminal size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>No Slow Operations Recorded</p>
            <p style={{ margin: 0, fontSize: '0.8125rem' }}>
              {isProfilingEnabled ? 'No queries exceeded the slowms threshold yet.' : 'Please enable profiling to start capturing logs.'}
            </p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-canvas-subtle)' }}>
            <table className="gh-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Query Pattern</th>
                  <th style={{ width: '15%' }}>Collection</th>
                  <th style={{ width: '12%' }}>Latency</th>
                  <th style={{ width: '13%' }}>Scanned Docs</th>
                  <th style={{ width: '20%' }}>Index Utilized</th>
                </tr>
              </thead>
              <tbody>
                {slowQueries.map((q: any, i: number) => (
                  <tr key={i}>
                    <td style={{ wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={q.queryPattern}>
                      {q.queryPattern}
                    </td>
                    <td>{q.collection}</td>
                    <td style={{ fontWeight: 600, color: q.execTimeMs > 500 ? 'var(--color-danger-fg)' : 'var(--color-attention-fg)' }}>
                      {q.execTimeMs} ms
                    </td>
                    <td>{q.docsExamined.toLocaleString()}</td>
                    <td>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: q.indexUsed === 'COLLSCAN' ? 'var(--color-danger-emphasis)' : 'var(--color-success-emphasis)',
                        color: q.indexUsed === 'COLLSCAN' ? 'var(--color-danger-fg)' : 'var(--color-success-fg)',
                        backgroundColor: q.indexUsed === 'COLLSCAN' ? 'var(--color-danger-muted)' : 'var(--color-success-muted)'
                      }}>
                        {q.indexUsed}
                      </span>
                    </td>
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
