import React, { useEffect, useRef, useState, useMemo } from 'react'

const EDGE_COLORS = {
  ally: '#16a34a',
  friend: '#16a34a',
  allies: '#16a34a',
  enemy: '#dc2626',
  enemies: '#dc2626',
  rival: '#ea580c',
  antagonist: '#dc2626',
  family: '#db2777',
  romantic: '#db2777',
  mentor: '#7c3aed',
  neutral: '#64748b',
}

const LEGEND_LABELS = {
  ally: 'Ally',
  enemy: 'Enemy',
  rival: 'Rival',
  family: 'Family',
  romantic: 'Romantic',
  mentor: 'Mentor',
  neutral: 'Neutral',
}

const CANONICAL = {
  friend: 'ally',
  allies: 'ally',
  enemies: 'enemy',
  antagonist: 'enemy',
}

function getEdgeColor(type) {
  const lower = (type || '').toLowerCase()
  return EDGE_COLORS[lower] ?? '#64748b'
}

// FNV-1a — deterministic per-node values so the same graph always looks the same
function hashInt(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

// Extra padding reserved for the colour-legend overlay (bottom-right corner).
// padR adds a small column buffer; padB adds enough bottom clearance so no node
// centre can land inside the legend box (≈140 px tall, 16 px from the edge).
const LEGEND_EXTRA_R = 80
const LEGEND_EXTRA_B = 150

function runSpringLayout(nodes, edges, width, height, iterations = 80) {
  const positions = {}
  const ids = nodes.map((n) => n.id)
  const n = ids.length
  const padL = 80, padT = 80
  const padR = 80 + LEGEND_EXTRA_R
  const padB = 80 + LEGEND_EXTRA_B

  // Spring simulation runs in a capped reference canvas so k stays stable
  // regardless of monitor size. Positions are normalised to the actual canvas
  // after the simulation so every node is always visible.
  const layoutW = Math.min(width, 1400)
  const layoutH = Math.min(height, 700)
  const usableW = Math.max(layoutW - padL - padR, 1)
  const usableH = Math.max(layoutH - padT - padB, 1)

  ids.forEach((id) => {
    const h = hashInt(id)
    const hx = h & 0xffff
    const hy = (h >>> 16) & 0xffff
    positions[id] = {
      x: padL + (hx / 65535) * usableW,
      y: padT + (hy / 65535) * usableH,
    }
  })

  const k = Math.sqrt((usableW * usableH) / Math.max(n, 1))

  for (let iter = 0; iter < iterations; iter++) {
    const disp = {}
    ids.forEach((id) => { disp[id] = { x: 0, y: 0 } })

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j]
        const dx = positions[a].x - positions[b].x
        const dy = positions[a].y - positions[b].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1
        const force = (k * k) / dist
        disp[a].x += (dx / dist) * force
        disp[a].y += (dy / dist) * force
        disp[b].x -= (dx / dist) * force
        disp[b].y -= (dy / dist) * force
        const minSafe = 110
        if (dist < minSafe) {
          const extra = ((minSafe - dist) / minSafe) * k * 4
          disp[a].x += (dx / dist) * extra
          disp[a].y += (dy / dist) * extra
          disp[b].x -= (dx / dist) * extra
          disp[b].y -= (dy / dist) * extra
        }
      }
    }

    edges.forEach(({ source, target }) => {
      if (!positions[source] || !positions[target]) return
      const dx = positions[source].x - positions[target].x
      const dy = positions[source].y - positions[target].y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1
      const force = (dist * dist) / k
      disp[source].x -= (dx / dist) * force
      disp[source].y -= (dy / dist) * force
      disp[target].x += (dx / dist) * force
      disp[target].y += (dy / dist) * force
    })

    const temp = k * (1 - iter / iterations)
    ids.forEach((id) => {
      const d = disp[id]
      const mag = Math.sqrt(d.x * d.x + d.y * d.y) || 0.1
      const clamped = Math.min(mag, temp)
      positions[id].x += (d.x / mag) * clamped
      positions[id].y += (d.y / mag) * clamped
      positions[id].x = Math.max(padL, Math.min(layoutW - padR, positions[id].x))
      positions[id].y = Math.max(padT, Math.min(layoutH - padB, positions[id].y))
    })
  }

  // Normalise: scale the layout bounding box to 90% of the actual usable canvas,
  // centered. This guarantees every node is visible on any screen size, even when
  // the spring simulation left some nodes piled at the reference-canvas boundary.
  const usableW_actual = Math.max(width - padL - padR, 1)
  const usableH_actual = Math.max(height - padT - padB, 1)

  const xs = ids.map((id) => positions[id].x)
  const ys = ids.map((id) => positions[id].y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const spreadX = maxX - minX || 1
  const spreadY = maxY - minY || 1

  const scale = Math.min(
    (usableW_actual * 0.9) / spreadX,
    (usableH_actual * 0.9) / spreadY,
  )
  const centerX = padL + usableW_actual / 2
  const centerY = padT + usableH_actual / 2
  const graphCX = (minX + maxX) / 2
  const graphCY = (minY + maxY) / 2

  ids.forEach((id) => {
    positions[id].x = Math.max(padL, Math.min(width - padR,
      centerX + (positions[id].x - graphCX) * scale))
    positions[id].y = Math.max(padT, Math.min(height - padB,
      centerY + (positions[id].y - graphCY) * scale))
  })

  // Overlap resolution in actual canvas space.
  // When two nodes are exactly co-located (dist ≈ 0) after normalisation, push
  // them apart horizontally so the direction vector is always well-defined.
  const minNodeDist = 105
  for (let pass = 0; pass < 30; pass++) {
    let moved = false
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j]
        const dx = positions[a].x - positions[b].x
        const dy = positions[a].y - positions[b].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < minNodeDist) {
          const push = (minNodeDist - (dist || 0)) / 2 + 0.5
          // Use a deterministic fallback direction when nodes are co-located
          const ux = dist > 0.5 ? dx / dist : 1
          const uy = dist > 0.5 ? dy / dist : 0
          positions[a].x = Math.max(padL, Math.min(width  - padR, positions[a].x + ux * push))
          positions[a].y = Math.max(padT, Math.min(height - padB, positions[a].y + uy * push))
          positions[b].x = Math.max(padL, Math.min(width  - padR, positions[b].x - ux * push))
          positions[b].y = Math.max(padT, Math.min(height - padB, positions[b].y - uy * push))
          moved = true
        }
      }
    }
    if (!moved) break
  }

  return positions
}

export default function GraphCanvas({ nodes, edges, onNodeClick }) {
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ width: 800, height: 600 })
  const [tooltip, setTooltip] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDims({ width, height })
    })
    obs.observe(containerRef.current)
    const { width, height } = containerRef.current.getBoundingClientRect()
    setDims({ width: width || 800, height: height || 600 })
    return () => obs.disconnect()
  }, [])

  const positions = useMemo(() => {
    if (nodes.length === 0) return {}
    return runSpringLayout(nodes, edges, dims.width, dims.height)
  }, [nodes, edges, dims.width, dims.height])

  const degreeMap = useMemo(() => {
    const map = {}
    nodes.forEach((n) => { map[n.id] = 0 })
    edges.forEach((e) => {
      if (map[e.source] !== undefined) map[e.source]++
      if (map[e.target] !== undefined) map[e.target]++
    })
    return map
  }, [nodes, edges])

  const nodeRadius = (id) => Math.max(28, Math.min(44, 28 + (degreeMap[id] || 0) * 2.5))

  const connectedToHovered = useMemo(() => {
    if (!hoveredNode) return null
    const set = new Set()
    edges.forEach((e) => {
      if (e.source === hoveredNode) set.add(e.target)
      if (e.target === hoveredNode) set.add(e.source)
    })
    return set
  }, [hoveredNode, edges])

  const presentTypes = useMemo(() => {
    const seen = new Set()
    edges.forEach((e) => {
      const t = (e.relationshipType || '').toLowerCase()
      seen.add(CANONICAL[t] || t)
    })
    return Array.from(seen).filter((t) => LEGEND_LABELS[t])
  }, [edges])

  const handleEdgeMouseEnter = (e, edge) => setTooltip({ x: e.clientX, y: e.clientY, edge })
  const handleEdgeMouseLeave = () => setTooltip(null)
  const handleEdgeMouseMove = (e) => {
    if (tooltip) setTooltip((t) => ({ ...t, x: e.clientX, y: e.clientY }))
  }

  return (
    <div ref={containerRef} className='w-full h-full relative'>
      <svg width={dims.width} height={dims.height} className='absolute inset-0'>
        <defs>
          <pattern id='dot-grid' x='0' y='0' width='24' height='24' patternUnits='userSpaceOnUse'>
            <circle cx='1' cy='1' r='1' fill='#cbd5e1' />
          </pattern>
        </defs>
        <rect width={dims.width} height={dims.height} fill='url(#dot-grid)' />

        {/* Layer 1 — edge lines only (drawn before nodes) */}
        {edges.map((edge, i) => {
          const s = positions[edge.source]
          const t = positions[edge.target]
          if (!s || !t) return null

          const color = getEdgeColor(edge.relationshipType)
          const isActive = !hoveredNode || edge.source === hoveredNode || edge.target === hoveredNode

          const dx = t.x - s.x
          const dy = t.y - s.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const sr = nodeRadius(edge.source) + 3
          const tr = nodeRadius(edge.target) + 3

          // Skip edge when nodes overlap — trimmed endpoints would cross each other
          if (sr + tr >= len) return null

          const x1 = s.x + (dx / len) * sr
          const y1 = s.y + (dy / len) * sr
          const x2 = t.x - (dx / len) * tr
          const y2 = t.y - (dy / len) * tr

          return (
            <g key={i} style={{ opacity: isActive ? 1 : 0.12 }}>
              {/* Wide transparent hit-target so the thin line is easy to hover */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke='transparent' strokeWidth={16}
                className='cursor-pointer'
                onMouseEnter={(e) => handleEdgeMouseEnter(e, edge)}
                onMouseLeave={handleEdgeMouseLeave}
                onMouseMove={handleEdgeMouseMove}
              />
              {/* Visible line */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeOpacity={0.85}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )
        })}

        {/* Layer 2 — nodes (on top of lines) */}
        {nodes.map((node) => {
          const pos = positions[node.id]
          if (!pos) return null
          const r = nodeRadius(node.id)
          const isHovered = hoveredNode === node.id
          const isDimmed = hoveredNode && !isHovered && !connectedToHovered?.has(node.id)

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x},${pos.y})`}
              onClick={() => onNodeClick?.(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className='cursor-pointer'
              style={{ opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.15s' }}
            >
              <circle
                r={r}
                fill='white'
                stroke={isHovered ? '#10b981' : '#cbd5e1'}
                strokeWidth={isHovered ? 2.5 : 1.5}
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))',
                  transition: 'stroke 0.15s, stroke-width 0.15s',
                }}
              />
              <text
                textAnchor='middle' dy='0.35em'
                fill='#0f172a'
                fontSize={r < 34 ? 10 : 11}
                fontWeight='600'
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {node.label.length > 11 ? node.label.slice(0, 10) + '…' : node.label}
              </text>
            </g>
          )
        })}

        {/* Layer 3 — edge badges (on top of nodes so they're never hidden) */}
        {edges.map((edge, i) => {
          const s = positions[edge.source]
          const t = positions[edge.target]
          if (!s || !t) return null

          const color = getEdgeColor(edge.relationshipType)
          const isActive = !hoveredNode || edge.source === hoveredNode || edge.target === hoveredNode

          const dx = t.x - s.x
          const dy = t.y - s.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const sr = nodeRadius(edge.source) + 3
          const tr = nodeRadius(edge.target) + 3

          if (sr + tr >= len) return null

          const x1 = s.x + (dx / len) * sr
          const y1 = s.y + (dy / len) * sr
          const x2 = t.x - (dx / len) * tr
          const y2 = t.y - (dy / len) * tr
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2

          const label = edge.relationshipType || ''
          const halfW = Math.ceil(label.length * 3.1 + 10)
          const minLen = nodeRadius(edge.source) + nodeRadius(edge.target) + halfW * 2 + 20
          const showBadge = len > minLen

          if (!showBadge) return null

          // Skip badge if its centre would overlap any node circle (including third-party nodes)
          const badgeClipsNode = nodes.some((nd) => {
            const p = positions[nd.id]
            if (!p) return false
            const ndx = mx - p.x
            const ndy = my - p.y
            return Math.sqrt(ndx * ndx + ndy * ndy) < nodeRadius(nd.id) + 14
          })
          if (badgeClipsNode) return null

          return (
            <g key={`badge-${i}`} style={{ opacity: isActive ? 1 : 0.12, pointerEvents: 'none' }}>
              <rect
                x={mx - halfW} y={my - 9}
                width={halfW * 2} height={18}
                rx={9}
                fill='white'
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={mx} y={my}
                textAnchor='middle' dy='0.35em'
                fill={color} fontSize={9} fontWeight='700'
                style={{ userSelect: 'none' }}
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Colour legend — only shows types present in the current chapter slice */}
      {presentTypes.length > 0 && (
        <div className='absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-xl px-3 py-2.5 shadow-sm pointer-events-none'>
          <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5'>
            Relationship
          </p>
          <div className='flex flex-col gap-1.5'>
            {presentTypes.map((type) => (
              <div key={type} className='flex items-center gap-2'>
                <span
                  className='w-5 h-1.5 rounded-full shrink-0'
                  style={{ backgroundColor: EDGE_COLORS[type] }}
                />
                <span className='text-xs text-slate-700 font-medium'>{LEGEND_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edge detail tooltip */}
      {tooltip && (
        <div
          className='fixed z-50 px-3 py-2.5 bg-white border border-slate-200/60 shadow-lg text-xs rounded-xl pointer-events-none max-w-xs'
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <p className='font-semibold text-slate-900 capitalize'>
            {tooltip.edge.relationshipType || 'Unknown'}
          </p>
          {tooltip.edge.context && (
            <p className='text-slate-500 mt-1 leading-relaxed'>{tooltip.edge.context}</p>
          )}
        </div>
      )}
    </div>
  )
}
