'use client'

import { useMemo } from 'react'
import { GitFork, GitBranch, GitMerge, Package, Clock, Globe, Lock, GitCommitHorizontal } from 'lucide-react'
import type { RepoStats } from '@/lib/github'

// ─── Language colours (best-effort, fallback to generic) ──────────────────────
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', Java: '#b07219', 'C#': '#178600', 'C++': '#f34b7d', C: '#555555',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
  Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
  Scala: '#c22d40', R: '#198CE7', Lua: '#000080', Vue: '#41b883',
  SCSS: '#c6538c', Elixir: '#6e4a7e', Haskell: '#5e5086', Clojure: '#db5855',
}
const langColor = (lang: string) => LANG_COLORS[lang] ?? '#8b949e'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function kbToMb(kb: number) {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

function timeAgo(iso: string | null) {
  if (!iso) return '–'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m}mo ago`
  return `${Math.floor(m / 12)}y ago`
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color?: string
}) {
  return (
    <div style={{
      background: 'var(--color-canvas-subtle)',
      border: '1px solid var(--color-border-default)',
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
      borderTop: `3px solid ${color ?? 'var(--color-accent-emphasis)'}`,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-fg-muted)' }}>
        <Icon size={13} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>{value}</span>
    </div>
  )
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


function LanguageBreakdown({ languages }: { languages: Record<string, number> }) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)

  return (
    <div style={{
      background: 'var(--color-canvas-subtle)',
      border: '1px solid var(--color-border-default)',
      borderRadius: '10px',
      padding: '1.25rem',
    }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)', marginBottom: '0.875rem', fontWeight: 600 }}>
        Language Breakdown
      </div>
      {entries.length === 0 ? (
        <div style={{ color: 'var(--color-fg-subtle)', fontSize: '0.8rem' }}>No language data.</div>
      ) : (
        <>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.875rem' }}>
            {entries.slice(0, 8).map(([lang, bytes]) => (
              <div key={lang} title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
                style={{ width: `${(bytes / total) * 100}%`, background: langColor(lang), transition: 'width 0.4s' }} />
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
            {entries.slice(0, 8).map(([lang, bytes]) => (
              <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: langColor(lang), flexShrink: 0 }} />
                <span style={{ color: 'var(--color-fg-default)', fontWeight: 500 }}>{lang}</span>
                <span style={{ color: 'var(--color-fg-subtle)' }}>{((bytes / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
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

// ─── Deployments (Latest merges into main branch) ─────────────────────────────
function DeploymentsList({ commits, branch }: { commits: RepoStats['recentCommits']; branch: string }) {
  return (
    <div style={{
      background: 'var(--color-canvas-subtle)',
      border: '1px solid var(--color-border-default)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      {/* Table header */}
      <div style={{
        padding: '0.875rem 1.25rem',
        borderBottom: '1px solid var(--color-border-default)',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
      }}>
        <GitMerge size={14} style={{ color: 'var(--color-success-fg)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-fg-default)' }}>Deployments</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.68rem', fontWeight: 600,
          padding: '0.1rem 0.45rem',
          borderRadius: '999px',
          background: 'var(--color-success-subtle)',
          color: 'var(--color-success-fg)',
          border: '1px solid var(--color-success-muted)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <GitBranch size={9} />
          {branch}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--color-fg-subtle)' }}>Latest merges into {branch}</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 160px 80px',
        padding: '0.4rem 1.25rem',
        background: 'var(--color-canvas-default)',
        borderBottom: '1px solid var(--color-border-muted)',
        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--color-fg-subtle)',
      }}>
        <span>Merge commit</span>
        <span>Merged branch</span>
        <span>Author</span>
        <span style={{ textAlign: 'right' }}>SHA</span>
      </div>

      {commits.length === 0 ? (
        <div style={{ padding: '2rem 1.25rem', color: 'var(--color-fg-subtle)', fontSize: '0.82rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
          <GitMerge size={24} style={{ opacity: 0.3 }} />
          <span>No merge commits found on <code style={{ fontFamily: 'monospace', color: 'var(--color-accent-fg)' }}>{branch}</code>.</span>
          <span style={{ fontSize: '0.75rem' }}>Merges from other branches will appear here.</span>
        </div>
      ) : (
        <div>
          {commits.map((c, i) => (
            <a key={c.sha} href={c.html_url} target="_blank" rel="noreferrer"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 160px 80px',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.25rem',
                borderBottom: i < commits.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                textDecoration: 'none', background: 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-canvas-default)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Merge message */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <GitMerge size={13} style={{ color: 'var(--color-done-fg)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--color-fg-default)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.message}
                </span>
              </div>

              {/* Source branch badge */}
              <div style={{ minWidth: 0 }}>
                {c.sourceBranch ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.7rem', fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: 'var(--color-accent-muted)',
                    color: 'var(--color-accent-fg)',
                    border: '1px solid var(--color-accent-emphasis)',
                    fontFamily: 'JetBrains Mono, monospace',
                    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <GitBranch size={9} />
                    {c.sourceBranch}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-fg-subtle)' }}>—</span>
                )}
              </div>

              {/* Author + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                {c.author.avatar ? (
                  <img src={c.author.avatar} alt={c.author.login ?? ''} width={18} height={18}
                    style={{ borderRadius: '50%', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-accent-muted)', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.author.login ?? c.author.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-fg-subtle)' }}>{timeAgo(c.author.date)}</div>
                </div>
              </div>

              {/* SHA */}
              <div style={{ textAlign: 'right' }}>
                <code style={{ fontSize: '0.7rem', color: 'var(--color-accent-fg)', background: 'var(--color-accent-muted)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                  {c.sha.slice(0, 7)}
                </code>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}


// ─── PR & Issues Gauges ───────────────────────────────────────────────────────
function PRIssuePanel({ stats }: { stats: RepoStats }) {
  const prTotal = stats.pullRequests.open + stats.pullRequests.closed
  const issueTotal = stats.openIssues + stats.closedIssues
  const prOpenPct = prTotal === 0 ? 0 : (stats.pullRequests.open / prTotal) * 100
  const issueOpenPct = issueTotal === 0 ? 0 : (stats.openIssues / issueTotal) * 100

  const GaugePill = ({ label, open, closed, openPct, openColor, closedColor }: any) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--color-border-default)', overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ height: '100%', width: `${openPct}%`, background: openColor, borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
        <span style={{ color: openColor, fontWeight: 600 }}>{open} open</span>
        <span style={{ color: closedColor, fontWeight: 600 }}>{closed} closed</span>
      </div>
    </div>
  )

  return (
    <div style={{
      background: 'var(--color-canvas-subtle)',
      border: '1px solid var(--color-border-default)',
      borderRadius: '10px',
      padding: '1.25rem',
      display: 'flex',
      gap: '2rem',
    }}>
      <GaugePill label="Pull Requests" open={stats.pullRequests.open} closed={stats.pullRequests.closed} openPct={prOpenPct}
        openColor="var(--color-accent-fg)" closedColor="var(--color-success-fg)" />
      <div style={{ width: '1px', background: 'var(--color-border-default)' }} />
      <GaugePill label="Issues" open={stats.openIssues} closed={stats.closedIssues} openPct={issueOpenPct}
        openColor="var(--color-danger-fg)" closedColor="var(--color-success-fg)" />
    </div>
  )
}

// ─── Releases ─────────────────────────────────────────────────────────────────
function ReleasesList({ releases }: { releases: RepoStats['releases'] }) {
  return (
    <div style={{
      background: 'var(--color-canvas-subtle)',
      border: '1px solid var(--color-border-default)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border-default)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg-muted)' }}>
        Releases
      </div>
      {releases.length === 0 ? (
        <div style={{ padding: '1rem 1.25rem', color: 'var(--color-fg-subtle)', fontSize: '0.8rem' }}>No releases yet.</div>
      ) : (
        <div>
          {releases.map((r, i) => (
            <a key={r.tag_name} href={r.html_url} target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 1.25rem',
                borderBottom: i < releases.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                textDecoration: 'none', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-border-muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Tag size={13} color="var(--color-fg-muted)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent-fg)', fontFamily: 'monospace' }}>
                {r.tag_name}
              </span>
              {r.name && <span style={{ fontSize: '0.82rem', color: 'var(--color-fg-default)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>}
              {r.prerelease && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--color-attention-muted)', color: 'var(--color-attention-fg)', border: '1px solid var(--color-attention-emphasis)' }}>
                  pre
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--color-fg-subtle)', flexShrink: 0 }}>{timeAgo(r.published_at)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main RepoAnalytics Component ─────────────────────────────────────────────
export default function RepoAnalytics({ stats }: { stats: RepoStats }) {
  const { overview } = stats

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Repo Header */}
      <div style={{
        background: 'var(--color-canvas-subtle)',
        border: '1px solid var(--color-border-default)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            <a href={overview.html_url} target="_blank" rel="noreferrer"
              style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-accent-fg)', textDecoration: 'none', fontFamily: 'monospace' }}>
              {overview.full_name}
            </a>
            {overview.isPrivate ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border-default)', color: 'var(--color-fg-muted)' }}>
                <Lock size={10} /> Private
              </span>
            ) : (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border-default)', color: 'var(--color-fg-muted)' }}>
                Public
              </span>
            )}
          </div>
          {overview.description && (
            <p style={{ margin: '0 0 0.625rem', fontSize: '0.85rem', color: 'var(--color-fg-muted)', lineHeight: 1.5 }}>
              {overview.description}
            </p>
          )}
          {overview.topics.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {overview.topics.map(t => (
                <span key={t} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'var(--color-accent-muted)', color: 'var(--color-accent-fg)', fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--color-fg-muted)', minWidth: 180 }}>
          {overview.language && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: langColor(overview.language) }} />
              {overview.language}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={12} /> Default: <code style={{ fontFamily: 'monospace', color: 'var(--color-fg-default)' }}>{overview.defaultBranch}</code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Package size={12} /> {kbToMb(overview.size)}
          </div>
          {overview.homepage && (
            <a href={overview.homepage} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-accent-fg)', textDecoration: 'none' }}>
              <Globe size={12} /> {overview.homepage.replace(/^https?:\/\//, '').slice(0, 30)}
            </a>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={12} /> Pushed {timeAgo(overview.pushedAt)}
          </div>
        </div>
      </div>


      {/* Contributors */}
      <Section title="Contributors">
        <ContributorsList contributors={stats.contributors} />
      </Section>

      {/* Deployments — full-width table */}
      <Section title="Deployments">
        <DeploymentsList commits={stats.recentCommits} branch={stats.overview.defaultBranch} />
      </Section>
    </div>
  )
}
