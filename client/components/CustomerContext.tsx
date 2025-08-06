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
          setCustomers(JSON.parse(saved));
        } else {
          // If no data for this account, start with default customers
          setCustomers(defaultCustomers);
        }
      } catch {
        setCustomers(defaultCustomers);
      }
    } else {
      // If no active account, start with empty array
      setCustomers([]);
    }
  }, [activeAccount?.id]);

  const addCustomer = (customerData: Omit<Customer, "id">) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
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
    const customerMap = new Map<string, any>();

    // Group transactions by customer name
    transactions.forEach(transaction => {
      const customerName = transaction.customerName?.trim();
      if (!customerName || customerName.toLowerCase() === 'cash') return;

      const cleanName = customerName.endsWith('_c') ? customerName.slice(0, -2) : customerName;
      const paymentMode = customerName.endsWith('_c') ? 'Cash' : transaction.paymentMode || 'GPay';

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
        items: []
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
        // Update existing customer
        updateCustomer(existingCustomer.id, {
          totalTransactions: customerData.totalTransactions,
          totalAmount: customerData.totalAmount,
          lastTransaction: customerData.lastTransaction,
          transactions: customerData.transactions,
          preferredPayment: customerData.preferredPayment,
        });
      } else {
        // Create new customer
        addCustomer({
          name: customerName,
          preferredPayment: customerData.preferredPayment,
          totalTransactions: customerData.totalTransactions,
          totalAmount: customerData.totalAmount,
          lastTransaction: customerData.lastTransaction,
          transactions: customerData.transactions,
        });
      }
    });
  };

  const getCustomerSuggestions = (prefix: string) => {
    if (prefix.length < 2) return [];

    return customers.filter(customer =>
      customer.name.toLowerCase().includes(prefix.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions
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
