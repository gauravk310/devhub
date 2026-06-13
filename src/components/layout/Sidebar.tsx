'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderKanban, Bell } from 'lucide-react'
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
    <div
      className="gh-sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 20,
        display: 'flex',
        width: '64px',
        borderRight: 'none', // Managed by sub-containers
      }}
    >
      {/* Activity Bar (Fixed, 64px) */}
      <div
        style={{
          width: '64px',
          height: '100%',
          backgroundColor: 'var(--color-canvas-inset)',
          borderRight: '1px solid var(--color-border-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Logo Icon */}
        <Link
          href="/projects"
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            borderBottom: '1px solid var(--color-border-default)',
          }}
          title="DevHub"
        >
          <img
            src="/logo.png"
            alt="DevHub Logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              objectFit: 'cover',
            }}
          />
        </Link>

        {/* Nav Icons */}
        <nav
          style={{
            padding: '0.75rem 0',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            width: '100%',
          }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`gh-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                }}
                title={label}
              >
                <Icon size={16} />
              </Link>
            )
          })}
        </nav>

        {/* User Avatar */}
        {session?.user && (
          <Link
            href="/profile"
            style={{
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              borderTop: '1px solid var(--color-border-default)',
            }}
            title={session.user.name ?? 'Profile'}
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
          </Link>
        )}
      </div>
    </div>
  )
}
