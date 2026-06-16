'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, CheckCircle2, Clock, ShieldAlert } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Toast from '@/components/ui/Toast'
import { getInitials, formatDate } from '@/lib/utils'

interface ProjectDetails {
  projectId: string
  name: string
  owner: {
    name: string
    email: string
    image?: string
    githubUsername?: string
  }
  isOwner: boolean
  isMember: boolean
  alreadyRequested: boolean
}

interface JoinRequest {
  _id: string
  recipientId: {
    name: string
    email: string
    image?: string
    githubUsername?: string
  }
  projectId: {
    name: string
  } | null
  status: 'UNREAD' | 'READ' | 'ACCEPTED' | 'DECLINED'
  createdAt: string
}

export default function JoinProjectPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [requests, setRequests] = useState<JoinRequest[]>([])

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/projects/join-requests')
      const json = await res.json()
      if (res.ok) {
        setRequests(json.data ?? [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')
    setProject(null)

    try {
      const formattedCode = code.trim().toUpperCase()
      const res = await fetch(`/api/projects/by-code/${encodeURIComponent(formattedCode)}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Project not found')
      }

      setProject(json.data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!project) return
    setSubmitting(true)
    try {
      const formattedCode = code.trim().toUpperCase()
      const res = await fetch(`/api/projects/by-code/${encodeURIComponent(formattedCode)}/join`, {
        method: 'POST',
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to send join request')
      }

      setToast({ message: 'Join request sent successfully!', type: 'success' })
      setProject(prev => prev ? { ...prev, alreadyRequested: true } : null)
      fetchRequests()
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to send request', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '2.5rem 3rem', background: 'transparent', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>
          Join Project
        </h1>
        <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
          Enter a unique Project ID to search and send a request to join the project team.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-fg-subtle)', display: 'flex', alignItems: 'center' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="e.g. PROJ-ABCD12"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="gh-input"
              style={{
                paddingLeft: '2.25rem',
                fontSize: '1rem',
                height: '42px',
                borderRadius: '8px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="gh-btn-primary"
            style={{
              height: '42px',
              padding: '0 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            {loading ? <LoadingSpinner size={16} color="#fff" /> : 'Search'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'var(--color-danger-muted)',
            border: '1px solid var(--color-danger-emphasis)',
            borderRadius: '8px',
            color: 'var(--color-danger-fg)',
            fontSize: '0.875rem',
            marginBottom: '2rem',
            animation: 'slide-down 0.15s ease-out'
          }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Project Details Results */}
        {project && (
          <div className="gh-card" style={{ padding: '1.75rem', animation: 'slide-down 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-fg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Project Found
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: '0.25rem 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                  {project.name}
                </h3>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {project.isOwner && (
                  <span className="badge-ready" style={{ height: 'fit-content' }}>
                    Owner
                  </span>
                )}
                {project.isMember && !project.isOwner && (
                  <span className="badge-deployed" style={{ height: 'fit-content' }}>
                    Member
                  </span>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-muted)', margin: '1rem 0 1.25rem 0' }} />

            {/* Owner Details */}
            <div style={{ marginBottom: '1.75rem' }}>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-fg-muted)' }}>
                PROJECT OWNER
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {project.owner.image ? (
                  <img
                    src={project.owner.image}
                    alt={project.owner.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-border-default)' }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-accent-emphasis)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {getInitials(project.owner.name)}
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#ffffff' }}>
                    {project.owner.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
                    {project.owner.githubUsername ? `@${project.owner.githubUsername}` : project.owner.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div>
              {project.isOwner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-attention-fg)', fontSize: '0.875rem' }}>
                  <ShieldAlert size={16} />
                  <span>You are the owner of this project.</span>
                </div>
              ) : project.isMember ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success-fg)', fontSize: '0.875rem' }}>
                  <CheckCircle2 size={16} />
                  <span>You are already a member of this project.</span>
                </div>
              ) : project.alreadyRequested ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-attention-muted)',
                  border: '1px solid var(--color-attention-emphasis)',
                  borderRadius: '6px',
                  color: 'var(--color-attention-fg)',
                  fontSize: '0.875rem'
                }}>
                  <Clock size={16} />
                  <span>Join request sent. Waiting for owner approval.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={submitting}
                  className="gh-btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '0.625rem 1rem',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                  }}
                >
                  {submitting ? (
                    <LoadingSpinner size={16} color="#fff" />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Send Join Request</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sent Requests Table */}
        <div style={{ marginTop: '3.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            My Sent Join Requests
          </h2>
          {requests.length === 0 ? (
            <div className="gh-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: '0.875rem' }}>
              No join requests sent yet.
            </div>
          ) : (
            <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden' }}>
              <table className="gh-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Owner</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const project = r.projectId
                    const owner = r.recipientId
                    
                    let statusLabel = 'Pending'
                    let badgeClass = 'badge-pending'
                    
                    if (r.status === 'ACCEPTED') {
                      statusLabel = 'Accepted'
                      badgeClass = 'badge-deployed'
                    } else if (r.status === 'DECLINED') {
                      statusLabel = 'Declined'
                      badgeClass = 'badge-discard'
                    }
                    
                    return (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>
                          {project?.name ?? 'Deleted Project'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {owner?.image ? (
                              <img
                                src={owner.image}
                                alt={owner.name}
                                style={{ width: 20, height: 20, borderRadius: '50%' }}
                              />
                            ) : (
                              <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'var(--color-accent-emphasis)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: '#fff'
                              }}>
                                {getInitials(owner?.name ?? 'Unknown')}
                              </div>
                            )}
                            <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
                              {owner?.name ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--color-fg-subtle)' }}>
                          {formatDate(r.createdAt)}
                        </td>
                        <td>
                          <span className={badgeClass}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
