"use client";

import { useRouter, usePathname } from "next/navigation";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { OpsKpiCards } from "@/components/ops/ops-kpi-cards";
import { OpsCharts } from "@/components/ops/ops-charts";
import { BarChart2, Wallet } from "lucide-react";

export function CeoOverview({
  financeData,
  execStats,
  opsStats,
  activeView,
}: {
  financeData: any;
  execStats: any;
  opsStats: any;
  activeView: "finance" | "ops";
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setView(v: "finance" | "ops") {
    router.push(`${pathname}?view=${v}`);
  }

  return (
    <div className="workspace-page">
      {/* Header + toggle */}
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">CEO Overview</h1>
          <p className="workspace-description">
            Real-time execution, finance and operations intelligence
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/60 p-1">
          <button
            onClick={() => setView("finance")}
            className={`flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
              activeView === "finance"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Finance
          </button>
          <button
            onClick={() => setView("ops")}
            className={`flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
              activeView === "ops"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Operations
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === "finance" ? (
        <FinanceOverview
          data={financeData}
          canAdmin={false}
          canTransfer={false}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <OpsKpiCards
            execStats={execStats}
            opsStats={opsStats}
            currency={financeData.config.currency}
          />
          <OpsCharts
            execStats={execStats}
            opsStats={opsStats}
            currency={financeData.config.currency}
          />
        </div>
      )}
    </div>
  );
}
