'use client'

import NotificationBell from '@/components/notifications/NotificationBell'
import UserDropdown from '@/components/layout/UserDropdown'

interface TopbarProps {
  title?: string
  breadcrumb?: { label: string; href?: string }[]
}

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  return (
    <header
      className="gh-topbar"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: '240px',
        height: '56px',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        gap: '1rem',
      }}
    >
      {/* Left: breadcrumb / title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        {breadcrumb?.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {i > 0 && <span style={{ color: 'var(--color-fg-subtle)', fontSize: '0.875rem' }}>/</span>}
            {crumb.href ? (
              <a
                href={crumb.href}
                style={{ fontSize: '0.875rem', color: 'var(--color-accent-fg)', fontWeight: 500 }}
              >
                {crumb.label}
              </a>
            ) : (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-default)', fontWeight: 600 }}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
        {title && !breadcrumb && (
          <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-fg-default)', margin: 0 }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right: bell + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <NotificationBell />
        <UserDropdown />
      </div>
    </header>
  )
}
