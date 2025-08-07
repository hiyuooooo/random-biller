import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "./AccountManager";

interface Transaction {
  id: number;
  date: string;
  customerName: string;
  total: number | string;
  paymentMode: "Cash" | "GPay" | "Bank";
  isValid: boolean;
  selected?: boolean;
  billGenerated?: boolean;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: number, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: number) => void;
  importTransactions: (transactions: Transaction[]) => void;
  getValidTransactions: () => Transaction[];
  toggleTransactionSelection: (id: number) => void;
  selectAllTransactions: (filteredTransactions?: Transaction[]) => void;
  deselectAllTransactions: () => void;
  getSelectedTransactions: () => Transaction[];
  markBillsGenerated: (transactionIds: number[]) => void;
  deleteAllTransactions: () => void;
}

// Default transaction data
const defaultTransactions: Transaction[] = [
  {
    id: 1,
    date: "15-01-2024",
    customerName: "Rajesh Kumar",
    total: 2450,
    paymentMode: "GPay",
    isValid: true,
  },
  {
    id: 2,
    date: "15-01-2024",
    customerName: "Priya Sharma",
    total: 1200,
    paymentMode: "Cash",
    isValid: true,
  },
  {
    id: 3,
    date: "14-01-2024",
    customerName: "Ahmed Ali",
    total: 380,
    paymentMode: "GPay",
    isValid: true,
  },
  {
    id: 4,
    date: "14-01-2024",
    customerName: "Sunita Devi",
    total: 850,
    paymentMode: "Cash",
    isValid: true,
  },
  {
    id: 5,
    date: "13-01-2024",
    customerName: "Vikram Singh",
    total: 4200,
    paymentMode: "GPay",
    isValid: true,
  },
  {
    id: 6,
    date: "13-01-2024",
    customerName: "Meera Patel",
    total: 1500,
    paymentMode: "Cash",
    isValid: true,
  },
  {
    id: 7,
    date: "12-01-2024",
    customerName: "Arjun Reddy",
    total: 3250,
    paymentMode: "GPay",
    isValid: true,
  },
  {
    id: 8,
    date: "12-01-2024",
    customerName: "Kavita Singh",
    total: 1800,
    paymentMode: "GPay",
    isValid: true,
  },
  {
    id: 9,
    date: "11-01-2024",
    customerName: "Rohit Kumar",
    total: 950,
    paymentMode: "Cash",
    isValid: true,
  },
  {
    id: 10,
    date: "11-01-2024",
    customerName: "Anita Sharma",
    total: 2750,
    paymentMode: "GPay",
    isValid: true,
  },
];

const TransactionContext = createContext<TransactionContextType | null>(null);

export function TransactionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const accountContext = useAccount();
  const { activeAccount } = accountContext;

  // Initialize with empty array and load data in useEffect
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Save to account-specific localStorage whenever transactions or activeAccount changes
  useEffect(() => {
    try {
      if (activeAccount) {
        const storageKey = `transactions_${activeAccount.id}`;
        localStorage.setItem(storageKey, JSON.stringify(transactions));
      }
    } catch (error) {
      console.warn("Failed to save transactions to localStorage:", error);
    }
  }, [transactions, activeAccount]);

  // Load transactions for active account (both initial load and account switch)
  useEffect(() => {
    if (activeAccount) {
      try {
        const storageKey = `transactions_${activeAccount.id}`;

        const saved = localStorage.getItem(storageKey);

        if (saved) {
          setTransactions(JSON.parse(saved));
        } else {
          // Create account-specific transaction data and save immediately
          if (activeAccount.id === "1") {
            // Sadhana Agency - default transactions
            setTransactions(defaultTransactions);
            localStorage.setItem(
              storageKey,
              JSON.stringify(defaultTransactions),
            );
          } else {
            // Himalaya Traders - different transactions
            const himalayaTransactions = [
              {
                id: 201,
                date: "22-01-2024",
                customerName: "Mountain Resort",
                total: 2800,
                paymentMode: "Bank" as const,
                isValid: true,
              },
              {
                id: 202,
                date: "21-01-2024",
                customerName: "Hill Station Shop",
                total: 1650,
                paymentMode: "GPay" as const,
                isValid: true,
              },
            ];
            setTransactions(himalayaTransactions);
            localStorage.setItem(
              storageKey,
              JSON.stringify(himalayaTransactions),
            );
          }
        }
      } catch (error) {
        setTransactions(defaultTransactions);
      }
    } else {
      setTransactions([]);
    }
  }, [activeAccount?.id]);

  // Listen for account switch events to force refresh
  useEffect(() => {
    const handleAccountSwitch = () => {
      console.log(
        "Account switch event detected in TransactionContext, forcing data refresh",
      );
      if (activeAccount) {
        loadAccountData(activeAccount.id);
      }
    };

    const handleForceSave = (event: any) => {
      const accountId = event.detail?.accountId;
      if (accountId && transactions.length > 0) {
        try {
          const storageKey = `transactions_${accountId}`;
          localStorage.setItem(storageKey, JSON.stringify(transactions));
          console.log(
            `Force saved ${transactions.length} transactions for account ${accountId}`,
          );
        } catch (error) {
          console.error("Error force saving transactions:", error);
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
        const storageKey = `transactions_${accountId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedTransactions = JSON.parse(saved);
          if (Array.isArray(parsedTransactions)) {
            setTransactions([...parsedTransactions]); // Create new array reference to force re-render
            console.log(
              `Force reloaded ${parsedTransactions.length} transactions for account ${accountId}`,
            );
          }
        } else {
          if (accountId === "1") {
            setTransactions([...defaultTransactions]); // Sadhana Agency defaults
            console.log(
              `No transactions found for account ${accountId}, loading Sadhana defaults`,
            );
          } else {
            const himalayaTransactions = [
              {
                id: 201,
                date: "22-01-2024",
                customerName: "Mountain Resort",
                total: 2800,
                paymentMode: "Bank" as const,
                isValid: true,
              },
              {
                id: 202,
                date: "21-01-2024",
                customerName: "Hill Station Shop",
                total: 1650,
                paymentMode: "GPay" as const,
                isValid: true,
              },
            ];
            setTransactions([...himalayaTransactions]); // Himalaya Traders specific data
            console.log(
              `No transactions found for account ${accountId}, loading Himalaya defaults`,
            );
          }
        }
      } catch (error) {
        console.error("Error force reloading transactions:", error);
        if (accountId === "1") {
          setTransactions([...defaultTransactions]); // Sadhana Agency defaults
        } else {
          const himalayaTransactions = [
            {
              id: 201,
              date: "22-01-2024",
              customerName: "Mountain Resort",
              total: 2800,
              paymentMode: "Bank" as const,
              isValid: true,
            },
            {
              id: 202,
              date: "21-01-2024",
              customerName: "Hill Station Shop",
              total: 1650,
              paymentMode: "GPay" as const,
              isValid: true,
            },
          ];
          setTransactions([...himalayaTransactions]); // Himalaya Traders specific data
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

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const updateTransaction = (id: number, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? { ...transaction, ...updates } : transaction,
      ),
    );
  };

  const deleteTransaction = (id: number) => {
    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== id),
    );
  };

  const importTransactions = (newTransactions: Transaction[]) => {
    setTransactions((prev) => [...prev, ...newTransactions]);
  };

  const getValidTransactions = () => {
    return transactions.filter((transaction) => transaction.isValid);
  };

  const toggleTransactionSelection = (id: number) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id
          ? { ...transaction, selected: !transaction.selected }
          : transaction,
      ),
    );
  };

  const getSelectedTransactions = () => {
    return transactions.filter(
      (transaction) => transaction.selected && transaction.isValid,
    );
  };

  const markBillsGenerated = (transactionIds: number[]) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transactionIds.includes(transaction.id)
          ? { ...transaction, billGenerated: true }
          : transaction,
      ),
    );
  };

  const selectAllTransactions = (filteredTransactions?: Transaction[]) => {
    setTransactions((prev) =>
      prev.map((transaction) => {
        // If filteredTransactions is provided, only select those that are in the filtered list
        if (filteredTransactions) {
          const isInFilteredList = filteredTransactions.some(
            (ft) => ft.id === transaction.id,
          );
          return transaction.isValid && isInFilteredList
            ? { ...transaction, selected: true }
            : transaction;
        }
        // Default behavior: select all valid transactions
        return transaction.isValid
          ? { ...transaction, selected: true }
          : transaction;
      }),
    );
  };

  const deselectAllTransactions = () => {
    setTransactions((prev) =>
      prev.map((transaction) => ({ ...transaction, selected: false })),
    );
  };

  const deleteAllTransactions = () => {
    setTransactions([]);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactions,
        getValidTransactions,
        toggleTransactionSelection,
        selectAllTransactions,
        deselectAllTransactions,
        getSelectedTransactions,
        markBillsGenerated,
        deleteAllTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransaction must be used within TransactionProvider");
  }
  return context;
}
