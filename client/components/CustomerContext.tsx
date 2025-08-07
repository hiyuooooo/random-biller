import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "./AccountManager";

export interface CustomerTransaction {
  id: string;
  date: string;
  amount: number;
  paymentMode: "Cash" | "GPay" | "Bank";
  items: string[];
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  preferredPayment: "Cash" | "GPay" | "Bank";
  totalTransactions: number;
  totalAmount: number;
  lastTransaction: string;
  transactions: CustomerTransaction[];
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, "id">) => void;
  updateCustomer: (id: number, updates: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  addTransactionToCustomer: (
    customerId: number,
    transaction: CustomerTransaction,
  ) => void;
  getCustomerByName: (name: string) => Customer | undefined;
  syncCustomersFromTransactions: (transactions: any[]) => void;
  getCustomerSuggestions: (prefix: string) => Customer[];
}

// Default customer data
const defaultCustomers: Customer[] = [
  {
    id: 1,
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@email.com",
    address: "Harsila Village, Bageshwar",
    preferredPayment: "GPay",
    totalTransactions: 8,
    totalAmount: 3420,
    lastTransaction: "15-01-2024",
    transactions: [
      {
        id: "TXN-001",
        date: "15-01-2024",
        amount: 450,
        paymentMode: "GPay",
        items: ["Rice 1kg", "Oil 1L", "Sugar 1kg"],
      },
      {
        id: "TXN-002",
        date: "12-01-2024",
        amount: 320,
        paymentMode: "GPay",
        items: ["Wheat Flour 1kg", "Tea 250g"],
      },
    ],
  },
  {
    id: 2,
    name: "Priya Sharma",
    phone: "+91 87654 32109",
    email: "priya.sharma@email.com",
    address: "Main Bazaar, Bageshwar",
    preferredPayment: "Cash",
    totalTransactions: 5,
    totalAmount: 1850,
    lastTransaction: "14-01-2024",
    transactions: [
      {
        id: "TXN-003",
        date: "14-01-2024",
        amount: 280,
        paymentMode: "Cash",
        items: ["Rice 2kg", "Dal 1kg"],
      },
    ],
  },
];

const CustomerContext = createContext<CustomerContextType | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { activeAccount } = useAccount();

  // Initialize with empty array and load data in useEffect
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Save to account-specific localStorage whenever customers or activeAccount changes
  useEffect(() => {
    try {
      if (activeAccount) {
        const storageKey = `customers_${activeAccount.id}`;
        localStorage.setItem(storageKey, JSON.stringify(customers));
      }
    } catch (error) {
      console.warn("Failed to save customers to localStorage:", error);
    }
  }, [customers, activeAccount]);

  // Load customers for active account (both initial load and account switch)
  useEffect(() => {
    if (activeAccount) {
      try {
        const storageKey = `customers_${activeAccount.id}`;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedCustomers = JSON.parse(saved);
          if (Array.isArray(parsedCustomers)) {
            // Deduplicate customers by ID and name to prevent duplicate keys
            const uniqueCustomers = parsedCustomers.filter(
              (customer, index, self) =>
                index ===
                self.findIndex(
                  (c) =>
                    c.id === customer.id ||
                    c.name.toLowerCase() === customer.name.toLowerCase(),
                ),
            );
            setCustomers(uniqueCustomers);
          } else {
            setCustomers(defaultCustomers);
          }
        } else {
          // If no data for this account, start with account-specific defaults
          if (activeAccount.id === "2") {
            // Himalaya Traders - different customers
            setCustomers([]);
          } else {
            // Sadhana Agency - default customers
            setCustomers(defaultCustomers);
          }
        }
      } catch {
        if (activeAccount.id === "2") {
          setCustomers([]);
        } else {
          setCustomers(defaultCustomers);
        }
      }
    } else {
      // If no active account, start with empty array
      setCustomers([]);
    }
  }, [activeAccount?.id]);

  // Listen for account switch events to force refresh
  useEffect(() => {
    const handleAccountSwitch = () => {
      console.log(
        "Account switch event detected in CustomerContext, forcing data refresh",
      );
      if (activeAccount) {
        loadAccountData(activeAccount.id);
      }
    };

    const handleForceSave = (event: any) => {
      const accountId = event.detail?.accountId;
      if (accountId && customers.length > 0) {
        try {
          const storageKey = `customers_${accountId}`;
          localStorage.setItem(storageKey, JSON.stringify(customers));
          console.log(
            `Force saved ${customers.length} customers for account ${accountId}`,
          );
        } catch (error) {
          console.error("Error force saving customers:", error);
        }
      }
    };

    const handleLoadAccountData = (event: any) => {
      const accountId = event.detail?.accountId;
      if (accountId) {
        loadAccountData(accountId);
      }
    };

    const loadAccountData = (accountId: string) => {
      try {
        const storageKey = `customers_${accountId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedCustomers = JSON.parse(saved);
          if (Array.isArray(parsedCustomers)) {
            // Deduplicate customers by ID and name to prevent duplicate keys
            const uniqueCustomers = parsedCustomers.filter(
              (customer, index, self) =>
                index ===
                self.findIndex(
                  (c) =>
                    c.id === customer.id ||
                    c.name.toLowerCase() === customer.name.toLowerCase(),
                ),
            );
            setCustomers([...uniqueCustomers]); // Create new array reference to force re-render
            console.log(
              `Force reloaded ${uniqueCustomers.length} unique customers for account ${accountId}`,
            );
          }
        } else {
          if (accountId === "2") {
            setCustomers([]); // Himalaya Traders - empty customers
            console.log(
              `No customers found for account ${accountId}, starting empty`,
            );
          } else {
            setCustomers([...defaultCustomers]); // Sadhana Agency - default customers
            console.log(
              `No customers found for account ${accountId}, loading defaults`,
            );
          }
        }
      } catch (error) {
        console.error("Error force reloading customers:", error);
        if (accountId === "2") {
          setCustomers([]); // Himalaya Traders - empty customers
        } else {
          setCustomers([...defaultCustomers]); // Sadhana Agency - default customers
        }
      }
    };

    window.addEventListener("account-switched", handleAccountSwitch);
    window.addEventListener("force-save-account-data", handleForceSave);
    window.addEventListener("load-account-data", handleLoadAccountData);

    return () => {
      window.removeEventListener("account-switched", handleAccountSwitch);
      window.removeEventListener("force-save-account-data", handleForceSave);
      window.removeEventListener("load-account-data", handleLoadAccountData);
    };
  }, [activeAccount]);

  const addCustomer = (customerData: Omit<Customer, "id">) => {
    setCustomers((prev) => {
      // Generate a unique ID based on existing IDs to avoid conflicts
      const maxId = prev.length > 0 ? Math.max(...prev.map((c) => c.id)) : 0;
      const newCustomer: Customer = {
        ...customerData,
        id: maxId + 1,
      };
      return [...prev, newCustomer];
    });
  };

  const updateCustomer = (id: number, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id ? { ...customer, ...updates } : customer,
      ),
    );
  };

  const deleteCustomer = (id: number) => {
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
  };

  const addTransactionToCustomer = (
    customerId: number,
    transaction: CustomerTransaction,
  ) => {
    setCustomers((prev) =>
      prev.map((customer) => {
        if (customer.id === customerId) {
          return {
            ...customer,
            totalTransactions: customer.totalTransactions + 1,
            totalAmount: customer.totalAmount + transaction.amount,
            lastTransaction: transaction.date,
            transactions: [...customer.transactions, transaction],
          };
        }
        return customer;
      }),
    );
  };

  const getCustomerByName = (name: string) => {
    return customers.find(
      (customer) => customer.name.toLowerCase() === name.toLowerCase(),
    );
  };

  const syncCustomersFromTransactions = (transactions: any[]) => {
    // Prevent multiple rapid syncs
    if (transactions.length === 0) return;

    const customerMap = new Map<string, any>();

    // Group transactions by customer name
    transactions.forEach((transaction) => {
      const customerName = transaction.customerName?.trim();
      if (!customerName || customerName.toLowerCase() === "cash") return;

      const cleanName = customerName.endsWith("_c")
        ? customerName.slice(0, -2)
        : customerName;
      const paymentMode = customerName.endsWith("_c")
        ? "Cash"
        : transaction.paymentMode || "GPay";

      if (!customerMap.has(cleanName)) {
        customerMap.set(cleanName, {
          name: cleanName,
          transactions: [],
          totalAmount: 0,
          totalTransactions: 0,
          preferredPayment: paymentMode,
          lastTransaction: transaction.date,
        });
      }

      const customer = customerMap.get(cleanName);
      customer.transactions.push({
        id: transaction.id,
        date: transaction.date,
        amount: transaction.total,
        paymentMode: paymentMode,
        items: [],
      });
      customer.totalAmount += transaction.total;
      customer.totalTransactions += 1;

      // Update last transaction if this one is more recent
      if (new Date(transaction.date) > new Date(customer.lastTransaction)) {
        customer.lastTransaction = transaction.date;
      }
    });

    // Update existing customers or create new ones
    customerMap.forEach((customerData, customerName) => {
      const existingCustomer = getCustomerByName(customerName);

      if (existingCustomer) {
        // Update existing customer only if data has changed
        if (
          existingCustomer.totalTransactions !==
            customerData.totalTransactions ||
          existingCustomer.totalAmount !== customerData.totalAmount ||
          existingCustomer.lastTransaction !== customerData.lastTransaction
        ) {
          updateCustomer(existingCustomer.id, {
            totalTransactions: customerData.totalTransactions,
            totalAmount: customerData.totalAmount,
            lastTransaction: customerData.lastTransaction,
            transactions: customerData.transactions,
            preferredPayment: customerData.preferredPayment,
          });
        }
      } else {
        // Only create new customer if one with this name doesn't already exist
        const duplicateCheck = customers.find(
          (c) => c.name.toLowerCase() === customerName.toLowerCase(),
        );
        if (!duplicateCheck) {
          addCustomer({
            name: customerName,
            preferredPayment: customerData.preferredPayment,
            totalTransactions: customerData.totalTransactions,
            totalAmount: customerData.totalAmount,
            lastTransaction: customerData.lastTransaction,
            transactions: customerData.transactions,
          });
        }
      }
    });
  };

  const getCustomerSuggestions = (prefix: string) => {
    if (prefix.length < 1) return [];

    return customers
      .filter((customer) =>
        customer.name.toLowerCase().startsWith(prefix.toLowerCase()),
      )
      .sort((a, b) => {
        // Sort by most recent transactions first, then by total amount
        const dateA = new Date(a.lastTransaction);
        const dateB = new Date(b.lastTransaction);
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        return b.totalAmount - a.totalAmount;
      })
      .slice(0, 8); // Increase to 8 suggestions for better UX
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addTransactionToCustomer,
        getCustomerByName,
        syncCustomersFromTransactions,
        getCustomerSuggestions,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within CustomerProvider");
  }
  return context;
}
