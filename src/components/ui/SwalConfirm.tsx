'use client'

import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'

interface SwalConfirmProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

export default function SwalConfirm({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Yes, delete it',
  cancelText = 'Cancel',
  loading = false,
}: SwalConfirmProps) {
  const handleConfirm = () => {
    if (loading) return
    onConfirm()
    // Only auto-close if loading prop was not explicitly provided
    // (if loading is used, parent controls closing after async action completes)
  }

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.75rem 0' }}>
        {/* Warning Icon (SweetAlert Style) */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-danger-muted)',
          border: '2px solid var(--color-danger-fg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-danger-fg)',
          marginBottom: '1.25rem',
        }}>
          <AlertTriangle size={28} />
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--color-fg-default)',
          margin: '0 0 0.5rem 0',
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-fg-muted)',
          lineHeight: '1.5',
          margin: '0 0 1.5rem 0',
          maxWidth: '300px',
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.45rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-canvas-subtle)',
              color: 'var(--color-fg-default)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background-color 0.15s',
              minWidth: '95px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-border-muted)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-canvas-subtle)' }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: '0.45rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-danger-emphasis)',
              color: 'var(--color-fg-on-emphasis)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.85 : 1,
              transition: 'background-color 0.15s',
              minWidth: '95px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-danger-fg)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-danger-emphasis)' }}
          >
            {loading ? (
              <>
                <LoadingSpinner size={14} color="#ffffff" />
                <span>Updating…</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
