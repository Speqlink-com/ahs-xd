import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getFinanceData } from "@/actions/finance";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { FinanceExpenses } from "@/components/finance/finance-expenses";
import { FinanceWallets } from "@/components/finance/finance-wallets";

type SearchParams = Promise<{ tab?: string }>;

export default async function FinancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (
    !session ||
    !["superadmin", "admin", "finance", "sales"].includes(session.role)
  ) {
    redirect("/login");
  }

  const { tab = "overview" } = await searchParams;
  const data = await getFinanceData("all");
  const canAdmin = ["superadmin", "admin", "finance"].includes(session.role);
  const canTransfer = ["superadmin", "finance"].includes(session.role);

  if (tab === "expenses") {
    return <FinanceExpenses data={data} canAdmin={canAdmin} />;
  }
  if (tab === "wallets") {
    return (
      <FinanceWallets
        data={data}
        canAdmin={canAdmin}
        canTransfer={canTransfer}
      />
    );
  }
  return (
    <div className="workspace-page">
      <div className="workspace-header"><div><h1 className="workspace-title">Finance</h1><p className="workspace-description">Revenue, spending and cash position</p></div></div>
      <FinanceOverview data={data} canAdmin={canAdmin} canTransfer={canTransfer} />
    </div>
  );
}
