'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { IProjectWithMembers, IFeaturePopulated, FeatureStatus, FeatureType } from '@/types'
import BranchSelector from '@/components/features/BranchSelector'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SwalConfirm from '@/components/ui/SwalConfirm'
import Toast from '@/components/ui/Toast'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Database,
  Key,
  GitBranch,
  Calendar,
  Layers,
  Tag,
  User as UserIcon,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

const TYPE_STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  'BUG FIX': { bg: '#3a1f1f', fg: '#f5a3a3', border: '#5c2b2b' },
  FEATURE: { bg: '#1f2b3a', fg: '#9cc4f0', border: '#2b4060' },
  UPDATE: { bg: '#1f3a2e', fg: '#9ce0bb', border: '#2b5c47' },
  DISCARD: { bg: '#2a2a2a', fg: '#9a9a9a', border: '#3a3a3a' },
}
const DEFAULT_TYPE_STYLE = { bg: '#3a301f', fg: '#f0cf9c', border: '#5c4a2b' }

export default function FeatureDetailPage({ params }: { params: Promise<{ projectId: string; featureId: string }> }) {
  const { projectId, featureId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [feature, setFeature] = useState<IFeaturePopulated | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<FeatureType>('FEATURE')
  const [status, setStatus] = useState<FeatureStatus>('PENDING')
  const [dbChange, setDbChange] = useState('')
  const [envChange, setEnvChange] = useState('')
  const [note, setNote] = useState('')
  const [deploymentDate, setDeploymentDate] = useState('')
  const [branches, setBranches] = useState<Record<string, string | null>>({})
  const [selectedCollabs, setSelectedCollabs] = useState<string[]>([])

  // Form saving state
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [projRes, featRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/features/${featureId}`)
      ])

      if (!projRes.ok) throw new Error('Failed to load project details')
      if (!featRes.ok) {
        if (featRes.status === 404) throw new Error('Feature not found')
        throw new Error('Failed to load feature details')
      }

      const projData = await projRes.json()
      const featData = await featRes.json()

      setProject(projData.data)
      setFeature(featData.data)

      // Initialize form fields
      if (featData.data) {
        const f = featData.data as IFeaturePopulated
        setName(f.name)
        setDescription(f.description ?? '')
        setType(f.type || 'FEATURE')
        setStatus(f.status || 'PENDING')
        setDbChange(f.dbChange ?? '')
        setEnvChange(f.envChange ?? '')
        setNote(f.note ?? '')
        setDeploymentDate(f.deploymentDate ? new Date(f.deploymentDate).toISOString().split('T')[0] : '')

        const branchMap: Record<string, string | null> = {}
        f.codebaseBranches.forEach((b) => {
          branchMap[b.codebaseId.toString()] = b.branchName
        })
        setBranches(branchMap)
        setSelectedCollabs(f.collaborators ? f.collaborators.map((c) => c._id.toString()) : [])
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId, featureId])

  const handleCancelEdit = () => {
    if (!feature) return
    setName(feature.name)
    setDescription(feature.description ?? '')
    setType(feature.type || 'FEATURE')
    setStatus(feature.status || 'PENDING')
    setDbChange(feature.dbChange ?? '')
    setEnvChange(feature.envChange ?? '')
    setNote(feature.note ?? '')
    setDeploymentDate(feature.deploymentDate ? new Date(feature.deploymentDate).toISOString().split('T')[0] : '')

    const branchMap: Record<string, string | null> = {}
    feature.codebaseBranches.forEach((b) => {
      branchMap[b.codebaseId.toString()] = b.branchName
    })
    setBranches(branchMap)
    setSelectedCollabs(feature.collaborators ? feature.collaborators.map((c) => c._id.toString()) : [])
    setToast(null)
    setIsEditMode(false)
  }

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      setToast({ message: 'Feature name is required', type: 'error' })
      return
    }
    if (status === 'DEPLOYED' && !deploymentDate) {
      setToast({ message: 'Deployment date is required when status is Deployed', type: 'error' })
      return
    }
    setSaving(true)
    setToast(null)

    try {
      const codebaseBranches = (project?.codebases ?? []).map((cb) => ({
        codebaseId: cb._id,
        codebaseName: cb.name,
        branchName: branches[cb._id.toString()] ?? null,
      }))

      const res = await fetch(`/api/projects/${projectId}/features/${featureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description,
          type,
          status,
          dbChange,
          envChange,
          note,
          collaborators: selectedCollabs,
          codebaseBranches,
          deploymentDate: deploymentDate || null,
        }),
      })

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to update feature')
      }

      const updated = await res.json()
      setFeature(updated.data)
      setIsEditMode(false)
      setToast({ message: 'Feature updated successfully!', type: 'success' })
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFeature = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/features/${featureId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to delete feature')
      }
      router.push(`/projects/${projectId}/features`)
    } catch (err) {
      alert((err as Error).message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 120px)' }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  if (error || !feature) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '10px', maxWidth: '500px', margin: '4rem auto' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-danger-fg)', marginBottom: '1rem', opacity: 0.8 }} />
        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#f0f0f0' }}>Error Loading Feature</h3>
        <p style={{ color: '#8a8a8a', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error || 'Feature could not be found.'}</p>
        <Link href={`/projects/${projectId}/features`} className="gh-btn-secondary">
          <ArrowLeft size={14} /> Back to Features
        </Link>
      </div>
    )
  }

  const projectOwnerId = typeof project?.ownerId === 'object' ? project.ownerId?._id?.toString() : project?.ownerId
  const isOwner = session?.user?.id && projectOwnerId === session.user.id

  const fType = feature.type || 'FEATURE'
  const typeStyle = TYPE_STYLES[fType] || DEFAULT_TYPE_STYLE

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link 
          href={`/projects/${projectId}/features`} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.875rem', 
            fontWeight: 500, 
            color: 'var(--color-fg-muted)',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-fg-default)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-fg-muted)'}
        >
          <ArrowLeft size={16} /> Back to Features
        </Link>

        {/* Global actions */}
        {!isEditMode && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setIsEditMode(true)} className="gh-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Edit size={14} /> Edit Feature
            </button>
            {isOwner && (
              <button onClick={() => setShowDeleteConfirm(true)} className="gh-btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {isEditMode ? (
        /* ==================== EDIT MODE ==================== */
        <div className="gh-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>Edit Feature Details</h3>
            <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg-muted)' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Feature Name */}
            <div>
              <label className="gh-label">Feature Name <span style={{ color: 'var(--color-danger-fg)' }}>*</span></label>
              <input 
                className="gh-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="User authentication flow" 
              />
            </div>

            {/* Description */}
            <div>
              <label className="gh-label">Description</label>
              <textarea
                className="gh-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the feature purpose, design or context…"
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Type */}
              <div>
                <label className="gh-label">Feature Type</label>
                <select
                  className="gh-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as FeatureType)}
                >
                  <option value="FEATURE">Feature</option>
                  <option value="BUG FIX">Bug Fix</option>
                  <option value="UPDATE">Update</option>
                  <option value="DISCARD">Discard</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="gh-label">Status</label>
                <select
                  className="gh-select"
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value as FeatureStatus
                    setStatus(newStatus)
                    if (newStatus !== 'DEPLOYED') {
                      setDeploymentDate('')
                    }
                  }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="READY">Ready</option>
                  <option value="TESTING">Testing</option>
                  <option value="DEPLOYED">Deployed</option>
                  <option value="DISCARD">Discard</option>
                </select>
              </div>
            </div>

            {/* Collaborators Selector */}
            <div>
              <label className="gh-label">Collaborators</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'var(--color-canvas-inset)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '6px',
                minHeight: '44px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {project?.members
                  .filter((m) => m._id.toString() !== feature.authorId?._id?.toString())
                  .map((m) => {
                    const isSelected = selectedCollabs.includes(m._id.toString())
                    return (
                      <label
                        key={m._id.toString()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
                          border: `1px solid ${isSelected ? 'var(--color-accent-fg)' : 'var(--color-border-default)'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: isSelected ? 'var(--color-accent-fg)' : 'var(--color-fg-default)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedCollabs(selectedCollabs.filter((id) => id !== m._id.toString()))
                            } else {
                              setSelectedCollabs([...selectedCollabs, m._id.toString()])
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        {m.image ? (
                          <img src={m.image} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#3a3a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#e0e0e0' }}>
                            {getInitials(m.name)}
                          </div>
                        )}
                        {m.name}
                      </label>
                    )
                  })
                }
                {project?.members.filter((m) => m._id.toString() !== feature.authorId?._id?.toString()).length === 0 && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-subtle)', fontStyle: 'italic' }}>
                    No other team members available.
                  </span>
                )}
              </div>
            </div>

            {/* Codebase branches */}
            {project && project.codebases.length > 0 && (
              <div style={{ 
                padding: '1.25rem', 
                background: 'var(--color-canvas-inset)', 
                borderRadius: '8px', 
                border: '1px solid var(--color-border-muted)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem' 
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-muted)' }}>Branch Associations</p>
                {project.codebases.map((cb) => (
                  <BranchSelector
                    key={cb._id.toString()}
                    codebaseName={cb.name}
                    repoFullName={cb.repoFullName}
                    value={branches[cb._id.toString()] ?? null}
                    onChange={(v) => setBranches((b) => ({ ...b, [cb._id.toString()]: v }))}
                  />
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* DB Change */}
              <div>
                <label className="gh-label">Database Changes</label>
                <textarea 
                  className="gh-input" 
                  value={dbChange} 
                  onChange={(e) => setDbChange(e.target.value)} 
                  placeholder="SQL/Mongoose schema modifications..." 
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}
                />
              </div>

              {/* ENV Change */}
              <div>
                <label className="gh-label">Environment Changes</label>
                <textarea 
                  className="gh-input" 
                  value={envChange} 
                  onChange={(e) => setEnvChange(e.target.value)} 
                  placeholder="New keys, API endpoints or keys needed..." 
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Changes Note */}
            <div>
              <label className="gh-label">Changes Note</label>
              <textarea 
                className="gh-input" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="Additional details, manual verification steps or instructions..." 
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}
              />
            </div>

            {/* Deployment Date */}
            <div>
              <label className="gh-label">Deployment Date {status === 'DEPLOYED' && <span style={{ color: 'var(--color-danger-fg)' }}>*</span>}</label>
              <input 
                type="date" 
                className="gh-input" 
                value={deploymentDate} 
                onChange={(e) => setDeploymentDate(e.target.value)} 
                disabled={status !== 'DEPLOYED'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border-muted)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={handleCancelEdit} className="gh-btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="button" onClick={handleSaveChanges} className="gh-btn-primary" disabled={saving}>
              {saving ? <><LoadingSpinner size={14} color="#fff" /> Saving…</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      ) : (
        /* ==================== VIEW MODE ==================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Info Card */}
          <div className="gh-card" style={{ padding: '2rem', position: 'relative' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '1.5rem', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      border: `1px solid ${typeStyle.border}`,
                      color: typeStyle.fg,
                      background: typeStyle.bg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fType}
                  </span>

                  <Badge status={feature.status} />
                </div>

                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-fg-default)' }}>
                  {feature.name}
                </h1>

                {feature.description ? (
                  <p style={{ margin: 0, fontSize: '0.925rem', color: '#c4c4c4', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {feature.description}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.925rem', color: 'var(--color-fg-subtle)', fontStyle: 'italic' }}>
                    No description provided.
                  </p>
                )}
              </div>

              {/* Dates in Top-Right of Card (Side-by-Side) */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-fg-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={11} /> Added Date
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-default)', fontWeight: 500 }}>
                    {formatDate(feature.createdAt)}
                  </span>
                </div>
                
                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border-muted)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-fg-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={11} /> Deployed Date
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: feature.deploymentDate ? 'var(--color-fg-default)' : 'var(--color-fg-subtle)', fontWeight: 500 }}>
                    {feature.deploymentDate ? formatDate(feature.deploymentDate) : 'Not deployed yet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Core parameters list */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              
              {/* Author */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-fg-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <UserIcon size={12} /> Author
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  {feature.authorId?.image ? (
                    <img
                      src={feature.authorId.image}
                      alt=""
                      style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--color-border-default)' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: '#3a3a3a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#e0e0e0',
                      }}
                    >
                      {getInitials(feature.authorId?.name ?? 'U')}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-fg-default)' }}>
                      {feature.authorId?.name}
                    </span>
                    {feature.authorId?.githubUsername && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-fg)' }}>
                        @{feature.authorId.githubUsername}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Collaborators */}
              {feature.collaborators && feature.collaborators.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-fg-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <UserIcon size={12} /> Collaborators
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.2rem' }}>
                    {feature.collaborators.map((c) => (
                      <div 
                        key={c._id.toString()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        title={`${c.name} (${c.email})`}
                      >
                        {c.image ? (
                          <img 
                            src={c.image} 
                            alt="" 
                            style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--color-border-default)' }} 
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: 26, 
                              height: 26, 
                              borderRadius: '50%', 
                              background: '#3a3a3a', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '0.7rem', 
                              fontWeight: 700, 
                              color: '#e0e0e0' 
                            }}
                          >
                            {getInitials(c.name)}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-fg-default)' }}>
                            {c.name}
                          </span>
                          {c.githubUsername && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-fg)' }}>
                              @{c.githubUsername}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



            </div>
          </div>

          {/* Codebase branches card */}
          <div className="gh-card" style={{ padding: '1.5rem 2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-fg-default)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitBranch size={16} color="var(--color-accent-fg)" />
              Codebase Branch Associations
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {feature.codebaseBranches.length === 0 ? (
                <span style={{ color: 'var(--color-fg-subtle)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No codebase branch associations defined for this feature.
                </span>
              ) : (
                feature.codebaseBranches.map((b) => (
                  <div 
                    key={b.codebaseId.toString()} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.875rem', 
                      background: 'var(--color-canvas-inset)', 
                      borderRadius: '6px', 
                      border: '1px solid var(--color-border-muted)' 
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                      {b.codebaseName}
                    </span>
                    {b.branchName ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.78rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#8fd4a8',
                          background: '#1b2e23',
                          border: '1px solid #2b4a3a',
                          borderRadius: '4px',
                          padding: '0.15rem 0.45rem',
                        }}
                      >
                        <GitBranch size={11} />
                        {b.branchName}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-subtle)', fontStyle: 'italic' }}>
                        No Branch
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Database and Env Changes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            
            {/* DB Changes */}
            <div className="gh-card" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f0cf9c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={16} />
                Database Changes
              </h3>
              {feature.dbChange?.trim() ? (
                <pre
                  style={{
                    margin: 0,
                    padding: '0.75rem 1rem',
                    fontSize: '0.8125rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    borderRadius: '6px',
                    background: 'var(--color-canvas-inset)',
                    border: '1px solid var(--color-border-muted)',
                    color: '#e4e4e4',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    minHeight: '80px',
                  }}
                >
                  {feature.dbChange}
                </pre>
              ) : (
                <div 
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: '6px', 
                    background: 'var(--color-canvas-inset)', 
                    border: '1px solid var(--color-border-muted)', 
                    color: 'var(--color-fg-subtle)', 
                    fontSize: '0.85rem', 
                    fontStyle: 'italic',
                    textAlign: 'center' 
                  }}
                >
                  No database schema modifications required for this feature.
                </div>
              )}
            </div>

            {/* Env Changes */}
            <div className="gh-card" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#f5a3a3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={16} />
                Environment Changes
              </h3>
              {feature.envChange?.trim() ? (
                <pre
                  style={{
                    margin: 0,
                    padding: '0.75rem 1rem',
                    fontSize: '0.8125rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    borderRadius: '6px',
                    background: 'var(--color-canvas-inset)',
                    border: '1px solid var(--color-border-muted)',
                    color: '#e4e4e4',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    minHeight: '80px',
                  }}
                >
                  {feature.envChange}
                </pre>
              ) : (
                <div 
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: '6px', 
                    background: 'var(--color-canvas-inset)', 
                    border: '1px solid var(--color-border-muted)', 
                    color: 'var(--color-fg-subtle)', 
                    fontSize: '0.85rem', 
                    fontStyle: 'italic',
                    textAlign: 'center' 
                  }}
                >
                  No environment variable changes required for this feature.
                </div>
              )}
            </div>

          </div>

          {/* Changes Note */}
          <div className="gh-card" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-accent-fg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} />
              Changes Note
            </h3>
            {feature.note?.trim() ? (
              <pre
                style={{
                  margin: 0,
                  padding: '0.75rem 1rem',
                  fontSize: '0.8125rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  borderRadius: '6px',
                  background: 'var(--color-canvas-inset)',
                  border: '1px solid var(--color-border-muted)',
                  color: '#e4e4e4',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  minHeight: '80px',
                }}
              >
                {feature.note}
              </pre>
            ) : (
              <div 
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: '6px', 
                  background: 'var(--color-canvas-inset)', 
                  border: '1px solid var(--color-border-muted)', 
                  color: 'var(--color-fg-subtle)', 
                  fontSize: '0.85rem', 
                  fontStyle: 'italic',
                  textAlign: 'center' 
                }}
              >
                No changes note specified for this feature.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Delete Confirmation */}
      <SwalConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteFeature}
        title="Delete this Feature?"
        message="Are you sure you want to delete this feature? This action is permanent and cannot be undone."
        confirmText={deleting ? 'Deleting…' : 'Delete Feature'}
        cancelText="Cancel"
      />

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
