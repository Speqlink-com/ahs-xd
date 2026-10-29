"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRightLeft, Flame } from "lucide-react";
import { FinanceCharts } from "./finance-charts";
import { AddTransaction } from "./add-transaction";
import { WalletCards } from "./wallet-cards";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";

function fmt(n: number, currency = "KES") {
  return `${currency} ${Math.abs(n).toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  negative,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
  gradient: string;
  negative?: boolean;
}) {
  return <MetricItem label={label} value={value} detail={sub} icon={Icon} valueClassName={negative ? "text-destructive" : undefined} />;
}

export function FinanceOverview({
  data,
  canAdmin,
  canTransfer = false,
}: {
  data: any;
  canAdmin: boolean;
  canTransfer?: boolean;
}) {
  const { kpi, monthlyTrend, categoryBreakdown, config } = data;
  const isNeg = kpi.netCashFlow < 0;

  return (
    <div className="workspace-page">
      {/* Header */}

      <MetricStrip>
        <StatCard
          label="Revenue"
          value={fmt(kpi.revenue, config.currency)}
          icon={TrendingUp}
          iconClass="bg-primary/20 text-primary"
          gradient="bg-linear-to-br from-primary/10 via-primary/5 to-transparent"
        />
        <StatCard
          label="Expenses"
          value={fmt(kpi.expenses, config.currency)}
          icon={TrendingDown}
          iconClass="bg-red-500/20 text-red-400"
          gradient="bg-linear-to-br from-red-500/10 via-red-500/5 to-transparent"
        />
        <StatCard
          label="Net Cash Flow"
          value={`${isNeg ? "−" : "+"}${fmt(kpi.netCashFlow, config.currency)}`}
          icon={ArrowRightLeft}
          iconClass={
            isNeg
              ? "bg-red-500/20 text-red-400"
              : "bg-emerald-500/20 text-emerald-400"
          }
          gradient={
            isNeg
              ? "bg-linear-to-br from-red-500/10 via-red-500/5 to-transparent"
              : "bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent"
          }
          negative={isNeg}
        />
        <StatCard
          label="Monthly Burn"
          value={fmt(kpi.monthlyBurn, config.currency)}
          sub="avg / month"
          icon={Flame}
          iconClass="bg-orange-500/20 text-orange-400"
          gradient="bg-linear-to-br from-orange-500/10 via-orange-500/5 to-transparent"
        />
      </MetricStrip>
      {/* Wallet gauges */}
      <WalletCards
        primaryBalance={kpi.primaryBalance}
        profitBalance={kpi.profitBalance}
        primaryGauge={kpi.primaryGauge}
        profitGauge={kpi.profitGauge}
        currency={config.currency}
        canTransfer={canTransfer}
      />
      {/* Charts */}
      <FinanceCharts
        monthlyTrend={monthlyTrend}
        categoryBreakdown={categoryBreakdown}
        serviceBreakdown={data.serviceBreakdown}
        currency={config.currency}
      />
    </div>
  );
}
