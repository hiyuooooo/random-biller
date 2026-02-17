import "./global.css";
import React from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccountProvider } from "@/components/AccountManager";
import { BillProvider } from "@/components/BillContext";
import { StockProvider } from "@/components/StockContext";
import { TransactionProvider } from "@/components/TransactionContext";
import { CustomerProvider } from "@/components/CustomerContext";
import { IterationMonitorProvider } from "@/components/IterationMonitor";
import { useState } from "react";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Bills from "./pages/Bills";
import BillBlocker from "./pages/BillBlocker";
import Stock from "./pages/Stock";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import DataManagement from "./pages/DataManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user was previously logged in, default to true for development
    const savedLoginState = localStorage.getItem("isLoggedIn");
    return savedLoginState === "true" || savedLoginState === null; // Default to logged in if no state exists
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccountProvider>
          <CustomerProvider>
            <StockProvider>
              <TransactionProvider>
                <IterationMonitorProvider>
                  <BillProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      {!isLoggedIn ? (
                        <Login onLogin={handleLogin} />
                      ) : (
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route
                            path="/transactions"
                            element={<Transactions />}
                          />
                          <Route path="/bills" element={<Bills />} />
                          <Route
                            path="/bill-blocker"
                            element={<BillBlocker />}
                          />
                          <Route path="/stock" element={<Stock />} />
                          <Route path="/customers" element={<Customers />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route
                            path="/data-management"
                            element={<DataManagement />}
                          />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      )}
                    </BrowserRouter>
                  </BillProvider>
                </IterationMonitorProvider>
              </TransactionProvider>
            </StockProvider>
          </CustomerProvider>
        </AccountProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const container = document.getElementById("root")!;

// Create root only once and store it globally to avoid recreation
if (!(window as any).__reactRoot) {
  (window as any).__reactRoot = createRoot(container);
}

// Ensure we only render once
if (!(window as any).__appMounted) {
  (window as any).__appMounted = true;
  (window as any).__reactRoot.render(<App />);
}
