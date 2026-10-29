"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInvestor, updateInvestor } from "@/actions/investors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Options = { statuses: string[]; waves: string[]; managers: { _id: string; name: string }[] };
type Initial = { _id: string; name: string; organization: string; wave: string; status: string; priority: string; manager?: { _id: string } | null; contactEmail: string; contactPhone: string; investmentFocus: string; notes: string; nextAction: string; nextFollowUp?: string | null; lastContacted?: string | null };
const dateValue = (date?: string | null) => date ? new Date(date).toISOString().slice(0, 10) : "";

export function InvestorForm({ options, initial, onSaved }: { options: Options; initial?: Initial; onSaved?: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(initial ? updateInvestor : createInvestor, undefined);
  useEffect(() => { if (state?.success) { router.refresh(); onSaved?.(); } }, [state?.success, router, onSaved]);
  return <form action={action} className="grid gap-4 sm:grid-cols-2 max-h-[70vh] overflow-y-auto pr-1">
    {initial && <input type="hidden" name="id" value={initial._id} />}
    <div className="space-y-1"><Label htmlFor="investor-name">Investor name</Label><Input id="investor-name" name="name" defaultValue={initial?.name} required maxLength={160} /></div>
    <div className="space-y-1"><Label htmlFor="investor-organization">Organization</Label><Input id="investor-organization" name="organization" defaultValue={initial?.organization} maxLength={160} /></div>
    <div className="space-y-1"><Label htmlFor="investor-wave">Engagement wave</Label><select id="investor-wave" name="wave" defaultValue={initial?.wave ?? options.waves[0]} className="w-full h-9 rounded-md border bg-background px-3 text-sm">{options.waves.map((wave) => <option key={wave}>{wave}</option>)}</select></div>
    {!initial && <div className="space-y-1"><Label htmlFor="investor-status">Initial status</Label><select id="investor-status" name="status" defaultValue={options.statuses[0]} className="w-full h-9 rounded-md border bg-background px-3 text-sm">{options.statuses.map((status) => <option key={status}>{status}</option>)}</select></div>}
    <div className="space-y-1"><Label htmlFor="investor-priority">Priority</Label><select id="investor-priority" name="priority" defaultValue={initial?.priority ?? "Medium"} className="w-full h-9 rounded-md border bg-background px-3 text-sm">{["Low", "Medium", "High"].map((priority) => <option key={priority}>{priority}</option>)}</select></div>
    <div className="space-y-1"><Label htmlFor="investor-manager">Relationship manager</Label><select id="investor-manager" name="manager" defaultValue={initial?.manager?._id ?? ""} className="w-full h-9 rounded-md border bg-background px-3 text-sm"><option value="">Unassigned</option>{options.managers.map((manager) => <option value={manager._id} key={manager._id}>{manager.name}</option>)}</select></div>
    <div className="space-y-1"><Label htmlFor="investor-email">Contact email</Label><Input id="investor-email" name="contactEmail" type="email" defaultValue={initial?.contactEmail} /></div>
    <div className="space-y-1"><Label htmlFor="investor-phone">Contact phone</Label><Input id="investor-phone" name="contactPhone" defaultValue={initial?.contactPhone} /></div>
    <div className="space-y-1"><Label htmlFor="investor-last">Last contacted</Label><Input id="investor-last" name="lastContacted" type="date" defaultValue={dateValue(initial?.lastContacted)} /></div>
    <div className="space-y-1"><Label htmlFor="investor-followup">Next follow-up</Label><Input id="investor-followup" name="nextFollowUp" type="date" defaultValue={dateValue(initial?.nextFollowUp)} /></div>
    <div className="space-y-1 sm:col-span-2"><Label htmlFor="investor-focus">Investment focus</Label><Input id="investor-focus" name="investmentFocus" defaultValue={initial?.investmentFocus} /></div>
    <div className="space-y-1 sm:col-span-2"><Label htmlFor="investor-next">Next planned action</Label><Input id="investor-next" name="nextAction" defaultValue={initial?.nextAction} /></div>
    <div className="space-y-1 sm:col-span-2"><Label htmlFor="investor-notes">Notes and discussion outcomes</Label><Textarea id="investor-notes" name="notes" defaultValue={initial?.notes} rows={3} /></div>
    <div className="sm:col-span-2 flex items-center justify-between gap-3"><p role="status" className="text-sm text-destructive">{state && !state.success ? state.message : ""}</p><Button type="submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save changes" : "Add investor"}</Button></div>
  </form>;
}
