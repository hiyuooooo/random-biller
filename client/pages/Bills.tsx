import React, { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useBill } from "@/components/BillContext";
import { useStock } from "@/components/StockContext";
import { useIterationMonitor } from "@/components/IterationMonitor";
import { useCustomer } from "@/components/CustomerContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit2,
  Eye,
  Download,
  FileText,
  Search,
  Calendar,
  User,
  Calculator,
  Package,
  CreditCard,
  Trash2,
  Save,
  RefreshCw,
  Upload,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { IterationMonitorTab } from "@/components/IterationMonitorTab";

// Mock stock data
const mockStock = [
  { id: 1, name: "Rice (1kg)", price: 80, availableQuantity: 150 },
  { id: 2, name: "Wheat Flour (1kg)", price: 45, availableQuantity: 200 },
  { id: 3, name: "Sugar (1kg)", price: 60, availableQuantity: 100 },
  { id: 4, name: "Cooking Oil (1L)", price: 120, availableQuantity: 80 },
  { id: 5, name: "Pulses (1kg)", price: 95, availableQuantity: 120 },
  { id: 6, name: "Tea (250g)", price: 180, availableQuantity: 60 },
  { id: 7, name: "Salt (1kg)", price: 25, availableQuantity: 300 },
  { id: 8, name: "Spices Mix (100g)", price: 40, availableQuantity: 90 },
  { id: 9, name: "Biscuits (Pack)", price: 35, availableQuantity: 150 },
  { id: 10, name: "Soap (100g)", price: 30, availableQuantity: 200 },
];

// Mock bills data
const mockBills = [
  {
    id: "BILL-001",
    billNumber: 1001,
    date: "15-01-2024",
    customerName: "Rajesh Kumar",
    items: [
      { id: 1, name: "Rice (1kg)", price: 80, quantity: 2, total: 160 },
      { id: 2, name: "Cooking Oil (1L)", price: 120, quantity: 1, total: 120 },
      { id: 3, name: "Sugar (1kg)", price: 60, quantity: 1, total: 60 },
    ],
    subTotal: 340,
    paymentMode: "GPay" as const,
    status: "generated" as const,
  },
  {
    id: "BILL-002",
    billNumber: 1002,
    date: "15-01-2024",
    customerName: "Priya Sharma",
    items: [
      { id: 1, name: "Wheat Flour (1kg)", price: 45, quantity: 3, total: 135 },
      { id: 2, name: "Pulses (1kg)", price: 95, quantity: 1, total: 95 },
    ],
    subTotal: 230,
    paymentMode: "Cash" as const,
    status: "draft" as const,
  },
];

interface StockItem {
  id: number;
  name: string;
  price: number;
  availableQuantity: number;
}

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
  paymentMode: "Cash" | "GPay";
  status: "draft" | "generated";
}

export default function Bills() {
  const { bills, addBill, updateBill, deleteBill, deleteAllBills } = useBill();
  const iterationMonitor = useIterationMonitor();
  const { stockItems, reduceStock } = useStock();
  const { getCustomerSuggestions } = useCustomer();

  const handleDeleteBill = (billId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this bill? This action cannot be undone.",
      )
    ) {
      deleteBill(billId);
    }
  };

  const handleDeleteAllBills = () => {
    // First confirmation
    if (
      !confirm(
        "⚠️ WARNING: You are about to delete ALL bills permanently!\n\nThis action cannot be undone. All bill data will be lost forever.\n\nAre you absolutely sure you want to proceed?",
      )
    ) {
      return;
    }

    // Second confirmation with typing requirement
    const confirmText = prompt(
      "To confirm deletion of ALL bills, please type 'DELETE ALL BILLS' exactly:",
    );

    if (confirmText === "DELETE ALL BILLS") {
      deleteAllBills();
      alert("All bills have been permanently deleted.");
    } else {
      alert("Deletion cancelled. The confirmation text did not match.");
    }
  };

  const startEditBill = (bill: any) => {
    setEditingBill({ ...bill });
    setEditItems([...bill.items]);
    setIsEditDialogOpen(true);
  };

  const saveEditBill = () => {
    if (!editingBill) return;

    const updatedBill = {
      ...editingBill,
      items: editItems,
      subTotal: editItems.reduce((sum, item) => sum + item.total, 0),
    };

    updateBill(editingBill.id, updatedBill);
    setIsEditDialogOpen(false);
    setEditingBill(null);
    setEditItems([]);
  };

  const updateEditItem = (index: number, field: string, value: any) => {
    setEditItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === "price" || field === "quantity") {
            updated.total = updated.price * updated.quantity;
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const removeEditItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addManualItem = () => {
    const stockItem = stockItems.find(
      (item) => item.id === parseInt(itemToAdd.stockItemId),
    );
    if (!stockItem) return;

    const price = itemToAdd.customPrice
      ? parseFloat(itemToAdd.customPrice)
      : stockItem.price;
    const total = price * itemToAdd.quantity;

    const newItem: BillItem = {
      id: stockItem.id,
      name: stockItem.itemName,
      price: price,
      quantity: itemToAdd.quantity,
      total: total,
    };

    setSelectedItems((prev) => [...prev, newItem]);
    setItemToAdd({ stockItemId: "", quantity: 1, customPrice: "" });
  };

  const removeSelectedItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSelectedItem = (index: number, field: string, value: any) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === "price" || field === "quantity") {
            updated.total = updated.price * updated.quantity;
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const resetCreateBillForm = () => {
    setSelectedItems([]);
    setNewBill({
      billNumber: "",
      date: new Date().toISOString().split("T")[0],
      customerName: "",
      targetTotal: "",
      paymentMode: "GPay",
    });
    setItemToAdd({ stockItemId: "", quantity: 1, customPrice: "" });
  };

  const switchMode = (mode: boolean) => {
    setManualMode(mode);
    setSelectedItems([]); // Clear items when switching modes
  };
  const [activeTab, setActiveTab] = useState("view");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [isMegaReportOptionsOpen, setIsMegaReportOptionsOpen] = useState(false);
  const [megaReportOptions, setMegaReportOptions] = useState({
    hideCustomerNames: false,
    totalAtLastPage: true,
  });
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);

  // New bill form state
  const [newBill, setNewBill] = useState({
    billNumber: "",
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    targetTotal: "",
    paymentMode: "GPay" as "Cash" | "GPay",
  });

  const [selectedItems, setSelectedItems] = useState<BillItem[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [itemToAdd, setItemToAdd] = useState({
    stockItemId: "",
    quantity: 1,
    customPrice: "",
  });

  // Filter bills based on search and status
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesSearch =
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber.toString().includes(searchTerm);

      const matchesStatus =
        filterStatus === "all" || bill.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [bills, searchTerm, filterStatus]);

  // Determine payment mode based on customer name
  const getPaymentMode = (customerName: string): "Cash" | "GPay" => {
    const lowerName = customerName.toLowerCase();
    return lowerName === "cash" || lowerName.endsWith("_c") ? "Cash" : "GPay";
  };

  // Clean customer name for display
  const cleanCustomerName = (name: string): string => {
    return name.endsWith("_c") ? name.slice(0, -2) : name;
  };

  // Enhanced 200-iteration algorithm for auto-select
  const generate200IterationBillItems = (
    targetTotal: number,
    stockToUse: any[],
    previousItems: string[] = [],
    billNumber?: number,
  ): { items: BillItem[]; total: number } => {
    console.log("Starting 200-iteration algorithm for target:", targetTotal);

    // Get available items that aren't in previous bill to avoid repetition
    let availableItems = stockToUse.filter(
      (item) =>
        !previousItems.includes(item.name) && item.availableQuantity > 0,
    );

    if (availableItems.length < 2) {
      // If not enough unique items available, use all available items with stock
      availableItems = stockToUse.filter((item) => item.availableQuantity > 0);
      console.log(
        `Not enough unique items, using all available items with stock: ${availableItems.length}`,
      );
    }

    if (availableItems.length === 0) {
      return { items: [], total: 0 };
    }

    let bestMatch: { items: BillItem[]; total: number } | null = null;
    let closestDiff = Infinity;
    const tolerance = 30; // ±30 tolerance
    let iterationsPerformed = 0;

    // Start iteration monitoring
    let monitorId: string | null = null;
    if (billNumber && iterationMonitor) {
      monitorId = iterationMonitor.startIteration(billNumber, targetTotal);
      iterationMonitor.updateIteration(monitorId, { status: "running" });
      iterationMonitor.logIteration(
        monitorId,
        0,
        `Starting 200 iterations for auto-select with target ₹${targetTotal}`,
        "info",
      );
    }

    // Complete 200 iterations to find the best combination
    for (let attempt = 0; attempt < 200; attempt++) {
      iterationsPerformed++;

      // Log iteration progress
      if (monitorId && iterationMonitor && attempt % 20 === 0) {
        iterationMonitor.logIteration(
          monitorId,
          attempt + 1,
          `Iteration ${attempt + 1}/200: Trying new combination...`,
          "info",
        );
      }

      // Shuffle items randomly each iteration
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
      // Vary the number of items from 2 to 7 for more realistic bills
      const maxItems = Math.floor(Math.random() * 6) + 2; // Random between 2-7 items

      // First, ensure we get at least 2 items by being more lenient
      for (
        let itemIndex = 0;
        itemIndex < shuffledItems.length && selectedItems.length < maxItems;
        itemIndex++
      ) {
        const item = shuffledItems[itemIndex];

        // Try different quantities (up to 2 as per requirements)
        let bestQty = 0;
        let bestQtyTotal = 0;

        for (let qty = 1; qty <= Math.min(2, item.availableQuantity); qty++) {
          const itemCost = item.price * qty;
          const newTotal = currentTotal + itemCost;

          // Be more lenient for the first 2 items to ensure minimum requirement
          const currentTolerance =
            selectedItems.length < 2 ? tolerance * 2 : tolerance;

          // Check if this addition keeps us within bounds
          if (newTotal <= targetTotal + currentTolerance) {
            bestQty = qty;
            bestQtyTotal = itemCost;
          } else {
            break;
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

      // If we still don't have 2 items, force add the cheapest available items
      if (selectedItems.length < 2 && shuffledItems.length >= 2) {
        const remainingItems = shuffledItems.filter(
          (item) => !selectedItems.some((selected) => selected.id === item.id),
        );

        const sortedRemaining = remainingItems.sort(
          (a, b) => a.price - b.price,
        );

        for (const item of sortedRemaining) {
          if (selectedItems.length >= 2) break;

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

        // Log progress to monitor
        if (monitorId && iterationMonitor) {
          iterationMonitor.updateIteration(monitorId, {
            bestMatch: {
              items: selectedItems,
              total: currentTotal,
              difference: finalDiff,
            },
          });
        }

        if (finalDiff === 0) {
          if (monitorId && iterationMonitor) {
            iterationMonitor.logIteration(
              monitorId,
              attempt + 1,
              `Perfect match found! Total: ₹${currentTotal}, difference: ₹0`,
              "success",
            );
          }
        } else if (finalDiff <= tolerance && selectedItems.length >= 2) {
          if (monitorId && iterationMonitor) {
            iterationMonitor.logIteration(
              monitorId,
              attempt + 1,
              `Good match found! Total: ₹${currentTotal}, difference: ₹${finalDiff}`,
              "success",
            );
          }
        }
      }
    }

    // Fallback if no good match found
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

    // Complete iteration monitoring
    if (monitorId && iterationMonitor) {
      iterationMonitor.completeIteration(monitorId, {
        bestMatch: bestMatch
          ? {
              items: bestMatch.items,
              total: bestMatch.total,
              difference: closestDiff,
            }
          : null,
        currentIteration: 200,
      });
      iterationMonitor.logIteration(
        monitorId,
        200,
        `Completed all 200 iterations. Final result: ${bestMatch.items.length} items, total: ₹${bestMatch.total}, difference: ₹${closestDiff}`,
        "success",
      );
    }

    console.log(
      `Auto-select completed: ${bestMatch.items.length} items, total: ₹${bestMatch.total}, difference: ₹${closestDiff}`,
    );
    return bestMatch;
  };

  // Enhanced bill generator with improved constraints (legacy function, keeping for compatibility)
  const generateOptimalBillItems = (
    targetTotal: number,
    previousItems: string[] = [],
    billNumber?: number,
  ): { items: BillItem[]; total: number } => {
    console.log(
      "Generating bill items for target:",
      targetTotal,
      "Previous items:",
      previousItems,
    );

    // Get available items that aren't in previous bill
    let availableItems = stockItems.filter(
      (item) =>
        item.availableQuantity > 0 && !previousItems.includes(item.itemName),
    );

    if (availableItems.length < 2) {
      // If not enough unique items available, use all available items
      availableItems = stockItems.filter((item) => item.availableQuantity > 0);
    }

    console.log("Available items:", availableItems.length);

    if (availableItems.length === 0) {
      return { items: [], total: 0 };
    }

    // Shuffle available items for variety using Fisher-Yates algorithm
    const shuffledItems = [...availableItems];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [
        shuffledItems[j],
        shuffledItems[i],
      ];
    }

    // Start iteration monitoring if bill number provided
    let monitorId: string | null = null;
    if (billNumber && iterationMonitor) {
      monitorId = iterationMonitor.startIteration(billNumber, targetTotal);
      iterationMonitor.updateIteration(monitorId, { status: "running" });
      iterationMonitor.logIteration(
        monitorId,
        0,
        `Starting auto-select for bill ${billNumber} with target ₹${targetTotal}`,
        "info",
      );
    }

    // Strategy: Always ensure minimum 2 items, then optimize
    const selectedItems: BillItem[] = [];
    let currentTotal = 0;

    // Step 1: Add at least 2 items, starting with cheapest to leave room for optimization
    const sortedByPrice = [...shuffledItems].sort((a, b) => a.price - b.price);

    for (let i = 0; i < Math.min(2, sortedByPrice.length); i++) {
      const item = sortedByPrice[i];
      const quantity = 1; // Start with 1 quantity each

      const billItem: BillItem = {
        id: item.id,
        name: item.itemName,
        price: item.price,
        quantity,
        total: item.price * quantity,
      };

      selectedItems.push(billItem);
      currentTotal += billItem.total;
    }

    console.log("Initial 2 items selected, total:", currentTotal);

    // Step 2: Try to add more items or increase quantities to get closer to target
    const remainingBudget = targetTotal - currentTotal;
    const remainingItems = shuffledItems.filter(
      (item) =>
        !selectedItems.some((selected) => selected.name === item.itemName),
    );

    // Try to add more items within budget and tolerance
    for (const item of remainingItems) {
      if (selectedItems.length >= 7) break;

      const itemCost = item.price;
      if (currentTotal + itemCost <= targetTotal + 30) {
        const billItem: BillItem = {
          id: item.id,
          name: item.itemName,
          price: item.price,
          quantity: 1,
          total: itemCost,
        };

        selectedItems.push(billItem);
        currentTotal += itemCost;
      }
    }

    // Step 3: Try to increase quantities of existing items if under target
    if (currentTotal < targetTotal - 10) {
      for (const billItem of selectedItems) {
        if (
          billItem.quantity < 2 &&
          currentTotal + billItem.price <= targetTotal + 30
        ) {
          const originalItem = stockItems.find(
            (item) => item.id === billItem.id,
          );
          if (
            originalItem &&
            originalItem.availableQuantity >= billItem.quantity + 1
          ) {
            billItem.quantity += 1;
            billItem.total = billItem.price * billItem.quantity;
            currentTotal += billItem.price;
          }
        }
      }
    }

    console.log(
      "Final bill items:",
      selectedItems.length,
      "Total:",
      currentTotal,
    );

    // Complete iteration monitoring
    if (monitorId && iterationMonitor) {
      const difference = Math.abs(currentTotal - targetTotal);
      iterationMonitor.completeIteration(monitorId, {
        bestMatch: {
          items: selectedItems,
          total: currentTotal,
          difference: difference,
        },
        currentIteration: 1, // This is a simplified algorithm, not 200 iterations
      });
      iterationMonitor.logIteration(
        monitorId,
        1,
        `Auto-select completed: ${selectedItems.length} items, total: ₹${currentTotal}, difference: ₹${difference}`,
        "success",
      );
    }

    return { items: selectedItems, total: currentTotal };
  };

  // Get previous bill items to avoid repeats
  const getPreviousBillItems = (): string[] => {
    if (bills.length === 0) return [];

    // Get the most recent bill's items
    const lastBill = bills[bills.length - 1];
    return lastBill.items.map((item) => item.name);
  };

  // Auto-select items based on target total with enhanced algorithm
  const autoSelectItems = (targetTotal: number) => {
    if (!targetTotal || targetTotal <= 0) {
      alert("Please enter a valid target total amount.");
      return;
    }

    console.log("Auto-selecting items for target:", targetTotal);
    const previousItems = getPreviousBillItems();
    console.log("Previous bill items to avoid:", previousItems);

    // Generate a mock bill number for monitoring (use next bill number)
    const mockBillNumber =
      Math.max(...bills.map((b) => b.billNumber), 1000) + 1;

    // Use the stock items in the format expected by the algorithm
    const stockForAlgorithm = stockItems
      .filter((item) => item.availableQuantity > 0)
      .map((item) => ({
        id: item.id,
        name: item.itemName,
        price: item.price,
        availableQuantity: item.availableQuantity,
      }));

    // Switch to iteration monitor tab to show progress
    setActiveTab("monitor");

    const result = generate200IterationBillItems(
      targetTotal,
      stockForAlgorithm,
      previousItems,
      mockBillNumber,
    );

    if (result.items.length === 0) {
      alert(
        "Unable to generate bill items. Please check stock availability or try manual mode.",
      );
      // Switch back to bills tab
      setActiveTab("view");
      return;
    }

    console.log("Generated items:", result.items);
    setSelectedItems(result.items);

    // Switch back to bills tab after a short delay to show the result
    setTimeout(() => {
      setActiveTab("view");
    }, 1000);

    // Provide feedback about the generation
    const difference = Math.abs(result.total - targetTotal);
    console.log(
      `Bill generated with ${result.items.length} items, total: ₹${result.total}, difference from target: ₹${difference}`,
    );

    if (difference > 30) {
      console.warn(
        `Generated bill total (₹${result.total}) differs from target (₹${targetTotal}) by ₹${difference}`,
      );
    }
  };

  const handleCreateBill = () => {
    const paymentMode = getPaymentMode(newBill.customerName);
    const displayName = cleanCustomerName(newBill.customerName);

    const bill: any = {
      id: `BILL-${String(bills.length + 1).padStart(3, "0")}`,
      billNumber:
        parseInt(newBill.billNumber) ||
        Math.max(...bills.map((b) => b.billNumber)) + 1,
      date: new Date(newBill.date).toLocaleDateString("en-GB"),
      customerName: displayName,
      items: selectedItems,
      subTotal: selectedItems.reduce((sum, item) => sum + item.total, 0),
      expectedTotal:
        parseFloat(newBill.targetTotal) ||
        selectedItems.reduce((sum, item) => sum + item.total, 0),
      paymentMode,
      status: "draft",
      difference:
        (parseFloat(newBill.targetTotal) ||
          selectedItems.reduce((sum, item) => sum + item.total, 0)) -
        selectedItems.reduce((sum, item) => sum + item.total, 0),
      tolerance: 0,
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

    addBill(bill);

    // Update stock quantities
    selectedItems.forEach((billItem) => {
      const success = reduceStock(billItem.id, billItem.quantity);
      if (!success) {
        console.warn(`Failed to reduce stock for ${billItem.name}`);
      }
    });

    // Reset form
    setNewBill({
      billNumber: "",
      date: new Date().toISOString().split("T")[0],
      customerName: "",
      targetTotal: "",
      paymentMode: "GPay",
    });
    setSelectedItems([]);
    setIsCreateDialogOpen(false);
    setActiveTab("view");
  };

  const generatePDF = async (bill: any) => {
    try {
      // Create HTML content for the bill
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill ${bill.billNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px 40px 40px 0.70cm;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              color: #333;
            }
            .header h2 {
              margin: 0 0 5px 0;
              font-size: 18px;
              color: #666;
            }
            .header p {
              margin: 0;
              color: #888;
              font-size: 14px;
            }
            .bill-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 30px 0;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 8px;
            }
            .bill-info div {
              margin: 5px 0;
            }
            .bill-info strong {
              color: #333;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .items-table th, .items-table td {
              border: 1px solid #ddd;
              padding: 12px 8px;
              text-align: left;
            }
            .items-table th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #333;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              background-color: #e9ecef !important;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .signature {
              text-align: center;
              margin-top: 40px;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
              .header {
                page-break-inside: avoid;
                page-break-after: avoid;
              }
              .items-table {
                page-break-inside: avoid;
                page-break-before: avoid;
                page-break-after: avoid;
              }
              .bill-info {
                page-break-inside: avoid;
                page-break-after: avoid;
              }
              .footer {
                page-break-before: avoid;
                page-break-inside: avoid;
              }
              /* Prevent all page breaks for single bill */
              * {
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
                break-before: avoid !important;
                break-inside: avoid !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Bill of Supply</h1>
            <h2>${bill.headerInfo?.agencyName || "Sadhana Agency"}</h2>
            <p>${bill.headerInfo?.address || "Harsila (Dewalchaura), Bageshwar, Uttarakhand"}</p>
          </div>

          <div class="bill-info">
            <div><strong>Bill No:</strong> ${bill.billNumber}</div>
            <div><strong>Date:</strong> ${bill.date}</div>
            <div><strong>Customer:</strong> ${bill.customerName}</div>
            <div><strong>Payment Mode:</strong> ${bill.paymentMode}</div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td>₹${item.total}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4"><strong>Sub Total:</strong></td>
                <td><strong>₹${bill.subTotal}</strong></td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <p>${bill.footerInfo?.declaration || "We hereby declare that the tax on supplies has been paid by us under the composition scheme."}</p>
            <div class="signature">${bill.footerInfo?.signature || "Authorized Signature"}</div>
          </div>
        </body>
        </html>
      `;

      // Create temporary element for html2canvas
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "210mm";
      tempDiv.style.backgroundColor = "white";
      document.body.appendChild(tempDiv);

      // Wait for styles to load
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate canvas and PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      // Remove temporary element
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 210;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Use bill number as filename
      const fileName = `${bill.billNumber}.pdf`;
      pdf.save(fileName);

      console.log(`PDF generated successfully: ${fileName}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Filter bills by date range
  const filterBillsByDateRange = (
    billsList: any[],
    fromDate: string,
    toDate: string,
  ) => {
    if (!fromDate && !toDate) return billsList;

    return billsList.filter((bill) => {
      const billDate = new Date(bill.date.split("-").reverse().join("-")); // Convert DD-MM-YYYY to YYYY-MM-DD
      const from = fromDate ? new Date(fromDate) : new Date("1900-01-01");
      const to = toDate ? new Date(toDate) : new Date("2100-12-31");

      return billDate >= from && billDate <= to;
    });
  };

  // Enhanced batch PDF download with date range filtering
  const generateBatchPDF = async (
    billsToGenerate: any[],
    useCustomRange = false,
  ) => {
    let filteredBills = billsToGenerate;

    if (useCustomRange && (dateRange.from || dateRange.to)) {
      filteredBills = filterBillsByDateRange(
        billsToGenerate,
        dateRange.from,
        dateRange.to,
      );

      if (filteredBills.length === 0) {
        alert("No bills found in the selected date range.");
        return;
      }
    }

    if (filteredBills.length === 0) {
      alert("No bills selected for PDF generation.");
      return;
    }

    const confirmed = confirm(
      `Generate ${filteredBills.length} PDF files?${useCustomRange ? ` (Date range: ${dateRange.from || "All"} to ${dateRange.to || "All"})` : ""} This may take a few moments.`,
    );

    if (!confirmed) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < filteredBills.length; i++) {
        const bill = filteredBills[i];
        try {
          await generatePDF(bill);
          successCount++;

          // Add delay between downloads to prevent browser blocking
          if (i < filteredBills.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        } catch (error) {
          console.error(
            `Error generating PDF for bill ${bill.billNumber}:`,
            error,
          );
          errorCount++;
        }
      }

      if (errorCount === 0) {
        alert(`Successfully generated ${successCount} PDF files!`);
      } else {
        alert(
          `Generated ${successCount} PDF files successfully. ${errorCount} files failed to generate.`,
        );
      }
    } catch (error) {
      console.error("Error in batch PDF generation:", error);
      alert("Error generating PDFs. Please try again.");
    }
  };

  const generateMegaReport = async (format: "pdf" | "excel") => {
    const generatedBills = bills.filter((b) => b.status === "generated");

    if (generatedBills.length === 0) {
      alert("No generated bills found for report.");
      return;
    }

    if (format === "excel") {
      // Excel export
      const reportData = generatedBills.map((bill) => ({
        Date: bill.date,
        "Bill Number": bill.billNumber,
        "Customer Name": bill.customerName,
        "Bill Total": bill.subTotal,
      }));

      // Add total sum row
      const totalSum = generatedBills.reduce(
        (sum, bill) => sum + bill.subTotal,
        0,
      );
      reportData.push({
        Date: "",
        "Bill Number": "",
        "Customer Name": "TOTAL",
        "Bill Total": totalSum,
      });

      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bill Report");
      XLSX.writeFile(
        workbook,
        `Bill_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } else {
      // PDF export using HTML
      const totalSum = generatedBills.reduce(
        (sum, bill) => sum + bill.subTotal,
        0,
      );
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Mega Bill Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              color: #333;
            }
            .header h2 {
              margin: 0 0 5px 0;
              font-size: 18px;
              color: #666;
            }
            .header p {
              margin: 0;
              color: #888;
              font-size: 14px;
            }
            .report-info {
              text-align: center;
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .report-table th, .report-table td {
              border: 1px solid #ddd;
              padding: 12px 8px;
              text-align: left;
            }
            .report-table th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #333;
            }
            .report-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              background-color: #e9ecef !important;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .header {
                page-break-inside: avoid;
                page-break-after: avoid;
              }
              .report-table {
                page-break-inside: avoid;
                page-break-before: avoid;
                page-break-after: avoid;
              }
              .report-info {
                page-break-inside: avoid;
                page-break-after: avoid;
              }
              .footer {
                page-break-before: avoid;
                page-break-inside: avoid;
              }
              /* Prevent page breaks for mega report */
              * {
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
                break-before: avoid !important;
                break-inside: avoid !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mega Bill Report</h1>
            <h2>Sadhana Agency</h2>
            <p>Harsila (Dewalchaura), Bageshwar, Uttarakhand</p>
          </div>

          <div class="report-info">
            <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Bills:</strong> ${generatedBills.length}</p>
            <p><strong>Period:</strong> ${generatedBills.length > 0 ? `${generatedBills[0].date} to ${generatedBills[generatedBills.length - 1].date}` : "N/A"}</p>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th>Date</th>
                ${megaReportOptions.hideCustomerNames ? "" : "<th>Customer Name</th>"}
                <th>Bill Number</th>
                <th>Bill Total</th>
              </tr>
            </thead>
            <tbody>
              ${generatedBills
                .map(
                  (bill) => `
                <tr>
                  <td>${bill.date}</td>
                  ${megaReportOptions.hideCustomerNames ? "" : `<td>${bill.customerName}</td>`}
                  <td>${bill.billNumber}</td>
                  <td>₹${bill.subTotal.toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
            ${
              !megaReportOptions.totalAtLastPage
                ? `
            <tfoot>
              <tr class="total-row">
                <td colspan="${megaReportOptions.hideCustomerNames ? "2" : "3"}"><strong>TOTAL:</strong></td>
                <td><strong>₹${totalSum.toLocaleString()}</strong></td>
              </tr>
            </tfoot>
            `
                : ""
            }
          </table>

          ${
            megaReportOptions.totalAtLastPage
              ? `
          <div style="page-break-before: always; padding-top: 50px; text-align: center;">
            <h2>Total Summary</h2>
            <div style="margin: 40px auto; padding: 30px; border: 2px solid #333; border-radius: 10px; width: 300px; background-color: #f8f9fa;">
              <p style="font-size: 18px; margin: 0;"><strong>Total Bills:</strong> ${generatedBills.length}</p>
              <p style="font-size: 24px; margin: 20px 0 0 0; color: #333;"><strong>GRAND TOTAL: ₹${totalSum.toLocaleString()}</strong></p>
            </div>
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>© Sadhana Agency - All rights reserved</p>
            <p>This is a computer-generated report</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load then trigger print dialog
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
      } else {
        // Fallback: create blob and download
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Mega_Bill_Report_${new Date().toISOString().split("T")[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bills Management</h1>
            <p className="text-muted-foreground">
              Create, edit, and manage customer bills with automatic item
              selection
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsMegaReportOptionsOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Mega Report PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => generateMegaReport("excel")}
            >
              <Download className="h-4 w-4 mr-2" />
              Mega Report Excel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                generateBatchPDF(bills.filter((b) => b.status === "generated"))
              }
              disabled={
                bills.filter((b) => b.status === "generated").length === 0
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Download All PDFs (
              {bills.filter((b) => b.status === "generated").length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDateRangeDialogOpen(true)}
              disabled={
                bills.filter((b) => b.status === "generated").length === 0
              }
            >
              <Calendar className="h-4 w-4 mr-2" />
              Download by Date Range
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllBills}
              disabled={bills.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Bills
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="view">Bills Management</TabsTrigger>
            <TabsTrigger value="monitor">Iteration Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Bills</p>
                      <p className="text-2xl font-bold">{bills.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        ₹
                        {bills
                          .reduce((sum, bill) => sum + bill.subTotal, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Items in Stock</p>
                      <p className="text-2xl font-bold">
                        {
                          stockItems.filter((s) => s.availableQuantity > 0)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Draft Bills</p>
                      <p className="text-2xl font-bold">
                        {bills.filter((b) => b.status === "draft").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bills by customer, ID, or bill number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="generated">Generated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bills Table */}
            <Card>
              <CardHeader>
                <CardTitle>Bills List</CardTitle>
                <CardDescription>
                  Manage all customer bills. Click actions to view, edit, or
                  generate PDFs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Bill #</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Customer</th>
                        <th className="text-left p-3 font-medium">Items</th>
                        <th className="text-left p-3 font-medium">Total</th>
                        <th className="text-left p-3 font-medium">Payment</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill) => (
                        <tr
                          key={bill.id}
                          className="border-b hover:bg-accent/50 transition-colors"
                        >
                          <td className="p-3 font-medium">{bill.billNumber}</td>
                          <td className="p-3">{bill.date}</td>
                          <td className="p-3">{bill.customerName}</td>
                          <td className="p-3">{bill.items.length} items</td>
                          <td className="p-3 font-medium">
                            ₹{bill.subTotal.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                bill.paymentMode === "GPay"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {bill.paymentMode}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                bill.status === "generated"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                bill.status === "generated"
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }
                            >
                              {bill.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBill(bill)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditBill(bill)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generatePDF(bill)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteBill(bill.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Create Bill Dialog */}
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) resetCreateBillForm();
              }}
            >
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Bill</DialogTitle>
                  <DialogDescription>
                    {manualMode
                      ? "Manually select items and set quantities/prices"
                      : "Enter customer details and the system will auto-select items to match the target total"}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 border-b pb-4">
                  <Label>Creation Mode:</Label>
                  <Button
                    variant={!manualMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => switchMode(false)}
                  >
                    Auto Mode
                  </Button>
                  <Button
                    variant={manualMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => switchMode(true)}
                  >
                    Manual Mode
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Bill Details Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bill Number</Label>
                      <Input
                        value={newBill.billNumber}
                        onChange={(e) =>
                          setNewBill((prev) => ({
                            ...prev,
                            billNumber: e.target.value,
                          }))
                        }
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newBill.date}
                        onChange={(e) =>
                          setNewBill((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <div className="relative">
                        <Input
                          value={newBill.customerName}
                          onChange={(e) => {
                            const name = e.target.value;
                            setNewBill((prev) => ({
                              ...prev,
                              customerName: name,
                              paymentMode: getPaymentMode(name),
                            }));

                            // Update customer suggestions
                            if (name.length >= 2) {
                              const suggestions = getCustomerSuggestions(name);
                              setCustomerSuggestions(suggestions);
                            } else {
                              setCustomerSuggestions([]);
                            }
                          }}
                          placeholder="Enter customer name (use _c suffix for cash)"
                        />

                        {/* Customer suggestions dropdown */}
                        {customerSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {customerSuggestions.map((customer) => (
                              <div
                                key={customer.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                onClick={() => {
                                  setNewBill((prev) => ({
                                    ...prev,
                                    customerName: customer.name,
                                    paymentMode: customer.preferredPayment,
                                  }));
                                  setCustomerSuggestions([]);
                                }}
                              >
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-gray-500">
                                  {customer.totalTransactions} transactions • ₹{customer.totalAmount.toLocaleString()} total
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Total (₹)</Label>
                      <Input
                        value={newBill.targetTotal}
                        onChange={(e) =>
                          setNewBill((prev) => ({
                            ...prev,
                            targetTotal: e.target.value,
                          }))
                        }
                        placeholder="Target amount to approximate"
                        type="number"
                      />
                    </div>
                  </div>

                  {!manualMode ? (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() =>
                            autoSelectItems(Number(newBill.targetTotal))
                          }
                          disabled={!newBill.targetTotal}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Auto Select Items
                        </Button>
                        <Badge variant="outline">
                          Payment Mode: {newBill.paymentMode}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        <div className="font-medium mb-1">
                          Auto Selection Features:
                        </div>
                        <ul className="space-y-1">
                          <li>
                            • Avoids items from the previous bill to prevent
                            repeats
                          </li>
                          <li>• Ensures minimum 2 items per bill</li>
                          <li>• Matches target total within ±₹30 tolerance</li>
                          <li>
                            • Maximum 7 items per bill, up to 2 quantity each
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 bg-muted/30 p-6 rounded-lg">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">
                          Manual Item Selection
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Add items one by one with custom quantities and prices
                        </p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="space-y-2 lg:col-span-2">
                          <Label className="text-base font-medium">
                            Select Item
                          </Label>
                          <Select
                            value={itemToAdd.stockItemId}
                            onValueChange={(value) =>
                              setItemToAdd((prev) => ({
                                ...prev,
                                stockItemId: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Choose an item from stock..." />
                            </SelectTrigger>
                            <SelectContent>
                              {stockItems
                                .filter((item) => item.availableQuantity > 0)
                                .map((item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.id.toString()}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {item.itemName}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        ₹{item.price} • Stock:{" "}
                                        {item.availableQuantity}{" "}
                                        {item.blocked && "• (Blocked)"}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            value={itemToAdd.quantity}
                            onChange={(e) =>
                              setItemToAdd((prev) => ({
                                ...prev,
                                quantity: parseInt(e.target.value) || 1,
                              }))
                            }
                            min="1"
                            className="h-12 text-center text-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">
                            Custom Price
                          </Label>
                          <Input
                            type="number"
                            value={itemToAdd.customPrice}
                            onChange={(e) =>
                              setItemToAdd((prev) => ({
                                ...prev,
                                customPrice: e.target.value,
                              }))
                            }
                            placeholder="Optional override"
                            className="h-12"
                          />
                          <p className="text-xs text-muted-foreground">
                            Leave empty to use default price
                          </p>
                        </div>
                        <div className="space-y-2 flex flex-col justify-end">
                          <Button
                            onClick={addManualItem}
                            disabled={!itemToAdd.stockItemId}
                            className="w-full h-12 bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Add to Bill
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Items */}
                  {selectedItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Selected Items</Label>
                        {!manualMode && newBill.targetTotal && (
                          <div className="text-sm text-muted-foreground">
                            Target: ₹{newBill.targetTotal} | Actual: ₹
                            {selectedItems.reduce(
                              (sum, item) => sum + item.total,
                              0,
                            )}{" "}
                            | Difference: ���
                            {Math.abs(
                              Number(newBill.targetTotal) -
                                selectedItems.reduce(
                                  (sum, item) => sum + item.total,
                                  0,
                                ),
                            )}
                          </div>
                        )}
                      </div>
                      <div className="border rounded-lg">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/20">
                              <th className="text-left p-3 font-medium">
                                Item
                              </th>
                              <th className="text-left p-3 font-medium">
                                Quantity
                              </th>
                              <th className="text-left p-3 font-medium">
                                Price
                              </th>
                              <th className="text-left p-3 font-medium">
                                Total
                              </th>
                              <th className="text-left p-3 font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedItems.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3">
                                  {manualMode ? (
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateSelectedItem(
                                          index,
                                          "quantity",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-20"
                                    />
                                  ) : (
                                    item.quantity
                                  )}
                                </td>
                                <td className="p-3">
                                  {manualMode ? (
                                    <Input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) =>
                                        updateSelectedItem(
                                          index,
                                          "price",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-24"
                                    />
                                  ) : (
                                    `₹${item.price}`
                                  )}
                                </td>
                                <td className="p-3">��{item.total}</td>
                                <td className="p-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeSelectedItem(index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/20 font-bold">
                              <td colSpan={3} className="p-3">
                                Total:
                              </td>
                              <td className="p-3">
                                ₹
                                {selectedItems.reduce(
                                  (sum, item) => sum + item.total,
                                  0,
                                )}
                              </td>
                              <td className="p-3"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Validation Alerts */}
                  {selectedItems.length > 0 && (
                    <div className="space-y-2">
                      {selectedItems.length < 2 && (
                        <Alert>
                          <AlertDescription>
                            ⚠️ Bills should have at least 2 items for optimal
                            generation.
                          </AlertDescription>
                        </Alert>
                      )}
                      {!manualMode &&
                        newBill.targetTotal &&
                        Math.abs(
                          Number(newBill.targetTotal) -
                            selectedItems.reduce(
                              (sum, item) => sum + item.total,
                              0,
                            ),
                        ) > 30 && (
                          <Alert>
                            <AlertDescription>
                              ⚠️ Total differs from target by more than ₹30.
                              Consider adjusting target or using manual mode.
                            </AlertDescription>
                          </Alert>
                        )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateBill}
                      disabled={
                        !newBill.customerName || selectedItems.length === 0
                      }
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Create Bill
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bill Details View */}
            {selectedBill && !isEditDialogOpen && (
              <Dialog
                open={!!selectedBill}
                onOpenChange={() => setSelectedBill(null)}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bill Details - {selectedBill.id}</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bill Number</Label>
                        <p className="font-medium">{selectedBill.billNumber}</p>
                      </div>
                      <div>
                        <Label>Date</Label>
                        <p className="font-medium">{selectedBill.date}</p>
                      </div>
                      <div>
                        <Label>Customer</Label>
                        <p className="font-medium">
                          {selectedBill.customerName}
                        </p>
                      </div>
                      <div>
                        <Label>Payment Mode</Label>
                        <Badge
                          variant={
                            selectedBill.paymentMode === "GPay"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedBill.paymentMode}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label>Items</Label>
                      <div className="border rounded-lg">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/20">
                              <th className="text-left p-3 font-medium">
                                Item
                              </th>
                              <th className="text-left p-3 font-medium">
                                Quantity
                              </th>
                              <th className="text-left p-3 font-medium">
                                Price
                              </th>
                              <th className="text-left p-3 font-medium">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedBill.items.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3">{item.quantity}</td>
                                <td className="p-3">₹{item.price}</td>
                                <td className="p-3">₹{item.total}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/20 font-bold">
                              <td colSpan={3} className="p-3">
                                Sub Total:
                              </td>
                              <td className="p-3">₹{selectedBill.subTotal}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Edit Bill Dialog */}
            {editingBill && (
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      Edit Bill - {editingBill.billNumber}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Customer Name</Label>
                        <Input
                          value={editingBill.customerName}
                          onChange={(e) =>
                            setEditingBill((prev) => ({
                              ...prev,
                              customerName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Payment Mode</Label>
                        <Select
                          value={editingBill.paymentMode}
                          onValueChange={(value) =>
                            setEditingBill((prev) => ({
                              ...prev,
                              paymentMode: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="GPay">GPay</SelectItem>
                            <SelectItem value="Bank">Bank</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Items</Label>
                      <div className="border rounded-lg">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/20">
                              <th className="text-left p-3 font-medium">
                                Item
                              </th>
                              <th className="text-left p-3 font-medium">
                                Quantity
                              </th>
                              <th className="text-left p-3 font-medium">
                                Price
                              </th>
                              <th className="text-left p-3 font-medium">
                                Total
                              </th>
                              <th className="text-left p-3 font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {editItems.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateEditItem(
                                        index,
                                        "quantity",
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20"
                                  />
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) =>
                                      updateEditItem(
                                        index,
                                        "price",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-24"
                                  />
                                </td>
                                <td className="p-3">���{item.total}</td>
                                <td className="p-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeEditItem(index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/20 font-bold">
                              <td colSpan={3} className="p-3">
                                Sub Total:
                              </td>
                              <td className="p-3">
                                ₹
                                {editItems.reduce(
                                  (sum, item) => sum + item.total,
                                  0,
                                )}
                              </td>
                              <td className="p-3"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveEditBill}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Date Range PDF Download Dialog */}
            <Dialog
              open={isDateRangeDialogOpen}
              onOpenChange={setIsDateRangeDialogOpen}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Download PDFs by Date Range</DialogTitle>
                  <DialogDescription>
                    Select a date range to filter bills for PDF download
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            from: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            to: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div className="text-sm space-y-1">
                      {(() => {
                        const filteredBills = filterBillsByDateRange(
                          bills.filter((b) => b.status === "generated"),
                          dateRange.from,
                          dateRange.to,
                        );
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Bills in range:</span>
                              <span>{filteredBills.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Date range:</span>
                              <span>
                                {dateRange.from || "All"} to{" "}
                                {dateRange.to || "All"}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDateRangeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        generateBatchPDF(
                          bills.filter((b) => b.status === "generated"),
                          true,
                        );
                        setIsDateRangeDialogOpen(false);
                      }}
                      disabled={
                        filterBillsByDateRange(
                          bills.filter((b) => b.status === "generated"),
                          dateRange.from,
                          dateRange.to,
                        ).length === 0
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDFs
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Mega Report Options Dialog */}
            <Dialog
              open={isMegaReportOptionsOpen}
              onOpenChange={setIsMegaReportOptionsOpen}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Mega Report PDF Options</DialogTitle>
                  <DialogDescription>
                    Customize your mega report PDF settings
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hideCustomerNames"
                      checked={megaReportOptions.hideCustomerNames}
                      onChange={(e) =>
                        setMegaReportOptions((prev) => ({
                          ...prev,
                          hideCustomerNames: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <Label htmlFor="hideCustomerNames">
                      Hide Customer Names
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="totalAtLastPage"
                      checked={megaReportOptions.totalAtLastPage}
                      onChange={(e) =>
                        setMegaReportOptions((prev) => ({
                          ...prev,
                          totalAtLastPage: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <Label htmlFor="totalAtLastPage">
                      Show Total on Last Page
                    </Label>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">
                      Preview Settings
                    </h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Customer Names:</span>
                        <span>
                          {megaReportOptions.hideCustomerNames
                            ? "Hidden"
                            : "Visible"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Position:</span>
                        <span>
                          {megaReportOptions.totalAtLastPage
                            ? "Last Page"
                            : "Bottom of Table"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsMegaReportOptionsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      generateMegaReport("pdf");
                      setIsMegaReportOptionsOpen(false);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <IterationMonitorTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
