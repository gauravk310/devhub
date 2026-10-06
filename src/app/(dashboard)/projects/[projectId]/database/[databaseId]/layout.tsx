'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { 
  Database as DbIcon, 
  ShieldCheck, 
  ServerCrash, 
  Play,
  Home,
  Layers,
  HardDrive,
  SquareTerminal,
  Code2,
  Network,
  Settings
} from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface DatabaseDetails {
  _id: string
  name: string
  type: string
  databaseName: string
  status: 'Connected' | 'Disconnected' | 'Error'
  errorMessage?: string
  lastChecked: string | Date
  createdAt: string | Date
}

interface DatabaseContextProps {
  database: DatabaseDetails | null
  loading: boolean
  refresh: () => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextProps>({
  database: null,
  loading: true,
  refresh: async () => {},
})

export const useDatabase = () => useContext(DatabaseContext)

export default function ProjectDatabaseLayout({ children }: { children: React.ReactNode }) {
  const { projectId, databaseId } = useParams() as { projectId: string; databaseId: string }
  const pathname = usePathname()
  const [database, setDatabase] = useState<DatabaseDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const databaseNavItems = [
    { href: `/projects/${projectId}/database/${databaseId}`, label: 'Overview', icon: Home },
    { href: `/projects/${projectId}/database/${databaseId}/collections`, label: 'Collections', icon: Layers },
    { href: `/projects/${projectId}/database/${databaseId}/storage`, label: 'Storage Analytics', icon: HardDrive },
    { href: `/projects/${projectId}/database/${databaseId}/queries`, label: 'Query Analytics', icon: SquareTerminal },
    { href: `/projects/${projectId}/database/${databaseId}/indexes`, label: 'Index Analytics', icon: Code2 },
    { href: `/projects/${projectId}/database/${databaseId}/replication`, label: 'Replication', icon: Network },
    { href: `/projects/${projectId}/database/${databaseId}/settings`, label: 'Settings', icon: Settings },
  ]

  const isTabActive = (href: string) => {
    if (href === `/projects/${projectId}/database/${databaseId}`) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const fetchDatabaseDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}`)
      if (!res.ok) throw new Error('Database connection details not found')
      const json = await res.json()
      setDatabase(json.data ?? null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && databaseId) {
      fetchDatabaseDetails()
    }
  }, [projectId, databaseId])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 56px)' }}>
        <LoadingSpinner size={28} />
      </div>
    )
  }

  if (!database) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-fg-muted)' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>Database connection not found.</p>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (database.status) {
      case 'Connected':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success-fg)', background: 'var(--color-success-muted)', padding: '0.125rem 0.625rem', borderRadius: '6px', border: '1px solid var(--color-success-emphasis)' }}>
            <ShieldCheck size={12} /> Connected
          </span>
        )
      case 'Error':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-danger-fg)', background: 'var(--color-danger-muted)', padding: '0.125rem 0.625rem', borderRadius: '6px', border: '1px solid var(--color-danger-emphasis)' }} title={database.errorMessage}>
            <ServerCrash size={12} /> Error
          </span>
        )
      case 'Disconnected':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-attention-fg)', background: 'var(--color-attention-muted)', padding: '0.125rem 0.625rem', borderRadius: '6px', border: '1px solid var(--color-attention-emphasis)' }}>
            <Play size={12} /> Disconnected
          </span>
        )
    }
  }

  return (
    <DatabaseContext.Provider value={{ database, loading, refresh: fetchDatabaseDetails }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Workspace Sub-header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', border: '1px solid var(--color-border-default)', background: 'var(--color-canvas-inset)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <DbIcon size={22} color="var(--color-success-fg)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'center', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                  {database.name}
                </h1>
                {getStatusBadge()}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Target: <code style={{ color: 'var(--color-accent-fg)' }}>{database.databaseName}</code></span>
                <span>•</span>
                <span>Last diagnosed: {timeAgo(database.lastChecked)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Database Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            borderBottom: '1px solid var(--color-border-muted)',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
          }}
        >
          {databaseNavItems.map((item) => {
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
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#ffffff' : 'var(--color-fg-muted)',
                  backgroundColor: active ? 'var(--color-canvas-subtle)' : 'transparent',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  border: active ? '1px solid var(--color-border-default)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} color={active ? 'var(--color-success-fg)' : 'currentColor'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Workspace Tab Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </DatabaseContext.Provider>
  )
}

