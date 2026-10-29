"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InvestorForm } from "./investor-form";

type Options = { statuses: string[]; waves: string[]; managers: { _id: string; name: string }[] };
type Investor = Parameters<typeof InvestorForm>[0]["initial"];
export function InvestorProfileEditor({ investor, options }: { investor: NonNullable<Investor>; options: Options }) {
  const [open, setOpen] = useState(false);
  return <><Button variant="outline" size="sm" onClick={() => setOpen(true)}>Edit profile</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit investor profile</DialogTitle></DialogHeader><InvestorForm initial={investor} options={options} onSaved={() => setOpen(false)} /></DialogContent></Dialog></>;
}
