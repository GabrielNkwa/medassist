import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Stethoscope, 
  Pill, 
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Radiology AI", href: "/radiology", icon: Activity },
  { name: "Symptom Checker", href: "/symptoms", icon: Stethoscope },
  { name: "Dose Calculator", href: "/dosage", icon: Pill },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when location changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-sidebar">
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
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/20 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent/20 hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
            location === "/settings"
              ? "bg-primary/20 text-primary border-l-2 border-primary"
              : "text-muted-foreground hover:bg-accent/20 hover:text-accent-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent/20 hover:text-accent-foreground transition-colors">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:relative z-50 w-72 md:w-64 h-full transition-transform duration-300 border-r bg-sidebar",
        isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
      )}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-md transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-sm md:text-base font-medium text-foreground">
              {location === "/settings" ? "Settings" : navigation.find((item) => item.href === location)?.name || "MedAssist"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-md transition-colors">
              <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              Dr
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
