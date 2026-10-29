import { ThemeToggle } from "@/components/theme_switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-[minmax(300px,42%)_1fr]">
      <aside className="auth-brand-surface hidden min-h-screen flex-col justify-between border-r border-border px-10 py-10 lg:flex xl:px-16">
        <p className="font-realce text-sm uppercase tracking-[0.16em]">AHS-XD</p>
        <div className="max-w-md">
          <div className="mb-8 h-1 w-12 bg-primary" />
          <p className="text-3xl font-semibold leading-tight tracking-tight">A clear view of the work that matters.</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Finance, operations and executive decisions in one connected workspace.</p>
        </div>
        <p className="text-xs text-muted-foreground">Ayot Health Solutions · Executive workspace</p>
      </aside>
      <div className="auth-form-surface relative flex min-h-screen flex-col">
        <div className="flex justify-end px-5 py-5"><ThemeToggle /></div>
        <main className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
