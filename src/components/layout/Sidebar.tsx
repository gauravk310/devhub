'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitBranch, FolderKanban, Bell, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/projects',      label: 'Projects',       icon: FolderKanban },
  { href: '/notifications', label: 'Notifications',  icon: Bell },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      className="gh-sidebar"
      style={{
        width: '240px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 20,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--color-border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1f6feb, #58a6ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <GitBranch size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-fg-default)', letterSpacing: '-0.02em' }}>
          DevHub
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.75rem 0.75rem', flex: 1 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`gh-nav-item ${isActive ? 'active' : ''}`}
              style={{ marginBottom: '0.125rem' }}
            >
              <Icon size={16} />
              {label}
              {isActive && (
                <ChevronRight
                  size={14}
                  style={{ marginLeft: 'auto', color: 'var(--color-accent-fg)', opacity: 0.7 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      {session?.user && (
        <Link
          href="/profile"
          style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--color-border-default)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-border-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? ''}
              className="gh-avatar"
              style={{ width: 28, height: 28 }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--color-accent-emphasis)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {getInitials(session.user.name ?? 'U')}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-fg-default)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.user.name}
            </p>
          </div>
        </Link>
      )}
    </aside>
  )
}
