'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import CodebaseSelector from './CodebaseSelector'
import QABranchConfig from './QABranchConfig'
import Toggle from '@/components/ui/Toggle'
import type { GitHubRepo, ICodebase } from '@/types'
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CodebaseEntry {
  tempId: string
  name: string
  repo: GitHubRepo | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const STEPS = ['Basic Info', 'Codebases', 'QA Config', 'Review']

export default function CreateProjectModal({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [codebases, setCodebases] = useState<CodebaseEntry[]>([{ tempId: '1', name: '', repo: null }])
  const [hasQA, setHasQA] = useState(false)
  const [qaBranches, setQABranches] = useState<Record<string, string>>({})
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && step === 1 && repos.length === 0) {
      setReposLoading(true)
      fetch('/api/github/repos')
        .then((r) => r.json())
        .then((j) => setRepos(j.data ?? []))
        .catch(() => {})
        .finally(() => setReposLoading(false))
    }
  }, [isOpen, step])

  const reset = () => {
    setStep(0); setName(''); setDomain(''); setHasQA(false)
    setCodebases([{ tempId: '1', name: '', repo: null }])
    setQABranches({}); setError('')
  }

  const handleClose = () => { reset(); onClose() }

  const addCodebase = () =>
    setCodebases((c) => [...c, { tempId: Date.now().toString(), name: '', repo: null }])

  const removeCodebase = (id: string) =>
    setCodebases((c) => c.filter((e) => e.tempId !== id))

  const updateCodebase = (id: string, field: 'name' | 'repo', value: string | GitHubRepo | null) =>
    setCodebases((c) => c.map((e) => (e.tempId === id ? { ...e, [field]: value } : e)))

  const builtCodebases = (): (ICodebase & { tempId: string })[] =>
    codebases
      .filter((c) => c.name.trim() && c.repo)
      .map((c) => ({
        _id: Math.random().toString(16).slice(2).padEnd(24, '0').slice(0, 24), // browser-safe ObjectId-format ID
        tempId: c.tempId,
        name: c.name.trim(),
        repoFullName: c.repo!.full_name,
        repoId: c.repo!.id,
      }))

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const built = builtCodebases()
      const payload = {
        name: name.trim(),
        domain: domain.trim(),
        codebases: built.map(({ tempId: _, ...rest }) => rest),
        hasQA,
        qaBranches: hasQA
          ? built
              .filter((cb) => qaBranches[cb.tempId])
              .map((cb) => ({ codebaseId: cb._id, branchName: qaBranches[cb.tempId] }))
          : [],
      }
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to create project')
      }
      onCreated()
      handleClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const canNext =
    step === 0 ? name.trim().length > 0 :
    step === 1 ? codebases.some((c) => c.name.trim() && c.repo) :
    true

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Project" maxWidth="600px">
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1, height: 4, borderRadius: 9999,
              background: i <= step ? 'var(--color-accent-emphasis)' : 'var(--color-border-default)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', marginBottom: '1.25rem', marginTop: '-1rem' }}>
        Step {step + 1} of {STEPS.length} — <strong style={{ color: 'var(--color-fg-default)' }}>{STEPS[step]}</strong>
      </p>

      {/* Step 0 — Basic Info */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label className="gh-label">Project Name <span style={{ color: 'var(--color-danger-fg)' }}>*</span></label>
            <input className="gh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome App" autoFocus />
          </div>
          <div>
            <label className="gh-label">Domain URL</label>
            <input className="gh-input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="https://myapp.com" />
          </div>
        </div>
      )}

      {/* Step 1 — Codebases */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {codebases.map((cb, i) => (
            <div key={cb.tempId} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.875rem', background: 'var(--color-canvas-inset)', borderRadius: '8px', border: '1px solid var(--color-border-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-fg-muted)' }}>Codebase {i + 1}</span>
                {codebases.length > 1 && (
                  <button type="button" onClick={() => removeCodebase(cb.tempId)} className="gh-btn-danger" style={{ padding: '0.125rem 0.5rem', fontSize: '0.75rem' }}>
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
              <div>
                <label className="gh-label">Name</label>
                <input className="gh-input" value={cb.name} onChange={(e) => updateCodebase(cb.tempId, 'name', e.target.value)} placeholder='e.g. "Frontend"' />
              </div>
              <div>
                <label className="gh-label">Repository</label>
                <CodebaseSelector repos={repos} loading={reposLoading} value={cb.repo} onChange={(r) => updateCodebase(cb.tempId, 'repo', r)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addCodebase} className="gh-btn-secondary" style={{ width: 'fit-content' }}>
            <Plus size={14} /> Add Another Codebase
          </button>
        </div>
      )}

      {/* Step 2 — QA Config */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Toggle checked={hasQA} onChange={setHasQA} label="Does this project have a QA environment?" id="hasqa" />
          {hasQA && (
            <div style={{ padding: '1rem', background: 'var(--color-canvas-inset)', borderRadius: '8px', border: '1px solid var(--color-border-muted)' }}>
              <QABranchConfig
                codebases={builtCodebases()}
                qaBranches={qaBranches}
                onChange={(id, branch) => setQABranches((q) => ({ ...q, [id]: branch }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-canvas-inset)', borderRadius: '8px', border: '1px solid var(--color-border-muted)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Row label="Project" value={name} />
            {domain && <Row label="Domain" value={domain} />}
            <Row label="Codebases" value={builtCodebases().map((c) => c.name).join(', ') || '—'} />
            <Row label="QA" value={hasQA ? 'Yes' : 'No'} />
          </div>
          {error && <p style={{ color: 'var(--color-danger-fg)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.75rem' }}>
        <button type="button" onClick={step === 0 ? handleClose : () => setStep(s => s - 1)} className="gh-btn-secondary">
          {step === 0 ? 'Cancel' : <><ChevronLeft size={14} /> Back</>}
        </button>
        {step < 3 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} className="gh-btn-primary" disabled={!canNext}>
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="gh-btn-primary" disabled={submitting}>
            {submitting ? <><LoadingSpinner size={14} color="#fff" /> Creating…</> : 'Create Project'}
          </button>
        )}
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--color-fg-muted)', width: '80px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-fg-default)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
