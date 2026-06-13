'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { GitBranch, ExternalLink, Layers } from 'lucide-react'
import type { IProjectWithMembers, ICodebase } from '@/types'
import type { RepoStats } from '@/lib/github'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RepoAnalytics from '@/components/projects/RepoAnalytics'

export default function CodebasesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)

  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)

  const [selectedCodebase, setSelectedCodebase] = useState<ICodebase | null>(null)
  const [stats, setStats] = useState<RepoStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch project to get codebases list
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(j => {
        const p: IProjectWithMembers = j.data
        setProject(p)
        if (p?.codebases?.length) {
          setSelectedCodebase(p.codebases[0])
        }
      })
      .finally(() => setProjectLoading(false))
  }, [projectId])

  // Fetch stats whenever selected codebase changes
  const fetchStats = useCallback(async (codebase: ICodebase) => {
    setStatsLoading(true)
    setStatsError(null)
    setStats(null)
    try {
      const res = await fetch(`/api/github/repo-stats?repo=${encodeURIComponent(codebase.repoFullName)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch stats')
      setStats(json.data)
    } catch (err: any) {
      setStatsError(err.message ?? 'Unknown error')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCodebase) fetchStats(selectedCodebase)
  }, [selectedCodebase, fetchStats])

  // ─── Render ────────────────────────────────────────────────────────────────

  if (projectLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingSpinner size={28} />
      </div>
    )
  }

  const codebases = project?.codebases ?? []

  if (codebases.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '4rem 2rem', gap: '1rem', textAlign: 'center',
        border: '2px dashed var(--color-border-default)',
        borderRadius: '12px', background: 'var(--color-canvas-subtle)',
      }}>
        <Layers size={48} style={{ opacity: 0.25 }} />
        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-fg-default)' }}>
          No codebases linked
        </p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-fg-muted)', maxWidth: 400 }}>
          Link GitHub repositories to this project to see codebase contributions here.
          You can add codebases when creating or editing the project.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Codebase sub-tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border-default)',
        background: 'transparent',
        paddingBottom: '0',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {codebases.map((cb) => {
            const isActive = selectedCodebase?._id?.toString() === cb._id?.toString()
            return (
              <button
                key={cb._id.toString()}
                onClick={() => setSelectedCodebase(cb)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.85rem', fontWeight: isActive ? 600 : 400,
                  border: 'none',
                  borderBottom: isActive ? '2px solid #f78166' : '2px solid transparent',
                  background: 'transparent',
                  color: isActive ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  borderRadius: '6px 6px 0 0',
                  marginBottom: '-1px',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(110, 118, 129, 0.08)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-fg-default)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-fg-muted)';
                  }
                }}
              >
                <GitBranch size={14} style={{ opacity: isActive ? 1 : 0.7 }} />
                {cb.name || cb.repoFullName}
              </button>
            )
          })}
        </div>

        {/* Link to selected repo */}
        {selectedCodebase && (
          <a
            href={`https://github.com/${selectedCodebase.repoFullName}`}
            target="_blank" rel="noreferrer"
            className="gh-btn-secondary"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.375rem 0.75rem', fontSize: '0.82rem', fontWeight: 500,
              borderRadius: '6px', border: '1px solid var(--color-border-default)',
              color: 'var(--color-fg-default)', textDecoration: 'none',
              background: 'var(--color-canvas-subtle)',
              marginBottom: '0.375rem',
            }}
          >
            <ExternalLink size={12} />
            View on GitHub
          </a>
        )}
      </div>

      {/* Content area */}
      {statsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
          <LoadingSpinner size={28} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-fg-muted)' }}>
            Fetching contributions for <code style={{ fontFamily: 'monospace', color: 'var(--color-accent-fg)' }}>{selectedCodebase?.repoFullName}</code>…
          </p>
        </div>
      ) : statsError ? (
        <div style={{
          padding: '2rem', textAlign: 'center', borderRadius: '10px',
          background: 'var(--color-danger-muted)', border: '1px solid var(--color-danger-emphasis)',
          color: 'var(--color-danger-fg)', fontSize: '0.875rem',
        }}>
          <strong>Failed to load stats:</strong> {statsError}
          <br />
          <button
            onClick={() => selectedCodebase && fetchStats(selectedCodebase)}
            style={{
              marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: '6px',
              border: '1px solid var(--color-danger-emphasis)', background: 'transparent',
              color: 'var(--color-danger-fg)', cursor: 'pointer', fontSize: '0.82rem',
            }}
          >
            Retry
          </button>
        </div>
      ) : stats ? (
        <RepoAnalytics stats={stats} />
      ) : null}
    </div>
  )
}
