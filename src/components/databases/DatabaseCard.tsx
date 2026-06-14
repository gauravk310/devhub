'use client'

import { useRouter } from 'next/navigation'
import { Database, Calendar, ShieldCheck, Play, ServerCrash, Cpu } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DatabaseInfo {
  _id: string
  name: string
  type: string
  databaseName: string
  status: 'Connected' | 'Disconnected' | 'Error'
  errorMessage?: string
  lastChecked: string | Date
  createdAt: string | Date
}

interface Props {
  database: DatabaseInfo
  projectId: string
}

export default function DatabaseCard({ database, projectId }: Props) {
  const router = useRouter()

  const getStatusBadge = () => {
    switch (database.status) {
      case 'Connected':
        return (
          <span 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: 'var(--color-success-fg)', 
              background: 'var(--color-success-muted)', 
              padding: '0.125rem 0.5rem', 
              borderRadius: '9999px',
              border: '1px solid var(--color-success-emphasis)'
            }}
          >
            <ShieldCheck size={11} />
            Connected
          </span>
        )
      case 'Error':
        return (
          <span 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: 'var(--color-danger-fg)', 
              background: 'var(--color-danger-muted)', 
              padding: '0.125rem 0.5rem', 
              borderRadius: '9999px',
              border: '1px solid var(--color-danger-emphasis)'
            }}
            title={database.errorMessage}
          >
            <ServerCrash size={11} />
            Error
          </span>
        )
      case 'Disconnected':
      default:
        return (
          <span 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: 'var(--color-attention-fg)', 
              background: 'var(--color-attention-muted)', 
              padding: '0.125rem 0.5rem', 
              borderRadius: '9999px',
              border: '1px solid var(--color-attention-emphasis)'
            }}
          >
            <Play size={11} />
            Disconnected
          </span>
        )
    }
  }

  return (
    <div
      className="gh-card"
      onClick={() => router.push(`/projects/${projectId}/database/${database._id}`)}
      style={{ 
        padding: '1.25rem', 
        cursor: 'pointer', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.875rem' 
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: 0, lineHeight: 1.3 }}>
          {database.name}
        </h3>
        {getStatusBadge()}
      </div>

      {/* Target Database Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <Database size={13} color="var(--color-fg-subtle)" />
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
          DB: <code style={{ color: 'var(--color-accent-fg)' }}>{database.databaseName}</code>
        </span>
      </div>

      {/* DB Type & Stats */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Cpu size={13} color="var(--color-fg-subtle)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', textTransform: 'capitalize' }}>
            {database.type || 'MongoDB'} Cluster
          </span>
        </div>
      </div>

      {/* Footer */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.375rem', 
          borderTop: '1px solid var(--color-border-muted)', 
          paddingTop: '0.75rem', 
          marginTop: '0.125rem' 
        }}
      >
        <Calendar size={12} color="var(--color-fg-subtle)" />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)' }}>
          Connected {formatDate(database.createdAt)}
        </span>
      </div>
    </div>
  )
}
