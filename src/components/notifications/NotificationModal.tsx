'use client'

import Modal from '@/components/ui/Modal'
import type { INotificationPopulated } from '@/types'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { useState } from 'react'

interface Props {
  notification: INotificationPopulated | null
  onClose: () => void
  onUpdate: (id: string, status: 'READ' | 'ACCEPTED' | 'DECLINED') => Promise<void>
}

export default function NotificationModal({ notification, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  if (!notification) return null

  const canAct =
    notification.type === 'PROJECT_INVITE' && notification.status === 'UNREAD'

  const handle = async (status: 'ACCEPTED' | 'DECLINED') => {
    setLoading(status)
    await onUpdate(notification._id.toString(), status)
    setLoading(null)
    onClose()
  }

  return (
    <Modal isOpen={!!notification} onClose={onClose} title={notification.title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Sender */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {notification.senderId?.image && (
            <img
              src={notification.senderId.image}
              alt=""
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            />
          )}
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
              {notification.senderId?.name}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>
              {timeAgo(notification.createdAt)}
            </p>
          </div>
        </div>

        {/* Message */}
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-fg-muted)',
          lineHeight: 1.6,
          margin: 0,
          padding: '0.75rem',
          background: 'var(--color-canvas-inset)',
          borderRadius: '6px',
          border: '1px solid var(--color-border-muted)',
        }}>
          {notification.message}
        </p>

        {/* Actions */}
        {canAct && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => handle('ACCEPTED')}
              disabled={!!loading}
              className="gh-btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <CheckCircle size={15} />
              {loading === 'ACCEPTED' ? 'Accepting…' : 'Accept'}
            </button>
            <button
              onClick={() => handle('DECLINED')}
              disabled={!!loading}
              className="gh-btn-danger"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <XCircle size={15} />
              {loading === 'DECLINED' ? 'Declining…' : 'Decline'}
            </button>
          </div>
        )}

        {!canAct && notification.status !== 'UNREAD' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-fg-subtle)', fontSize: '0.8125rem' }}>
            <Clock size={14} />
            Status: <strong style={{ color: 'var(--color-fg-muted)' }}>{notification.status}</strong>
          </div>
        )}
      </div>
    </Modal>
  )
}
