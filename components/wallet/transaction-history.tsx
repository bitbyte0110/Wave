"use client"

import { useState } from "react"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Filter, Search } from "lucide-react"

export default function TransactionHistory() {
  const [filter, setFilter] = useState("all")

  const transactions = [
    {
      id: "TX123456789",
      type: "deposit",
      asset: "Bitcoin",
      symbol: "BTC",
      amount: "+0.0235",
      value: "$940.00",
      status: "completed",
      date: "2023-04-18",
      time: "14:32:45",
    },
    {
      id: "TX123456788",
      type: "withdraw",
      asset: "Ethereum",
      symbol: "ETH",
      amount: "-1.5000",
      value: "$3,000.00",
      status: "completed",
      date: "2023-04-17",
      time: "09:15:22",
    },
    {
      id: "TX123456787",
      type: "deposit",
      asset: "Litecoin",
      symbol: "LTC",
      amount: "+5.0000",
      value: "$500.00",
      status: "completed",
      date: "2023-04-15",
      time: "18:45:11",
    },
    {
      id: "TX123456786",
      type: "withdraw",
      asset: "Bitcoin",
      symbol: "BTC",
      amount: "-0.0050",
      value: "$200.00",
      status: "pending",
      date: "2023-04-15",
      time: "11:22:33",
    },
    {
      id: "TX123456785",
      type: "deposit",
      asset: "Ripple",
      symbol: "XRP",
      amount: "+250.0000",
      value: "$125.00",
      status: "completed",
      date: "2023-04-14",
      time: "16:08:59",
    },
  ]

  const filteredTransactions = filter === "all" ? transactions : transactions.filter((tx) => tx.type === filter)

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Transaction History</h2>
        <button className="p-1 rounded-md hover:bg-gray-100">
          <RefreshCw className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md text-sm flex items-center ${
              filter === "all" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm flex items-center ${
              filter === "deposit" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setFilter("deposit")}
          >
            <ArrowDownLeft className="h-4 w-4 mr-1" />
            Deposits
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm flex items-center ${
              filter === "withdraw" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setFilter("withdraw")}
          >
            <ArrowUpRight className="h-4 w-4 mr-1" />
            Withdrawals
          </button>
        </div>

        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <button className="p-1 rounded-md hover:bg-gray-100 border">
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="min-w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="pb-2 text-left">DATE & TIME</th>
              <th className="pb-2 text-left">TYPE</th>
              <th className="pb-2 text-left">ASSET</th>
              <th className="pb-2 text-right">AMOUNT</th>
              <th className="pb-2 text-right">VALUE</th>
              <th className="pb-2 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0">
                <td className="py-3">
                  <div className="text-sm">{tx.date}</div>
                  <div className="text-xs text-gray-500">{tx.time}</div>
                </td>
                <td className="py-3">
                  <div className={`flex items-center ${tx.type === "deposit" ? "text-emerald-500" : "text-red-500"}`}>
                    {tx.type === "deposit" ? (
                      <ArrowDownLeft className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    )}
                    <span className="capitalize">{tx.type}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="text-sm">{tx.asset}</div>
                  <div className="text-xs text-gray-500">{tx.symbol}</div>
                </td>
                <td className="py-3 text-right font-medium">
                  {tx.amount} {tx.symbol}
                </td>
                <td className="py-3 text-right">{tx.value}</td>
                <td className="py-3 text-right">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      tx.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {tx.status === "completed" ? "Completed" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No transactions found</p>
        </div>
      )}
    </div>
  )
}
