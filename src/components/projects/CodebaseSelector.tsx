'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import type { GitHubRepo } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  value: GitHubRepo | null
  onChange: (repo: GitHubRepo | null) => void
  repos: GitHubRepo[]
  loading?: boolean
}

export default function CodebaseSelector({ value, onChange, repos, loading }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.375rem 0.75rem',
          fontSize: '0.875rem',
          borderRadius: '6px',
          border: '1px solid var(--color-border-default)',
          background: 'var(--color-canvas-default)',
          color: value ? 'var(--color-fg-default)' : 'var(--color-fg-subtle)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {loading ? 'Loading repos…' : value?.full_name ?? 'Select repository…'}
        </span>
        {loading ? <LoadingSpinner size={14} /> : <ChevronDown size={14} color="var(--color-fg-muted)" />}
      </button>

      {open && !loading && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--color-canvas-overlay)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '8px',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(1,4,9,0.5)',
            animation: 'slide-down 0.15s ease-out',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={13} color="var(--color-fg-muted)" />
            <input
              autoFocus
              placeholder="Search repos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: 'var(--color-fg-default)', width: '100%' }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '0.75rem 1rem', color: 'var(--color-fg-muted)', fontSize: '0.875rem', margin: 0 }}>
                No repos found
              </p>
            ) : (
              filtered.map((repo) => (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => { onChange(repo); setOpen(false); setSearch('') }}
                  style={{
                    width: '100%', display: 'flex', flexDirection: 'column',
                    padding: '0.5rem 0.75rem', border: 'none',
                    background: value?.id === repo.id ? 'var(--color-accent-muted)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid var(--color-border-muted)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (value?.id !== repo.id) e.currentTarget.style.background = 'var(--color-border-muted)' }}
                  onMouseLeave={(e) => { if (value?.id !== repo.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-fg-default)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {repo.full_name}
                  </span>
                  {repo.description && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {repo.description}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
