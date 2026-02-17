import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "./AccountManager";

interface StockItem {
  id: number;
  itemName: string;
  price: number;
  availableQuantity: number;
  lowStockThreshold: number;
  blocked?: boolean; // Add blocked field
}

interface StockContextType {
  stockItems: StockItem[];
  addStockItem: (item: StockItem) => void;
  updateStockItem: (id: number, updates: Partial<StockItem>) => void;
  deleteStockItem: (id: number) => void;
  reduceStock: (id: number, quantity: number) => boolean;
  restoreStock: (id: number, quantity: number) => boolean;
  adjustStock: (id: number, quantityDifference: number) => boolean;
  importStockItems: (items: StockItem[]) => void;
  getAvailableStock: () => StockItem[];
  toggleBlockItem: (id: number) => void;
  getUnblockedStock: () => StockItem[];
  deleteAllStock: () => void;
  isStockUsedInBills: (id: number) => boolean;
}

// Account-specific stock data function
const getStockForAccount = (accountId: string): StockItem[] => {
  if (accountId === "1") {
    // Sadhana Agency - Traditional grocery items
    return [
      {
        id: 1,
        itemName: "Rice (1kg)",
        price: 80,
        availableQuantity: 150,
        lowStockThreshold: 20,
      },
      {
        id: 2,
        itemName: "Wheat Flour (1kg)",
        price: 45,
        availableQuantity: 200,
        lowStockThreshold: 30,
      },
      {
        id: 3,
        itemName: "Sugar (1kg)",
        price: 60,
        availableQuantity: 100,
        lowStockThreshold: 25,
      },
      {
        id: 4,
        itemName: "Cooking Oil (1L)",
        price: 120,
        availableQuantity: 80,
        lowStockThreshold: 15,
      },
      {
        id: 5,
        itemName: "Pulses (1kg)",
        price: 95,
        availableQuantity: 120,
        lowStockThreshold: 20,
      },
    ];
  } else {
    // Himalaya Traders - Different mountain/trading items
    return [
      {
        id: 101,
        itemName: "Himalayan Pink Salt (500g)",
        price: 150,
        availableQuantity: 50,
        lowStockThreshold: 10,
      },
      {
        id: 102,
        itemName: "Mountain Honey (250g)",
        price: 280,
        availableQuantity: 30,
        lowStockThreshold: 5,
      },
      {
        id: 103,
        itemName: "Organic Tea Leaves (100g)",
        price: 220,
        availableQuantity: 75,
        lowStockThreshold: 15,
      },
      {
        id: 104,
        itemName: "Dry Fruits Mix (500g)",
        price: 450,
        availableQuantity: 40,
        lowStockThreshold: 8,
      },
    ];
  }
};

// Default stock data (keeping for backward compatibility)
const defaultStock: StockItem[] = [
  {
    id: 1,
    itemName: "Rice (1kg)",
    price: 80,
    availableQuantity: 150,
    lowStockThreshold: 20,
  },
  {
    id: 2,
    itemName: "Wheat Flour (1kg)",
    price: 45,
    availableQuantity: 200,
    lowStockThreshold: 30,
  },
  {
    id: 3,
    itemName: "Sugar (1kg)",
    price: 60,
    availableQuantity: 100,
    lowStockThreshold: 25,
  },
  {
    id: 4,
    itemName: "Cooking Oil (1L)",
    price: 120,
    availableQuantity: 80,
    lowStockThreshold: 15,
  },
  {
    id: 5,
    itemName: "Pulses (1kg)",
    price: 95,
    availableQuantity: 120,
    lowStockThreshold: 20,
  },
  {
    id: 6,
    itemName: "Tea (250g)",
    price: 180,
    availableQuantity: 60,
    lowStockThreshold: 10,
  },
  {
    id: 7,
    itemName: "Salt (1kg)",
    price: 25,
    availableQuantity: 300,
    lowStockThreshold: 50,
  },
  {
    id: 8,
    itemName: "Spices Mix (100g)",
    price: 40,
    availableQuantity: 90,
    lowStockThreshold: 15,
  },
  {
    id: 9,
    itemName: "Biscuits (Pack)",
    price: 35,
    availableQuantity: 150,
    lowStockThreshold: 25,
  },
  {
    id: 10,
    itemName: "Soap (100g)",
    price: 30,
    availableQuantity: 200,
    lowStockThreshold: 40,
  },
  {
    id: 11,
    itemName: "Shampoo (200ml)",
    price: 85,
    availableQuantity: 45,
    lowStockThreshold: 10,
  },
  {
    id: 12,
    itemName: "Toothpaste (100g)",
    price: 55,
    availableQuantity: 75,
    lowStockThreshold: 15,
  },
  {
    id: 13,
    itemName: "Detergent (1kg)",
    price: 65,
    availableQuantity: 90,
    lowStockThreshold: 20,
  },
  {
    id: 14,
    itemName: "Milk Powder (500g)",
    price: 220,
    availableQuantity: 35,
    lowStockThreshold: 8,
  },
  {
    id: 15,
    itemName: "Honey (250g)",
    price: 180,
    availableQuantity: 25,
    lowStockThreshold: 5,
  },
];

const StockContext = createContext<StockContextType | null>(null);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const { activeAccount } = useAccount();

  // Initialize with empty array and load data in useEffect
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Save to account-specific localStorage whenever stockItems or activeAccount changes
  useEffect(() => {
    try {
      if (activeAccount) {
        const storageKey = `stockItems_${activeAccount.id}`;
        localStorage.setItem(storageKey, JSON.stringify(stockItems));
      }
    } catch (error) {
      console.warn("Failed to save stock items to localStorage:", error);
    }
  }, [stockItems, activeAccount]);

  // Load stock items for active account (both initial load and account switch)
  useEffect(() => {
    if (activeAccount) {
      try {
        const storageKey = `stockItems_${activeAccount.id}`;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedStock = JSON.parse(saved);
          setStockItems(parsedStock);
          console.log(
            `Loaded ${parsedStock.length} stock items for account ${activeAccount.name} (ID: ${activeAccount.id})`,
          );
        } else {
          const accountStock = getStockForAccount(activeAccount.id);
          setStockItems(accountStock);
          console.log(
            `No existing data found for account ${activeAccount.name}, loading account-specific stock (${accountStock.length} items)`,
          );
        }
      } catch (error) {
        console.error(
          `Error loading stock for account ${activeAccount.name}:`,
          error,
        );
        const accountStock = getStockForAccount(activeAccount.id);
        setStockItems(accountStock);
      }
    } else {
      // If no active account, start with empty array
      setStockItems([]);
      console.log("No active account, clearing stock items");
    }
  }, [activeAccount?.id]);

  // Listen for account switch events to force refresh
  useEffect(() => {
    const handleAccountSwitch = () => {
      console.log(
        "Account switch event detected in StockContext, forcing data refresh",
      );
      if (activeAccount) {
        loadAccountData(activeAccount.id);
      }
    };

    const handleForceSave = (event: any) => {
      const accountId = event.detail?.accountId;
      if (accountId && stockItems.length > 0) {
        try {
          const storageKey = `stockItems_${accountId}`;
          localStorage.setItem(storageKey, JSON.stringify(stockItems));
          console.log(
            `Force saved ${stockItems.length} stock items for account ${accountId}`,
          );
        } catch (error) {
          console.error("Error force saving stock items:", error);
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
        const storageKey = `stockItems_${accountId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedStock = JSON.parse(saved);
          if (Array.isArray(parsedStock)) {
            setStockItems([...parsedStock]); // Create new array reference to force re-render
            console.log(
              `Force reloaded ${parsedStock.length} stock items for account ${accountId}`,
            );
          }
        } else {
          const accountStock = getStockForAccount(accountId);
          setStockItems([...accountStock]); // Create new array reference to force re-render
          console.log(
            `No data found for account ${accountId}, loading account-specific stock (${accountStock.length} items)`,
          );
        }
      } catch (error) {
        console.error("Error force reloading stock:", error);
        const accountStock = getStockForAccount(accountId);
        setStockItems([...accountStock]); // Create new array reference to force re-render
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

  const addStockItem = (item: StockItem) => {
    setStockItems((prev) => [...prev, item]);
  };

  const updateStockItem = (id: number, updates: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const deleteStockItem = (id: number) => {
    // Note: The component should check isStockUsedInBills before calling this
    setStockItems((prev) => prev.filter((item) => item.id !== id));
  };

  const reduceStock = (id: number, quantity: number): boolean => {
    const item = stockItems.find((item) => item.id === id);
    if (!item || item.availableQuantity < quantity) {
      return false;
    }

    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, availableQuantity: item.availableQuantity - quantity }
          : item,
      ),
    );
    return true;
  };

  const restoreStock = (id: number, quantity: number): boolean => {
    const item = stockItems.find((item) => item.id === id);
    if (!item) {
      return false;
    }

    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, availableQuantity: item.availableQuantity + quantity }
          : item,
      ),
    );
    return true;
  };

  const adjustStock = (id: number, quantityDifference: number): boolean => {
    const item = stockItems.find((item) => item.id === id);
    if (!item) {
      return false;
    }

    // If reducing stock, check if there's enough
    if (
      quantityDifference < 0 &&
      item.availableQuantity < Math.abs(quantityDifference)
    ) {
      return false;
    }

    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              availableQuantity: Math.max(
                0,
                item.availableQuantity + quantityDifference,
              ),
            }
          : item,
      ),
    );
    return true;
  };

  const isStockUsedInBills = (id: number): boolean => {
    // This will be checked by the component using context
    // We need access to bills to check if stock item is used
    // For now, return false - this will be implemented in the component
    return false;
  };

  const importStockItems = (items: StockItem[]) => {
    setStockItems((prev) => [...prev, ...items]);
  };

  const getAvailableStock = () => {
    return stockItems.filter((item) => item.availableQuantity > 0);
  };

  const toggleBlockItem = (id: number) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, blocked: !item.blocked } : item,
      ),
    );
  };

  const getUnblockedStock = () => {
    return stockItems.filter(
      (item) => item.availableQuantity > 0 && !item.blocked,
    );
  };

  const deleteAllStock = () => {
    setStockItems([]);
  };

  return (
    <StockContext.Provider
      value={{
        stockItems,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        reduceStock,
        restoreStock,
        adjustStock,
        importStockItems,
        getAvailableStock,
        toggleBlockItem,
        getUnblockedStock,
        deleteAllStock,
        isStockUsedInBills,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error("useStock must be used within StockProvider");
  }
  return context;
}
