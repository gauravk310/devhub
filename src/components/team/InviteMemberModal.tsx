'use client'

import { useState, useRef, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import type { PublicUser } from '@/types'
import { Search, UserPlus, X } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getInitials } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onInvited: () => void
}

export default function InviteMemberModal({ isOpen, onClose, projectId, onInvited }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicUser[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<PublicUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json.data ?? [])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query])

  const handleClose = () => {
    setQuery(''); setResults([]); setSelected(null); setError(''); setSuccess('')
    onClose()
  }

  const handleInvite = async () => {
    if (!selected) return
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/projects/${projectId}/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: selected.email }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      setSuccess(`Invite sent to ${selected.name}!`)
      setSelected(null); setQuery('')
      onInvited()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search */}
        <div>
          <label className="gh-label">Search by email</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--color-fg-subtle)" style={{ position: 'absolute', left: '0.75rem' }} />
            <input
              className="gh-input"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
              placeholder="user@example.com"
              style={{ paddingLeft: '2.25rem' }}
              autoFocus
            />
            {searching && <div style={{ position: 'absolute', right: '0.75rem' }}><LoadingSpinner size={14} /></div>}
          </div>
          {/* Results dropdown */}
          {results.length > 0 && !selected && (
            <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden', marginTop: '0.25rem', animation: 'slide-down 0.15s ease-out' }}>
              {results.map((u) => (
                <button
                  key={u._id.toString()}
                  type="button"
                  onClick={() => { setSelected(u); setQuery(u.email); setResults([]) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid var(--color-border-muted)', transition: 'background 0.1s', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {u.image ? (
                    <img src={u.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-emphasis)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                      {getInitials(u.name)}
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>{u.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected user chip */}
        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--color-accent-muted)', borderRadius: '8px', border: '1px solid var(--color-accent-emphasis)' }}>
            {selected.image && <img src={selected.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
            <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-fg-default)', fontWeight: 600 }}>{selected.name}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>{selected.email}</span>
            <button type="button" onClick={() => { setSelected(null); setQuery('') }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)', display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {error && <p style={{ color: 'var(--color-danger-fg)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
        {success && <p style={{ color: 'var(--color-success-fg)', fontSize: '0.875rem', margin: 0 }}>{success}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleClose} className="gh-btn-secondary">Cancel</button>
          <button type="button" onClick={handleInvite} className="gh-btn-primary" disabled={!selected || submitting}>
            {submitting ? <><LoadingSpinner size={14} color="#fff" /> Sending…</> : <><UserPlus size={14} /> Send Invite</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}
