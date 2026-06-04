import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  CreditCard,
  ShieldAlert,
  ChevronRight,
  FlaskConical,
  Bot,
  Map,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Collateral Portfolio", icon: Building2 },
  { href: "/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/loans", label: "Loan Applications", icon: CreditCard },
  { href: "/alerts", label: "Fraud & Risk Alerts", icon: ShieldAlert },
  { href: "/geo-intelligence", label: "Geo Intelligence", icon: Map },
  { href: "/stress-simulator", label: "Stress Simulator", icon: FlaskConical },
  { href: "/ai-copilot", label: "AI Copilot", icon: Bot },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">C</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-sidebar-foreground tracking-tight">CollateralOS</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Intelligence Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors group",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                <span className="flex-1 truncate">{label}</span>
                {active && <ChevronRight className="w-3 h-3 text-primary opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="text-[10px] text-muted-foreground">CollateralOS v1.0</div>
          <div className="text-[10px] text-muted-foreground/60">AI-Native Risk Intelligence</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
