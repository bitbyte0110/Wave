import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react"

export default function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "deposit",
      asset: "Bitcoin",
      symbol: "BTC",
      amount: "+0.0235",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "withdraw",
      asset: "Ethereum",
      symbol: "ETH",
      amount: "-1.5000",
      time: "5 hours ago",
    },
    {
      id: 3,
      type: "deposit",
      asset: "Litecoin",
      symbol: "LTC",
      amount: "+5.0000",
      time: "Yesterday",
    },
  ]

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-bold mb-4">Recent Activity</h2>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
            <div className="flex items-center">
              <div className={`rounded-full p-2 mr-3 ${activity.type === "deposit" ? "bg-emerald-100" : "bg-red-100"}`}>
                {activity.type === "deposit" ? (
                  <ArrowDownLeft className={`h-4 w-4 text-emerald-600`} />
                ) : (
                  <ArrowUpRight className={`h-4 w-4 text-red-600`} />
                )}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {activity.type === "deposit" ? "Received" : "Sent"} {activity.symbol}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.time}
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${activity.type === "deposit" ? "text-emerald-600" : "text-red-600"}`}>
              {activity.amount}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-center text-sm text-emerald-600 hover:text-emerald-700">
        View All Activity
      </button>
    </div>
  )
}
