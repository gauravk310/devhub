'use client'

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ShieldAlert, 
  Home, 
  GitPullRequest, 
  Users, 
  GitMerge, 
  GitBranch, 
  Database, 
  Settings 
} from 'lucide-react'

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [deactivated, setDeactivated] = useState(false)

  const projectNavItems = [
    { href: `/projects/${projectId}/dashboard`, label: 'Dashboard', icon: Home },
    { href: `/projects/${projectId}/features`, label: 'Features', icon: GitPullRequest },
    { href: `/projects/${projectId}/team`, label: 'Team', icon: Users },
    { href: `/projects/${projectId}/merges`, label: 'Deployment History', icon: GitMerge },
    { href: `/projects/${projectId}/codebases`, label: 'Contributions', icon: GitBranch },
    { href: `/projects/${projectId}/database`, label: 'Database', icon: Database },
    { href: `/projects/${projectId}/settings`, label: 'Settings', icon: Settings },
  ]

  const isTabActive = (href: string) => {
    if (href === `/projects/${projectId}/dashboard`) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error === 'Project is deactivated' || j.status === 'DEACTIVATED') {
          setDeactivated(true)
        } else if (j.data) {
          const project = j.data
          const isOwner = typeof project.ownerId === 'object'
            ? project.ownerId._id?.toString() === session?.user?.id
            : project.ownerId.toString() === session?.user?.id
          
          if (project.status === 'DEACTIVATED' && !isOwner) {
            setDeactivated(true)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, session?.user?.id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <LoadingSpinner size={28} />
      </div>
    )
  }

  if (deactivated) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 120px)',
        gap: '1rem',
        padding: '2rem',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <ShieldAlert size={48} color="var(--color-danger-fg)" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Project Deactivated</h2>
        <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: '400px', margin: 0 }}>
          This project has been deactivated by the owner. Members cannot access project resources while it is deactivated.
        </p>
        <button onClick={() => router.push('/projects')} className="gh-btn-secondary" style={{ marginTop: '0.5rem' }}>
          Go Back to Projects
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>
      {/* Project Navigation Tabs */}
      <div
        style={{
          backgroundColor: '#161616',
          borderBottom: '1px solid #27272a',
          padding: '0 2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          overflowX: 'auto',
        }}
      >
        {projectNavItems.map((item) => {
          const Icon = item.icon
          const active = isTabActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 500,
                color: active ? '#ffffff' : '#8b949e',
                borderBottom: active ? '2px solid #22c55e' : '2px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
              className="project-tab-link"
            >
              <Icon size={16} color={active ? '#22c55e' : 'currentColor'} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div style={{ padding: '2rem 3rem', flex: 1 }}>
        {children}
      </div>

      <style jsx>{`
        .project-tab-link:hover {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  )
}

