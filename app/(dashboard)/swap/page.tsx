"use client"

import { ArrowLeftRight, Sparkles } from "lucide-react"
import InstantSwap from "@/components/wallet/instant-swap"

export default function SwapPage() {
  return (
    <div className="p-4 md:p-6 bg-background space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-emerald-500/10 rounded-2xl p-2.5 mr-3.5 border border-emerald-500/20">
            <ArrowLeftRight className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Instant Swap</span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </h1>
            <p className="text-muted-foreground text-xs">
              Guaranteed exchange rates powered by Wave Swap Engine & Async AI Risk Audit
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <InstantSwap />
      </div>
    </div>
  )
}
