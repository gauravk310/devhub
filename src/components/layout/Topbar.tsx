'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserDropdown from '@/components/layout/UserDropdown'
import { useSidebar } from '@/components/layout/SidebarContext'
import { Mail, ChevronDown } from 'lucide-react'

interface TopbarProps {
  title?: string
  breadcrumb?: { label: string; href?: string }[]
}

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,73,0c.79.71,1.63,1.4,2.52,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.24,48.72,122.92,25.86,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
  </svg>
)

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()
  const sidebarWidth = isCollapsed ? '64px' : '240px'

  const segments = pathname.split('/').filter(Boolean)
  const isInsideProject = segments[0] === 'projects' && segments[1] && segments[1] !== 'new'
  const projectId = isInsideProject ? segments[1] : null

  const [project, setProject] = useState<{ name: string } | null>(null)

  useEffect(() => {
    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then((r) => r.json())
        .then((j) => setProject(j.data))
    }
  }, [projectId])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: sidebarWidth,
        height: '56px',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        gap: '1rem',
        backgroundColor: '#0d1117',
        borderBottom: '1px solid #1f2023',
        transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Left: Dynamic Project Breadcrumbs or generic Title */}
      {isInsideProject ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          {/* Organization Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b949e', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            <span className="topbar-breadcrumb-link">Personal Org</span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(34, 197, 94, 0.05)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              Free
            </span>
            <ChevronDown size={14} color="#8b949e" style={{ marginLeft: '-0.125rem' }} />
          </div>

          <span style={{ color: '#30363d', fontSize: '0.875rem' }}>/</span>

          {/* Project Link */}
          <Link
            href={`/projects/${projectId}/dashboard`}
            style={{
              fontSize: '0.875rem',
              color: '#ffffff',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            className="topbar-breadcrumb-link"
          >
            {project?.name ?? 'Loading...'}
          </Link>

          <span style={{ color: '#30363d', fontSize: '0.875rem' }}>/</span>

          {/* Branch & Env */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b949e', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
            <span className="topbar-breadcrumb-link">Main</span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#d29922',
                border: '1px solid rgba(210, 153, 34, 0.4)',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(210, 153, 34, 0.05)',
                textTransform: 'capitalize',
              }}
            >
              Production
            </span>
            <ChevronDown size={14} color="#8b949e" style={{ marginLeft: '-0.125rem' }} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          {breadcrumb?.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {i > 0 && <span style={{ color: '#8b949e', fontSize: '0.875rem' }}>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  style={{ fontSize: '0.875rem', color: '#58a6ff', fontWeight: 500 }}
                >
                  {crumb.label}
                </a>
              ) : (
                <span style={{ fontSize: '0.875rem', color: '#ffffff', fontWeight: 600 }}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
          {title && !breadcrumb && (
            <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              {title}
            </h1>
          )}
        </div>
      )}

      {/* Right: Discord, GitHub Stars, Contact Us, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
        {/* Discord Link */}
        <a
          href="https://discord.gg"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#8b949e', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          className="topbar-social-link"
          title="Discord"
        >
          <DiscordIcon />
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
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#8b949e',
              background: '#21262d',
              border: '1px solid #30363d',
              padding: '2px 8px',
              borderRadius: '20px',
            }}
          >
            11.7k
          </span>
        </a>

        {/* Contact Us */}
        <a
          href="mailto:contact@devhub.com"
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
          <span>Contact Us</span>
        </a>

        {/* User Dropdown */}
        <div style={{ borderLeft: '1px solid #21262d', paddingLeft: '1rem', display: 'flex', alignItems: 'center' }}>
          <UserDropdown />
        </div>
      </div>

      <style>{`
        .topbar-social-link:hover, .topbar-social-link:hover span {
          color: #ffffff !important;
        }
        .topbar-breadcrumb-link:hover {
          color: #ffffff !important;
          text-decoration: underline !important;
        }
      `}</style>
    </header>
  )
}
