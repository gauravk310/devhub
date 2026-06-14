'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

export default function UserDropdown() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!session?.user) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '6px',
          border: '1px solid transparent',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-border-muted)'
          e.currentTarget.style.borderColor = 'var(--color-border-default)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }}
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? ''}
            style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #e24a3b' }}
          />
        ) : (
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--color-accent-emphasis)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 700, color: '#fff',
          }}>
            {getInitials(session.user.name ?? 'U')}
          </div>
        )}
        <ChevronDown size={14} color="var(--color-fg-muted)" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '220px',
            background: 'var(--color-canvas-overlay)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(1,4,9,0.5)',
            zIndex: 50,
            animation: 'slide-down 0.15s ease-out',
            overflow: 'hidden',
          }}
        >
          {/* Profile info */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              {session.user.image && (
                <img src={session.user.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
              )}
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-default)', margin: 0 }}>
                  {session.user.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', margin: 0 }}>
                  {session.user.email}
                </p>
              </div>
            </div>
            {/* @ts-expect-error githubUsername extended field */}
            {session.user.githubUsername && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', margin: 0 }}>
                {/* @ts-expect-error githubUsername extended field */}
                @{session.user.githubUsername}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div style={{ padding: '0.375rem' }}>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                color: 'var(--color-fg-default)', textDecoration: 'none',
                fontSize: '0.875rem', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <User size={15} />
              Profile
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                color: 'var(--color-danger-fg)', background: 'transparent',
                border: 'none', fontSize: '0.875rem', cursor: 'pointer',
                transition: 'background 0.15s', textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
