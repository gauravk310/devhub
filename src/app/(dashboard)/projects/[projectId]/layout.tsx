'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { IProjectWithMembers } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { LayoutDashboard, GitPullRequest, Users, GitBranch, GitMerge } from 'lucide-react'

const tabs = [
  { label: 'Dashboard',          href: 'dashboard',  icon: LayoutDashboard },
  { label: 'Features',           href: 'features',   icon: GitPullRequest },
  { label: 'Deployment History', href: 'merges',     icon: GitMerge },
  { label: 'Team',               href: 'team',       icon: Users },
  { label: 'Contributions',      href: 'codebases',  icon: GitBranch },
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
          position: 'sticky',
          top: '56px',
          zIndex: 15,
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
                  padding: '0.55rem 0.875rem',
                  fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
                  borderBottom: active ? '2px solid #f78166' : '2px solid transparent',
                  marginBottom: '-1px',
                  textDecoration: 'none',
                  transition: 'color 0.12s, border-bottom-color 0.12s',
                  borderRadius: '6px 6px 0 0',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(110, 118, 129, 0.08)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-fg-default)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-fg-muted)';
                  }
                }}
              >
                <Icon size={15} style={{ opacity: active ? 1 : 0.7 }} />
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
