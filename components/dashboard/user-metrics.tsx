"use client";

import { useState } from "react";
import { Users, UserCheck, UserX, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm } from "@/components/dashboard/user-form";
import { MetricItem, MetricStrip } from "@/components/ui/metric-strip";

type Stats = {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  byRole: { _id: string; count: number }[];
};

const METRIC_CARDS = [
  {
    key: "total",
    label: "Total users",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "active",
    label: "Active",
    icon: UserCheck,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    key: "suspended",
    label: "Suspended",
    icon: UserX,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    key: "pending",
    label: "Pending setup",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
];

export function UserMetrics({ stats }: { stats: Stats }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MetricStrip>
        {METRIC_CARDS.map((card) => {
          const value = stats[card.key as keyof Stats] as number;
          return (
            <MetricItem key={card.key} label={card.label} value={value} icon={card.icon} valueClassName={card.key === "suspended" && value > 0 ? "text-destructive" : undefined} />
          );
        })}
      </MetricStrip>

      {/* Role breakdown + shortcut */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {stats.byRole.map((r) => (
            <span
              key={r._id}
              className="text-xs px-2 py-1 rounded-sm border border-border bg-card text-muted-foreground capitalize"
            >
              {r._id}{" "}
              <span className="font-semibold text-foreground ml-1">
                {r.count}
              </span>
            </span>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new user</DialogTitle>
          </DialogHeader>
          <UserForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
