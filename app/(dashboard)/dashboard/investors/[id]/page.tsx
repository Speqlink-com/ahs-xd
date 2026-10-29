import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getInvestor, getInvestorDirectory, getInvestorOptions } from "@/actions/investors";
import { InvestorRefresh } from "@/components/investors/investor-refresh";
import { InvestorActivityForm } from "@/components/investors/investor-activity-form";
import { InvestorProfileEditor } from "@/components/investors/investor-profile-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const format = (value?: string | null) => value ? new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "—";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };

export default async function InvestorDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { from } = await searchParams;
  const session = await getSession();
  if (!session || !["superadmin", "admin", "ops"].includes(session.role)) notFound();
  const investor = await getInvestor(id);
  if (!investor) notFound();
  const canEdit = ["superadmin", "ops"].includes(session.role);
  const fallback = session.role === "ops" ? "/dashboard/ops?tab=investors" : "/dashboard/ceo?tab=investors";
  const allowedFrom = from && (from.startsWith("/dashboard/ceo?tab=investors") || (session.role !== "admin" && from.startsWith("/dashboard/ops?tab=investors"))) ? from : fallback;
  const listUrl = new URL(allowedFrom, "http://local.invalid");
  const filters = Object.fromEntries(listUrl.searchParams);
  const [options, directory] = await Promise.all([getInvestorOptions(), getInvestorDirectory(filters)]);
  const position = directory.investors.findIndex((row) => String(row._id) === id);
  const [previousPage, nextPage] = await Promise.all([
    position === 0 && directory.page > 1 ? getInvestorDirectory({ ...filters, page: String(directory.page - 1) }) : Promise.resolve(null),
    position === directory.investors.length - 1 && directory.page < directory.pageCount ? getInvestorDirectory({ ...filters, page: String(directory.page + 1) }) : Promise.resolve(null),
  ]);
  const profileLink = (investorId: string, page: number) => {
    const returnUrl = new URL(allowedFrom, "http://local.invalid");
    returnUrl.searchParams.set("page", String(page));
    return `/dashboard/investors/${investorId}?from=${encodeURIComponent(returnUrl.pathname + returnUrl.search)}`;
  };
  const previousRecord = position > 0 ? directory.investors[position - 1] : previousPage?.investors.at(-1);
  const nextRecord = position >= 0 && position < directory.investors.length - 1 ? directory.investors[position + 1] : nextPage?.investors[0];
  const previous = previousRecord ? profileLink(previousRecord._id, position > 0 ? directory.page : directory.page - 1) : null;
  const next = nextRecord ? profileLink(nextRecord._id, position < directory.investors.length - 1 ? directory.page : directory.page + 1) : null;
  const events = [...investor.events].reverse();
  return <div className="space-y-6"><InvestorRefresh /><div className="flex flex-wrap items-center justify-between gap-3"><div><Link className="text-sm text-primary hover:underline" href={allowedFrom}>← Back to All Investors</Link><h1 className="mt-2 font-realce text-2xl font-semibold">{investor.name}</h1><p className="text-sm text-muted-foreground">{investor.organization || "Organization not recorded"}</p></div><div className="flex gap-2">{previous && <Button asChild variant="outline" size="sm"><Link href={previous}>Previous investor</Link></Button>}{next && <Button asChild variant="outline" size="sm"><Link href={next}>Next investor</Link></Button>}{canEdit && <InvestorProfileEditor investor={investor} options={options} />}</div></div>
    <section aria-label="Investor profile" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[
      ["Current status", investor.status], ["Engagement wave", investor.wave], ["Priority", investor.priority], ["Relationship manager", investor.manager?.name ?? "Unassigned"], ["Contact email", investor.contactEmail || "—"], ["Contact phone", investor.contactPhone || "—"], ["Investment focus", investor.investmentFocus || "—"], ["Last contacted", format(investor.lastContacted)], ["Next follow-up", format(investor.nextFollowUp)], ["Next planned action", investor.nextAction || "—"], ["Last updated", format(investor.updatedAt)], ["Last updated by", investor.lastUpdatedByName]
    ].map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium">{value}</p></div>)}</section>
    <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Notes and discussion outcomes</h2><p className="mt-2 whitespace-pre-wrap text-sm">{investor.notes || "No notes recorded."}</p></section>
    <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Complete engagement history</h2><p className="text-xs text-muted-foreground">Status changes, calls, correspondence, meetings, follow-ups, notes and opportunities are preserved as events.</p><ol className="mt-4 space-y-3">{events.map((event, index) => <li key={String(event._id ?? index)} className="border-l-2 border-primary/40 pl-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{event.kind}{event.meetingStage ? ` · ${event.meetingStage}` : ""}</Badge><time className="text-xs text-muted-foreground">{format(event.at)}</time><span className="text-xs text-muted-foreground">by {event.actorName}</span></div>{event.kind === "status" && <p className="mt-1 text-sm">{event.previousStatus} → {event.newStatus}</p>}{event.kind === "created" && <p className="mt-1 text-sm">Initial status: {event.newStatus}</p>}{event.remarks && <p className="mt-1 whitespace-pre-wrap text-sm">{event.remarks}</p>}{event.outcome && <p className="text-sm">Outcome: {event.outcome}</p>}{event.scheduledFor && <p className="text-sm">Scheduled: {format(event.scheduledFor)}</p>}</li>)}{events.length === 0 && <li className="text-sm text-muted-foreground">No engagement events recorded.</li>}</ol></section>
    {canEdit && <InvestorActivityForm id={id} />}
  </div>;
}
