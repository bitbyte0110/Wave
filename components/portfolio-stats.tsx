"use client"

import { useState } from "react"
import { MoreVertical } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function PortfolioStats() {
  const [activeTab, setActiveTab] = useState("1W")

  // Sample data for the chart
  const chartData = [
    { date: "Nov 12", price: 39800, volume: 24000 },
    { date: "Nov 13", price: 40200, volume: 26000 },
    { date: "Nov 14", price: 40500, volume: 22000 },
    { date: "Nov 15", price: 41200, volume: 29000 },
    { date: "Nov 16", price: 42100, volume: 34000 },
    { date: "Nov 17", price: 41800, volume: 31000 },
    { date: "Nov 18", price: 41561, volume: 28000 },
  ]

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Portfolio Stats</h2>
        <button>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="mb-4">
        <div className="text-xs text-muted-foreground">Price</div>
        <div className="text-2xl font-bold">$41,561.22</div>
        <div className="text-xs text-muted-foreground">Currency</div>
        <div className="text-sm font-medium">USD</div>
      </div>

      <div className="h-[200px] mb-4">
        <ChartContainer
          config={{
            price: {
              label: "Price",
              color: "hsl(var(--chart-1))",
            },
            volume: {
              label: "Volume",
              color: "hsl(var(--chart-2))",
              area: true,
              opacity: 0.2,
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                fontSize={10}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                domain={["dataMin - 500", "dataMax + 500"]}
                tickLine={false}
                axisLine={false}
                tickCount={5}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="var(--color-price)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <button
          className={`px-2 py-1 text-xs rounded ${activeTab === "24H" ? "bg-muted text-foreground" : ""}`}
          onClick={() => setActiveTab("24H")}
        >
          24H
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${activeTab === "1W" ? "bg-muted text-foreground" : ""}`}
          onClick={() => setActiveTab("1W")}
        >
          1W
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${activeTab === "1M" ? "bg-muted text-foreground" : ""}`}
          onClick={() => setActiveTab("1M")}
        >
          1M
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${activeTab === "3M" ? "bg-muted text-foreground" : ""}`}
          onClick={() => setActiveTab("3M")}
        >
          3M
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${activeTab === "1Y" ? "bg-muted text-foreground" : ""}`}
          onClick={() => setActiveTab("1Y")}
        >
          1Y
        </button>
      </div>
    </div>
  )
}
