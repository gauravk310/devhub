'use client'

import { useEffect, useState, use } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Network, Server, Activity, RefreshCw } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

export default function DatabaseReplicationPage({ params }: { params: Promise<{ projectId: string; databaseId: string }> }) {
  const { projectId, databaseId } = use(params)
  const [replication, setReplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReplicationStats = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}/stats`)
      if (!res.ok) throw new Error('Failed to retrieve replication status')
      const json = await res.json()
      setReplication(json.data?.health?.replicationStatus ?? { isReplicaSet: false })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && databaseId) {
      fetchReplicationStats()
    }
  }, [projectId, databaseId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', border: '1px solid var(--color-danger-emphasis)', borderRadius: '8px', background: 'var(--color-danger-muted)', color: 'var(--color-danger-fg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>Replication Info Error</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
      </div>
    )
  }

  const { isReplicaSet, setName, members = [] } = replication

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
      <div 
        style={{ 
          border: '1px solid var(--color-border-default)', 
          borderRadius: '10px', 
          background: 'var(--color-canvas-subtle)', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
          <Network size={16} color="var(--color-accent-fg)" /> Replication Topology
        </h3>

        {!isReplicaSet ? (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--color-canvas-inset)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border-muted)' }}>
            <Server size={24} color="var(--color-fg-subtle)" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, margin: '0 0 0.125rem', color: '#ffffff', fontSize: '0.875rem' }}>Standalone Instance</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: 0 }}>
                This database cluster is running in standalone mode (no replica sets configured). Storage growth and operational analytics remain active.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)', display: 'block', textTransform: 'uppercase' }}>REPLICA SET NAME</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-accent-fg)' }}>{setName}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)', display: 'block', textTransform: 'uppercase' }}>MEMBERS</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>{members.length} nodes</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontWeight: 600 }}>CLUSTER MEMBERS</span>
                <button onClick={() => { setLoading(true); fetchReplicationStats() }} className="gh-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  <RefreshCw size={12} /> Sync Nodes
                </button>
              </div>

              <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-canvas-inset)' }}>
                <table className="gh-table">
                  <thead>
                    <tr>
                      <th>Node Address</th>
                      <th>Role</th>
                      <th>Health</th>
                      <th>Uptime</th>
                      <th style={{ textAlign: 'right' }}>Last Optime Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member: any) => (
                      <tr key={member.name}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Server size={13} color="var(--color-fg-subtle)" />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: '#ffffff' }}>{member.name}</span>
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
                            borderColor: member.stateStr === 'PRIMARY' ? 'var(--color-success-emphasis)' : 
                                         member.stateStr === 'SECONDARY' ? 'var(--color-accent-emphasis)' : 
                                         'var(--color-border-default)',
                            color: member.stateStr === 'PRIMARY' ? 'var(--color-success-fg)' : 
                                   member.stateStr === 'SECONDARY' ? 'var(--color-accent-fg)' : 
                                   'var(--color-fg-subtle)',
                            backgroundColor: member.stateStr === 'PRIMARY' ? 'var(--color-success-muted)' : 
                                             member.stateStr === 'SECONDARY' ? 'var(--color-accent-muted)' : 
                                             'var(--color-neutral-muted)',
                          }}>
                            {member.stateStr}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: member.health === 1 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)' }}>
                            <Activity size={12} /> {member.health === 1 ? 'Healthy' : 'Unhealthy'}
                          </span>
                        </td>
                        <td>{member.uptime ? `${Math.round(member.uptime / 3600).toLocaleString()} hrs` : '—'}</td>
                        <td style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
                          {member.optimeDate ? timeAgo(member.optimeDate) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
