'use client'

import { use, useEffect, useState } from 'react'
import TeamTable from '@/components/team/TeamTable'
import InviteMemberModal from '@/components/team/InviteMemberModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { PublicUser } from '@/types'
import { UserPlus } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface TeamMember extends PublicUser { role: string }

export default function TeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { data: session } = useSession()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [ownerId, setOwnerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/team`)
    const json = await res.json()
    setMembers(json.data ?? [])
    setOwnerId(json.ownerId ?? '')
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleRemove = async (uid: string) => {
    if (!confirm('Remove this member?')) return
    await fetch(`/api/projects/${projectId}/team?uid=${uid}`, { method: 'DELETE' })
    setMembers((prev) => prev.filter((m) => m._id.toString() !== uid))
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

      <TeamTable members={members} ownerId={ownerId} onRemove={handleRemove} />

      <InviteMemberModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        projectId={projectId}
        onInvited={() => {}}
      />
    </div>
  )
}
