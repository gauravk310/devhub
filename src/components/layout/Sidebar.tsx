'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitBranch, FolderKanban, Bell, ChevronRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getInitials } from '@/lib/utils'
import { useSidebar } from '@/components/layout/SidebarContext'

const navItems = [
  { href: '/projects',      label: 'Projects',       icon: FolderKanban },
  { href: '/notifications', label: 'Notifications',  icon: Bell },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, toggleSidebar, setIsCollapsed } = useSidebar()

  const sidebarWidth = isCollapsed ? '64px' : '240px'

  const handleNavClick = (href: string) => {
    const isActive = pathname.startsWith(href)
    if (isActive) {
      toggleSidebar()
    } else {
      setIsCollapsed(false)
    }
  }

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
        width: sidebarWidth,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: 'none', // Managed by sub-containers
      }}
    >
      {/* 1. Activity Bar (Fixed, 64px) */}
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
        <div
          onClick={toggleSidebar}
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            borderBottom: '1px solid var(--color-border-default)',
            cursor: 'pointer',
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
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
            }}
          >
            <GitBranch size={18} color="#fff" />
          </div>
        </div>

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
                onClick={() => handleNavClick(href)}
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
            onClick={() => setIsCollapsed(false)}
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

      {/* 2. Sidebar Panel (Collapsible, 176px) */}
      <div
        style={{
          width: isCollapsed ? '0px' : '176px',
          height: '100%',
          backgroundColor: 'var(--color-canvas-subtle)',
          borderRight: isCollapsed ? 'none' : '1px solid var(--color-border-default)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-right 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Title / Logo Label */}
        <div
          style={{
            height: '56px',
            padding: '0 1rem',
            borderBottom: '1px solid var(--color-border-default)',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-fg-default)', letterSpacing: '-0.02em' }}>
            DevHub
          </span>
        </div>

        {/* Nav Labels */}
        <div
          style={{
            padding: '0.75rem 0.5rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {navItems.map(({ href, label }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`gh-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  height: '40px',
                  padding: '0 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
              >
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
        </div>

        {/* User Profile Label */}
        {session?.user && (
          <Link
            href="/profile"
            style={{
              height: '56px',
              padding: '0 1rem',
              borderTop: '1px solid var(--color-border-default)',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-fg-default)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.name}
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
