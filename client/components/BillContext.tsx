import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "./AccountManager";
import { useIterationMonitor } from "./IterationMonitor";

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
    reduceStockCallback?: (id: number, quantity: number) => boolean,
  ) => void;
  deleteAllBills: () => void;
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

  const deleteAllBills = () => {
    setBills([]);
  };

  // Enhanced 200-iteration algorithm following Python bill generation rules
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

    // Get available items that aren't in previous bill to avoid repetition
    let availableItems = stockToUse.filter(
      (item) =>
        !previousItems.includes(item.name) && item.availableQuantity > 0,
    );

    if (availableItems.length < 2) {
      // If not enough unique items available, use all available items
      availableItems = stockToUse.filter((item) => item.availableQuantity > 0);
    }

    if (availableItems.length === 0) {
      return { items: [], total: 0 };
    }

    let bestMatch: { items: BillItem[]; total: number } | null = null;
    let closestDiff = Infinity;
    const tolerance = 30; // ±30 tolerance as per requirements
    let iterationsPerformed = 0;

    // Complete 200 iterations to find the best combination
    for (let attempt = 0; attempt < 200; attempt++) {
      iterationsPerformed++;

      // Shuffle items randomly each iteration (equivalent to pandas sample(frac=1))
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
      const maxItems = 7; // Maximum 7 items per bill

      // Try to select items in shuffled order
      for (const item of shuffledItems) {
        if (selectedItems.length >= maxItems) break;

        // Try different quantities (up to 2 as per requirements)
        let bestQty = 0;
        let bestQtyTotal = 0;

        for (let qty = 1; qty <= Math.min(2, item.availableQuantity); qty++) {
          const itemCost = item.price * qty;
          const newTotal = currentTotal + itemCost;

          // Check if this addition keeps us within bounds
          if (newTotal <= targetTotal + tolerance) {
            bestQty = qty;
            bestQtyTotal = itemCost;
          } else {
            break; // Don't exceed target + tolerance
          }
        }

        // Add the item if we found a valid quantity
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
      }

      // Enforce minimum 2 items per bill rule
      if (selectedItems.length < 2) {
        continue; // Skip this combination, try next iteration
      }

      // Calculate difference from target
      const finalDiff = Math.abs(currentTotal - targetTotal);

      // Check if this is our best match so far
      if (finalDiff < closestDiff) {
        bestMatch = { items: [...selectedItems], total: currentTotal };
        closestDiff = finalDiff;

        // Continue all 200 iterations to find the absolute best match
        if (finalDiff === 0) {
          console.log(
            `Found perfect match on iteration ${attempt + 1}, continuing for optimization...`,
          );
        } else if (finalDiff <= tolerance && selectedItems.length >= 2) {
          console.log(
            `Found good match within ±${tolerance} on iteration ${attempt + 1}, continuing for optimization...`,
          );
        }
      }
    }

    // If no acceptable match found, create a fallback with minimum requirements
    if (!bestMatch || bestMatch.items.length < 2) {
      console.log(
        "No suitable match found in 200 iterations, creating fallback",
      );

      const selectedItems: BillItem[] = [];
      let currentTotal = 0;

      // Sort items by price and take cheapest items to ensure minimum 2 items
      const sortedItems = availableItems.sort((a, b) => a.price - b.price);

      for (let i = 0; i < Math.min(2, sortedItems.length); i++) {
        const item = sortedItems[i];
        const billItem: BillItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          total: item.price,
        };
        selectedItems.push(billItem);
        currentTotal += billItem.total;
      }

      bestMatch = { items: selectedItems, total: currentTotal };
      closestDiff = Math.abs(currentTotal - targetTotal);
    }

    console.log(
      `Bill generation completed after full ${iterationsPerformed} iterations:`,
      `${bestMatch.items.length} items, total: ₹${bestMatch.total},`,
      `target: ₹${targetTotal}, difference: ₹${closestDiff},`,
      `within ±${tolerance}: ${closestDiff <= tolerance}`,
    );

    return bestMatch;
  };

  const generateBillsFromTransactions = (
    transactions: any[],
    startingBillNumber: number,
    blockedNumbers: number[],
    availableStock: any[] = [],
    reduceStockCallback?: (id: number, quantity: number) => boolean,
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
      // Skip blocked bill numbers - keep incrementing until we find an unblocked number
      while (blockedNumbers.includes(currentBillNumber)) {
        console.log(`Skipping blocked bill number: ${currentBillNumber}`);
        currentBillNumber++;
      }

      console.log(
        `Using bill number: ${currentBillNumber} for transaction ${transaction.id}`,
      );

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

      // Check tolerance constraint (±30)
      const difference = Math.abs(currentTotal - targetTotal);
      if (difference > 30) {
        console.warn(
          `Bill ${currentBillNumber} exceeds ±30 tolerance: difference ${difference}`,
        );
        console.log(
          "Target:",
          targetTotal,
          "Generated:",
          currentTotal,
          "Items:",
          selectedItems.length,
        );

        // Try one more time with different approach if tolerance exceeded
        const retryResult = generateOptimalBillItems(
          targetTotal,
          stockToUse,
          [], // Don't avoid previous items on retry
        );

        if (Math.abs(retryResult.total - targetTotal) < difference) {
          selectedItems = retryResult.items;
          currentTotal = retryResult.total;
          console.log(
            `Retry improved result: ${retryResult.total} (diff: ${Math.abs(retryResult.total - targetTotal)})`,
          );
        }
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

      // Always reduce stock quantities when generating bills
      if (reduceStockCallback) {
        selectedItems.forEach((billItem) => {
          const success = reduceStockCallback(billItem.id, billItem.quantity);
          if (success) {
            console.log(
              `Reduced stock for ${billItem.name}: -${billItem.quantity}`,
            );
            // Update available quantity in stockToUse for subsequent bills
            const stockItem = stockToUse.find(
              (item) => item.id === billItem.id,
            );
            if (stockItem) {
              stockItem.availableQuantity = Math.max(
                0,
                stockItem.availableQuantity - billItem.quantity,
              );
            }
          } else {
            console.warn(`Failed to reduce stock for ${billItem.name}`);
          }
        });
      } else {
        // Log warning if no callback provided
        console.warn(
          "No stock reduction callback provided - stock quantities will not be updated",
        );
      }

      // Update previous items for next bill to avoid consecutive repeats
      previousBillItems = selectedItems.map((item) => item.name);

      console.log(
        `Generated bill ${currentBillNumber} with ${selectedItems.length} items, total: ${currentTotal}`,
      );

      // Increment to next bill number for next iteration
      currentBillNumber++;

      // Skip any immediately following blocked numbers for next bill
      while (blockedNumbers.includes(currentBillNumber)) {
        console.log(`Pre-skipping blocked bill number: ${currentBillNumber}`);
        currentBillNumber++;
      }
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
        deleteAllBills,
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
