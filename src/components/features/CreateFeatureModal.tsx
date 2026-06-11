'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import BranchSelector from './BranchSelector'
import type { ICodebase } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  projectId: string
  codebases: ICodebase[]
}

export default function CreateFeatureModal({ isOpen, onClose, onCreated, projectId, codebases }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [branches, setBranches] = useState<Record<string, string | null>>({})
  const [dbChange, setDbChange] = useState('')
  const [envChange, setEnvChange] = useState('')
  const [deploymentDate, setDeploymentDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setName(''); setDescription(''); setBranches({})
    setDbChange(''); setEnvChange(''); setDeploymentDate(''); setError('')
  }
  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Feature name is required'); return }
    setSubmitting(true); setError('')
    try {
      const codebaseBranches = codebases.map((cb) => ({
        codebaseId: cb._id,
        codebaseName: cb.name,
        branchName: branches[cb._id.toString()] ?? null,
      }))
      const res = await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, codebaseBranches, dbChange, envChange, deploymentDate: deploymentDate || null }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
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
          <label className="gh-label">Feature Name <span style={{ color: 'var(--color-danger-fg)' }}>*</span></label>
          <input className="gh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="User authentication flow" autoFocus />
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

        {/* Codebase branches */}
        {codebases.length > 0 && (
          <div style={{ padding: '0.875rem', background: 'var(--color-canvas-inset)', borderRadius: '8px', border: '1px solid var(--color-border-muted)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-fg-muted)' }}>Branch per Codebase</p>
            {codebases.map((cb) => (
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="gh-label">DB Change</label>
            <input className="gh-input" value={dbChange} onChange={(e) => setDbChange(e.target.value)} placeholder="Migration needed?" />
          </div>
          <div>
            <label className="gh-label">ENV Change</label>
            <input className="gh-input" value={envChange} onChange={(e) => setEnvChange(e.target.value)} placeholder="New env vars?" />
          </div>
        </div>

        <div>
          <label className="gh-label">Deployment Date</label>
          <input type="date" className="gh-input" value={deploymentDate} onChange={(e) => setDeploymentDate(e.target.value)} />
        </div>

        {error && <p style={{ color: 'var(--color-danger-fg)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button type="button" onClick={handleClose} className="gh-btn-secondary">Cancel</button>
          <button type="button" onClick={handleSubmit} className="gh-btn-primary" disabled={submitting}>
            {submitting ? <><LoadingSpinner size={14} color="#fff" /> Creating…</> : 'Create Feature'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
