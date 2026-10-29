import * as React from "react";
import { cn } from "@/lib/utils";

export function MetricStrip({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-2 divide-x divide-border border-y border-border lg:grid-cols-4", className)} {...props} />;
}

export function MetricItem({ label, value, detail, icon: Icon, className, valueClassName }: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  valueClassName?: string;
}) {
  return <div className={cn("flex min-w-0 flex-col justify-center gap-1 px-4 py-4 first:pl-0 last:pr-0", className)}>
    <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">{Icon && <Icon aria-hidden="true" className="size-3.5" />}<span>{label}</span></div>
    <div className={cn("text-xl font-semibold tracking-tight text-foreground tabular-nums md:text-2xl", valueClassName)}>{value}</div>
    {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
  </div>;
}
