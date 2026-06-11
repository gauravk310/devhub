'use client'

import type { PublicUser } from '@/types'
import { Crown, UserMinus, Users } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface TeamMember extends PublicUser {
  role: string
}

interface Props {
  members: TeamMember[]
  ownerId: string
  onRemove: (userId: string) => void
}

export default function TeamTable({ members, ownerId, onRemove }: Props) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id === ownerId

  if (members.length === 0) {
    return (
      <div className="gh-empty-state">
        <Users size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontWeight: 600 }}>No team members</p>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden' }}>
      <table className="gh-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            {isOwner && <th></th>}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const isMe = m._id.toString() === session?.user?.id
            const isMemberOwner = m._id.toString() === ownerId
            return (
              <tr key={m._id.toString()}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    {m.image ? (
                      <img src={m.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-emphasis)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                        {getInitials(m.name)}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                        {m.name} {isMe && <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)' }}>(you)</span>}
                      </p>
                      {m.githubUsername && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-fg-subtle)' }}>@{m.githubUsername}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>{m.email}</td>
                <td>
                  {isMemberOwner ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-attention-fg)' }}>
                      <Crown size={12} /> Owner
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>Member</span>
                  )}
                </td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--color-fg-subtle)' }}>
                  {formatDate(m.createdAt)}
                </td>
                {isOwner && (
                  <td>
                    {!isMemberOwner && (
                      <button
                        onClick={() => onRemove(m._id.toString())}
                        title="Remove member"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-fg-subtle)', transition: 'color 0.15s, background 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger-fg)'; e.currentTarget.style.background = 'var(--color-danger-muted)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-fg-subtle)'; e.currentTarget.style.background = 'transparent' }}
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
