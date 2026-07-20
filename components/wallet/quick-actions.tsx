import { ArrowDownLeft, ArrowUpRight, RefreshCw, Send } from "lucide-react"

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-bold mb-4">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <div className="bg-emerald-100 rounded-full p-2 mb-2">
            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium">Deposit</span>
        </button>

        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <div className="bg-red-100 rounded-full p-2 mb-2">
            <ArrowUpRight className="h-5 w-5 text-red-600" />
          </div>
          <span className="text-sm font-medium">Withdraw</span>
        </button>

        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <div className="bg-blue-100 rounded-full p-2 mb-2">
            <Send className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium">Transfer</span>
        </button>

        <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
          <div className="bg-purple-100 rounded-full p-2 mb-2">
            <RefreshCw className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-sm font-medium">Convert</span>
        </button>
      </div>
    </div>
  )
}
