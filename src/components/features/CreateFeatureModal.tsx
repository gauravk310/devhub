'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Modal from '@/components/ui/Modal'
import BranchSelector from './BranchSelector'
import type { ICodebase, FeatureType, PublicUser } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  projectId: string
  codebases: ICodebase[]
  members?: PublicUser[]
}

export default function CreateFeatureModal({
  isOpen,
  onClose,
  onCreated,
  projectId,
  codebases,
  members,
}: Props) {
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [branches, setBranches] = useState<Record<string, string | null>>({})
  const [dbChange, setDbChange] = useState('')
  const [envChange, setEnvChange] = useState('')
  const [note, setNote] = useState('')
  const [type, setType] = useState<FeatureType>('FEATURE')
  const [authorId, setAuthorId] = useState<string>('')
  const [fetchedMembers, setFetchedMembers] = useState<PublicUser[]>([])
  const [deploymentDate, setDeploymentDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentUserId = session?.user?.id ?? ''

  // Fetch project members if not provided in props
  useEffect(() => {
    if (isOpen && (!members || members.length === 0)) {
      fetch(`/api/projects/${projectId}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data?.members) {
            setFetchedMembers(j.data.members)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, projectId, members])

  // Set default author to current user when modal opens or session loads
  useEffect(() => {
    if (isOpen && currentUserId && !authorId) {
      setAuthorId(currentUserId)
    }
  }, [isOpen, currentUserId, authorId])

  const reset = () => {
    setName('')
    setDescription('')
    setBranches({})
    setType('FEATURE')
    setAuthorId(currentUserId)
    setDbChange('')
    setEnvChange('')
    setNote('')
    setDeploymentDate('')
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const membersList = (members && members.length > 0) ? members : fetchedMembers
  const hasCurrentUserInList = membersList.some((m) => m._id.toString() === currentUserId)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Feature name is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const codebaseBranches = codebases.map((cb) => ({
        codebaseId: cb._id,
        codebaseName: cb.name,
        branchName: branches[cb._id.toString()] ?? null,
      }))

      const res = await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description,
          authorId: authorId || currentUserId,
          codebaseBranches,
          dbChange,
          envChange,
          note,
          type,
          deploymentDate: deploymentDate || null,
        }),
      })

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to create feature')
      }

      onCreated()
      handleClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Feature">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <label className="gh-label">
            Feature Name <span style={{ color: 'var(--color-danger-fg)' }}>*</span>
          </label>
          <input
            className="gh-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="User authentication flow"
            autoFocus
          />
        </div>

        <div>
          <label className="gh-label">Description</label>
          <textarea
            className="gh-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the feature…"
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="gh-label">Feature Type</label>
            <select
              className="gh-select"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="FEATURE">Feature</option>
              <option value="BUG FIX">Bug Fix</option>
              <option value="UPDATE">Update</option>
              <option value="DISCARD">Discard</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="gh-label">Author</label>
            <select
              className="gh-select"
              value={authorId || currentUserId}
              onChange={(e) => setAuthorId(e.target.value)}
            >
              {!hasCurrentUserInList && session?.user && (
                <option value={currentUserId}>
                  {session.user.name || session.user.email || 'You'} (You)
                </option>
              )}
              {membersList.map((m) => {
                const isYou = m._id.toString() === currentUserId
                return (
                  <option key={m._id.toString()} value={m._id.toString()}>
                    {m.name || m.email || 'Member'} {isYou ? '(You)' : ''}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Codebase branches */}
        {codebases.length > 0 && (
          <div
            style={{
              padding: '0.875rem',
              background: 'var(--color-canvas-inset)',
              borderRadius: '8px',
              border: '1px solid var(--color-border-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-fg-muted)',
              }}
            >
              Branch per Codebase
            </p>
            {codebases.map((cb) => (
              <BranchSelector
                key={cb._id.toString()}
                codebaseName={cb.name}
                repoFullName={cb.repoFullName}
                projectId={projectId}
                value={branches[cb._id.toString()] ?? null}
                onChange={(v) => setBranches((b) => ({ ...b, [cb._id.toString()]: v }))}
              />
            ))}
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--color-danger-fg)', fontSize: '0.875rem', margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button type="button" onClick={handleClose} className="gh-btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="gh-btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner size={14} color="#fff" /> Creating…
              </>
            ) : (
              'Create Feature'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
