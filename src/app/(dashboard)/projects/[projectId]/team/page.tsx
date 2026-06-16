'use client'

import { use, useEffect, useState } from 'react'
import TeamTable from '@/components/team/TeamTable'
import InviteMemberModal from '@/components/team/InviteMemberModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SwalConfirm from '@/components/ui/SwalConfirm'
import Toast from '@/components/ui/Toast'
import type { PublicUser } from '@/types'
import { UserPlus, UserMinus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { formatDate, getInitials } from '@/lib/utils'

interface TeamMember extends PublicUser { role: string }

interface PendingInvite {
  _id: string
  recipient: PublicUser
  createdAt: string
}

export default function TeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { data: session } = useSession()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [ownerId, setOwnerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  // Custom modal & toast states
  const [pendingCancelInviteId, setPendingCancelInviteId] = useState<string | null>(null)
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/team`)
    const json = await res.json()
    setMembers(json.data ?? [])
    setOwnerId(json.ownerId ?? '')
    setInvites(json.invites ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleRemoveClick = (uid: string) => {
    setPendingRemoveMemberId(uid)
  }

  const handleConfirmRemove = async () => {
    if (!pendingRemoveMemberId) return
    const uid = pendingRemoveMemberId
    try {
      const res = await fetch(`/api/projects/${projectId}/team?uid=${uid}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m._id.toString() !== uid))
        setToast({ message: 'Member removed from team', type: 'success' })
      } else {
        const j = await res.json()
        setToast({ message: j.error || 'Failed to remove member', type: 'error' })
      }
    } catch (e) {
      setToast({ message: 'Error removing member', type: 'error' })
    } finally {
      setPendingRemoveMemberId(null)
    }
  }

  const handleCancelInviteClick = (inviteId: string) => {
    setPendingCancelInviteId(inviteId)
  }

  const handleConfirmCancelInvite = async () => {
    if (!pendingCancelInviteId) return
    const inviteId = pendingCancelInviteId
    try {
      const res = await fetch(`/api/projects/${projectId}/team/invite?id=${inviteId}`, { method: 'DELETE' })
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i._id !== inviteId))
        setToast({ message: 'Invitation cancelled successfully', type: 'success' })
      } else {
        const j = await res.json()
        setToast({ message: j.error || 'Failed to cancel invitation', type: 'error' })
      }
    } catch (e) {
      setToast({ message: 'Error cancelling invitation', type: 'error' })
    } finally {
      setPendingCancelInviteId(null)
    }
  }

  const handleInvited = () => {
    load()
    setToast({ message: 'Invitation sent successfully!', type: 'success' })
  }

  const isOwner = session?.user?.id === ownerId

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: 0 }}>
          Team <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-fg-muted)', marginLeft: '0.5rem' }}>({members.length})</span>
        </h2>
        {isOwner && (
          <button onClick={() => setShowInvite(true)} className="gh-btn-primary">
            <UserPlus size={14} /> Add Member
          </button>
        )}
      </div>

      <TeamTable members={members} ownerId={ownerId} onRemove={handleRemoveClick} />

      {invites.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-fg-default)', marginBottom: '1rem' }}>
            Pending Invitations <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-fg-muted)', marginLeft: '0.5rem' }}>({invites.length})</span>
          </h2>
          <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="gh-table">
              <thead>
                <tr>
                  <th>Invited User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Invited Date</th>
                  {isOwner && <th></th>}
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {inv.recipient.image ? (
                          <img src={inv.recipient.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-emphasis)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                            {getInitials(inv.recipient.name)}
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                            {inv.recipient.name}
                          </p>
                          {inv.recipient.githubUsername && (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-fg-subtle)' }}>@{inv.recipient.githubUsername}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>{inv.recipient.email}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        color: 'var(--color-attention-fg)',
                        backgroundColor: 'var(--color-attention-muted)',
                        border: '1px solid var(--color-attention-emphasis)'
                      }}>
                        Pending
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-fg-subtle)' }}>
                      {formatDate(inv.createdAt)}
                    </td>
                    {isOwner && (
                      <td>
                        <button
                          onClick={() => handleCancelInviteClick(inv._id)}
                          title="Cancel invitation"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-fg-subtle)', transition: 'color 0.15s, background 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger-fg)'; e.currentTarget.style.background = 'var(--color-danger-muted)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-fg-subtle)'; e.currentTarget.style.background = 'transparent' }}
                        >
                          <UserMinus size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        projectId={projectId}
        onInvited={handleInvited}
      />

      {/* Custom Swal Confirm Modals */}
      <SwalConfirm
        isOpen={pendingCancelInviteId !== null}
        onClose={() => setPendingCancelInviteId(null)}
        onConfirm={handleConfirmCancelInvite}
        title="Cancel Invitation?"
        message="Are you sure you want to cancel this team invitation? This action cannot be undone."
        confirmText="Cancel Invite"
        cancelText="Cancel"
      />

      <SwalConfirm
        isOpen={pendingRemoveMemberId !== null}
        onClose={() => setPendingRemoveMemberId(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Member?"
        message="Are you sure you want to remove this member from the project team?"
        confirmText="Remove Member"
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
