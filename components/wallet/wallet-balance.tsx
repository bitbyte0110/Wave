"use client"

import { useState } from "react"
import { Eye, EyeOff, TrendingUp, TrendingDown, MoreVertical } from "lucide-react"

export default function WalletBalance() {
  const [showBalance, setShowBalance] = useState(true)
  const [timeframe, setTimeframe] = useState("1W")

  const cryptoAssets = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      icon: "₿",
      iconColor: "bg-orange-500",
      balance: "0.5473",
      value: "$21,892.00",
      change: "+2.3%",
      changeType: "up",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      icon: "Ξ",
      iconColor: "bg-blue-500",
      balance: "4.2134",
      value: "$8,426.80",
      change: "-0.8%",
      changeType: "down",
    },
    {
      name: "Litecoin",
      symbol: "LTC",
      icon: "Ł",
      iconColor: "bg-gray-500",
      balance: "12.3456",
      value: "$1,234.56",
      change: "+1.2%",
      changeType: "up",
    },
    {
      name: "Ripple",
      symbol: "XRP",
      icon: "✕",
      iconColor: "bg-gray-700",
      balance: "1,234.5678",
      value: "$617.28",
      change: "+0.5%",
      changeType: "up",
    },
  ]

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Wallet Balance</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <Eye className="h-5 w-5 text-gray-500" /> : <EyeOff className="h-5 w-5 text-gray-500" />}
          </button>
          <button className="p-1 rounded-md hover:bg-gray-100">
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-500">Total Balance</div>
        <div className="text-3xl font-bold">{showBalance ? "$32,170.64" : "••••••••"}</div>
        <div className="flex items-center mt-1">
          <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
          <span className="text-sm text-emerald-500 font-medium">+$642.58 (2.0%)</span>
          <span className="text-xs text-gray-500 ml-2">Past 24h</span>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        <h3 className="font-medium">Your Assets</h3>
        <div className="flex space-x-1">
          {["24H", "1W", "1M", "1Y", "ALL"].map((period) => (
            <button
              key={period}
              className={`px-2 py-1 text-xs rounded ${timeframe === period ? "bg-gray-200" : "hover:bg-gray-100"}`}
              onClick={() => setTimeframe(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="min-w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="pb-2 text-left">ASSET</th>
              <th className="pb-2 text-right">BALANCE</th>
              <th className="pb-2 text-right">VALUE</th>
              <th className="pb-2 text-right">CHANGE</th>
            </tr>
          </thead>
          <tbody>
            {cryptoAssets.map((asset, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="py-3">
                  <div className="flex items-center">
                    <div className={`${asset.iconColor} rounded-full h-8 w-8 flex items-center justify-center mr-3`}>
                      <span className="text-white text-xs">{asset.icon}</span>
                    </div>
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-xs text-gray-500">{asset.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <div className="font-medium">{showBalance ? asset.balance : "•••••"}</div>
                  <div className="text-xs text-gray-500">{asset.symbol}</div>
                </td>
                <td className="py-3 text-right">
                  <div className="font-medium">{showBalance ? asset.value : "•••••"}</div>
                </td>
                <td className="py-3 text-right">
                  <div
                    className={`flex items-center justify-end ${
                      asset.changeType === "up" ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {asset.changeType === "up" ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {asset.change}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
