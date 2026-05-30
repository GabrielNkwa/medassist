import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Stethoscope, 
  Pill, 
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Radiology AI", href: "/radiology", icon: Activity },
  { name: "Symptom Checker", href: "/symptoms", icon: Stethoscope },
  { name: "Dose Calculator", href: "/dosage", icon: Pill },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-sidebar flex flex-col">
        <div className="h-14 flex items-center px-4 border-b">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg tracking-tight">
            <Activity className="h-5 w-5" />
            MedAssist
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Clinical Modules
            </div>
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <h1 className="text-sm font-medium text-foreground">
            {navigation.find((item) => item.href === location)?.name || "MedAssist"}
          </h1>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
              Dr
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
