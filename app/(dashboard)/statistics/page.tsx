"use client"

import { useState } from "react"
import { BarChart2, TrendingUp, TrendingDown, Download, RefreshCw, Calendar, Filter } from "lucide-react"

export default function StatisticsPage() {
  const [timeframe, setTimeframe] = useState("1W")
  const [chartType, setChartType] = useState("line")

  // Sample data for charts
  const performanceData = [
    { date: "Jan", btc: 42000, eth: 3200, ltc: 180, xrp: 0.85 },
    { date: "Feb", btc: 44500, eth: 3100, ltc: 190, xrp: 0.82 },
    { date: "Mar", btc: 47000, eth: 3300, ltc: 195, xrp: 0.88 },
    { date: "Apr", btc: 51000, eth: 3500, ltc: 210, xrp: 0.92 },
    { date: "May", btc: 49000, eth: 3400, ltc: 205, xrp: 0.9 },
    { date: "Jun", btc: 52000, eth: 3600, ltc: 220, xrp: 0.95 },
    { date: "Jul", btc: 55000, eth: 3800, ltc: 230, xrp: 1.05 },
    { date: "Aug", btc: 53000, eth: 3700, ltc: 225, xrp: 1.0 },
    { date: "Sep", btc: 56000, eth: 3900, ltc: 235, xrp: 1.1 },
    { date: "Oct", btc: 58000, eth: 4100, ltc: 245, xrp: 1.15 },
    { date: "Nov", btc: 61000, eth: 4300, ltc: 255, xrp: 1.2 },
    { date: "Dec", btc: 64000, eth: 4500, ltc: 265, xrp: 1.25 },
  ]

  const marketStats = [
    {
      title: "Total Market Cap",
      value: "$2.14T",
      change: "+2.3%",
      trend: "up",
    },
    {
      title: "24h Volume",
      value: "$84.5B",
      change: "-1.2%",
      trend: "down",
    },
    {
      title: "BTC Dominance",
      value: "42.1%",
      change: "+0.5%",
      trend: "up",
    },
    {
      title: "Active Cryptocurrencies",
      value: "12,344",
      change: "+121",
      trend: "up",
    },
  ]

  const topGainers = [
    { name: "Solana", symbol: "SOL", price: "$138.42", change: "+15.2%" },
    { name: "Avalanche", symbol: "AVAX", price: "$34.21", change: "+12.8%" },
    { name: "Polygon", symbol: "MATIC", price: "$0.98", change: "+10.5%" },
    { name: "Cardano", symbol: "ADA", price: "$0.52", change: "+8.7%" },
    { name: "Polkadot", symbol: "DOT", price: "$7.84", change: "+7.3%" },
  ]

  const topLosers = [
    { name: "Shiba Inu", symbol: "SHIB", price: "$0.00000912", change: "-8.4%" },
    { name: "Dogecoin", symbol: "DOGE", price: "$0.078", change: "-6.2%" },
    { name: "Uniswap", symbol: "UNI", price: "$5.42", change: "-5.8%" },
    { name: "Chainlink", symbol: "LINK", price: "$14.32", change: "-4.3%" },
    { name: "Stellar", symbol: "XLM", price: "$0.11", change: "-3.9%" },
  ]

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-emerald-100 rounded-full p-2 mr-3">
            <BarChart2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Statistics</h1>
            <p className="text-gray-500 text-sm">Analyze your portfolio and market trends</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border rounded-md text-sm font-medium flex items-center hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700">
            <RefreshCw className="h-4 w-4 inline-block mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {marketStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500 mb-1">{stat.title}</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`flex items-center ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Performance Chart */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Portfolio Performance</h2>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <button
                className={`px-2 py-1 text-xs rounded ${chartType === "line" ? "bg-gray-200" : ""}`}
                onClick={() => setChartType("line")}
              >
                Line
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${chartType === "bar" ? "bg-gray-200" : ""}`}
                onClick={() => setChartType("bar")}
              >
                Bar
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${chartType === "candle" ? "bg-gray-200" : ""}`}
                onClick={() => setChartType("candle")}
              >
                Candle
              </button>
            </div>
            <div className="flex space-x-1">
              {["24H", "1W", "1M", "3M", "1Y", "ALL"].map((period) => (
                <button
                  key={period}
                  className={`px-2 py-1 text-xs rounded ${timeframe === period ? "bg-gray-200" : ""}`}
                  onClick={() => setTimeframe(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          {/* Chart visualization - using a placeholder SVG for now */}
          <svg className="w-full h-full" viewBox="0 0 800 300">
            {/* X and Y axes */}
            <line x1="50" y1="250" x2="750" y2="250" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="50" y1="50" x2="50" y2="250" stroke="#e5e7eb" strokeWidth="1" />

            {/* X-axis labels */}
            {performanceData.map((data, i) => (
              <text
                key={i}
                x={50 + i * (700 / (performanceData.length - 1))}
                y="270"
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {data.date}
              </text>
            ))}

            {/* Y-axis labels */}
            {[0, 20000, 40000, 60000, 80000].map((value, i) => (
              <text key={i} x="40" y={250 - i * 50} textAnchor="end" fontSize="10" fill="#6b7280">
                ${value.toLocaleString()}
              </text>
            ))}

            {/* BTC line chart */}
            <path
              d={performanceData
                .map((data, i) => {
                  const x = 50 + i * (700 / (performanceData.length - 1))
                  const y = 250 - (data.btc / 80000) * 200
                  return `${i === 0 ? "M" : "L"}${x},${y}`
                })
                .join(" ")}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
            />

            {/* ETH line chart */}
            <path
              d={performanceData
                .map((data, i) => {
                  const x = 50 + i * (700 / (performanceData.length - 1))
                  const y = 250 - (data.eth / 80000) * 200 * 10 // Scale up for visibility
                  return `${i === 0 ? "M" : "L"}${x},${y}`
                })
                .join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Legend */}
            <circle cx="650" cy="30" r="5" fill="#f59e0b" />
            <text x="660" y="35" fontSize="12" fill="#6b7280">
              Bitcoin (BTC)
            </text>
            <circle cx="650" cy="50" r="5" fill="#3b82f6" />
            <text x="660" y="55" fontSize="12" fill="#6b7280">
              Ethereum (ETH)
            </text>
          </svg>
        </div>
      </div>

      {/* Top Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-bold mb-4">Top Gainers (24h)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="pb-2 text-left">NAME</th>
                  <th className="pb-2 text-right">PRICE</th>
                  <th className="pb-2 text-right">CHANGE</th>
                </tr>
              </thead>
              <tbody>
                {topGainers.map((coin, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="font-medium">{coin.name}</div>
                        <div className="text-xs text-gray-500 ml-2">{coin.symbol}</div>
                      </div>
                    </td>
                    <td className="py-3 text-right">{coin.price}</td>
                    <td className="py-3 text-right text-emerald-500">{coin.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-bold mb-4">Top Losers (24h)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="pb-2 text-left">NAME</th>
                  <th className="pb-2 text-right">PRICE</th>
                  <th className="pb-2 text-right">CHANGE</th>
                </tr>
              </thead>
              <tbody>
                {topLosers.map((coin, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="font-medium">{coin.name}</div>
                        <div className="text-xs text-gray-500 ml-2">{coin.symbol}</div>
                      </div>
                    </td>
                    <td className="py-3 text-right">{coin.price}</td>
                    <td className="py-3 text-right text-red-500">{coin.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trading Volume */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Trading Volume</h2>
          <div className="flex items-center space-x-2">
            <button className="p-1 rounded-md hover:bg-gray-100 border">
              <Calendar className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-1 rounded-md hover:bg-gray-100 border">
              <Filter className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="h-60 w-full">
          {/* Bar chart visualization */}
          <svg className="w-full h-full" viewBox="0 0 800 200">
            {/* X and Y axes */}
            <line x1="50" y1="150" x2="750" y2="150" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="50" y1="20" x2="50" y2="150" stroke="#e5e7eb" strokeWidth="1" />

            {/* X-axis labels */}
            {performanceData.map((data, i) => (
              <text
                key={i}
                x={50 + i * (700 / (performanceData.length - 1))}
                y="170"
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {data.date}
              </text>
            ))}

            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map((value, i) => (
              <text key={i} x="40" y={150 - i * 30} textAnchor="end" fontSize="10" fill="#6b7280">
                ${value}B
              </text>
            ))}

            {/* Volume bars */}
            {performanceData.map((data, i) => {
              const barWidth = 30
              const x = 50 + i * (700 / (performanceData.length - 1)) - barWidth / 2
              const height = (data.btc / 80000) * 100
              return (
                <rect
                  key={i}
                  x={x}
                  y={150 - height}
                  width={barWidth}
                  height={height}
                  fill="#10b981"
                  fillOpacity="0.7"
                />
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
