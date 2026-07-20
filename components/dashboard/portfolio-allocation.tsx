"use client"

import { PieChart, RefreshCw } from "lucide-react"

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const allocations = [
  { label: "Bitcoin (BTC)", value: "$141,820.50", pct: 91.9, color: "#f59e0b", dot: "bg-amber-500" },
  { label: "US Dollars (USD)", value: "$12,500.00", pct: 8.1, color: "hsl(var(--primary))", dot: "bg-primary" },
]

export default function PortfolioAllocation() {
  // Build cumulative arc segments
  let cumulative = 0
  const segments = allocations.map((a) => {
    const length = (a.pct / 100) * CIRCUMFERENCE
    const dashArray = `${length} ${CIRCUMFERENCE - length}`
    const dashOffset = -((cumulative / 100) * CIRCUMFERENCE)
    cumulative += a.pct
    return { ...a, dashArray, dashOffset }
  })

  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Portfolio Asset Allocation
        </h3>
        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-md border border-border transition">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Donut */}
        <div className="flex justify-center relative py-6">
          <svg className="w-44 h-44 -rotate-90" viewBox="0 0 176 176">
            <circle cx="88" cy="88" r={RADIUS} stroke="hsl(var(--muted))" strokeWidth="16" fill="transparent" />
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx="88"
                cy="88"
                r={RADIUS}
                stroke={seg.color}
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Assets</p>
            <p className="text-base font-extrabold">$154,320.50</p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-4">
          {allocations.map((a) => (
            <div key={a.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${a.dot}`} />
                <span className="text-sm font-semibold text-foreground/80">{a.label}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{a.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{a.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
