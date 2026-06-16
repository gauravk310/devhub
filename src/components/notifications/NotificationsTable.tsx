'use client'

import { formatDate, timeAgo } from '@/lib/utils'
import type { INotificationPopulated } from '@/types'
import { Mail, GitPullRequest, Info, CheckCircle, XCircle, Clock } from 'lucide-react'

const typeIcon = {
  PROJECT_INVITE: GitPullRequest,
  FEATURE_UPDATE: Info,
  GENERAL: Mail,
}

const statusStyle: Record<string, { color: string; label: string }> = {
  UNREAD:   { color: 'var(--color-attention-fg)',  label: 'Unread'   },
  READ:     { color: 'var(--color-fg-muted)',       label: 'Read'     },
  ACCEPTED: { color: 'var(--color-success-fg)',     label: 'Accepted' },
  DECLINED: { color: 'var(--color-danger-fg)',      label: 'Declined' },
}

interface Props {
  notifications: INotificationPopulated[]
  onSelect: (n: INotificationPopulated) => void
}

export default function NotificationsTable({ notifications, onSelect }: Props) {
  if (notifications.length === 0) {
    return (
      <div className="gh-empty-state">
        <Mail size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontWeight: 600 }}>No notifications</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-subtle)' }}>
          You&apos;re all caught up!
        </p>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden' }}>
      <table className="gh-table">
        <thead>
          <tr>

            <th>Title</th>
            <th>From</th>
            <th>Project</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((n) => {
            const Icon = typeIcon[n.type] ?? Mail
            const st = statusStyle[n.status]
            return (
              <tr
                key={n._id.toString()}
                onClick={() => onSelect(n)}
                style={{ cursor: 'pointer' }}
              >

                <td style={{ fontWeight: n.status === 'UNREAD' ? 600 : 400 }}>
                  {n.title}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {n.senderId?.image && (
                      <img
                        src={n.senderId.image}
                        alt=""
                        style={{ width: 20, height: 20, borderRadius: '50%' }}
                      />
                    )}
                    <span style={{ color: 'var(--color-fg-muted)', fontSize: '0.8125rem' }}>
                      {n.senderId?.name ?? '—'}
                    </span>
                  </div>
                </td>
                <td style={{ color: 'var(--color-fg-muted)', fontSize: '0.8125rem' }}>
                  {/* @ts-expect-error populated projectId */}
                  {n.projectId?.name ?? '—'}
                </td>
                <td style={{ color: 'var(--color-fg-subtle)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  {timeAgo(n.createdAt)}
                </td>
                <td>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: st.color }}>
                    {st.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
