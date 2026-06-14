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
  GitBranch,
  Bell,
  Network,
  Layers
} from 'lucide-react'
import { useSidebar } from '@/components/layout/SidebarContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const segments = pathname.split('/').filter(Boolean)
  
  // Database sub-nav state
  const isInsideDatabase = segments[0] === 'projects' && segments[2] === 'database' && segments[3] && segments[3] !== 'new'
  const databaseId = isInsideDatabase ? segments[3] : null

  // Project sub-nav state
  const isInsideProject = segments[0] === 'projects' && segments[1] && segments[1] !== 'new'
  const projectId = isInsideProject ? segments[1] : (isInsideDatabase ? segments[1] : null)

  // Default outer global sidebar items (reverted Databases link)
  const globalNavItems = [
    { href: '/projects', label: 'Projects', icon: FolderKanban },
  ]

  // Project-specific sidebar items
  const projectNavItems = [
    { href: `/projects/${projectId}/dashboard`, label: 'Dashboard', icon: Home },
    { href: `/projects/${projectId}/features`, label: 'Features', icon: GitPullRequest },
    { href: `/projects/${projectId}/team`, label: 'Team', icon: Users },
    { href: `/projects/${projectId}/merges`, label: 'Deployment History', icon: GitMerge },
    { href: `/projects/${projectId}/codebases`, label: 'Contributions', icon: GitBranch },
    { href: `/projects/${projectId}/database`, label: 'Database', icon: Database },
  ]

  // Database-specific sidebar items under `/projects/[projectId]/database/[databaseId]/...`
  const databaseNavItems = [
    { href: `/projects/${projectId}/database/${databaseId}`, label: 'Overview', icon: Home },
    { href: `/projects/${projectId}/database/${databaseId}/collections`, label: 'Collections', icon: Layers },
    { href: `/projects/${projectId}/database/${databaseId}/storage`, label: 'Storage Analytics', icon: HardDrive },
    { href: `/projects/${projectId}/database/${databaseId}/queries`, label: 'Query Analytics', icon: SquareTerminal },
    { href: `/projects/${projectId}/database/${databaseId}/indexes`, label: 'Index Analytics', icon: Code2 },
    { href: `/projects/${projectId}/database/${databaseId}/replication`, label: 'Replication', icon: Network },
  ]

  let navItems = globalNavItems
  let settingsHref = '/settings'

  if (isInsideDatabase) {
    navItems = databaseNavItems
    settingsHref = `/projects/${projectId}/database/${databaseId}/settings`
  } else if (isInsideProject) {
    navItems = projectNavItems
    settingsHref = `/projects/${projectId}/settings`
  }

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
          paddingLeft: isCollapsed ? '18px' : '16px',
          paddingRight: '16px',
          borderBottom: '1px solid #27272a',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'padding-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          {/* Logo icon */}
          <img
            src="/logo.png"
            alt="DevHub Logo"
            onClick={toggleSidebar}
            className="sidebar-logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              objectFit: 'contain',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          
          <span
            style={{
              marginLeft: isCollapsed ? '0px' : '12px',
              transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isCollapsed ? 0 : 1,
              maxWidth: isCollapsed ? '0px' : '150px',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.02em',
              display: 'inline-block',
            }}
          >
            DevHub
          </span>
        </div>
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
        {navItems.map((item) => {
          const { href, label, icon: Icon, isDividerBefore } = item as {
            href: string
            label: string
            icon: React.ComponentType<{ size: number; color?: string; style?: React.CSSProperties }>
            isDividerBefore?: boolean
          }
          
          // Check if link is active
          // Prevent parent index page from highlighting all child pages
          const isActive = pathname === href || (
            href !== `/projects/${projectId}/database/${databaseId}` && 
            href !== `/projects/${projectId}/dashboard` && 
            pathname.startsWith(href + '/')
          )
          
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
                title={isCollapsed ? label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: '0.625rem',
                  paddingBottom: '0.625rem',
                  paddingLeft: isCollapsed ? '11px' : '12px',
                  paddingRight: '12px',
                  borderRadius: '8px',
                  color: isActive ? '#ffffff' : '#8b949e',
                  backgroundColor: isActive ? '#27272a' : 'transparent',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'padding-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s ease, background-color 0.15s ease',
                }}
                className="sidebar-nav-link"
              >
                <Icon 
                  size={18} 
                  color={isActive ? '#22c55e' : 'currentColor'} 
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    marginLeft: isCollapsed ? '0px' : '12px',
                    transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isCollapsed ? 0 : 1,
                    maxWidth: isCollapsed ? '0px' : '150px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    display: 'inline-block',
                  }}
                >
                  {label}
                </span>
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
        
      </div>

      <style>{`
        .sidebar-logo:hover {
          transform: scale(1.08);
        }
        .sidebar-logo:active {
          transform: scale(0.95);
        }
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
