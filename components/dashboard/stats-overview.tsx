import { TrendingUp, TrendingDown } from "lucide-react"

const stats = [
  {
    label: "Global Market Cap",
    value: "$2.14T",
    change: "+2.3%",
    caption: "vs yesterday",
    up: true,
  },
  {
    label: "24h Trade Volume",
    value: "$84.5B",
    change: "-1.2%",
    caption: "vs yesterday",
    up: false,
  },
  {
    label: "Bitcoin Dominance",
    value: "42.1%",
    change: "+0.5%",
    caption: "market share",
    up: true,
  },
]

export default function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-sm"
        >
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1.5">{stat.value}</h3>
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs mt-3 font-semibold ${
              stat.up ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {stat.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {stat.change} <span className="text-muted-foreground font-normal">{stat.caption}</span>
          </div>
        </div>
      ))}

      {/* Highlighted balance card */}
      <div className="bg-primary/5 border border-primary/30 rounded-lg p-5 flex flex-col justify-between shadow-sm">
        <div>
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Your Balance</p>
          <h3 className="text-2xl font-bold mt-1.5">$12,500.00</h3>
        </div>
        <div className="flex items-center justify-between text-xs mt-3 font-medium text-muted-foreground">
          <span>Includes 2.1005 BTC</span>
          <span className="bg-primary/15 text-primary px-2 py-0.5 rounded text-[10px] font-semibold">USDC</span>
        </div>
      </div>
    </div>
  )
}
