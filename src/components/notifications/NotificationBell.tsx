'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const router = useRouter()

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/notifications?unread=true')
      if (res.ok) {
        const json = await res.json()
        setCount(json.data?.length ?? 0)
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30_000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <button
      onClick={() => router.push('/notifications')}
      aria-label={`Notifications${count > 0 ? ` — ${count} unread` : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: '1px solid transparent',
        background: 'transparent',
        cursor: 'pointer',
        color: 'var(--color-fg-muted)',
        transition: 'border-color 0.15s, background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-border-muted)'
        e.currentTarget.style.borderColor = 'var(--color-border-default)'
        e.currentTarget.style.color = 'var(--color-fg-default)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.color = 'var(--color-fg-muted)'
      }}
    >
      <Bell size={18} />
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            minWidth: '16px',
            height: '16px',
            borderRadius: '9999px',
            background: 'var(--color-danger-emphasis)',
            color: '#fff',
            fontSize: '0.625rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            animation: 'fade-in 0.2s ease-out',
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
