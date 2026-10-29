import { getUsers, getUserStats } from "@/actions/users";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserManagement } from "@/components/dashboard";
import { UserMetrics } from "@/components/dashboard/user-metrics";

export default async function SuperAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/dashboard");

  const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <div><h1 className="workspace-title">
          User Management
        </h1>
        <p className="workspace-description">
          Manage system users, roles and access
        </p></div>
      </div>
      <UserMetrics stats={stats} />
      <UserManagement users={users} currentUserId={session.userId} />
    </div>
  );
}
