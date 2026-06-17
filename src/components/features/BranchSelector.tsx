'use client'

import { useEffect, useState, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import type { GitHubBranch } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  codebaseName: string
  repoFullName: string
  value: string | null
  onChange: (branch: string | null) => void
}

export default function BranchSelector({ codebaseName, repoFullName, value, onChange }: Props) {
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const [owner, repo] = repoFullName.split('/')
    if (!owner || !repo) return
    setLoading(true)
    fetch(`/api/github/repos/${owner}/${repo}/branches`)
      .then((r) => r.json())
      .then((j) => setBranches(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [repoFullName])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="gh-label" style={{ fontWeight: 600 }}>
        {codebaseName}{' '}
        <span style={{ color: 'var(--color-fg-muted)', fontWeight: 400 }}>
          - {repoFullName} {loading ? 'loading branches...' : `(${branches.length} branches)`}
        </span>
      </label>
      
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
          height: '34px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {loading ? 'Loading branches…' : value ?? 'Select branch…'}
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
          {/* Search Input */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={13} color="var(--color-fg-muted)" />
            <input
              autoFocus
              placeholder="Search branches…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: 'var(--color-fg-default)', width: '100%' }}
            />
          </div>

          {/* List Options */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {/* No Branch option */}
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
                setSearch('')
              }}
              style={{
                width: '100%',
                display: 'flex',
                padding: '0.5rem 0.75rem',
                border: 'none',
                background: value === null ? 'var(--color-accent-muted)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: '1px solid var(--color-border-muted)',
                fontSize: '0.875rem',
                color: 'var(--color-fg-subtle)',
              }}
              onMouseEnter={(e) => { if (value !== null) e.currentTarget.style.background = 'var(--color-border-muted)' }}
              onMouseLeave={(e) => { if (value !== null) e.currentTarget.style.background = 'transparent' }}
            >
              No Branch
            </button>

            {/* Suggested options */}
            {filtered.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => {
                  onChange(b.name)
                  setOpen(false)
                  setSearch('')
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  background: value === b.name ? 'var(--color-accent-muted)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderBottom: '1px solid var(--color-border-muted)',
                  fontSize: '0.875rem',
                  color: 'var(--color-fg-default)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                onMouseEnter={(e) => { if (value !== b.name) e.currentTarget.style.background = 'var(--color-border-muted)' }}
                onMouseLeave={(e) => { if (value !== b.name) e.currentTarget.style.background = 'transparent' }}
              >
                {b.name}
              </button>
            ))}

            {filtered.length === 0 && (
              <p style={{ padding: '0.75rem 1rem', color: 'var(--color-fg-muted)', fontSize: '0.875rem', margin: 0 }}>
                No branches found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
