import { AddTransaction } from "./add-transaction";
import { TransactionTable } from "./transaction-table";
import { FinanceCharts } from "./finance-charts";

export function FinanceExpenses({
  data,
  canAdmin,
}: {
  data: any;
  canAdmin: boolean;
}) {
  const { transactions, monthlyTrend, categoryBreakdown, config } = data;

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <div>
          <h1 className="workspace-title">Expenses</h1>
          <p className="workspace-description">
            All transactions · filter, search and manage
          </p>
        </div>
        {canAdmin && (
          <AddTransaction
            primaryBalance={data.kpi.primaryBalance}
            profitBalance={data.kpi.profitBalance}
            currency={data.config.currency}
          />
        )}
      </div>

      {/* Expense donut + category bar */}
      <div className="workspace-section">
        <div>
          <FinanceCharts
            monthlyTrend={monthlyTrend}
            categoryBreakdown={categoryBreakdown}
            serviceBreakdown={data.serviceBreakdown}
            currency={config.currency}
          />
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        currency={config.currency}
        canDelete={canAdmin}
      />
    </div>
  );
}
