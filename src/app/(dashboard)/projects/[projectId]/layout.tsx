'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { IProjectWithMembers } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { LayoutDashboard, GitPullRequest, Users } from 'lucide-react'

const tabs = [
  { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
  { label: 'Features',  href: 'features',  icon: GitPullRequest },
  { label: 'Team',      href: 'team',       icon: Users },
]

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const pathname = usePathname()
  const [project, setProject] = useState<IProjectWithMembers | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((j) => setProject(j.data))
  }, [projectId])

  return (
    <div>
      {/* Project header */}
      <div
        style={{
          padding: '1.25rem 2rem 0',
          borderBottom: '1px solid var(--color-border-default)',
          background: 'var(--color-canvas-subtle)',
        }}
      >
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Link href="/projects" style={{ fontSize: '0.8125rem', color: 'var(--color-accent-fg)' }}>Projects</Link>
          <span style={{ color: 'var(--color-fg-subtle)', fontSize: '0.875rem' }}>/</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', fontWeight: 600 }}>
            {project?.name ?? <LoadingSpinner size={12} />}
          </span>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          {tabs.map(({ label, href, icon: Icon }) => {
            const fullHref = `/projects/${projectId}/${href}`
            const active = pathname === fullHref
            return (
              <Link
                key={href}
                href={fullHref}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.875rem', fontWeight: 500,
                  color: active ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
                  borderBottom: active ? '2px solid var(--color-accent-fg)' : '2px solid transparent',
                  marginBottom: '-1px',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Page content */}
      <div style={{ padding: '1.75rem 2rem' }}>
        {children}
      </div>
    </div>
  )
}
