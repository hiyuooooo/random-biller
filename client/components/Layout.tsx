import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Shield,
  LogOut,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "./AccountManager";
import { Button } from "./ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Bills", href: "/bills", icon: FileText },
  { name: "Bill Blocker", href: "/bill-blocker", icon: Shield },
  { name: "Stock Management", href: "/stock", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Data Management", href: "/data-management", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { activeAccount } = useAccount();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                BillMaster Pro
              </h1>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {activeAccount?.name || "No Account Selected"}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card">
          <nav className="flex flex-col space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
