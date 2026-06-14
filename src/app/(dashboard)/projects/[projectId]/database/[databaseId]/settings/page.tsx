'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useDatabase } from '../layout'
import { Settings, ShieldAlert, Trash2, Save } from 'lucide-react'

export default function DatabaseSettingsPage({ params }: { params: Promise<{ projectId: string; databaseId: string }> }) {
  const { projectId, databaseId } = use(params)
  const router = useRouter()
  const { database, refresh } = useDatabase()

  // Form states
  const [name, setName] = useState('')
  const [connectionUri, setConnectionUri] = useState('')
  const [databaseName, setDatabaseName] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Delete state
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (database) {
      setName(database.name)
      setDatabaseName(database.databaseName)
    }
  }, [database])

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload: any = { name: name.trim() }
      if (connectionUri.trim()) {
        payload.connectionUri = connectionUri.trim()
        payload.databaseName = databaseName.trim() || undefined
      }

      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to update database credentials')
      }

      setSuccess('Settings updated successfully.')
      setConnectionUri('')
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDatabase = async () => {
    if (confirmName !== database?.name) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/${databaseId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete database connection')
      
      router.push(`/projects/${projectId}/database`)
      router.refresh()
    } catch (e) {
      setError('Failed to delete connection. Try again later.')
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* General Settings */}
      <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
          <Settings size={16} color="var(--color-accent-fg)" /> Connection Settings
        </h3>
        <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '520px' }}>
          <div>
            <label className="gh-label">Display Name</label>
            <input className="gh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Display Name" />
          </div>
          <div>
            <label className="gh-label">Target Database Name</label>
            <input className="gh-input" value={databaseName} onChange={(e) => setDatabaseName(e.target.value)} placeholder="e.g. admin" />
          </div>
          <div>
            <label className="gh-label">Update Connection URI <span style={{ color: 'var(--color-fg-subtle)' }}>(Leave blank to keep current URI)</span></label>
            <input type="password" className="gh-input" value={connectionUri} onChange={(e) => setConnectionUri(e.target.value)} placeholder="••••••••••••••••••••••••••••••••" />
          </div>

          {error && <p style={{ color: 'var(--color-danger-fg)', fontSize: '0.75rem', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: 'var(--color-success-fg)', fontSize: '0.75rem', margin: 0 }}>{success}</p>}

          <button type="submit" disabled={submitting} className="gh-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
            <Save size={14} />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{ border: '1px solid var(--color-danger-emphasis)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger-fg)' }}>
          <ShieldAlert size={16} /> Danger Zone
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: '0 0 1.25rem' }}>
          Once you delete this connection, all historical analytics, snapshots, and alert rules associated with it will be permanently lost. This action is irreversible.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '520px' }}>
          <label className="gh-label" style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>
            To confirm deletion, type the database display name: <strong style={{ color: 'var(--color-fg-default)' }}>{database?.name}</strong>
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input 
              className="gh-input" 
              style={{ flex: 1, minWidth: '200px' }} 
              value={confirmName} 
              onChange={(e) => setConfirmName(e.target.value)} 
              placeholder={database?.name} 
            />
            <button
              onClick={handleDeleteDatabase}
              disabled={confirmName !== database?.name || deleting}
              className="gh-btn-danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete Connection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
