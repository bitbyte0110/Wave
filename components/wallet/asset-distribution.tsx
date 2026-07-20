"use client"

import { useState } from "react"
import { MoreVertical } from "lucide-react"

export default function AssetDistribution() {
  const [showPercentage, setShowPercentage] = useState(true)

  const assets = [
    { name: "Bitcoin", symbol: "BTC", color: "bg-orange-500", percentage: 68 },
    { name: "Ethereum", symbol: "ETH", color: "bg-blue-500", percentage: 26 },
    { name: "Litecoin", symbol: "LTC", color: "bg-gray-500", percentage: 4 },
    { name: "Ripple", symbol: "XRP", color: "bg-gray-700", percentage: 2 },
  ]

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Asset Distribution</h2>
        <button>
          <MoreVertical className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="mb-6">
        <div className="relative h-48 w-48 mx-auto">
          {/* SVG Donut Chart */}
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f0f0f0" strokeWidth="20" />

            {/* Dynamic segments - we'll calculate stroke-dasharray and stroke-dashoffset */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f97316" // orange-500
              strokeWidth="20"
              strokeDasharray="251.2 251.2"
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
            />

            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#3b82f6" // blue-500
              strokeWidth="20"
              strokeDasharray="65.31 251.2"
              strokeDashoffset="-170.82"
              transform="rotate(-90 50 50)"
            />

            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#6b7280" // gray-500
              strokeWidth="20"
              strokeDasharray="10.05 251.2"
              strokeDashoffset="-236.13"
              transform="rotate(-90 50 50)"
            />

            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#374151" // gray-700
              strokeWidth="20"
              strokeDasharray="5.02 251.2"
              strokeDashoffset="-246.18"
              transform="rotate(-90 50 50)"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-medium">Total</div>
            <div className="text-xl font-bold">$32,170.64</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {assets.map((asset, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full ${asset.color} mr-2`}></div>
              <span className="text-sm">{asset.name}</span>
            </div>
            <div className="text-sm font-medium">
              {showPercentage
                ? `${asset.percentage}%`
                : `$${((32170.64 * asset.percentage) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button
          className="text-xs text-emerald-600 hover:text-emerald-700"
          onClick={() => setShowPercentage(!showPercentage)}
        >
          Show {showPercentage ? "Values" : "Percentages"}
        </button>
      </div>
    </div>
  )
}
