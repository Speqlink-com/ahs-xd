import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/actions/finance";
import { getExecutionStats, getExecutionLogs } from "@/actions/execution";
import { getOpsStats, getOperations } from "@/actions/operations";
import { OpsKpiCards } from "@/components/ops/ops-kpi-cards";
import { OpsCharts } from "@/components/ops/ops-charts";
import { ExecutionForm } from "@/components/ops/execution-form";
import { ExecutionTable } from "@/components/ops/execution-table";
import { OpsForm } from "@/components/ops/ops-form";
import { OpsTable } from "@/components/ops/ops-table";
import { getInvestorDirectory } from "@/actions/investors";
import { InvestorDirectory } from "@/components/investors/investor-directory";

type SearchParams = Promise<{ tab?: string; q?: string; status?: string; wave?: string; manager?: string; priority?: string; sort?: string; page?: string }>;

export default async function OpsDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "ops", "sales"].includes(session.role)
  ) {
    redirect("/login");
  }

  const params = await searchParams;
  const { tab = "overview" } = params;
  if (tab === "investors") {
    const directory = await getInvestorDirectory(params);
    return <InvestorDirectory data={directory} filters={params} basePath="/dashboard/ops" canEdit={session.role === "ops" || session.role === "superadmin"} canConfigure={session.role === "superadmin"} />;
  }
  const canEdit = ["superadmin", "admin", "ops"].includes(session.role);

  const [execStats, opsStats, financeData] = await Promise.all([
    getExecutionStats(),
    getOpsStats(),
    getFinanceData("all"),
  ]);

  if (tab === "execution") {
    const logs = await getExecutionLogs("month");
    return (
      <div className="workspace-page">
        <div className="workspace-header">
          <div>
            <h1 className="workspace-title">
              Execution Log
            </h1>
            <p className="workspace-description">
              Daily activity tracking
            </p>
          </div>
        </div>
        {canEdit && <ExecutionForm />}
        <ExecutionTable
          logs={logs}
          currency={financeData.config.currency}
          canEdit={canEdit}
        />
      </div>
    );
  }

  if (tab === "deals") {
    const operations = await getOperations();
    return (
      <div className="workspace-page">
        <div className="workspace-header">
          <div>
            <h1 className="workspace-title">Deals & Operations</h1>
            <p className="workspace-description">
              SafeSport · ResultShield
            </p>
          </div>
          {canEdit && <OpsForm />}
        </div>
        <OpsTable
          operations={operations}
          currency={financeData.config.currency}
          canEdit={canEdit}
        />
      </div>
    );
  }

  // Overview
  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">Operations</h1>
          <p className="workspace-description">
            Execution · Pipeline · Performance
          </p>
        </div>
        {canEdit && <OpsForm />}
      </div>

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
  );
}
