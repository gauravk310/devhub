'use client'

import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface SwalConfirmProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

export default function SwalConfirm({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Yes, delete it',
  cancelText = 'Cancel',
}: SwalConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="400px">
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
            style={{
              padding: '0.45rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-canvas-subtle)',
              color: 'var(--color-fg-default)',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              minWidth: '95px',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border-muted)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-canvas-subtle)'}
          >
            {cancelText}
          </button>
          
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            style={{
              padding: '0.45rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-danger-emphasis)',
              color: 'var(--color-fg-on-emphasis)',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              minWidth: '95px',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-danger-fg)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-danger-emphasis)'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
