import React, { useState } from "react";
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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount, AccountSelector } from "./AccountManager";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";

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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [logoutStep, setLogoutStep] = useState(1);
  const [deleteCurrentAccountData, setDeleteCurrentAccountData] =
    useState(false);
  const [deleteAllAccountsData, setDeleteAllAccountsData] = useState(false);

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
    setLogoutStep(1);
  };

  const confirmLogout = () => {
    if (logoutStep === 1) {
      setLogoutStep(2);
      return;
    }

    // Handle data deletion based on user choices
    if (deleteCurrentAccountData && activeAccount) {
      try {
        const keysToRemove = [
          `bills_${activeAccount.id}`,
          `transactions_${activeAccount.id}`,
          `stockItems_${activeAccount.id}`,
          `billBlocker_startingNumber_${activeAccount.id}`,
          `billBlocker_blockedNumbers_${activeAccount.id}`,
        ];

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });

        console.log(`Deleted all data for account: ${activeAccount.name}`);
      } catch (error) {
        console.warn("Failed to delete current account data:", error);
      }
    }

    if (deleteAllAccountsData) {
      try {
        // Get all accounts and delete their data
        const accountsString = localStorage.getItem("accounts");
        if (accountsString) {
          const accounts = JSON.parse(accountsString);
          accounts.forEach((account: any) => {
            const keysToRemove = [
              `bills_${account.id}`,
              `transactions_${account.id}`,
              `stockItems_${account.id}`,
              `billBlocker_startingNumber_${account.id}`,
              `billBlocker_blockedNumbers_${account.id}`,
            ];

            keysToRemove.forEach((key) => {
              localStorage.removeItem(key);
            });
          });
        }

        // Also remove account settings
        localStorage.removeItem("accounts");
        localStorage.removeItem("activeAccount");

        console.log("Deleted all data for all accounts");
      } catch (error) {
        console.warn("Failed to delete all accounts data:", error);
      }
    }

    // Always remove login state
    localStorage.removeItem("isLoggedIn");

    // Close dialog and reload
    setIsLogoutDialogOpen(false);
    window.location.reload();
  };

  const cancelLogout = () => {
    setIsLogoutDialogOpen(false);
    setLogoutStep(1);
    setDeleteCurrentAccountData(false);
    setDeleteAllAccountsData(false);
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
            {activeAccount && (
              <div className="flex items-center space-x-4">
                <AccountSelector />
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Active:</span>
                  <span className="font-medium text-foreground">
                    {activeAccount.name}
                  </span>
                </div>
              </div>
            )}
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <LogOut className="h-5 w-5" />
              <span>
                {logoutStep === 1 ? "Confirm Logout" : "Data Deletion Options"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {logoutStep === 1
                ? "Are you sure you want to logout from BillMaster Pro?"
                : "Choose what data to delete before logging out (optional)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {logoutStep === 1 && (
              <>
                <div className="text-sm text-muted-foreground">
                  You are currently logged in as{" "}
                  <strong>{activeAccount?.name}</strong>. Your data will be
                  preserved unless you choose to delete it in the next step.
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You will have the option to delete account data in the next
                    step if needed.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {logoutStep === 2 && (
              <>
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Warning:</strong> Data deletion is permanent and
                    cannot be undone. Only select these options if you want to
                    completely remove data.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="delete-current"
                      checked={deleteCurrentAccountData}
                      onCheckedChange={(checked) =>
                        setDeleteCurrentAccountData(checked as boolean)
                      }
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="delete-current"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Delete current account data ({activeAccount?.name})
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Removes all bills, transactions, and stock data for the
                        current account only
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="delete-all"
                      checked={deleteAllAccountsData}
                      onCheckedChange={(checked) =>
                        setDeleteAllAccountsData(checked as boolean)
                      }
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="delete-all"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Delete ALL accounts and data
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Removes all accounts, settings, and data from this
                        application completely
                      </p>
                    </div>
                  </div>

                  {(deleteCurrentAccountData || deleteAllAccountsData) && (
                    <Alert className="border-red-200 bg-red-50">
                      <Trash2 className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>This action cannot be undone!</strong> Make sure
                        you have backups if needed.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelLogout}>
              Cancel
            </Button>
            <Button
              onClick={confirmLogout}
              variant={
                logoutStep === 2 &&
                (deleteCurrentAccountData || deleteAllAccountsData)
                  ? "destructive"
                  : "default"
              }
            >
              {logoutStep === 1 ? (
                "Continue"
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  {deleteCurrentAccountData || deleteAllAccountsData
                    ? "Delete & Logout"
                    : "Logout"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
