'use client'

import { useState, useRef, useEffect } from 'react'
import type { FeatureStatus } from '@/types'
import Badge from '@/components/ui/Badge'
import { ChevronDown } from 'lucide-react'
import SwalConfirm from '@/components/ui/SwalConfirm'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const ALL_STATUSES: FeatureStatus[] = ['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD']

interface Props {
  status: FeatureStatus
  featureId: string
  projectId: string
  onUpdated: (featureId: string, newStatus: FeatureStatus, deploymentDate?: Date | null) => void
  readonly?: boolean
}

export default function FeatureStatusBadge({ status, featureId, projectId, onUpdated, readonly }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [pendingStatus, setPendingStatus] = useState<FeatureStatus | null>(null)
  const [deployDate, setDeployDate] = useState<string>(() => new Date().toISOString().split('T')[0])

  const handleDropdownSelect = (newStatus: FeatureStatus) => {
    if (newStatus === status) { setOpen(false); return }
    if (newStatus === 'DEPLOYED') {
      setDeployDate(new Date().toISOString().split('T')[0])
    }
    setPendingStatus(newStatus)
    setOpen(false)
  }

  const handleConfirmChange = async () => {
    if (!pendingStatus) return
    setLoading(true)
    try {
      const payload: { status: FeatureStatus; deploymentDate: Date | null } = {
        status: pendingStatus,
        deploymentDate: pendingStatus === 'DEPLOYED' ? (deployDate ? new Date(deployDate) : new Date()) : null
      }
      const res = await fetch(`/api/projects/${projectId}/features/${featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onUpdated(featureId, pendingStatus, payload.deploymentDate)
      } else {
        const j = await res.json()
        alert(j.error || 'Failed to update status')
      }
    } catch (err) {
      console.error('Failed to update status:', err)
      alert((err as Error).message || 'Failed to update status')
    } finally {
      setLoading(false)
      setPendingStatus(null)
    }
  }

  if (readonly) return <Badge status={status} />

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'transparent',
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          padding: '2px 4px',
          borderRadius: '6px',
          opacity: loading ? 0.75 : 1,
          transition: 'all 0.15s ease',
        }}
        title={loading ? 'Updating status…' : 'Change status'}
      >
        <Badge status={status} />
        {loading ? (
          <LoadingSpinner size={12} color="var(--color-accent-fg)" />
        ) : (
          <ChevronDown size={12} color="var(--color-fg-subtle)" />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: 'var(--color-canvas-overlay)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '8px',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(1,4,9,0.5)',
            animation: 'slide-down 0.15s ease-out',
            overflow: 'hidden',
            minWidth: '130px',
          }}
        >
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleDropdownSelect(s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '0.375rem 0.75rem', border: 'none',
                background: s === status ? 'var(--color-border-muted)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (s !== status) e.currentTarget.style.background = 'var(--color-border-muted)' }}
              onMouseLeave={(e) => { if (s !== status) e.currentTarget.style.background = 'transparent' }}
            >
              <Badge status={s} size="sm" />
            </button>
          ))}
        </div>
      )}

      <SwalConfirm
        isOpen={pendingStatus !== null && pendingStatus !== 'DEPLOYED'}
        onClose={() => { if (!loading) setPendingStatus(null) }}
        onConfirm={handleConfirmChange}
        loading={loading}
        title="Change Feature Status?"
        message={`Are you sure you want to change the status of this feature from ${status} to ${pendingStatus || ''}?`}
        confirmText="Change Status"
        cancelText="Cancel"
      />

      <Modal
        isOpen={pendingStatus === 'DEPLOYED'}
        onClose={() => { if (!loading) setPendingStatus(null) }}
        title="Set Deployment Date"
        maxWidth="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="gh-label" style={{ marginBottom: '0.375rem', display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>
              Deployment Date <span style={{ color: 'var(--color-danger-fg)' }}>*</span>
            </label>
            <input
              type="date"
              className="gh-input"
              value={deployDate}
              onChange={(e) => setDeployDate(e.target.value)}
              disabled={loading}
              required
            />
            {!deployDate && (
              <span style={{ color: 'var(--color-danger-fg)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                Deployment date is required.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="gh-btn-secondary"
              onClick={() => { if (!loading) setPendingStatus(null) }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="gh-btn-primary"
              onClick={handleConfirmChange}
              disabled={loading || !deployDate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size={14} color="#ffffff" />
                  <span>Updating…</span>
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
