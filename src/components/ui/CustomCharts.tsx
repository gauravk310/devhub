'use client'

import React from 'react'

// Helper to format bytes cleanly
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.max(0, Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k))))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Helper to format standard values
function formatValue(val: number, formatType?: 'bytes' | 'number'): string {
  if (formatType === 'bytes') return formatBytes(val)
  return val.toLocaleString()
}

// ─── AREA CHART COMPONENT ──────────────────────────────────────────────────
interface ChartPoint {
  label: string
  value: number
}

interface AreaChartProps {
  data: ChartPoint[]
  height?: number
  strokeColor?: string
  fillColor?: string
  formatType?: 'bytes' | 'number'
}

export function AreaChart({
  data,
  height = 180,
  strokeColor = '#3fb950', // Success green
  fillColor = 'rgba(63, 185, 80, 0.15)',
  formatType = 'number',
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-subtle)', fontSize: '0.8125rem' }}>
        No metric history available
      </div>
    )
  }

  const values = data.map((d) => d.value)
  const maxVal = Math.max(...values, 1)
  const minVal = Math.min(...values, 0)
  const range = maxVal - minVal

  const paddingLeft = 60
  const paddingRight = 10
  const paddingTop = 20
  const paddingBottom = 30

  // Standard chart dimensions
  const viewWidth = 500
  const viewHeight = height
  const graphWidth = viewWidth - paddingLeft - paddingRight
  const graphHeight = viewHeight - paddingTop - paddingBottom

  // Map points to SVG coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * graphWidth
    const y = paddingTop + graphHeight - ((d.value - minVal) / range) * graphHeight
    return { x, y }
  })

  // Create paths
  let linePath = ''
  let areaPath = ''

  if (points.length === 1) {
    const pt = points[0]
    const endX = paddingLeft + graphWidth
    linePath = `M ${pt.x} ${pt.y} L ${endX} ${pt.y}`
    areaPath = `M ${pt.x} ${pt.y} L ${endX} ${pt.y} L ${endX} ${paddingTop + graphHeight} L ${pt.x} ${paddingTop + graphHeight} Z`
  } else if (points.length > 1) {
    linePath = `M ${points[0].x} ${points[0].y} `
    for (let i = 1; i < points.length; i++) {
      linePath += `L ${points[i].x} ${points[i].y} `
    }

    areaPath = linePath + `L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`
  }

  // Draw grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const yVal = minVal + p * range
    const yCoord = paddingTop + graphHeight - p * graphHeight
    return { yCoord, yVal }
  })

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${viewWidth} ${viewHeight}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={paddingLeft}
            y1={line.yCoord}
            x2={viewWidth - paddingRight}
            y2={line.yCoord}
            stroke="var(--color-border-muted)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <text
            x={paddingLeft - 8}
            y={line.yCoord + 4}
            fill="var(--color-fg-subtle)"
            fontSize="9"
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            {formatValue(line.yVal, formatType)}
          </text>
        </g>
      ))}

      {/* Areas */}
      {points.length >= 1 && (
        <>
          <path d={areaPath} fill="url(#areaGrad)" />
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={1.5} />
        </>
      )}

      {/* Markers */}
      {points.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r={points.length > 25 ? 0.5 : 2.5}
          fill="var(--color-canvas-default)"
          stroke={strokeColor}
          strokeWidth={1.5}
        />
      ))}

      {/* X Axis Labels */}
      {data.map((d, i) => {
        // Only show a select number of labels to prevent crowding
        if (data.length > 6 && i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null

        const pt = points[i]
        return (
          <text
            key={i}
            x={pt.x}
            y={viewHeight - 10}
            fill="var(--color-fg-subtle)"
            fontSize="9"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── BAR CHART COMPONENT ───────────────────────────────────────────────────
interface BarChartProps {
  data: ChartPoint[]
  height?: number
  barColor?: string
  formatType?: 'bytes' | 'number'
}

export function BarChart({
  data,
  height = 180,
  barColor = '#58a6ff', // Accent blue
  formatType = 'number',
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-subtle)', fontSize: '0.8125rem' }}>
        No data available
      </div>
    )
  }

  const values = data.map((d) => d.value)
  const maxVal = Math.max(...values, 1)

  const paddingLeft = 80
  const paddingRight = 20
  const paddingTop = 10
  const paddingBottom = 10

  const viewWidth = 500
  const viewHeight = height
  const graphWidth = viewWidth - paddingLeft - paddingRight
  const graphHeight = viewHeight - paddingTop - paddingBottom

  const barHeight = Math.max(Math.floor(graphHeight / data.length) - 8, 8)
  const gap = (graphHeight - barHeight * data.length) / Math.max(data.length - 1, 1)

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${viewWidth} ${viewHeight}`} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const percentage = d.value / maxVal
        const barWidth = percentage * graphWidth
        const y = paddingTop + i * (barHeight + gap)

        return (
          <g key={i}>
            {/* Label */}
            <text
              x={paddingLeft - 10}
              y={y + barHeight / 2 + 3}
              fill="var(--color-fg-default)"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {d.label.length > 10 ? d.label.substring(0, 10) + '..' : d.label}
            </text>

            {/* Background Bar track */}
            <rect
              x={paddingLeft}
              y={y}
              width={graphWidth}
              height={barHeight}
              fill="var(--color-border-muted)"
              rx="3"
            />

            {/* Filled Bar */}
            <rect
              x={paddingLeft}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={barColor}
              rx="3"
            />

            {/* Value Indicator */}
            <text
              x={paddingLeft + barWidth + 8}
              y={y + barHeight / 2 + 3}
              fill="var(--color-fg-subtle)"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {formatValue(d.value, formatType)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── PIE CHART COMPONENT ───────────────────────────────────────────────────
interface PieItem {
  label: string
  value: number
}

interface PieChartProps {
  data: PieItem[]
  height?: number
  colors?: string[]
}

export function PieChart({
  data,
  height = 180,
  colors = ['#58a6ff', '#3fb950', '#a371f7', '#d29922', '#f85149', '#6e7681'],
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-subtle)', fontSize: '0.8125rem' }}>
        No storage distribution data
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-fg-subtle)', fontSize: '0.8125rem' }}>
        Database is empty
      </div>
    )
  }

  const cx = 100
  const cy = 90
  const r = 70

  let currentAngle = 0

  const slices = data.map((item, index) => {
    const percentage = item.value / total
    const angle = percentage * 360

    // Coordinates of start and end points
    const startRad = (currentAngle - 90) * (Math.PI / 180)
    const endRad = (currentAngle + angle - 90) * (Math.PI / 180)

    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    // SVG path string for a pie slice
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

    currentAngle += angle
    const color = colors[index % colors.length]

    return { d, color, label: item.label, percent: (percentage * 100).toFixed(1) }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', height }}>
      <svg width={200} height={height} viewBox="0 0 200 180">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.d}
            fill={slice.color}
            stroke="var(--color-canvas-subtle)"
            strokeWidth="1.5"
            style={{ transition: 'opacity 0.2s', cursor: 'help' }}
          >
            <title>{`${slice.label}: ${slice.percent}%`}</title>
          </path>
        ))}
        {/* Inner circle for donut styling */}
        <circle cx={cx} cy={cy} r={r * 0.4} fill="var(--color-canvas-subtle)" />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, maxHeight: height, overflowY: 'auto' }}>
        {slices.slice(0, 6).map((slice, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: slice.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
              {slice.label}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
              {slice.percent}%
            </span>
          </div>
        ))}
        {data.length > 6 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--color-fg-subtle)', fontStyle: 'italic', paddingLeft: '0.8rem' }}>
            + {data.length - 6} other collections
          </div>
        )}
      </div>
    </div>
  )
}
