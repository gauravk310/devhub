'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserDropdown from '@/components/layout/UserDropdown'
import { 
  FolderKanban, 
  Bell, 
  UserPlus,
  Home,
  GitPullRequest,
  Users,
  GitMerge,
  GitBranch,
  Database,
  Settings
} from 'lucide-react'

interface TopbarProps {
  title?: string
  breadcrumb?: { label: string; href?: string }[]
}

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  const isInsideProject = segments[0] === 'projects' && segments[1] && segments[1] !== 'new'
  const projectId = isInsideProject ? segments[1] : null

  const [project, setProject] = useState<{ name: string } | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const projectNavItems = projectId
    ? [
        { href: `/projects/${projectId}/dashboard`, label: 'Dashboard', icon: Home },
        { href: `/projects/${projectId}/features`, label: 'Features', icon: GitPullRequest },
        { href: `/projects/${projectId}/team`, label: 'Team', icon: Users },
        { href: `/projects/${projectId}/merges`, label: 'Deployment History', icon: GitMerge },
        { href: `/projects/${projectId}/codebases`, label: 'Contributions', icon: GitBranch },
        { href: `/projects/${projectId}/database`, label: 'Database', icon: Database },
        { href: `/projects/${projectId}/settings`, label: 'Settings', icon: Settings },
      ]
    : []

  const isTabActive = (href: string) => {
    if (href === `/projects/${projectId}/dashboard`) {
      return pathname === href || pathname === `/projects/${projectId}`
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?unread=true')
      if (res.ok) {
        const json = await res.json()
        setUnreadCount(json.data?.length ?? 0)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30_000)
    const onUpdate = () => fetchUnreadCount()
    window.addEventListener('notifications-updated', onUpdate)
    window.addEventListener('focus', onUpdate)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications-updated', onUpdate)
      window.removeEventListener('focus', onUpdate)
    }
  }, [pathname])

  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then((r) => r.json())
        .then((j) => setProject(j.data))
        .catch(() => {})
    } else {
      setProject(null)
    }
  }, [projectId])

  const isProjectsActive = pathname === '/projects' || pathname.startsWith('/projects')
  const isNotificationsActive = pathname === '/notifications' || pathname.startsWith('/notifications')
  const isJoinProjectActive = pathname === '/join-project' || pathname.startsWith('/join-project')

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        height: '56px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        gap: '1rem',
        backgroundColor: '#161616',
        borderBottom: '1px solid #27272a',
      }}
    >
      {/* Left: Brand + Navigation Items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
        {/* DevHub Logo & Brand */}
        <Link
          href="/projects"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          className="topbar-brand-link"
          title="DevHub — All Projects"
        >
          <img
            src="/logo.png"
            alt="DevHub Logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              objectFit: 'contain',
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: '1rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            DevHub
          </span>
        </Link>

        {/* Subtle Separator */}
        <div
          style={{
            width: '1px',
            height: '18px',
            backgroundColor: '#27272a',
            margin: '0 0.125rem',
            flexShrink: 0,
          }}
        />

        {/* Dynamic Navigation: Project-Level vs Global Navigation */}
        {isInsideProject && projectId ? (
          /* PROJECT-LEVEL NAVIGATION */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
            {/* Project Name Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <span style={{ color: '#484f58', fontSize: '0.875rem', userSelect: 'none' }}>/</span>
              <Link
                href={`/projects/${projectId}/dashboard`}
                style={{
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  fontWeight: 600,
                  textDecoration: 'none',
                  maxWidth: '180px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: '#1f242c',
                  border: '1px solid #30363d',
                  transition: 'border-color 0.15s ease',
                }}
                className="topbar-project-link"
                title={project?.name || 'Project'}
              >
                {project?.name || 'Project'}
              </Link>
            </div>

            {/* Separator between Project Name and Project Tabs */}
            <div
              style={{
                width: '1px',
                height: '18px',
                backgroundColor: '#27272a',
                margin: '0 0.125rem',
                flexShrink: 0,
              }}
            />

            {/* Project Tabs on top */}
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
              className="topbar-project-nav"
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
                      gap: '0.45rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: active ? 600 : 500,
                      textDecoration: 'none',
                      color: active ? '#ffffff' : '#8b949e',
                      backgroundColor: active ? '#27272a' : 'transparent',
                      border: active ? '1px solid #3f3f46' : '1px solid transparent',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    className="topbar-nav-link"
                  >
                    <Icon
                      size={15}
                      color={active ? '#22c55e' : 'currentColor'}
                      style={{ flexShrink: 0 }}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ) : (
          /* GLOBAL NAVIGATION (Shown on /projects, /notifications, /join-project, etc.) */
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
            {/* Projects */}
            <Link
              href="/projects"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: isProjectsActive ? '#ffffff' : '#8b949e',
                backgroundColor: isProjectsActive ? '#27272a' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              className="topbar-nav-link"
            >
              <FolderKanban
                size={16}
                color={isProjectsActive ? '#22c55e' : 'currentColor'}
                style={{ flexShrink: 0 }}
              />
              <span>Projects</span>
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: isNotificationsActive ? '#ffffff' : '#8b949e',
                backgroundColor: isNotificationsActive ? '#27272a' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              className="topbar-nav-link"
            >
              <Bell
                size={16}
                color={isNotificationsActive ? '#22c55e' : 'currentColor'}
                style={{ flexShrink: 0 }}
              />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 5px',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    backgroundColor: '#da3633',
                    color: '#ffffff',
                    marginLeft: '2px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Join Project */}
            <Link
              href="/join-project"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: isJoinProjectActive ? '#ffffff' : '#8b949e',
                backgroundColor: isJoinProjectActive ? '#27272a' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              className="topbar-nav-link"
            >
              <UserPlus
                size={16}
                color={isJoinProjectActive ? '#22c55e' : 'currentColor'}
                style={{ flexShrink: 0 }}
              />
              <span>Join Project</span>
            </Link>
          </nav>
        )}
      </div>

      {/* Right: User Avatar Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <UserDropdown />
      </div>

      <style>{`
        .topbar-brand-link:hover {
          opacity: 0.85;
        }
        .topbar-nav-link:hover {
          background-color: #212124 !important;
          color: #ffffff !important;
        }
        .topbar-project-link:hover {
          border-color: #58a6ff !important;
          color: #58a6ff !important;
        }
        .topbar-project-nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </header>
  )
}
