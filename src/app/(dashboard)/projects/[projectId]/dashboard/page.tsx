'use client'

import { use, useEffect, useState } from 'react'
import type { IProjectWithMembers, IFeature, FeatureStatus, FeatureType } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { timeAgo, getInitials } from '@/lib/utils'
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Users, 
  GitBranch, 
  Award, 
  CheckCircle2, 
  Layers, 
  Percent 
} from 'lucide-react'

const STATUS_ORDER: FeatureStatus[] = ['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD']
const TYPE_ORDER: FeatureType[] = ['FEATURE', 'BUG FIX', 'UPDATE', 'DISCARD', 'OTHER']

const KPI_CONFIG: { status: FeatureStatus; label: string; border: string }[] = [
  { status: 'PENDING',  label: 'Pending',  border: 'var(--color-attention-emphasis)' },
  { status: 'READY',    label: 'Ready',    border: 'var(--color-accent-emphasis)'    },
  { status: 'TESTING',  label: 'Testing',  border: 'var(--color-done-emphasis)'      },
  { status: 'DEPLOYED', label: 'Deployed', border: 'var(--color-success-emphasis)'   },
  { status: 'DISCARD',  label: 'Discarded',border: 'var(--color-border-default)'     },
]

const TYPE_KPI_CONFIG: { type: FeatureType; label: string; border: string; bg: string; fg: string }[] = [
  { type: 'FEATURE',  label: 'Features',  border: '#2b4060', bg: '#1f2b3a', fg: '#9cc4f0' },
  { type: 'BUG FIX',  label: 'Bug Fixes', border: '#5c2b2b', bg: '#3a1f1f', fg: '#f5a3a3' },
  { type: 'UPDATE',   label: 'Updates',   border: '#2b5c47', bg: '#1f3a2e', fg: '#9ce0bb' },
  { type: 'DISCARD',  label: 'Discarded', border: '#3a3a3a', bg: '#2a2a2a', fg: '#9a9a9a' },
  { type: 'OTHER',    label: 'Others',    border: '#5c4a2b', bg: '#3a301f', fg: '#f0cf9c' },
]

const statusColors: Record<FeatureStatus, string> = {
  PENDING: '#f0cf9c',
  READY: '#9cc4f0',
  TESTING: '#9ce0bb',
  DEPLOYED: '#8fd4a8',
  DISCARD: '#9a9a9a',
}

interface MonthData {
  year: number
  month: number
  label: string
  created: number
  deployed: number
}

// ─── Status Donut Chart Component ──────────────────────────────────────────
function StatusDonutChart({ counts, total }: { counts: Record<FeatureStatus, number>; total: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const R = 65
  const strokeWidth = 14
  const C = 2 * Math.PI * R // ~408.4
  
  const segments = KPI_CONFIG.map(({ status, label }) => ({
    status,
    label,
    count: counts[status] ?? 0,
    color: statusColors[status],
  })).filter(seg => seg.count > 0)
  
  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={R} fill="transparent" stroke="var(--color-border-muted)" strokeWidth={strokeWidth} />
        </svg>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-fg-subtle)', marginTop: '0.5rem' }}>No data available</span>
      </div>
    )
  }

  let accumulatedPercent = 0
  const renderSegments = segments.map((seg, idx) => {
    const percent = (seg.count / total) * 100
    const strokeLength = (seg.count / total) * C
    const strokeOffset = C - strokeLength + (accumulatedPercent / 100) * C
    accumulatedPercent += percent

    return {
      ...seg,
      percent,
      strokeDasharray: `${strokeLength} ${C - strokeLength}`,
      strokeDashoffset: strokeOffset,
      isHovered: hoveredIndex === idx
    }
  })

  const activeSegment = hoveredIndex !== null ? renderSegments[hoveredIndex] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', flexWrap: 'wrap', minHeight: '220px' }}>
      <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
          {renderSegments.map((seg, idx) => (
            <circle
              key={seg.status}
              cx="90"
              cy="90"
              r={R}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={seg.isHovered ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                opacity: hoveredIndex === null || seg.isHovered ? 1 : 0.6
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
        
        {/* Center label readout */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {activeSegment ? (
            <>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>
                {activeSegment.count}
              </span>
              <span style={{ fontSize: '0.75rem', color: activeSegment.color, fontWeight: 700, marginTop: '2px' }}>
                {activeSegment.label}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-fg-subtle)' }}>
                {activeSegment.percent.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-fg-default)', lineHeight: 1 }}>
                {total}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', fontWeight: 500, marginTop: '2px' }}>
                Total Items
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '130px' }}>
        {renderSegments.map((seg, idx) => (
          <div 
            key={seg.status} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              cursor: 'pointer', 
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              background: hoveredIndex === idx ? 'var(--color-canvas-inset)' : 'transparent',
              transition: 'background 0.15s'
            }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: seg.color }} />
            <span style={{ fontSize: '0.8rem', fontWeight: hoveredIndex === idx ? 600 : 500, color: 'var(--color-fg-default)' }}>
              {seg.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', marginLeft: 'auto' }}>
              {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity Trend Area Chart Component ──────────────────────────────────
function ActivityTrendChart({ data }: { data: MonthData[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; type: 'created' | 'deployed' } | null>(null)
  
  const width = 500
  const height = 220
  const paddingX = 40
  const paddingY = 35
  
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2
  
  const maxVal = Math.max(...data.map(d => Math.max(d.created, d.deployed)), 4)
  
  const points = data.map((d, idx) => {
    const x = paddingX + idx * (chartWidth / (data.length - 1))
    const yCreated = (height - paddingY) - (d.created / maxVal) * chartHeight
    const yDeployed = (height - paddingY) - (d.deployed / maxVal) * chartHeight
    return { x, yCreated, yDeployed, ...d }
  })
  
  const createdLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yCreated}`).join(' ')
  const createdAreaPath = `${createdLinePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
  
  const deployedLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yDeployed}`).join(' ')
  const deployedAreaPath = `${deployedLinePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 4) * i))

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="deployedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fd4a8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8fd4a8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((tick, i) => {
          const y = (height - paddingY) - (tick / maxVal) * chartHeight
          return (
            <g key={i} style={{ opacity: 0.15 }}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--color-fg-muted)" strokeWidth="1" strokeDasharray="3 3" />
              <text x={paddingX - 10} y={y + 3} fill="var(--color-fg-default)" fontSize="9" textAnchor="end">
                {tick}
              </text>
            </g>
          )
        })}

        {/* X Axis labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={height - paddingY + 18} fill="var(--color-fg-subtle)" fontSize="9" textAnchor="middle" style={{ fontWeight: 500 }}>
            {p.label}
          </text>
        ))}

        {/* Area gradients */}
        <path d={createdAreaPath} fill="url(#createdGrad)" />
        <path d={deployedAreaPath} fill="url(#deployedGrad)" />

        {/* Paths */}
        <path d={createdLinePath} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        <path d={deployedLinePath} fill="none" stroke="#8fd4a8" strokeWidth="2" strokeLinecap="round" />

        {/* Interactive Dots for Created Features */}
        {points.map((p, idx) => {
          const isHovered = hoveredPoint?.index === idx && hoveredPoint?.type === 'created'
          return (
            <circle
              key={`c-${idx}`}
              cx={p.x}
              cy={p.yCreated}
              r={isHovered ? 5 : 3}
              fill="#2563eb"
              stroke="var(--color-canvas-default)"
              strokeWidth={1.5}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoveredPoint({ index: idx, type: 'created' })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          )
        })}

        {/* Interactive Dots for Deployed Features */}
        {points.map((p, idx) => {
          const isHovered = hoveredPoint?.index === idx && hoveredPoint?.type === 'deployed'
          return (
            <circle
              key={`d-${idx}`}
              cx={p.x}
              cy={p.yDeployed}
              r={isHovered ? 5 : 3}
              fill="#8fd4a8"
              stroke="var(--color-canvas-default)"
              strokeWidth={1.5}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoveredPoint({ index: idx, type: 'deployed' })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          )
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          top: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-canvas-overlay)',
          border: '1px solid var(--color-border-default)',
          borderRadius: '6px',
          padding: '0.35rem 0.6rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.1rem',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
            {points[hoveredPoint.index].label} {points[hoveredPoint.index].year}
          </span>
          <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#2563eb', fontWeight: 600 }}>
              Created: {points[hoveredPoint.index].created}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#8fd4a8', fontWeight: 600 }}>
              Deployed: {points[hoveredPoint.index].deployed}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────
export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [project, setProject] = useState<IProjectWithMembers | null>(null)
  const [features, setFeatures] = useState<IFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | FeatureType>('all')

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/features`).then((r) => r.json()),
    ]).then(([p, f]) => {
      setProject(p.data)
      setFeatures(f.data ?? [])
    }).finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner size={28} /></div>
  }

  const now = new Date()
  const filteredFeatures = features.filter((f) => {
    // 1. Time Filter
    if (timeFilter !== 'all') {
      const updatedTime = new Date(f.updatedAt).getTime()
      const diffMs = now.getTime() - updatedTime
      if (timeFilter === '24h' && diffMs > 24 * 60 * 60 * 1000) return false
      if (timeFilter === '7d' && diffMs > 7 * 24 * 60 * 60 * 1000) return false
      if (timeFilter === '30d' && diffMs > 30 * 24 * 60 * 60 * 1000) return false
    }

    // 2. Type Filter
    if (typeFilter !== 'all') {
      const fType = f.type || 'FEATURE'
      if (fType !== typeFilter) return false
    }

    return true
  })

  // Status counters
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = filteredFeatures.filter((f) => f.status === s).length
    return acc
  }, {} as Record<FeatureStatus, number>)

  // Type counters
  const typeCounts = TYPE_ORDER.reduce((acc, t) => {
    acc[t] = filteredFeatures.filter((f) => (f.type || 'FEATURE') === t).length
    return acc
  }, {} as Record<FeatureType, number>)

  // Calculations for Advanced Statistics
  const deployedFeatures = filteredFeatures.filter((f) => f.status === 'DEPLOYED' && f.deploymentDate)
  let avgLeadTimeDays = 0
  if (deployedFeatures.length > 0) {
    const totalLeadTimeMs = deployedFeatures.reduce((acc, f) => {
      const createTime = new Date(f.createdAt).getTime()
      const deployTime = new Date(f.deploymentDate!).getTime()
      return acc + Math.max(0, deployTime - createTime)
    }, 0)
    avgLeadTimeDays = totalLeadTimeMs / (1000 * 60 * 60 * 24 * deployedFeatures.length)
  }

  const featuresWithCollabs = filteredFeatures.filter((f) => f.collaborators && f.collaborators.length > 0).length
  const collaborationRate = filteredFeatures.length > 0 ? (featuresWithCollabs / filteredFeatures.length) * 100 : 0

  const featuresWithBranches = filteredFeatures.filter((f) => 
    f.codebaseBranches && f.codebaseBranches.some((b) => b.branchName && b.branchName.trim())
  ).length
  const branchCoverage = filteredFeatures.length > 0 ? (featuresWithBranches / filteredFeatures.length) * 100 : 0

  const activeCodebases = Array.from(new Set(
    filteredFeatures.flatMap(f => f.codebaseBranches?.map(b => b.codebaseId?.toString()) ?? [])
  )).filter(Boolean)

  // Monthly trend activity (last 6 months)
  const trendData: MonthData[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      created: 0,
      deployed: 0,
    }
  }).reverse()

  filteredFeatures.forEach((f) => {
    const cDate = new Date(f.createdAt)
    const cYear = cDate.getFullYear()
    const cMonth = cDate.getMonth()
    const matchCreated = trendData.find(m => m.year === cYear && m.month === cMonth)
    if (matchCreated) matchCreated.created++

    if (f.status === 'DEPLOYED' && f.deploymentDate) {
      const dDate = new Date(f.deploymentDate)
      const dYear = dDate.getFullYear()
      const dMonth = dDate.getMonth()
      const matchDeployed = trendData.find(m => m.year === dYear && m.month === dMonth)
      if (matchDeployed) matchDeployed.deployed++
    }
  })

  // Member Contributions Leaderboard
  const maxContributions = Math.max(1, ...(project?.members ?? []).map(m => {
    const auths = features.filter(f => {
      const aId = (f.authorId as any)?._id?.toString() || f.authorId?.toString()
      return aId === m._id.toString()
    }).length
    const collabs = features.filter(f => 
      f.collaborators?.some(c => {
        const cId = (c as any)?._id?.toString() || c.toString()
        return cId === m._id.toString()
      })
    ).length
    return auths + collabs
  }))

  const membersLeaderboard = (project?.members ?? []).map((m) => {
    const authored = features.filter(f => {
      const aId = (f.authorId as any)?._id?.toString() || f.authorId?.toString()
      return aId === m._id.toString()
    }).length
    const collaborated = features.filter(f => 
      f.collaborators?.some(c => {
        const cId = (c as any)?._id?.toString() || c.toString()
        return cId === m._id.toString()
      })
    ).length
    const total = authored + collaborated
    return {
      member: m,
      authored,
      collaborated,
      total,
    }
  }).sort((a, b) => b.total - a.total)

  const recentActivity = [...filteredFeatures].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* ─── Health Cards & Advanced KPIs ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        {/* Total Features */}
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-accent-muted)', color: 'var(--color-accent-fg)', flexShrink: 0 }}>
            <Layers size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-fg-default)', display: 'block', lineHeight: 1.1 }}>
              {filteredFeatures.length}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>Total Feature Items</span>
          </div>
        </div>

        {/* Avg Lead Time */}
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-attention-muted)', color: 'var(--color-attention-fg)', flexShrink: 0 }}>
            <Clock size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-fg-default)', display: 'block', lineHeight: 1.1 }}>
              {avgLeadTimeDays > 0 ? `${avgLeadTimeDays.toFixed(1)}d` : '—'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>Avg Days to Deploy</span>
          </div>
        </div>

        {/* Collaboration Rate */}
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-success-muted)', color: 'var(--color-success-fg)', flexShrink: 0 }}>
            <Users size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-fg-default)', display: 'block', lineHeight: 1.1 }}>
              {collaborationRate.toFixed(0)}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>Collaboration Density</span>
          </div>
        </div>

        {/* Branch Coverage */}
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-done-muted)', color: 'var(--color-done-fg)', flexShrink: 0 }}>
            <GitBranch size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-fg-default)', display: 'block', lineHeight: 1.1 }}>
              {branchCoverage.toFixed(0)}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)', fontWeight: 500 }}>Branch Coverage</span>
          </div>
        </div>

      </div>

      {/* ─── Row 1: Status Distribution & Velocity Charts ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Status Distribution Card */}
        <div className="gh-card" style={{ padding: '1.5rem 2rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-fg-default)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--color-accent-fg)" />
            Workflow Status Distribution
          </h3>
          <StatusDonutChart counts={counts} total={filteredFeatures.length} />
        </div>

        {/* Deployment Activity Card */}
        <div className="gh-card" style={{ padding: '1.5rem 2rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-fg-default)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--color-success-fg)" />
            Monthly Velocity (Created vs Deployed)
          </h3>
          <ActivityTrendChart data={trendData} />
        </div>

      </div>

      {/* ─── Row 2: Team Contributions & Category breakdown ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Leaderboard Card */}
        <div className="gh-card" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-fg-default)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} color="var(--color-attention-fg)" />
            Member Contributions Leaderboard
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
            {membersLeaderboard.slice(0, 5).map((item, idx) => (
              <div key={item.member._id.toString()} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {/* Member info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg-subtle)', width: '15px' }}>
                      #{idx + 1}
                    </span>
                    {item.member.image ? (
                      <img src={item.member.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--color-border-default)' }} />
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent-fg)' }}>
                        {getInitials(item.member.name)}
                      </div>
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                      {item.member.name}
                    </span>
                  </div>

                  {/* Contributions stats */}
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-fg-default)', fontWeight: 600, textAlign: 'right' }}>
                    {item.total} total
                  </span>
                </div>

                {/* Progress bar split */}
                <div style={{ display: 'flex', height: '6px', width: '100%', borderRadius: '3px', background: 'var(--color-canvas-inset)', overflow: 'hidden', marginTop: '0.2rem' }}>
                  {item.authored > 0 && (
                    <div 
                      style={{ 
                        width: `${(item.authored / maxContributions) * 100}%`, 
                        background: '#2563eb', 
                        transition: 'all 0.4s ease' 
                      }} 
                      title={`Authored: ${item.authored}`} 
                    />
                  )}
                  {item.collaborated > 0 && (
                    <div 
                      style={{ 
                        width: `${(item.collaborated / maxContributions) * 100}%`, 
                        background: '#8fd4a8', 
                        transition: 'all 0.4s ease' 
                      }} 
                      title={`Collaborated: ${item.collaborated}`} 
                    />
                  )}
                </div>
                
                {/* Micro details labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-fg-subtle)' }}>
                  <span>Authored: {item.authored}</span>
                  <span>Collaborated: {item.collaborated}</span>
                </div>
              </div>
            ))}

            {membersLeaderboard.length === 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-fg-subtle)', fontStyle: 'italic', margin: 'auto' }}>
                No active team members.
              </span>
            )}
          </div>
        </div>

        {/* Feature Types Breakdown Card */}
        <div className="gh-card" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-fg-default)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Percent size={16} color="var(--color-done-fg)" />
            Category & Type Analytics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            {TYPE_KPI_CONFIG.map(({ type, label, bg, fg, border }) => {
              const count = typeCounts[type] ?? 0
              const percentage = filteredFeatures.length > 0 ? (count / filteredFeatures.length) * 100 : 0
              return (
                <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.125rem 0.5rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      border: '1px solid',
                      borderColor: border,
                      color: fg,
                      backgroundColor: bg,
                    }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  
                  {/* Progress Meter */}
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-canvas-inset)', overflow: 'hidden', width: '100%' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: fg, transition: 'all 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ─── Recent Activity Log ─── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-fg-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14} /> Recent Log Activity
          </h2>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="type-filter" style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontWeight: 500 }}>
                Type:
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="gh-select"
                style={{
                  width: 'auto',
                  fontSize: '0.75rem',
                  padding: '0.25rem 1.75rem 0.25rem 0.5rem',
                  borderRadius: '6px',
                  height: '28px',
                }}
              >
                <option value="all">All Types</option>
                <option value="FEATURE">Feature</option>
                <option value="BUG FIX">Bug Fix</option>
                <option value="UPDATE">Update</option>
                <option value="DISCARD">Discard</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Time Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="time-filter" style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontWeight: 500 }}>
                Time:
              </label>
              <select
                id="time-filter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="gh-select"
                style={{
                  width: 'auto',
                  fontSize: '0.75rem',
                  padding: '0.25rem 1.75rem 0.25rem 0.5rem',
                  borderRadius: '6px',
                  height: '28px',
                }}
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--color-border-default)', borderRadius: '8px', background: 'var(--color-canvas-subtle)', color: 'var(--color-fg-subtle)', fontSize: '0.875rem' }}>
            {features.length === 0 ? 'No features added yet.' : 'No recent activity found matching filters.'}
          </div>
        ) : (
          <div style={{ border: '1px solid var(--color-border-default)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-canvas-subtle)' }}>
            <table className="gh-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Feature</th>
                  <th style={{ width: '20%' }}>Type</th>
                  <th style={{ width: '20%' }}>Author</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((f) => {
                  const author = f.authorId as any
                  const fType = f.type || 'FEATURE'
                  return (
                    <tr key={f._id.toString()}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>
                            {f.name}
                          </span>
                          {f.codebaseBranches && f.codebaseBranches.length > 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                              {f.codebaseBranches.map(b => `${b.codebaseName}:${b.branchName || 'main'}`).join(', ')}
                            </span>
                          ) : (
                            f.description && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-subtle)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                {f.description}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          border: '1px solid',
                          borderColor: fType === 'BUG FIX' ? '#5c2b2b' :
                                       fType === 'FEATURE' ? '#2b4060' :
                                       fType === 'UPDATE' ? '#2b5c47' :
                                       fType === 'DISCARD' ? '#3a3a3a' :
                                       '#5c4a2b',
                          color: fType === 'BUG FIX' ? '#f5a3a3' :
                                 fType === 'FEATURE' ? '#9cc4f0' :
                                 fType === 'UPDATE' ? '#9ce0bb' :
                                 fType === 'DISCARD' ? '#9a9a9a' :
                                 '#f0cf9c',
                          backgroundColor: fType === 'BUG FIX' ? '#3a1f1f' :
                                           fType === 'FEATURE' ? '#1f2b3a' :
                                           fType === 'UPDATE' ? '#1f3a2e' :
                                           fType === 'DISCARD' ? '#2a2a2a' :
                                           '#3a301f',
                          whiteSpace: 'nowrap',
                        }}>
                          {fType}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {author?.image ? (
                            <img
                              src={author.image}
                              alt={author.name ?? ''}
                              className="gh-avatar"
                              style={{ width: 20, height: 20 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'var(--color-accent-emphasis)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                color: '#fff',
                              }}
                            >
                              {getInitials(author?.name ?? 'U')}
                            </div>
                          )}
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-default)' }}>
                            {author?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge status={f.status} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-fg-subtle)', fontSize: '0.8125rem' }}>
                        {timeAgo(f.updatedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
