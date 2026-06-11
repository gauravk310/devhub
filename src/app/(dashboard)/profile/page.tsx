'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, Mail, User, GitBranch } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default function ProfilePage() {
  const { data: session } = useSession()
  if (!session?.user) return null

  return (
    <div style={{ padding: '2rem', maxWidth: '680px' }}>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
        Profile
      </h1>

      <div className="gh-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {session.user.image ? (
            <img src={session.user.image} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid var(--color-border-default)' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent-emphasis)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              {getInitials(session.user.name ?? 'U')}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-fg-default)', margin: 0 }}>{session.user.name}</h2>
            {/* @ts-expect-error githubUsername */}
            {session.user.githubUsername && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', margin: '0.125rem 0 0' }}>
                {/* @ts-expect-error githubUsername */}
                @{session.user.githubUsername}
              </p>
            )}
          </div>
        </div>

        <hr className="gh-divider" />

        {/* Info rows */}
        <InfoRow icon={<Mail size={15} />} label="Email" value={session.user.email ?? '—'} />
        {/* @ts-expect-error githubUsername */}
        {session.user.githubUsername && (
          // @ts-expect-error githubUsername
          <InfoRow icon={<GitBranch size={15} />} label="GitHub" value={`@${session.user.githubUsername}`} />
        )}
        <InfoRow icon={<User size={15} />} label="Account ID" value={session.user.id ?? '—'} mono />

        <hr className="gh-divider" />

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="gh-btn-danger"
          style={{ width: 'fit-content' }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ color: 'var(--color-fg-subtle)', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-muted)', width: '80px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-default)', fontFamily: mono ? 'JetBrains Mono, monospace' : undefined }}>
        {value}
      </span>
    </div>
  )
}
