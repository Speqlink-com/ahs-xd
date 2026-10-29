"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addInvestorActivity } from "@/actions/investors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function InvestorActivityForm({ id }: { id: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addInvestorActivity, undefined);
  useEffect(() => { if (state?.success) router.refresh(); }, [state?.success, router]);
  return <form action={action} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2"><input type="hidden" name="id" value={id} /><h2 className="font-semibold sm:col-span-2">Record engagement activity</h2><div><Label htmlFor="activity-kind">Activity type</Label><select name="kind" id="activity-kind" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">{["call", "correspondence", "meeting", "follow-up", "note", "opportunity"].map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></div><div><Label htmlFor="activity-stage">Meeting stage</Label><select name="meetingStage" id="activity-stage" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="scheduled">Scheduled</option><option value="completed">Completed</option></select></div><div><Label htmlFor="activity-date">Scheduled date, if applicable</Label><Input id="activity-date" name="scheduledFor" type="datetime-local" /></div><div className="sm:col-span-2"><Label htmlFor="activity-remarks">Details</Label><Textarea id="activity-remarks" name="remarks" required rows={3} /></div><div className="sm:col-span-2"><Label htmlFor="activity-outcome">Outcome</Label><Input id="activity-outcome" name="outcome" /></div><div className="flex items-center justify-between sm:col-span-2"><p role="status" className="text-sm">{state?.message}</p><Button disabled={pending}>{pending ? "Saving…" : "Record activity"}</Button></div></form>;
}
