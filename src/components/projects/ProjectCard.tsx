'use client'

import type { IProjectWithMembers } from '@/types'
import { useRouter } from 'next/navigation'
import { GitBranch, Globe, Users, Calendar, Crown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface Props {
  project: IProjectWithMembers
}

export default function ProjectCard({ project }: Props) {
  const router = useRouter()
  const { data: session } = useSession()

  const isOwner =
    typeof project.ownerId === 'object'
      ? project.ownerId._id?.toString() === session?.user?.id
      : project.ownerId.toString() === session?.user?.id

  return (
    <div
      className="gh-card"
      onClick={() => router.push(`/projects/${project._id}/dashboard`)}
      style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: 0, lineHeight: 1.3 }}>
          {project.name}
        </h3>
        {isOwner && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-attention-fg)', background: 'var(--color-attention-muted)', padding: '0.125rem 0.5rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
            <Crown size={10} />
            Owner
          </span>
        )}
      </div>

      {/* Domain */}
      {project.domain && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Globe size={13} color="var(--color-fg-subtle)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-accent-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.domain}
          </span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <GitBranch size={13} color="var(--color-fg-subtle)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
            {project.codebases.length} codebase{project.codebases.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Users size={13} color="var(--color-fg-subtle)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
            {project.members.length} member{project.members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Member avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '-0.25rem' }}>
        {project.members.slice(0, 5).map((m, i) => (
          <img
            key={m._id?.toString() ?? i}
            src={m.image}
            alt={m.name}
            title={m.name}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              border: '2px solid var(--color-canvas-subtle)',
              marginLeft: i > 0 ? '-6px' : 0,
              zIndex: 5 - i,
              position: 'relative',
            }}
          />
        ))}
        {project.members.length > 5 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-muted)', marginLeft: '0.5rem' }}>
            +{project.members.length - 5}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', borderTop: '1px solid var(--color-border-muted)', paddingTop: '0.75rem', marginTop: '0.125rem' }}>
        <Calendar size={12} color="var(--color-fg-subtle)" />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)' }}>
          Created {formatDate(project.createdAt)}
        </span>
        {project.hasQA && (
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-success-fg)', background: 'var(--color-success-muted)', padding: '0.1rem 0.5rem', borderRadius: '9999px' }}>
            QA
          </span>
        )}
      </div>
    </div>
  )
}
