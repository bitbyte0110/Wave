import StatsOverview from "@/components/dashboard/stats-overview"
import LiveMarketTable from "@/components/dashboard/live-market-table"
import PortfolioAllocation from "@/components/dashboard/portfolio-allocation"

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6 bg-background space-y-6">
      <StatsOverview />
      <LiveMarketTable />
      <PortfolioAllocation />
    </div>
  )
}
