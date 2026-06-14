'use client'

import React, { createContext, useContext, useState, useEffect, use } from 'react'
import { useParams } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Database as DbIcon, ShieldCheck, ServerCrash, Play } from 'lucide-react'
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
  const [database, setDatabase] = useState<DatabaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Workspace Sub-header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', border: '1px solid var(--color-border-default)', background: 'var(--color-canvas-inset)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <DbIcon size={22} color="var(--color-success-fg)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

        {/* Workspace Tab Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </DatabaseContext.Provider>
  )
}
