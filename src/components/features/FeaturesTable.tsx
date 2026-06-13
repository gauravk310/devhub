'use client'

import { useState } from 'react'
import type { IFeaturePopulated, ICodebase, FeatureStatus } from '@/types'
import FeatureStatusBadge from './FeatureStatusBadge'
import { formatDate, truncate, getInitials } from '@/lib/utils'
import { Trash2, Plus, Database, Key, GitBranch } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Modal from '@/components/ui/Modal'

interface Props {
  features: IFeaturePopulated[]
  codebases: ICodebase[]
  projectId: string
  ownerId: string
  onAddFeature: () => void
  onStatusUpdated: (featureId: string, status: FeatureStatus) => void
  onDelete: (featureId: string) => void
}

const TYPE_STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  'BUG FIX': { bg: '#3a1f1f', fg: '#f5a3a3', border: '#5c2b2b' },
  FEATURE: { bg: '#1f2b3a', fg: '#9cc4f0', border: '#2b4060' },
  UPDATE: { bg: '#1f3a2e', fg: '#9ce0bb', border: '#2b5c47' },
  DISCARD: { bg: '#2a2a2a', fg: '#9a9a9a', border: '#3a3a3a' },
}
const DEFAULT_TYPE_STYLE = { bg: '#3a301f', fg: '#f0cf9c', border: '#5c4a2b' }

export default function FeaturesTable({
  features, codebases, projectId, ownerId, onAddFeature, onStatusUpdated, onDelete,
}: Props) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id === ownerId
  const [selectedFeatureForChanges, setSelectedFeatureForChanges] = useState<IFeaturePopulated | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  if (features.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '3rem 1rem',
          border: '1px solid #2e2e2e',
          borderRadius: '10px',
          background: '#1a1a1a',
          color: '#9a9a9a',
        }}
      >
        <Plus size={36} style={{ opacity: 0.3 }} />
        <p style={{ fontWeight: 600, color: '#e4e4e4', margin: 0 }}>No features yet</p>
        <p style={{ fontSize: '0.875rem', margin: 0 }}>Add the first feature to get started.</p>
        <button
          onClick={onAddFeature}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: '1px solid #3a3a3a',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add Feature
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          overflow: 'auto',
          border: '1px solid #2e2e2e',
          borderRadius: '10px',
          background: '#1a1a1a',
          height: 'calc(100vh - 270px)',
          minHeight: '350px',
        }}
      >
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: '#202020' }}>
              {['Feature', 'Type', 'Author', ...codebases.map((cb) => `${cb.name} Branch`), 'Changes', 'Deploy Date', 'Status'].map((label) => (
                <th
                  key={label}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#202020',
                    textAlign: 'left',
                    padding: '0.7rem 1rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#8a8a8a',
                    borderBottom: '1px solid #2e2e2e',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </th>
              ))}
              {isOwner && (
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#202020',
                    borderBottom: '1px solid #2e2e2e',
                    width: '40px',
                  }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {features.map((f) => {
              const fType = f.type || 'FEATURE'
              const typeStyle = TYPE_STYLES[fType] || DEFAULT_TYPE_STYLE
              const id = f._id.toString()
              const isHovered = hoveredRow === id
              const hasDb = !!f.dbChange?.trim()
              const hasEnv = !!f.envChange?.trim()
              const hasChanges = hasDb || hasEnv

              return (
                <tr
                  key={id}
                  onMouseEnter={() => setHoveredRow(id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    background: isHovered ? '#222222' : 'transparent',
                    transition: 'background 0.12s ease',
                    borderBottom: '1px solid #262626',
                  }}
                >
                  {/* Name + description */}
                  <td style={{ padding: '0.7rem 1rem', maxWidth: '220px', verticalAlign: 'top' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#f0f0f0' }}>{f.name}</p>
                    {f.description && (
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#8a8a8a', lineHeight: 1.4 }} title={f.description}>
                        {truncate(f.description, 60)}
                      </p>
                    )}
                  </td>

                  {/* Type */}
                  <td style={{ padding: '0.7rem 1rem', verticalAlign: 'top' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
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
                  </td>

                  {/* Author */}
                  <td style={{ padding: '0.7rem 1rem', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {f.authorId?.image ? (
                        <img
                          src={f.authorId.image}
                          alt=""
                          style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #333' }}
                          title={f.authorId.name}
                        />
                      ) : (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#3a3a3a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#e0e0e0',
                          }}
                        >
                          {getInitials(f.authorId?.name ?? 'U')}
                        </div>
                      )}
                      <span style={{ fontSize: '0.8125rem', color: '#c4c4c4' }}>{f.authorId?.name}</span>
                    </div>
                  </td>

                  {/* Dynamic codebase branch columns */}
                  {codebases.map((cb) => {
                    const cbBranch = f.codebaseBranches.find((b) => b.codebaseId.toString() === cb._id.toString())
                    return (
                      <td key={cb._id.toString()} style={{ padding: '0.7rem 1rem', verticalAlign: 'top' }}>
                        {cbBranch?.branchName ? (
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
                            {cbBranch.branchName}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: '#5a5a5a' }}>— No Branch</span>
                        )}
                      </td>
                    )
                  })}

                  {/* Changes */}
                  <td style={{ padding: '0.7rem 1rem', verticalAlign: 'top' }}>
                    {!hasChanges ? (
                      <span style={{ color: '#5a5a5a', fontSize: '0.8125rem' }}>—</span>
                    ) : (
                      <button
                        onClick={() => setSelectedFeatureForChanges(f)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.3rem 0.625rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #3a3a3a',
                          background: '#242424',
                          color: '#cfcfcf',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          lineHeight: 1.2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2d2d2d'
                          e.currentTarget.style.borderColor = '#4a4a4a'
                          e.currentTarget.style.color = '#fff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#242424'
                          e.currentTarget.style.borderColor = '#3a3a3a'
                          e.currentTarget.style.color = '#cfcfcf'
                        }}
                      >
                        <span>View</span>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          {hasDb && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                padding: '0.05rem 0.3rem',
                                borderRadius: '3px',
                                background: '#3a301f',
                                color: '#f0cf9c',
                                border: '1px solid #5c4a2b',
                              }}
                            >
                              <Database size={9} /> DB
                            </span>
                          )}
                          {hasEnv && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                padding: '0.05rem 0.3rem',
                                borderRadius: '3px',
                                background: '#3a1f1f',
                                color: '#f5a3a3',
                                border: '1px solid #5c2b2b',
                              }}
                            >
                              <Key size={9} /> ENV
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </td>

                  {/* Deploy date */}
                  <td style={{ padding: '0.7rem 1rem', fontSize: '0.8125rem', color: '#9a9a9a', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                    {formatDate(f.deploymentDate)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.7rem 1rem', verticalAlign: 'top' }}>
                    <FeatureStatusBadge status={f.status} featureId={id} projectId={projectId} onUpdated={onStatusUpdated} />
                  </td>

                  {/* Delete */}
                  {isOwner && (
                    <td style={{ padding: '0.7rem 0.5rem', verticalAlign: 'top' }}>
                      <button
                        onClick={() => onDelete(id)}
                        title="Delete feature"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: isHovered ? '#666' : 'transparent',
                          transition: 'color 0.15s, background 0.15s',
                          opacity: isHovered ? 1 : 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#f87171'
                          e.currentTarget.style.background = '#3a1f1f'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = isHovered ? '#666' : 'transparent'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={selectedFeatureForChanges !== null}
        onClose={() => setSelectedFeatureForChanges(null)}
        title={`Changes for ${selectedFeatureForChanges?.name || 'Feature'}`}
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {selectedFeatureForChanges?.dbChange?.trim() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f0cf9c' }}>
                <Database size={15} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Database Changes
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '0.75rem 1rem',
                  fontSize: '0.8125rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  borderRadius: '6px',
                  background: '#1e1e1e',
                  border: '1px solid #333',
                  color: '#e0e0e0',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {selectedFeatureForChanges.dbChange}
              </pre>
            </div>
          )}

          {selectedFeatureForChanges?.envChange?.trim() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f5a3a3' }}>
                <Key size={15} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Environment Changes
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '0.75rem 1rem',
                  fontSize: '0.8125rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  borderRadius: '6px',
                  background: '#1e1e1e',
                  border: '1px solid #333',
                  color: '#e0e0e0',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {selectedFeatureForChanges.envChange}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}