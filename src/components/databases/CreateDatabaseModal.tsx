'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ChevronRight, ChevronLeft, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  projectId: string
}

const STEPS = ['Database Details', 'Connection Test']

export default function CreateDatabaseModal({ isOpen, onClose, onCreated, projectId }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [type, setType] = useState('mongodb')
  const [connectionUri, setConnectionUri] = useState('')
  const [databaseName, setDatabaseName] = useState('')

  // Connection testing state
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; databaseName?: string; error?: string } | null>(null)
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setStep(0)
    setName('')
    setType('mongodb')
    setConnectionUri('')
    setDatabaseName('')
    setTestResult(null)
    setTesting(false)
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/databases/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionUri: connectionUri.trim(),
          databaseName: databaseName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          databaseName: data.databaseName,
        })
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Connection failed. Check credentials.',
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: 'Network error occurred while testing connection.',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleNextStep = () => {
    setStep(1)
    handleTestConnection()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        type,
        connectionUri: connectionUri.trim(),
        databaseName: databaseName.trim() || testResult?.databaseName || 'admin',
      }
      const res = await fetch(`/api/projects/${projectId}/databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to create database connection')
      }
      onCreated()
      handleClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = name.trim().length > 0 && connectionUri.trim().length > 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Connect Database" maxWidth="540px">
      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 9999,
              background: i <= step ? 'var(--color-success-emphasis)' : 'var(--color-border-default)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', marginBottom: '1.25rem', marginTop: '-1rem' }}>
        Step {step + 1} of {STEPS.length} — <strong style={{ color: 'var(--color-fg-default)' }}>{STEPS[step]}</strong>
      </p>

      {/* Step 1 — Basic Credentials */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label className="gh-label">
              Display Name <span style={{ color: 'var(--color-danger-fg)' }}>*</span>
            </label>
            <input
              className="gh-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Production Cluster"
              autoFocus
            />
          </div>
          <div>
            <label className="gh-label">Database Type</label>
            <select
              className="gh-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="mongodb">MongoDB</option>
            </select>
          </div>
          <div>
            <label className="gh-label">
              Connection URI <span style={{ color: 'var(--color-danger-fg)' }}>*</span>
            </label>
            <input
              type="text"
              className="gh-input"
              value={connectionUri}
              onChange={(e) => setConnectionUri(e.target.value)}
              placeholder="mongodb+srv://username:password@cluster.mongodb.net/"
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)', marginTop: '0.25rem', marginBottom: 0 }}>
              Example: mongodb+srv://username:password@cluster.mongodb.net/
            </p>
          </div>
          <div>
            <label className="gh-label">Database Name <span style={{ color: 'var(--color-fg-subtle)' }}>(Optional)</span></label>
            <input
              className="gh-input"
              value={databaseName}
              onChange={(e) => setDatabaseName(e.target.value)}
              placeholder="e.g. staging"
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)', marginTop: '0.25rem', marginBottom: 0 }}>
              If left blank, will connect to the default database parsed from the URI.
            </p>
          </div>
        </div>
      )}

      {/* Step 2 — Connection Verification */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--color-canvas-inset)',
              borderRadius: '8px',
              border: '1px solid var(--color-border-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '160px',
              gap: '0.75rem',
            }}
          >
            {testing ? (
              <>
                <LoadingSpinner size={24} color="var(--color-success-fg)" />
                <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: 0 }}>
                  Testing database credentials and permissions...
                </p>
              </>
            ) : testResult ? (
              testResult.success ? (
                <>
                  <CheckCircle2 size={36} color="var(--color-success-fg)" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <p style={{ fontWeight: 700, color: 'var(--color-fg-default)', margin: 0 }}>
                      Connection Successful
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)', margin: 0 }}>
                      Resolved database: <code style={{ color: 'var(--color-accent-fg)' }}>{testResult.databaseName}</code>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={36} color="var(--color-danger-fg)" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '100%' }}>
                    <p style={{ fontWeight: 700, color: 'var(--color-fg-default)', margin: 0 }}>
                      Connection Failed
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-danger-fg)', margin: 0, wordBreak: 'break-all', maxHeight: '80px', overflowY: 'auto' }}>
                      {testResult.error}
                    </p>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    className="gh-btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
                  >
                    <RefreshCw size={12} /> Retry Test
                  </button>
                </>
              )
            ) : null}
          </div>

          {error && (
            <p style={{ color: 'var(--color-danger-fg)', fontSize: '0.875rem', margin: 0 }}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={step === 0 ? handleClose : () => setStep(0)}
          className="gh-btn-secondary"
        >
          {step === 0 ? 'Cancel' : <><ChevronLeft size={14} /> Back</>}
        </button>

        {step === 0 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="gh-btn-primary"
            disabled={!canNext}
            style={{ backgroundColor: 'var(--color-accent-emphasis)', borderColor: '#388bfd66' }}
          >
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="gh-btn-primary"
            disabled={submitting || !testResult?.success}
          >
            {submitting ? (
              <><LoadingSpinner size={14} color="#fff" /> Connecting...</>
            ) : (
              'Connect Database'
            )}
          </button>
        )}
      </div>
    </Modal>
  )
}
