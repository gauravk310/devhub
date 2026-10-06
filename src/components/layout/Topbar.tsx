'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserDropdown from '@/components/layout/UserDropdown'
import { 
  FolderKanban, 
  Bell, 
  UserPlus, 
  Mail 
} from 'lucide-react'

interface TopbarProps {
  title?: string
  breadcrumb?: { label: string; href?: string }[]
}

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)
  const isInsideProject = segments[0] === 'projects' && segments[1] && segments[1] !== 'new'
  const projectId = isInsideProject ? segments[1] : null

  const [project, setProject] = useState<{ name: string } | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
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
            margin: '0 0.25rem',
            flexShrink: 0,
          }}
        />

        {/* Navigation Menu (moved from Sidebar) */}
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

        {/* Project Breadcrumb if inside project */}
        {isInsideProject && project && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
            <span style={{ color: '#30363d', fontSize: '0.875rem' }}>/</span>
            <Link
              href={`/projects/${projectId}/dashboard`}
              style={{
                fontSize: '0.875rem',
                color: '#ffffff',
                fontWeight: 600,
                textDecoration: 'none',
                maxWidth: '200px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              className="topbar-project-link"
            >
              {project.name}
            </Link>
          </div>
        )}
      </div>

      {/* Right: Instagram, GitHub Stars, Contact Us, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
        {/* Instagram Link */}
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#8b949e', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          className="topbar-social-link"
          title="Instagram"
        >
          <InstagramIcon />
        </a>

        {/* GitHub Link & Star Count */}
        <a
          href="https://github.com/gauravk310/devhub"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#8b949e',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          className="topbar-social-link"
          title="GitHub Repository"
        >
          <GithubIcon />
        </a>

        {/* Contact Us */}
        <a
          href="mailto:gskadam3b@gmail.com"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: '#8b949e',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          className="topbar-social-link"
        >
          <Mail size={16} />
          <span>Contact Me</span>
        </a>

        {/* User Dropdown */}
        <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1rem', display: 'flex', alignItems: 'center' }}>
          <UserDropdown />
        </div>
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
          color: #58a6ff !important;
        }
        .topbar-social-link:hover, .topbar-social-link:hover span {
          color: #ffffff !important;
        }
      `}</style>
    </header>
  )
}
