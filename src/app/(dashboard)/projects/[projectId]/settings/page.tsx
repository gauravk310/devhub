'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Toast from '@/components/ui/Toast'
import { useSession } from 'next-auth/react'
import { 
  Settings, 
  ShieldAlert, 
  Trash2, 
  Save, 
  Copy, 
  Check, 
  Crown,
  Users,
  Calendar,
  Globe,
  BookOpen
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { IProjectWithMembers } from '@/types'

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [loading, setLoading] = useState(true)

  // Form states
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Deactivate state
  const [confirmName, setConfirmName] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Copy state
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setProject(j.data)
          setName(j.data.name)
          setDomain(j.data.domain || '')
        } else {
          setToast({ message: j.error || 'Failed to fetch project details', type: 'error' })
        }
      })
      .catch(() => setToast({ message: 'Error loading project', type: 'error' }))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  if (!project) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-fg-muted)' }}>
        Project not found.
      </div>
    )
  }

  const isOwner =
    typeof project.ownerId === 'object'
      ? project.ownerId._id?.toString() === session?.user?.id
      : project.ownerId.toString() === session?.user?.id

  const handleCopy = () => {
    if (project.projectId) {
      navigator.clipboard.writeText(project.projectId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }

      setProject(data.data)
      setToast({ message: 'Project settings updated successfully.', type: 'success' })
      router.refresh()
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const isDeactivated = project.status === 'DEACTIVATED'

  const handleToggleStatus = async () => {
    if (!isOwner) return
    if (!isDeactivated && (!confirmName || confirmName !== project.projectId)) return
    setUpdatingStatus(true)

    try {
      const nextStatus = isDeactivated ? 'ACTIVE' : 'DEACTIVATED'
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update project status')
      }

      setProject(data.data)
      setToast({ message: `Project ${isDeactivated ? 'activated' : 'deactivated'} successfully.`, type: 'success' })
      setConfirmName('')
      router.refresh()
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* View-Only Banner */}
      {!isOwner && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--color-attention-muted)',
          border: '1px solid var(--color-attention-emphasis)',
          borderRadius: '8px',
          color: 'var(--color-attention-fg)',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          You are viewing these settings as a member. Only the project owner can update connection settings or delete the project.
        </div>
      )}

      {/* General Settings */}
      <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
          <Settings size={16} color="var(--color-accent-fg)" /> General Settings
        </h3>
        <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '520px' }}>
          <div>
            <label className="gh-label">Project Name</label>
            <input 
              className="gh-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Project Name" 
              disabled={!isOwner}
              required
            />
          </div>
          <div>
            <label className="gh-label">Domain URL</label>
            <input 
              className="gh-input" 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)} 
              placeholder="e.g. https://myproject.com" 
              disabled={!isOwner}
            />
          </div>

          {isOwner && (
            <button type="submit" disabled={submitting} className="gh-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
              <Save size={14} />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </div>

      {/* Info & Codebases */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Project Metadata */}
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#ffffff' }}>
            Project Metadata
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.projectId && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', display: 'block', marginBottom: '0.25rem' }}>Project Code ID (Shared with members to join)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--color-accent-fg)',
                    background: 'var(--color-canvas-inset)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border-muted)'
                  }}>{project.projectId}</code>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: copied ? 'var(--color-success-fg)' : 'var(--color-fg-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '4px',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', display: 'block', marginBottom: '0.125rem' }}>Owner</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {typeof project.ownerId === 'object' && (project.ownerId as any).image ? (
                  <img src={(project.ownerId as any).image} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                ) : (
                  <Crown size={14} color="var(--color-attention-fg)" />
                )}
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-fg-default)' }}>
                  {typeof project.ownerId === 'object' ? (project.ownerId as any).name : 'Owner'}
                </span>
                {typeof project.ownerId === 'object' && (project.ownerId as any).githubUsername && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)' }}>
                    (@{(project.ownerId as any).githubUsername})
                  </span>
                )}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', display: 'block', marginBottom: '0.125rem' }}>Created At</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-default)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} className="text-zinc-500" />
                {formatDate(project.createdAt)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', display: 'block', marginBottom: '0.125rem' }}>Team Strength</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-default)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={14} className="text-zinc-500" />
                {project.members.length} member{project.members.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Codebases (Read-only) */}
        <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '10px', background: 'var(--color-canvas-subtle)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} color="var(--color-success-fg)" /> Linked Codebases
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '240px' }}>
            {project.codebases.length === 0 ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-subtle)', fontStyle: 'italic' }}>
                No codebases linked to this project.
              </span>
            ) : (
              project.codebases.map((cb) => (
                <div key={cb._id?.toString()} style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-canvas-inset)',
                  border: '1px solid var(--color-border-muted)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                    {cb.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                    {cb.repoFullName}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Danger Zone / Deactivation */}
      {isOwner && (
        <div style={{ 
          border: isDeactivated ? '1px solid var(--color-success-emphasis)' : '1px solid var(--color-danger-emphasis)', 
          borderRadius: '10px', 
          background: 'var(--color-canvas-subtle)', 
          padding: '1.5rem' 
        }}>
          <h3 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 700, 
            margin: '0 0 0.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: isDeactivated ? 'var(--color-success-fg)' : 'var(--color-danger-fg)' 
          }}>
            <ShieldAlert size={16} /> {isDeactivated ? 'Activate Project' : 'Deactivate Project'}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: '0 0 1.25rem' }}>
            {isDeactivated 
              ? 'Activating this project will restore access for all members, allowing them to view and manage features, database connections, and dashboard metrics again.'
              : 'Deactivating this project will temporarily lock it. Members will no longer be able to open it or access features, deployment details, or database connections until it is reactivated.'
            }
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '520px' }}>
            {!isDeactivated ? (
              <>
                <label className="gh-label" style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>
                  To confirm deactivation, type the project ID: <strong style={{ color: 'var(--color-fg-default)' }}>{project.projectId}</strong>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input 
                    className="gh-input" 
                    style={{ flex: 1, minWidth: '200px' }} 
                    value={confirmName} 
                    onChange={(e) => setConfirmName(e.target.value)} 
                    placeholder={project.projectId} 
                  />
                  <button
                    onClick={handleToggleStatus}
                    disabled={!confirmName || confirmName !== project.projectId || updatingStatus}
                    className="gh-btn-danger"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      opacity: (!confirmName || confirmName !== project.projectId || updatingStatus) ? 0.5 : 1,
                      cursor: (!confirmName || confirmName !== project.projectId || updatingStatus) ? 'not-allowed' : 'pointer',
                      pointerEvents: (!confirmName || confirmName !== project.projectId || updatingStatus) ? 'none' : 'auto'
                    }}
                  >
                    <ShieldAlert size={14} />
                    {updatingStatus ? 'Deactivating...' : 'Deactivate Project'}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleToggleStatus}
                disabled={updatingStatus}
                className="gh-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}
              >
                <Save size={14} />
                {updatingStatus ? 'Activating...' : 'Activate Project'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
