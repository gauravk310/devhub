'use client'

import { useEffect, useState } from 'react'
import NotificationsTable from '@/components/notifications/NotificationsTable'
import NotificationModal from '@/components/notifications/NotificationModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { INotificationPopulated, NotificationStatus } from '@/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotificationPopulated[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<INotificationPopulated | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/notifications')
    const json = await res.json()
    setNotifications(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleUpdate = async (id: string, status: 'READ' | 'ACCEPTED' | 'DECLINED') => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n._id.toString() === id ? { ...n, status: status as NotificationStatus } : n))
    )
  }

  const handleSelect = async (n: INotificationPopulated) => {
    setSelected(n)
    if (n.status === 'UNREAD') await handleUpdate(n._id.toString(), 'READ')
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
        Notifications
      </h1>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <LoadingSpinner size={28} />
        </div>
      ) : (
        <NotificationsTable notifications={notifications} onSelect={handleSelect} />
      )}

      <NotificationModal
        notification={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
