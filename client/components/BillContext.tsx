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

  // Enhanced bill generator with intelligent combination finding
  const generateOptimalBillItems = (
    targetTotal: number,
    stockToUse: any[],
    previousItems: string[] = [],
  ): { items: BillItem[]; total: number } => {
    console.log(
      "Generating optimal bill items for target:",
      targetTotal,
      "Stock available:",
      stockToUse.length,
    );

    // Get available items that aren't in previous bill
    let availableItems = stockToUse.filter(
      (item) => !previousItems.includes(item.name),
    );

    if (availableItems.length < 2) {
      // If not enough unique items available, use all available items
      availableItems = [...stockToUse];
    }

    if (availableItems.length === 0) {
      return { items: [], total: 0 };
    }

    let bestMatch: { items: BillItem[]; total: number } | null = null;
    let closestDiff = Infinity;

    // Try multiple attempts with different strategies
    for (let attempt = 0; attempt < 50; attempt++) {
      // Shuffle items for variety
      const shuffledItems = [...availableItems];
      for (let i = shuffledItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledItems[i], shuffledItems[j]] = [
          shuffledItems[j],
          shuffledItems[i],
        ];
      }

      const selectedItems: BillItem[] = [];
      let currentTotal = 0;

      // Strategy: Try to build a bill close to target
      const itemsToTry = shuffledItems.slice(0, 7); // Limit to 7 items

      // Greedy approach: select items and quantities that get us close to target
      for (const item of itemsToTry) {
        if (selectedItems.length >= 7) break;

        const remaining = targetTotal - currentTotal;

        // Calculate optimal quantity for this item
        let bestQty = 0;
        let bestQtyTotal = 0;

        // Try quantities 1, 2, 3
        for (let qty = 1; qty <= 3; qty++) {
          const itemCost = item.price * qty;

          // Check if this gets us closer to target without going too far over
          if (currentTotal + itemCost <= targetTotal + 30) {
            if (
              Math.abs(currentTotal + itemCost - targetTotal) <
              Math.abs(currentTotal + bestQtyTotal - targetTotal)
            ) {
              bestQty = qty;
              bestQtyTotal = itemCost;
            }
          }
        }

        // Add the item if we found a good quantity
        if (bestQty > 0) {
          const billItem: BillItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: bestQty,
            total: bestQtyTotal,
          };

          selectedItems.push(billItem);
          currentTotal += bestQtyTotal;
        }

        // Stop if we're close enough and have minimum items
        if (
          selectedItems.length >= 2 &&
          Math.abs(currentTotal - targetTotal) <= 30
        ) {
          break;
        }
      }

      // Ensure we have at least 2 items - add cheapest if needed
      if (selectedItems.length < 2) {
        const unusedItems = shuffledItems
          .filter(
            (item) =>
              !selectedItems.some((selected) => selected.name === item.name),
          )
          .sort((a, b) => a.price - b.price);

        for (const item of unusedItems.slice(0, 2 - selectedItems.length)) {
          if (currentTotal + item.price <= targetTotal + 30) {
            const billItem: BillItem = {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: 1,
              total: item.price,
            };
            selectedItems.push(billItem);
            currentTotal += item.price;
          }
        }
      }

      // Check if this is our best match so far
      const diff = Math.abs(currentTotal - targetTotal);
      if (selectedItems.length >= 2 && diff <= 30 && diff < closestDiff) {
        bestMatch = { items: selectedItems, total: currentTotal };
        closestDiff = diff;

        // If very close, stop searching
        if (diff <= 10) break;
      }
    }

    // If still no match, create a proportional bill
    if (!bestMatch) {
      console.log("No match found, creating proportional bill");

      // Calculate how to distribute target among available items
      const selectedItems: BillItem[] = [];
      let currentTotal = 0;

      // Sort items by price and take 2-3 items
      const sortedItems = availableItems.sort((a, b) => a.price - b.price);
      const numItems = Math.min(3, sortedItems.length);
      const targetPerItem = targetTotal / numItems;

      for (let i = 0; i < numItems; i++) {
        const item = sortedItems[i];
        const qty = Math.max(1, Math.round(targetPerItem / item.price));
        const clampedQty = Math.min(
          qty,
          Math.floor((targetTotal - currentTotal) / item.price) + 1,
        );
        const finalQty = Math.max(1, clampedQty);

        const billItem: BillItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: finalQty,
          total: item.price * finalQty,
        };

        selectedItems.push(billItem);
        currentTotal += billItem.total;

        if (Math.abs(currentTotal - targetTotal) <= 30) break;
      }

      bestMatch = { items: selectedItems, total: currentTotal };
      closestDiff = Math.abs(currentTotal - targetTotal);
    }

    console.log(
      "Generated bill with",
      bestMatch.items.length,
      "items, total:",
      bestMatch.total,
      "difference:",
      closestDiff,
    );
    return bestMatch;
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

    console.log(
      "Generating bills from transactions:",
      transactions.length,
      "Stock items:",
      stockToUse.length,
    );

    let previousBillItems: string[] = [];

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

      console.log(
        `Generating bill for transaction ${index + 1}/${transactions.length}: target ${targetTotal}`,
      );

      // Generate bill items using enhanced algorithm
      const result = generateOptimalBillItems(
        targetTotal,
        stockToUse,
        previousBillItems,
      );

      let selectedItems = result.items;
      let currentTotal = result.total;

      // If no items generated, create fallback (should not happen with new algorithm)
      if (selectedItems.length === 0) {
        console.warn("No items generated, using fallback");
        const fallbackItem = stockToUse[0];
        const quantity = Math.max(
          1,
          Math.round(targetTotal / fallbackItem.price),
        );
        selectedItems = [
          {
            id: fallbackItem.id,
            name: fallbackItem.name,
            price: fallbackItem.price,
            quantity: quantity,
            total: fallbackItem.price * quantity,
          },
        ];
        currentTotal = fallbackItem.price * quantity;
      }

      // Check tolerance constraint
      const difference = Math.abs(currentTotal - targetTotal);
      if (difference > 30) {
        console.warn(
          `Bill ${currentBillNumber} exceeds preferred tolerance: difference ${difference}`,
        );
        console.log(
          "Target:",
          targetTotal,
          "Generated:",
          currentTotal,
          "Items:",
          selectedItems.length,
        );

        // For now, continue with bill generation but log the issue
        // In production, you might want to either:
        // 1. Reject the bill (return;)
        // 2. Or try a different algorithm
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
        tolerance: difference,
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

      // Update previous items for next bill to avoid consecutive repeats
      previousBillItems = selectedItems.map((item) => item.name);

      console.log(
        `Generated bill ${currentBillNumber} with ${selectedItems.length} items, total: ${currentTotal}`,
      );
      currentBillNumber++;
    });

    console.log("Generated", generatedBills.length, "bills total");
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
