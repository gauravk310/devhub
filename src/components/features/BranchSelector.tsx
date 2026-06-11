'use client'

import { useEffect, useState } from 'react'
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

  return (
    <div>
      <label className="gh-label">{codebaseName} Branch</label>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0' }}>
          <LoadingSpinner size={14} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>Loading branches…</span>
        </div>
      ) : (
        <select
          className="gh-select"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No Branch</option>
          {branches.map((b) => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
