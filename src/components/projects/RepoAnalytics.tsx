'use client'

import type { RepoStats } from '@/lib/github'

function fmt(n: number) {
  return n.toLocaleString()
}

// ─── Section header ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{
        margin: 0, fontSize: '0.75rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--color-fg-muted)',
      }}>{title}</h3>
      {children}
    </div>
  )
}

// ─── Contributors List ────────────────────────────────────────────────────────
function ContributorsList({ contributors }: { contributors: RepoStats['contributors'] }) {
  const maxCommits = Math.max(...contributors.map(c => c.total), 1)

  return (
    <div style={{
      background: 'var(--color-canvas-subtle)',
      border: '1px solid var(--color-border-default)',
      borderRadius: '10px',
      padding: '1.25rem',
    }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)', marginBottom: '0.875rem', fontWeight: 600 }}>
        Top Contributors
      </div>
      {contributors.length === 0 ? (
        <div style={{ color: 'var(--color-fg-subtle)', fontSize: '0.8rem' }}>No contributor data available.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {contributors.map((c, i) => (
            <a key={c.login} href={c.html_url} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)', width: '16px', textAlign: 'right', fontWeight: 600 }}>
                #{i + 1}
              </span>
              <img src={c.avatar_url} alt={c.login} width={24} height={24}
                style={{ borderRadius: '50%', border: '1px solid var(--color-border-default)' }} />
              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.login}
              </span>
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--color-border-default)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.total / maxCommits) * 100}%`, background: 'var(--color-accent-emphasis)', borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', minWidth: '40px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(c.total)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main RepoAnalytics Component ─────────────────────────────────────────────
export default function RepoAnalytics({ stats }: { stats: RepoStats }) {
  const { contributors } = stats

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Top Contributors Card */}
      <Section title="Contributors">
        <ContributorsList contributors={contributors} />
      </Section>
      
    </div>
  )
}
