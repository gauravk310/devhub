'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const iconMap = {
    success: <CheckCircle size={18} color="var(--color-success-fg)" />,
    error: <AlertCircle size={18} color="var(--color-danger-fg)" />,
    info: <Info size={18} color="var(--color-accent-fg)" />,
  }

  const borderLeftColor = {
    success: 'var(--color-success-fg)',
    error: 'var(--color-danger-fg)',
    info: 'var(--color-accent-fg)',
  }[type]

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: '280px',
        maxWidth: '420px',
        padding: '1rem 1.25rem',
        background: 'var(--color-canvas-overlay)',
        border: '1px solid var(--color-border-default)',
        borderLeft: `4px solid ${borderLeftColor}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(1, 4, 9, 0.7)',
        animation: 'slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        color: 'var(--color-fg-default)',
      }}
    >
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Icon */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {iconMap[type]}
      </div>

      {/* Message */}
      <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: 'var(--color-fg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'background-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-border-muted)'
          e.currentTarget.style.color = 'var(--color-fg-default)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--color-fg-subtle)'
        }}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}
