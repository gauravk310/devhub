'use client'

import { use, useEffect, useState, useCallback } from 'react'
import {
  GitMerge,
  Search,
  Calendar,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitCommitHorizontal,
  Clock,
  AlertCircle,
  GitBranch,
  Layers,
  Terminal
} from 'lucide-react'
import type { IProjectWithMembers, ICodebase } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// ─── Formatting Helpers ───────────────────────────────────────────────────────
function formatMergeTime(isoString: string | Date) {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '–'
  
  const day = d.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hrs = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  
  return `${day} ${month} ${year}, ${hrs}:${mins}`
}

function formatCommitDate(isoString: string | Date) {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '–'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
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

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface IDeploymentItem {
  sourceType: 'PR' | 'DIRECT_MERGE' | 'DIRECT_COMMIT'
  deployType: 'FEATURE' | 'HOTFIX' | 'DIRECT_COMMIT'
  number?: number // For PRs
  sha?: string
  title: string
  branchName: string
  mergedBy: string
  avatarUrl: string
  mergeDate: string
  htmlUrl: string
  commitCount: number
}

interface IDeploymentSummary {
  totalMerged: number
  mergedThisWeek: number
  mergedThisMonth: number
  latestMerge: {
    branchName: string
    title: string
    mergedAt: string
    mergedBy: {
      login: string
      avatarUrl: string
    }
  } | null
}

interface ICommitItem {
  sha: string
  message: string
  author: string
  avatarUrl: string
  date: string
}

export default function DeploymentHistoryPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)

  // ─── Project & Repo State ──────────────────────────────────────────────────
  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [selectedCodebase, setSelectedCodebase] = useState<ICodebase | null>(null)

  // ─── Combined State ────────────────────────────────────────────────────────
  const [deployments, setDeployments] = useState<IDeploymentItem[]>([])
  const [summary, setSummary] = useState<IDeploymentSummary | null>(null)
  const [mergersList, setMergersList] = useState<{ login: string; avatarUrl: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // ─── Filter State ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [mergedByFilter, setMergedByFilter] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // ─── Row Expansion / Commits State ─────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [rowCommits, setRowCommits] = useState<
    Record<string, { loading: boolean; error: string | null; data: ICommitItem[] }>
  >({})

  // ─── Fetch Project Codebases ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((j) => {
        const p: IProjectWithMembers = j.data
        setProject(p)
        if (p?.codebases?.length) {
          setSelectedCodebase(p.codebases[0])
        }
      })
      .catch((err) => {
        console.error('Failed to load project details', err)
      })
      .finally(() => setLoadingProject(false))
  }, [projectId])

  // ─── Fetch Data (List + Summary) ───────────────────────────────────────────
  const fetchData = useCallback(
    async (repoFullName: string, currentPage: number) => {
      setLoading(true)
      setError(null)
      setExpandedRows({}) // Collapse all on page/filter change

      // Find the QA/Integration branch configured for this codebase
      const qaBranchObj = project?.qaBranches?.find(
        (qb) => qb.codebaseId.toString() === selectedCodebase?._id?.toString()
      )
      const qaBranchName = qaBranchObj?.branchName || ''

      try {
        let url = `/api/github/merges?repo=${encodeURIComponent(repoFullName)}&page=${currentPage}&per_page=25`

        if (qaBranchName) {
          url += `&qaBranch=${encodeURIComponent(qaBranchName)}`
        }

        if (mergedByFilter) {
          url += `&mergedBy=${encodeURIComponent(mergedByFilter)}`
        }

        // Apply Date Filters
        let finalStartDate = startDate
        let finalEndDate = endDate

        if (dateRangeFilter !== 'all' && dateRangeFilter !== 'custom') {
          const now = new Date()
          const diffDays = parseInt(dateRangeFilter, 10)
          const pastDate = new Date()
          pastDate.setDate(now.getDate() - diffDays)
          finalStartDate = pastDate.toISOString()
          finalEndDate = now.toISOString()
        }

        if (finalStartDate) {
          url += `&startDate=${encodeURIComponent(finalStartDate)}`
        }
        if (finalEndDate) {
          url += `&endDate=${encodeURIComponent(finalEndDate)}`
        }

        const res = await fetch(url)
        const json = await res.json()

        if (!res.ok) throw new Error(json.error ?? 'Failed to fetch deployment history')

        setDeployments(json.data ?? [])
        setHasMore(json.pagination?.hasMore ?? false)
        setSummary(json.summary ?? null)
        setMergersList(json.mergers ?? [])
      } catch (err: any) {
        setError(err.message ?? 'Failed to load deployment history')
        setDeployments([])
        setHasMore(false)
        setSummary(null)
      } finally {
        setLoading(false)
      }
    },
    [mergedByFilter, dateRangeFilter, startDate, endDate, project, selectedCodebase]
  )

  // Trigger load when codebase or page changes
  useEffect(() => {
    if (selectedCodebase) {
      fetchData(selectedCodebase.repoFullName, page)
    }
  }, [selectedCodebase, page, fetchData])

  // Reset pagination when filters change
  const handleFilterChange = () => {
    setPage(1)
  }

  useEffect(() => {
    handleFilterChange()
  }, [mergedByFilter, dateRangeFilter, startDate, endDate])

  // Reset all filters when codebase switches
  useEffect(() => {
    setPage(1)
    setSearchQuery('')
    setMergedByFilter('')
    setDateRangeFilter('all')
    setStartDate('')
    setEndDate('')
  }, [selectedCodebase])

  // ─── Fetch Row Commits on Expansion ────────────────────────────────────────
  const toggleRow = async (item: IDeploymentItem) => {
    const rowKey = item.sourceType === 'PR' ? `pr-${item.number}` : `${item.sourceType.toLowerCase()}-${item.sha}`
    const isExpanded = !!expandedRows[rowKey]
    setExpandedRows((prev) => ({ ...prev, [rowKey]: !isExpanded }))

    // If expanding and commits are not yet loaded, load them
    if (!isExpanded && !rowCommits[rowKey] && selectedCodebase) {
      setRowCommits((prev) => ({
        ...prev,
        [rowKey]: { loading: true, error: null, data: [] }
      }))

      try {
        const repoParam = encodeURIComponent(selectedCodebase.repoFullName)
        let url = `/api/github/merges/commits?repo=${repoParam}&source_type=${item.sourceType}`
        if (item.sourceType === 'PR') {
          url += `&pull_number=${item.number}`
        } else {
          url += `&sha=${item.sha}`
        }
        if (item.branchName) {
          url += `&branchName=${encodeURIComponent(item.branchName)}`
        }
        const qaBranchObj = project?.qaBranches?.find(
          (qb) => qb.codebaseId.toString() === selectedCodebase?._id?.toString()
        )
        const qaBranchName = qaBranchObj?.branchName || ''
        if (qaBranchName) {
          url += `&qaBranch=${encodeURIComponent(qaBranchName)}`
        }

        const res = await fetch(url)
        const json = await res.json()

        if (!res.ok) throw new Error(json.error ?? 'Failed to load commits')

        setRowCommits((prev) => ({
          ...prev,
          [rowKey]: { loading: false, error: null, data: json.data ?? [] }
        }))
      } catch (err: any) {
        setRowCommits((prev) => ({
          ...prev,
          [rowKey]: { loading: false, error: err.message ?? 'Failed to load commits', data: [] }
        }))
      }
    }
  }

  // ─── Client-side Search Filtering ──────────────────────────────────────────
  const filteredDeployments = deployments.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    
    const matchesTitle = item.title.toLowerCase().includes(q)
    const matchesBranch = item.branchName?.toLowerCase().includes(q)
    const matchesType = item.deployType.toLowerCase().includes(q)
    
    if (item.sourceType === 'PR') {
      return matchesTitle || matchesBranch || matchesType || `#${item.number}`.includes(q)
    } else {
      return matchesTitle || matchesBranch || matchesType || item.sha?.toLowerCase().includes(q)
    }
  })

  // ─── Render Type Badges ────────────────────────────────────────────────────
  const renderTypeBadge = (type: string) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.65rem',
      fontWeight: 700,
      padding: '0.15rem 0.5rem',
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }

    if (type === 'FEATURE') {
      return (
        <span style={{
          ...baseStyle,
          background: 'var(--color-success-subtle)',
          color: 'var(--color-success-fg)',
          border: '1px solid var(--color-success-muted)',
        }}>
          Feature
        </span>
      )
    } else if (type === 'HOTFIX') {
      return (
        <span style={{
          ...baseStyle,
          background: 'var(--color-danger-subtle)',
          color: 'var(--color-danger-fg)',
          border: '1px solid var(--color-danger-muted)',
        }}>
          Hotfix
        </span>
      )
    } else if (type === 'DIRECT_COMMIT') {
      return (
        <span style={{
          ...baseStyle,
          background: 'var(--color-attention-subtle)',
          color: 'var(--color-attention-fg)',
          border: '1px solid var(--color-attention-muted)',
        }}>
          Direct Commit
        </span>
      )
    }
    return <span style={baseStyle}>{type}</span>
  }

  // ─── Render Codebases Selector ─────────────────────────────────────────────
  if (loadingProject) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingSpinner size={28} />
      </div>
    )
  }

  const codebases = project?.codebases ?? []

  if (codebases.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '4rem 2rem', gap: '1rem', textAlign: 'center',
        border: '2px dashed var(--color-border-default)',
        borderRadius: '12px', background: 'var(--color-canvas-subtle)',
      }}>
        <Layers size={48} style={{ opacity: 0.25 }} />
        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-fg-default)' }}>
          No codebases linked
        </p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-fg-muted)', maxWidth: 400 }}>
          Link GitHub repositories to this project to see deployment history here.
          You can add codebases when creating or editing the project.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Codebase selection tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        padding: '0.625rem',
        background: 'var(--color-canvas-subtle)',
        borderRadius: '10px',
        border: '1px solid var(--color-border-default)',
      }}>
        {codebases.map((cb) => {
          const isActive = selectedCodebase?._id?.toString() === cb._id?.toString()
          return (
            <button
              key={cb._id.toString()}
              onClick={() => setSelectedCodebase(cb)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.875rem',
                fontSize: '0.82rem', fontWeight: 600,
                borderRadius: '6px',
                border: isActive ? '1px solid var(--color-accent-emphasis)' : '1px solid transparent',
                background: isActive ? 'var(--color-accent-muted)' : 'transparent',
                color: isActive ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'JetBrains Mono, monospace',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--color-border-muted)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <GitBranch size={13} />
              {cb.name || cb.repoFullName}
            </button>
          )
        })}

        {selectedCodebase && (
          <a
            href={`https://github.com/${selectedCodebase.repoFullName}`}
            target="_blank" rel="noreferrer"
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.4rem 0.875rem', fontSize: '0.78rem', fontWeight: 500,
              borderRadius: '6px', border: '1px solid var(--color-border-default)',
              color: 'var(--color-fg-muted)', textDecoration: 'none',
              transition: 'all 0.15s', background: 'transparent',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-accent-fg)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent-fg)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-fg-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-default)' }}
          >
            <ExternalLink size={12} />
            View on GitHub
          </a>
        )}
      </div>

      {/* ─── Summary Section ─────────────────────────────────────────────────── */}
      {loading && !summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '80px', background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Card 1: Total Features Released */}
          <div style={{
            background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: '10px',
            padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', borderTop: '3px solid var(--color-success-fg)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-fg-muted)' }}>
              <GitMerge size={13} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Features Released</span>
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>{summary.totalMerged}</span>
          </div>

          {/* Card 2: Released This Week */}
          <div style={{
            background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: '10px',
            padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', borderTop: '3px solid var(--color-accent-emphasis)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-fg-muted)' }}>
              <Clock size={13} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Released This Week</span>
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>{summary.mergedThisWeek}</span>
          </div>

          {/* Card 3: Released This Month */}
          <div style={{
            background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: '10px',
            padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', borderTop: '3px solid var(--color-attention-fg)',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-fg-muted)' }}>
              <Calendar size={13} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Released This Month</span>
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>{summary.mergedThisMonth}</span>
          </div>

          {/* Card 4: Latest Release */}
          <div style={{
            background: 'var(--color-canvas-subtle)', border: '1px solid var(--color-border-default)', borderRadius: '10px',
            padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', borderTop: '3px solid #b388ff',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-fg-muted)' }}>
              <GitBranch size={13} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Latest Release</span>
            </div>
            {summary.latestMerge ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{
                  fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-fg-default)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={summary.latestMerge.title}>
                  {summary.latestMerge.title}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-fg-subtle)' }}>
                  by {summary.latestMerge.mergedBy.login} · {timeAgo(summary.latestMerge.mergedAt)}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-subtle)', fontWeight: 500 }}>None</span>
            )}
          </div>
        </div>
      ) : null}

      {/* ─── Filters & Search ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
        padding: '0.875rem 1.25rem', background: 'var(--color-canvas-subtle)',
        border: '1px solid var(--color-border-default)', borderRadius: '10px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-fg-subtle)' }} />
          <input
            type="text"
            placeholder="Search branch name, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', fontSize: '0.82rem',
              borderRadius: '6px', border: '1px solid var(--color-border-default)',
              background: 'var(--color-canvas-default)', color: 'var(--color-fg-default)',
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent-fg)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
          />
        </div>

        {/* Released By filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: '150px' }}>
          <UserIcon size={13} style={{ color: 'var(--color-fg-subtle)' }} />
          <select
            value={mergedByFilter}
            onChange={(e) => setMergedByFilter(e.target.value)}
            style={{
              padding: '0.45rem 1.75rem 0.45rem 0.5rem', fontSize: '0.82rem',
              borderRadius: '6px', border: '1px solid var(--color-border-default)',
              background: 'var(--color-canvas-default)', color: 'var(--color-fg-default)',
              outline: 'none', cursor: 'pointer', appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%238b949e\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
              backgroundPosition: 'right 0.35rem center', backgroundSize: '1rem', backgroundRepeat: 'no-repeat'
            }}
          >
            <option value="">All Authors</option>
            {mergersList.map((m) => (
              <option key={m.login} value={m.login}>{m.login}</option>
            ))}
          </select>
        </div>

        {/* Date Range filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: '150px' }}>
          <Calendar size={13} style={{ color: 'var(--color-fg-subtle)' }} />
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            style={{
              padding: '0.45rem 1.75rem 0.45rem 0.5rem', fontSize: '0.82rem',
              borderRadius: '6px', border: '1px solid var(--color-border-default)',
              background: 'var(--color-canvas-default)', color: 'var(--color-fg-default)',
              outline: 'none', cursor: 'pointer', appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%238b949e\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
              backgroundPosition: 'right 0.35rem center', backgroundSize: '1rem', backgroundRepeat: 'no-repeat'
            }}
          >
            <option value="all">All (Last 6 Months)</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Inputs */}
        {dateRangeFilter === 'custom' && (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '0.4rem 0.5rem', fontSize: '0.82rem',
                borderRadius: '6px', border: '1px solid var(--color-border-default)',
                background: 'var(--color-canvas-default)', color: 'var(--color-fg-default)',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--color-fg-subtle)' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '0.4rem 0.5rem', fontSize: '0.82rem',
                borderRadius: '6px', border: '1px solid var(--color-border-default)',
                background: 'var(--color-canvas-default)', color: 'var(--color-fg-default)',
                outline: 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* ─── Table Section ──────────────────────────────────────────────────── */}
      {error ? (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '2rem', borderRadius: '10px', background: 'var(--color-danger-muted)', border: '1px solid var(--color-danger-emphasis)', color: 'var(--color-danger-fg)', fontSize: '0.875rem', textAlign: 'center', justifyContent: 'center' }}>
          <AlertCircle size={18} />
          <div>
            <strong>Failed to load deployments:</strong> {error}
            <br />
            <button
              onClick={() => selectedCodebase && fetchData(selectedCodebase.repoFullName, page)}
              style={{
                marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: '6px',
                border: '1px solid var(--color-danger-emphasis)', background: 'transparent',
                color: 'var(--color-danger-fg)', cursor: 'pointer', fontSize: '0.82rem',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-canvas-subtle)',
          border: '1px solid var(--color-border-default)',
          borderRadius: '10px',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Table Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 3.5fr 150px 2.5fr 2fr',
            padding: '0.875rem 1.25rem',
            background: 'var(--color-canvas-default)',
            borderBottom: '1px solid var(--color-border-default)',
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--color-fg-subtle)',
          }}>
            <span></span>
            <span>Branch Name</span>
            <span>Type</span>
            <span>Released By</span>
            <span>Release Date</span>
          </div>

          {/* Table Body / Skeleton */}
          {loading ? (
            <div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{
                  height: '50px',
                  display: 'grid',
                  gridTemplateColumns: '40px 3.5fr 150px 2.5fr 2fr',
                  alignItems: 'center',
                  padding: '0.7rem 1.25rem',
                  borderBottom: '1px solid var(--color-border-muted)',
                  animation: 'pulse 1.5s infinite'
                }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-border-muted)' }} />
                  <span style={{ width: '80%', height: '12px', borderRadius: '4px', background: 'var(--color-border-muted)' }} />
                  <span style={{ width: '80px', height: '16px', borderRadius: '4px', background: 'var(--color-border-muted)' }} />
                  <span style={{ width: '60px', height: '12px', borderRadius: '4px', background: 'var(--color-border-muted)' }} />
                  <span style={{ width: '70px', height: '12px', borderRadius: '4px', background: 'var(--color-border-muted)' }} />
                </div>
              ))}
            </div>
          ) : filteredDeployments.length === 0 ? (
            <div style={{ padding: '3.5rem 1.25rem', color: 'var(--color-fg-subtle)', fontSize: '0.875rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <GitMerge size={32} style={{ opacity: 0.3 }} />
              <span>No feature deployments found.</span>
            </div>
          ) : (
            <div>
              {filteredDeployments.map((item) => {
                const rowKey = item.sourceType === 'PR' ? `pr-${item.number}` : `${item.sourceType.toLowerCase()}-${item.sha}`
                const isExpanded = !!expandedRows[rowKey]
                const commitsInfo = rowCommits[rowKey]

                return (
                  <div key={rowKey} style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                    {/* Row Main Content */}
                    <div
                      onClick={() => toggleRow(item)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 3.5fr 150px 2.5fr 2fr',
                        alignItems: 'center',
                        padding: '0.75rem 1.25rem',
                        cursor: 'pointer',
                        background: isExpanded ? 'var(--color-canvas-default)' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--color-canvas-default)' }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Expansion Icon */}
                      <span style={{ color: 'var(--color-fg-subtle)', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>

                      {/* Feature Name & Branch Muted Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0, paddingRight: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--color-fg-default)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.branchName || item.title}
                        </span>
                        
                        {/* Subtitle reference text */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--color-fg-subtle)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {item.sourceType === 'PR' ? (
                            <>
                              <a
                                href={item.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'var(--color-accent-fg)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                PR #{item.number}
                                <ExternalLink size={10} />
                              </a>
                              {item.title && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {item.title}</span>}
                            </>
                          ) : item.sourceType === 'DIRECT_MERGE' ? (
                            <>
                              <a
                                href={item.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'var(--color-accent-fg)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                Merge Commit: {item.sha?.slice(0, 7)}
                                <ExternalLink size={10} />
                              </a>
                              {item.title && item.title !== item.branchName && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {item.title}</span>}
                            </>
                          ) : (
                            <>
                              <a
                                href={item.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'var(--color-accent-fg)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                Commit: {item.sha?.slice(0, 7)}
                                <ExternalLink size={10} />
                              </a>
                              {item.title && item.title !== item.branchName && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {item.title}</span>}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div>
                        {renderTypeBadge(item.deployType)}
                      </div>

                      {/* Released By */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={item.mergedBy} width={18} height={18} style={{ borderRadius: '50%', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--color-accent-muted)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-fg-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.mergedBy}
                        </span>
                      </div>

                      {/* Release Date */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-fg-muted)' }}>
                          {formatMergeTime(item.mergeDate)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-fg-subtle)' }}>
                          {timeAgo(item.mergeDate)}
                        </span>
                      </div>
                    </div>

                    {/* Row Expanded Details (Commit Lists) */}
                    {isExpanded && (
                      <div style={{
                        background: 'var(--color-canvas-inset)',
                        padding: '1rem 2rem 1.25rem 3.5rem',
                        borderTop: '1px solid var(--color-border-muted)',
                        borderBottom: '1px solid var(--color-border-muted)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                          <GitCommitHorizontal size={14} style={{ color: 'var(--color-fg-subtle)' }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-fg-muted)' }}>
                            {item.sourceType === 'DIRECT_COMMIT' ? 'Commit Details' : 'Commits Released'}
                          </span>
                        </div>

                        {commitsInfo?.loading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                            <LoadingSpinner size={14} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-fg-subtle)' }}>Loading commits...</span>
                          </div>
                        ) : commitsInfo?.error ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0', color: 'var(--color-danger-fg)', fontSize: '0.78rem' }}>
                            <AlertCircle size={14} />
                            <span>Failed to load commits: {commitsInfo.error}</span>
                          </div>
                        ) : commitsInfo?.data && commitsInfo.data.length > 0 ? (
                          <div style={{
                            border: '1px solid var(--color-border-muted)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: 'var(--color-canvas-subtle)',
                          }}>
                            {/* Commits Table Headers */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '80px 4fr 1.5fr 1.2fr',
                              padding: '0.4rem 1rem',
                              background: 'var(--color-canvas-default)',
                              borderBottom: '1px solid var(--color-border-muted)',
                              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                              letterSpacing: '0.04em', color: 'var(--color-fg-subtle)',
                            }}>
                              <span>SHA</span>
                              <span>Message</span>
                              <span>Author</span>
                              <span style={{ textAlign: 'right' }}>Date</span>
                            </div>

                            {/* Commits Rows */}
                            <div>
                              {commitsInfo.data.map((commit, cIdx) => (
                                <div
                                  key={commit.sha}
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 4fr 1.5fr 1.2fr',
                                    alignItems: 'center',
                                    padding: '0.45rem 1rem',
                                    fontSize: '0.78rem',
                                    borderBottom: cIdx < commitsInfo.data.length - 1 ? '1px solid var(--color-border-muted)' : 'none',
                                    color: 'var(--color-fg-default)'
                                  }}
                                >
                                  {/* Commit SHA */}
                                  <code style={{ fontSize: '0.7rem', color: 'var(--color-accent-fg)', fontFamily: 'monospace' }}>
                                    {commit.sha.slice(0, 7)}
                                  </code>

                                  {/* Message */}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem', fontWeight: 500 }}>
                                    {commit.message.split('\n')[0]}
                                  </span>

                                  {/* Author */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                                    {commit.avatarUrl ? (
                                      <img src={commit.avatarUrl} alt={commit.author} width={16} height={16} style={{ borderRadius: '50%', flexShrink: 0 }} />
                                    ) : (
                                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--color-accent-muted)', flexShrink: 0 }} />
                                    )}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.74rem', color: 'var(--color-fg-muted)' }}>
                                      {commit.author}
                                    </span>
                                  </div>

                                  {/* Date */}
                                  <span style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--color-fg-subtle)' }}>
                                    {formatCommitDate(commit.date)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '0.5rem 0', fontSize: '0.78rem', color: 'var(--color-fg-subtle)' }}>
                            No commits found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Pagination Controls ─────────────────────────────────────────────── */}
      {!error && deployments.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.5rem 0.25rem', marginTop: '0.25rem'
        }}>
          {/* Previous Button */}
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            className="gh-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 600,
              borderRadius: '6px', border: '1px solid var(--color-border-default)',
              background: 'var(--color-canvas-subtle)', color: page === 1 ? 'var(--color-fg-subtle)' : 'var(--color-fg-default)',
              cursor: page === 1 || loading ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1, transition: 'all 0.15s',
            }}
          >
            Previous
          </button>

          {/* Page Indicator */}
          <span style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>
            Page {page}
          </span>

          {/* Next Button */}
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || loading}
            className="gh-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 600,
              borderRadius: '6px', border: '1px solid var(--color-border-default)',
              background: 'var(--color-canvas-subtle)', color: !hasMore ? 'var(--color-fg-subtle)' : 'var(--color-fg-default)',
              cursor: !hasMore || loading ? 'not-allowed' : 'pointer',
              opacity: !hasMore ? 0.5 : 1, transition: 'all 0.15s',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
