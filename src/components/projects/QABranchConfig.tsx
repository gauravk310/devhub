'use client'

import { useEffect, useState } from 'react'
import type { ICodebase, GitHubBranch } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  codebases: ICodebase[]
  qaBranches: Record<string, string> // codebaseId -> branchName
  onChange: (codebaseId: string, branch: string) => void
}

export default function QABranchConfig({ codebases, qaBranches, onChange }: Props) {
  const [branches, setBranches] = useState<Record<string, GitHubBranch[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    codebases.forEach(async (cb) => {
      const [owner, repo] = cb.repoFullName.split('/')
      if (!owner || !repo) return
      setLoading((l) => ({ ...l, [cb._id.toString()]: true }))
      try {
        const res = await fetch(`/api/github/repos/${owner}/${repo}/branches`)
        const json = await res.json()
        setBranches((b) => ({ ...b, [cb._id.toString()]: json.data ?? [] }))
      } finally {
        setLoading((l) => ({ ...l, [cb._id.toString()]: false }))
      }
    })
  }, [codebases])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {codebases.map((cb) => {
        const id = cb._id.toString()
        return (
          <div key={id}>
            <label className="gh-label">
              {cb.name} QA Branch
            </label>
            {loading[id] ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                <LoadingSpinner size={14} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>Loading branches…</span>
              </div>
            ) : (
              <select
                className="gh-select"
                value={qaBranches[id] ?? ''}
                onChange={(e) => onChange(id, e.target.value)}
              >
                <option value="">— Select QA branch —</option>
                {(branches[id] ?? []).map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}
