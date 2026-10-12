import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Activity, BookOpen, FileJson, GitBranch, LayoutDashboard, Menu, Radio, Search, Wrench, Boxes, Network, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview / Lab Guide", icon: LayoutDashboard },
  { to: "/explorer", label: "Trace Explorer", icon: Search },
  { to: "/lte", label: "LTE / EPC Attach", icon: Radio },
  { to: "/5g-sa", label: "5G SA Registration", icon: Network },
  { to: "/pfcp", label: "PFCP Analysis", icon: Boxes },
  { to: "/timeline", label: "Procedure Timeline", icon: GitBranch },
  { to: "/troubleshooting", label: "Troubleshooting", icon: Wrench },
  { to: "/glossary", label: "Learning Notes", icon: BookOpen },
  { to: "/import", label: "Import Trace", icon: FileJson },
  { to: "/architecture", label: "README / Architecture", icon: FileText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Signaling Analysis Lab</p>
            <p className="font-mono text-[10px] text-muted-foreground">LTE / 5G SA · v0.1</p>
          </div>
        </div>
        <nav className="p-2" aria-label="Lab sections">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: true }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </Link>
          ))}
        </nav>
        <p className="absolute bottom-3 px-4 text-[10px] text-muted-foreground">
          Educational workbench. No live network connectivity. Not a standards validator.
        </p>
      </aside>
      {open && <button aria-label="Close menu" className="fixed inset-0 z-20 bg-background/70 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-2 backdrop-blur lg:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded p-1 hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">Signaling Analysis Lab</span>
        </div>
        <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
