import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "./AccountManager";

interface BillItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Bill {
  id: string;
  billNumber: number;
  date: string;
  customerName: string;
  items: BillItem[];
  subTotal: number;
  expectedTotal: number;
  paymentMode: "Cash" | "GPay" | "Bank";
  status: "draft" | "generated";
  difference: number;
  tolerance: number;
  headerInfo: {
    agencyName: string;
    address: string;
  };
  footerInfo: {
    declaration: string;
    signature?: string;
  };
}

interface BillContextType {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  updateBill: (id: string, bill: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  generateBillsFromTransactions: (
    transactions: any[],
    startingBillNumber: number,
    blockedNumbers: number[],
    availableStock?: any[],
  ) => void;
}

const BillContext = createContext<BillContextType | null>(null);

export function BillProvider({ children }: { children: React.ReactNode }) {
  const { activeAccount } = useAccount();

  // Initialize with empty array and load data in useEffect
  const [bills, setBills] = useState<Bill[]>([]);

  // Save to account-specific localStorage whenever bills or activeAccount changes
  useEffect(() => {
    try {
      if (activeAccount) {
        const storageKey = `bills_${activeAccount.id}`;
        localStorage.setItem(storageKey, JSON.stringify(bills));
      }
    } catch (error) {
      console.warn("Failed to save bills to localStorage:", error);
    }
  }, [bills, activeAccount]);

  // Load bills for active account (both initial load and account switch)
  useEffect(() => {
    if (activeAccount) {
      try {
        const storageKey = `bills_${activeAccount.id}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setBills(JSON.parse(saved));
        } else {
          setBills([]);
        }
      } catch {
        setBills([]);
      }
    } else {
      // If no active account, start with empty array
      setBills([]);
    }
  }, [activeAccount?.id]);

  const addBill = (bill: Bill) => {
    setBills((prev) => [...prev, bill]);
  };

  const updateBill = (id: string, billData: Partial<Bill>) => {
    setBills((prev) =>
      prev.map((bill) => (bill.id === id ? { ...bill, ...billData } : bill)),
    );
  };

  const deleteBill = (id: string) => {
    setBills((prev) => prev.filter((bill) => bill.id !== id));
  };

  const generateBillsFromTransactions = (
    transactions: any[],
    startingBillNumber: number,
    blockedNumbers: number[],
    availableStock: any[] = [],
  ) => {
    const generatedBills: Bill[] = [];
    let currentBillNumber = startingBillNumber;

    // Use provided stock or fallback to mock data
    const stockToUse =
      availableStock.length > 0
        ? availableStock.map((item) => ({
            id: item.id,
            name: item.itemName,
            price: item.price,
          }))
        : [
            { id: 1, name: "Rice (1kg)", price: 80 },
            { id: 2, name: "Wheat Flour (1kg)", price: 45 },
            { id: 3, name: "Sugar (1kg)", price: 60 },
            { id: 4, name: "Cooking Oil (1L)", price: 120 },
            { id: 5, name: "Pulses (1kg)", price: 95 },
            { id: 6, name: "Tea (250g)", price: 180 },
            { id: 7, name: "Salt (1kg)", price: 25 },
          ];

    transactions.forEach((transaction, index) => {
      // Skip blocked bill numbers
      while (blockedNumbers.includes(currentBillNumber)) {
        currentBillNumber++;
      }

      // Validate transaction total - must be greater than 0
      const targetTotal =
        typeof transaction.total === "number" ? transaction.total : 0;

      if (targetTotal <= 0) {
        console.warn(
          `Skipping transaction ${transaction.id} - invalid total: ${targetTotal}`,
        );
        return; // Skip invalid transactions
      }

      let selectedItems: BillItem[] = [];
      let currentTotal = 0;
      let usedTolerance = -1;

      // Try tolerance 0 first, then 1...25 for better matching
      for (let tolerance = 0; tolerance <= 25; tolerance++) {
        const attemptItems: BillItem[] = [];
        let attemptTotal = 0;

        // Shuffle stock for variety each tolerance pass
        const shuffledStock = [...stockToUse].sort(() => Math.random() - 0.5);

        // Smart item selection for better total matching
        const remainingTarget = targetTotal;
        const itemsByPrice = shuffledStock.sort((a, b) => a.price - b.price);

        // Random number of items (2-7) for this attempt
        const targetItemCount = Math.floor(Math.random() * 6) + 2; // 2 to 7 items
        const availableItems = [...shuffledStock];

        for (
          let itemIndex = 0;
          itemIndex < Math.min(targetItemCount, availableItems.length);
          itemIndex++
        ) {
          const item = availableItems[itemIndex];
          const remainingAmount = targetTotal - attemptTotal;

          // Random quantity between 1 and 5, but constrained by remaining amount
          const maxReasonableQty = Math.max(
            1,
            Math.floor(remainingAmount / item.price),
          );
          const maxQty = Math.min(5, maxReasonableQty);
          const quantity = Math.floor(Math.random() * maxQty) + 1;

          const itemTotal = item.price * quantity;
          const prospectiveTotal = attemptTotal + itemTotal;

          // Add item if it doesn't exceed target by too much
          if (prospectiveTotal <= targetTotal + tolerance) {
            const billItem: BillItem = {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: quantity,
              total: itemTotal,
            };
            attemptItems.push(billItem);
            attemptTotal = prospectiveTotal;

            // Stop if we're close enough or have enough items
            if (
              Math.abs(attemptTotal - targetTotal) <= tolerance &&
              attemptItems.length >= 2
            ) {
              break;
            }
          }
        }

        // Check if within current tolerance and has items
        if (
          Math.abs(attemptTotal - targetTotal) <= tolerance &&
          attemptItems.length > 0 &&
          attemptTotal > 0 // Ensure bill total is not zero
        ) {
          selectedItems = attemptItems;
          currentTotal = attemptTotal;
          usedTolerance = tolerance;
          break; // Found match, stop trying higher tolerances
        }
      }

      // If no valid bill could be generated, create a minimal bill
      if (selectedItems.length === 0 || currentTotal === 0) {
        // Create a single item that matches or comes close to the target
        const bestItem = stockToUse.reduce((best, item) => {
          const bestDiff = Math.abs(best.price - targetTotal);
          const itemDiff = Math.abs(item.price - targetTotal);
          return itemDiff < bestDiff ? item : best;
        });

        const quantity = Math.max(1, Math.round(targetTotal / bestItem.price));
        selectedItems = [
          {
            id: bestItem.id,
            name: bestItem.name,
            price: bestItem.price,
            quantity: quantity,
            total: bestItem.price * quantity,
          },
        ];
        currentTotal = bestItem.price * quantity;
        usedTolerance = Math.abs(currentTotal - targetTotal);
      }

      const bill: Bill = {
        id: `BILL-${String(generatedBills.length + 1).padStart(3, "0")}`,
        billNumber: currentBillNumber,
        date: transaction.date,
        customerName: transaction.customerName,
        items: selectedItems,
        subTotal: currentTotal,
        expectedTotal: targetTotal,
        paymentMode: transaction.paymentMode,
        status: "generated",
        difference: targetTotal - currentTotal,
        tolerance:
          usedTolerance >= 0
            ? usedTolerance
            : Math.abs(targetTotal - currentTotal),
        headerInfo: {
          agencyName: "Sadhana Agency",
          address: "Harsila (Dewalchaura), Bageshwar, Uttarakhand",
        },
        footerInfo: {
          declaration:
            "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
          signature: "Authorized Signature",
        },
      };

      generatedBills.push(bill);
      currentBillNumber++;
    });

    setBills((prev) => [...prev, ...generatedBills]);
    return generatedBills;
  };

  return (
    <BillContext.Provider
      value={{
        bills,
        addBill,
        updateBill,
        deleteBill,
        generateBillsFromTransactions,
      }}
    >
      {children}
    </BillContext.Provider>
  );
}

export function useBill() {
  const context = useContext(BillContext);
  if (!context) {
    throw new Error("useBill must be used within BillProvider");
  }
  return context;
}
