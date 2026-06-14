'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FolderKanban, 
  BarChart3, 
  Users, 
  CreditCard, 
  Settings, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  Home,
  Database,
  HardDrive,
  SquareTerminal,
  Code2,
  Radio,
  Sparkles,
  Globe,
  Cpu,
  LineChart,
  Download,
  BookOpen,
  GitPullRequest,
  GitMerge,
  GitBranch
} from 'lucide-react'
import { useSidebar } from '@/components/layout/SidebarContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const segments = pathname.split('/').filter(Boolean)
  const isInsideProject = segments[0] === 'projects' && segments[1] && segments[1] !== 'new'
  const projectId = isInsideProject ? segments[1] : null

  // Default outer sidebar items
  const globalNavItems = [
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/usage', label: 'Usage', icon: BarChart3 },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  ]

  // Project-specific sidebar items matching the screenshot
  const projectNavItems = [
    { href: `/projects/${projectId}/dashboard`, label: 'Dashboard', icon: Home },
    { href: `/projects/${projectId}/features`, label: 'Features', icon: GitPullRequest },
    { href: `/projects/${projectId}/team`, label: 'Team', icon: Users },
    { href: `/projects/${projectId}/merges`, label: 'Deployment History', icon: GitMerge },
    { href: `/projects/${projectId}/codebases`, label: 'Contributions', icon: GitBranch },
    { href: `/projects/${projectId}/database`, label: 'Database', icon: Database },
    { href: `/projects/${projectId}/storage`, label: 'Storage', icon: HardDrive },
    
    // SQL/Functions group
    { href: `/projects/${projectId}/sql`, label: 'SQL Editor', icon: SquareTerminal, isDividerBefore: true },
    { href: `/projects/${projectId}/functions`, label: 'Functions', icon: Code2 },
    { href: `/projects/${projectId}/realtime`, label: 'Realtime', icon: Radio },
    { href: `/projects/${projectId}/gateway`, label: 'Model Gateway', icon: Sparkles },
    { href: `/projects/${projectId}/sites`, label: 'Sites', icon: Globe },
    { href: `/projects/${projectId}/compute`, label: 'Compute', icon: Cpu },
    { href: `/projects/${projectId}/payments`, label: 'Payments', icon: CreditCard },
    
    // Logs/Docs group
    { href: `/projects/${projectId}/logs`, label: 'Logs', icon: LineChart, isDividerBefore: true },
    { href: `/projects/${projectId}/install`, label: 'Install', icon: Download },
    { href: `/projects/${projectId}/doc`, label: 'Doc', icon: BookOpen },
  ]

  const navItems = isInsideProject ? projectNavItems : globalNavItems
  const settingsHref = isInsideProject ? `/projects/${projectId}/settings` : '/settings'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: isCollapsed ? '64px' : '240px',
        backgroundColor: '#161616',
        borderRight: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header: Organization info */}
      <div
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          padding: isCollapsed ? '0' : '0 1rem',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #27272a',
          gap: '0.5rem',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          {/* Logo icon */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid #22c55e',
              background: 'rgba(34, 197, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Hexagon size={16} color="#22c55e" />
          </div>
          
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Personal Org
              </span>
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
            </div>
          )}
        </div>

        {!isCollapsed && (
          <ChevronDown size={14} color="#8b949e" style={{ flexShrink: 0 }} />
        )}
      </div>

      {/* Navigation menu */}
      <nav
        style={{
          flex: 1,
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          overflowY: 'auto',
        }}
        className="sidebar-nav"
      >
        {navItems.map((item, index) => {
          const { href, label, icon: Icon, isDividerBefore } = item as {
            href: string
            label: string
            icon: React.ComponentType<{ size: number; color?: string; style?: React.CSSProperties }>
            isDividerBefore?: boolean
          }
          const isActive = pathname === href || pathname.startsWith(href + '/')
          
          return (
            <div key={href} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {isDividerBefore && (
                <hr 
                  style={{ 
                    border: 'none', 
                    borderTop: '1px solid #27272a', 
                    margin: '0.5rem 0.75rem',
                    opacity: isCollapsed ? 0 : 1 
                  }} 
                />
              )}
              <Link
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.75rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '8px',
                  color: isActive ? '#ffffff' : '#8b949e',
                  backgroundColor: isActive ? '#27272a' : 'transparent',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                className="sidebar-nav-link"
              >
                <Icon 
                  size={18} 
                  color={isActive ? '#22c55e' : 'currentColor'} 
                  style={{ flexShrink: 0 }}
                />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer section */}
      <div
        style={{
          padding: '0.75rem',
          borderTop: '1px solid #27272a',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          flexShrink: 0,
        }}
      >
        {/* Settings */}
        <Link
          href={settingsHref}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.75rem',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            color: pathname.startsWith(settingsHref) ? '#ffffff' : '#8b949e',
            backgroundColor: pathname.startsWith(settingsHref) ? '#27272a' : 'transparent',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
          className="sidebar-nav-link"
        >
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.75rem',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            color: '#8b949e',
            background: 'transparent',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.15s ease',
            textAlign: 'left',
          }}
          className="sidebar-nav-link"
        >
          {isCollapsed ? (
            <ChevronRight size={18} style={{ flexShrink: 0 }} />
          ) : (
            <ChevronLeft size={18} style={{ flexShrink: 0 }} />
          )}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>

      <style>{`
        .sidebar-nav-link:hover {
          background-color: #212124 !important;
          color: #ffffff !important;
        }
        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
