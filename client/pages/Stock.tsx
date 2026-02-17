import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Save,
  Upload,
  Download,
  Search,
  Package,
  AlertTriangle,
  Trash2,
  RefreshCw,
  FileText,
  TrendingDown,
  TrendingUp,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SampleDataGenerator } from "@/components/SampleDataGenerator";
import * as XLSX from "xlsx";
import { useStock } from "@/components/StockContext";
import { useBill } from "@/components/BillContext";
import { useAccount } from "@/components/AccountManager";

// Mock stock data based on your Python code structure
const mockStockData = [
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

interface StockItem {
  id: number;
  itemName: string;
  price: number;
  availableQuantity: number;
  lowStockThreshold: number;
}

export default function Stock() {
  const { activeAccount, accounts, setActiveAccount } = useAccount();

  // Auto-switch to test different accounts via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("switch") === "himalaya" && activeAccount?.id === "1") {
      const himalayaAccount = accounts.find((acc) => acc.id === "2");
      if (himalayaAccount) {
        setActiveAccount(himalayaAccount);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [activeAccount, accounts, setActiveAccount]);
  const {
    stockItems,
    updateStockItem,
    addStockItem,
    deleteStockItem,
    importStockItems,
    toggleBlockItem,
    deleteAllStock,
  } = useStock();
  const { bills } = useBill();

  // Log when account changes to help debug
  React.useEffect(() => {
    if (activeAccount) {
      console.log(
        `Stock page: Account changed to ${activeAccount.name} (ID: ${activeAccount.id})`,
      );
      console.log(
        `Stock page: Current stock items count: ${stockItems.length}`,
      );
    }
  }, [activeAccount?.id, stockItems.length]);

  // Function to check if a stock item is used in any bills
  const isStockUsedInBills = (
    stockId: number,
  ): { isUsed: boolean; billNumbers: number[] } => {
    const billNumbers: number[] = [];

    bills.forEach((bill) => {
      const isUsedInBill = bill.items.some((item) => item.id === stockId);
      if (isUsedInBill) {
        billNumbers.push(bill.billNumber);
      }
    });

    return {
      isUsed: billNumbers.length > 0,
      billNumbers,
    };
  };

  const handleDeleteAllStock = () => {
    // Check if any stock items are used in bills
    const usedItems: { itemName: string; billNumbers: number[] }[] = [];

    stockItems.forEach((item) => {
      const usage = isStockUsedInBills(item.id);
      if (usage.isUsed) {
        usedItems.push({
          itemName: item.itemName,
          billNumbers: usage.billNumbers,
        });
      }
    });

    if (usedItems.length > 0) {
      const usedItemsText = usedItems
        .map(
          (item) =>
            `• ${item.itemName} (Bills: ${item.billNumbers.join(", ")})`,
        )
        .join("\n");

      alert(
        `Cannot delete all stock items because the following items are used in bills:\n\n${usedItemsText}\n\n` +
          "Please remove these items from all bills before bulk deletion.",
      );
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete ALL stock items? This action cannot be undone.",
      )
    ) {
      deleteAllStock();
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({
    itemName: "",
    price: "",
    availableQuantity: "",
    lowStockThreshold: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: "",
    price: "",
    availableQuantity: "",
    lowStockThreshold: "",
  });
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    itemPrefix: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    return stockItems
      .filter((item) =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [stockItems, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = stockItems.length;
    const totalValue = stockItems.reduce(
      (sum, item) => sum + item.price * item.availableQuantity,
      0,
    );
    const lowStockItems = stockItems.filter(
      (item) => item.availableQuantity <= item.lowStockThreshold,
    );
    const outOfStockItems = stockItems.filter(
      (item) => item.availableQuantity === 0,
    );

    return {
      totalItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
    };
  }, [stockItems]);

  const startEdit = (item: StockItem) => {
    setEditingId(item.id);
    setEditValues({
      itemName: item.itemName,
      price: item.price.toString(),
      availableQuantity: item.availableQuantity.toString(),
      lowStockThreshold: item.lowStockThreshold.toString(),
    });
  };

  // Handle prefix search for items
  const handlePrefixSearch = (prefix: string) => {
    setQuickAddData((prev) => ({ ...prev, itemPrefix: prefix }));

    if (prefix.length >= 2) {
      const matches = stockItems
        .filter((item) =>
          item.itemName.toLowerCase().includes(prefix.toLowerCase()),
        )
        .sort((a, b) => a.itemName.localeCompare(b.itemName));
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  // Handle quick add quantity to existing item
  const handleQuickAdd = () => {
    if (!quickAddData.itemPrefix || !quickAddData.quantity) {
      alert("Please enter item name and quantity");
      return;
    }

    const quantity = parseInt(quickAddData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    // Check if item exists
    const existingItem = stockItems.find(
      (item) =>
        item.itemName.toLowerCase() === quickAddData.itemPrefix.toLowerCase(),
    );

    if (existingItem) {
      // Add quantity to existing item
      updateStockItem(existingItem.id, {
        availableQuantity: existingItem.availableQuantity + quantity,
      });
      alert(`Added ${quantity} units to ${existingItem.itemName}`);
    } else {
      // Create new item
      const newStockItem = {
        id: Math.max(...stockItems.map((item) => item.id), 0) + 1,
        itemName: quickAddData.itemPrefix,
        price: 0, // Default price, user can edit later
        availableQuantity: quantity,
        lowStockThreshold: 10, // Default threshold
      };
      addStockItem(newStockItem);
      alert(
        `Created new item: ${quickAddData.itemPrefix} with ${quantity} units`,
      );
    }

    // Reset form but keep date
    setQuickAddData((prev) => ({
      itemPrefix: "",
      quantity: "",
      date: prev.date,
    }));
    setSuggestions([]);
    setIsQuickAddOpen(false);
  };

  const saveEdit = () => {
    if (editingId === null) return;

    updateStockItem(editingId, {
      itemName: editValues.itemName,
      price: parseFloat(editValues.price) || 0,
      availableQuantity: parseInt(editValues.availableQuantity) || 0,
      lowStockThreshold: parseInt(editValues.lowStockThreshold) || 0,
    });
    setEditingId(null);
    setAdjustmentReason("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAdjustmentReason("");
  };

  const addNewItem = () => {
    const newId = Math.max(...stockItems.map((item) => item.id)) + 1;
    const item = {
      id: newId,
      itemName: newItem.itemName,
      price: parseFloat(newItem.price) || 0,
      availableQuantity: parseInt(newItem.availableQuantity) || 0,
      lowStockThreshold: parseInt(newItem.lowStockThreshold) || 0,
    };

    addStockItem(item);
    setNewItem({
      itemName: "",
      price: "",
      availableQuantity: "",
      lowStockThreshold: "",
    });
    setIsAddDialogOpen(false);
  };

  const adjustQuantity = (id: number, adjustment: number) => {
    const item = stockItems.find((item) => item.id === id);
    if (item) {
      updateStockItem(id, {
        availableQuantity: Math.max(0, item.availableQuantity + adjustment),
      });
    }
  };

  const deleteItem = (id: number) => {
    const usage = isStockUsedInBills(id);

    if (usage.isUsed) {
      const stockItem = stockItems.find((item) => item.id === id);
      alert(
        `Cannot delete "${stockItem?.itemName}" because it is used in the following bills: ${usage.billNumbers.join(", ")}\n\n` +
          "Please remove this item from all bills before deleting it from stock.",
      );
      return;
    }

    const stockItem = stockItems.find((item) => item.id === id);
    if (
      confirm(
        `Are you sure you want to delete "${stockItem?.itemName}"? This action cannot be undone.`,
      )
    ) {
      deleteStockItem(id);
    }
  };

  const exportToExcel = () => {
    // Create Excel-compatible data
    const excelData = stockItems.map((item) => ({
      "Item Name": item.itemName,
      Price: item.price,
      "Available Quantity": item.availableQuantity,
      "Low Stock Threshold": item.lowStockThreshold,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Data");
    XLSX.writeFile(workbook, "stock_data.xlsx");
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // More flexible column name matching
          const getColumnValue = (row: any, possibleNames: string[]) => {
            for (const name of possibleNames) {
              if (
                row[name] !== undefined &&
                row[name] !== null &&
                row[name] !== ""
              ) {
                return row[name];
              }
            }
            return null;
          };

          // Validate and import data with flexible column names
          const importedItems = jsonData
            .map((row: any, index) => {
              const maxId =
                stockItems.length > 0
                  ? Math.max(...stockItems.map((item) => item.id))
                  : 0;
              const newId = maxId + index + 1;

              const itemName = getColumnValue(row, [
                "Item Name",
                "item name",
                "name",
                "Name",
                "Item",
                "item",
                "Product",
                "product",
              ]);

              const price = getColumnValue(row, [
                "Price",
                "price",
                "Cost",
                "cost",
                "Rate",
                "rate",
                "Amount",
                "amount",
              ]);

              const quantity = getColumnValue(row, [
                "Available Quantity",
                "available quantity",
                "quantity",
                "Quantity",
                "Stock",
                "stock",
                "Available",
                "available",
                "Qty",
                "qty",
              ]);

              const threshold = getColumnValue(row, [
                "Low Stock Threshold",
                "low stock threshold",
                "threshold",
                "Threshold",
                "Min Stock",
                "min stock",
                "Alert Level",
                "alert level",
              ]);

              return {
                id: newId,
                itemName: itemName || "",
                price: parseFloat(price) || 0,
                availableQuantity: parseInt(quantity) || 0,
                lowStockThreshold: parseInt(threshold) || 10,
              };
            })
            .filter((item) => item.itemName && item.itemName.trim() !== ""); // Filter out empty items

          if (importedItems.length === 0) {
            alert(
              "No valid data found in the file. Please check that your Excel file has columns like 'Item Name', 'Price', 'Available Quantity', etc.",
            );
            return;
          }

          importStockItems(importedItems);
          alert(
            `Successfully imported ${importedItems.length} items from ${file.name}. ${jsonData.length - importedItems.length} rows were skipped due to missing data.`,
          );
        } catch (error) {
          alert(`Error reading file: ${error}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset the input
    event.target.value = "";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Management</h1>
            <p className="text-muted-foreground">
              Manage inventory items, track quantities, and monitor stock levels
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                const otherAccount = accounts.find(
                  (acc) => acc.id !== activeAccount?.id,
                );
                if (otherAccount) setActiveAccount(otherAccount);
              }}
              variant="secondary"
              size="sm"
              className="bg-blue-100 hover:bg-blue-200 text-blue-800"
            >
              🔄 Switch to{" "}
              {accounts.find((acc) => acc.id !== activeAccount?.id)?.name}
            </Button>
            <Button
              onClick={() => setIsQuickAddOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Quick Add Stock
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </span>
              </Button>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllStock}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Items</p>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total Value</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Low Stock</p>
                  <p className="text-2xl font-bold">{stats.lowStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Out of Stock</p>
                  <p className="text-2xl font-bold">{stats.outOfStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStockCount > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>{stats.lowStockCount} items</strong> are running low on
              stock:{" "}
              {stats.lowStockItems
                .slice(0, 3)
                .map((item) => item.itemName)
                .join(", ")}
              {stats.lowStockItems.length > 3 &&
                ` and ${stats.lowStockItems.length - 3} more`}
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Items</CardTitle>
            <CardDescription>
              Click on any cell to edit. Use +/- buttons for quick quantity
              adjustments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Item Name</th>
                    <th className="text-left p-3 font-medium">Price (₹)</th>
                    <th className="text-left p-3 font-medium">
                      Available Quantity
                    </th>
                    <th className="text-left p-3 font-medium">
                      Low Stock Alert
                    </th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Bill Usage</th>
                    <th className="text-left p-3 font-medium">Quick Adjust</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b hover:bg-accent/50 transition-colors",
                        item.availableQuantity === 0 && "bg-red-50",
                        item.availableQuantity <= item.lowStockThreshold &&
                          item.availableQuantity > 0 &&
                          "bg-orange-50",
                      )}
                    >
                      <td className="p-3">
                        {editingId === item.id ? (
                          <Input
                            value={editValues.itemName}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                itemName: e.target.value,
                              }))
                            }
                            className="w-48"
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:bg-accent rounded px-1"
                            onDoubleClick={() => startEdit(item)}
                          >
                            {item.itemName}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editValues.price}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                            className="w-20"
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:bg-accent rounded px-1"
                            onDoubleClick={() => startEdit(item)}
                          >
                            ₹{item.price}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editValues.availableQuantity}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                availableQuantity: e.target.value,
                              }))
                            }
                            className="w-20"
                          />
                        ) : (
                          <span
                            className={cn(
                              "cursor-pointer hover:bg-accent rounded px-1 font-medium",
                              item.availableQuantity === 0 && "text-red-600",
                              item.availableQuantity <=
                                item.lowStockThreshold &&
                                item.availableQuantity > 0 &&
                                "text-orange-600",
                            )}
                            onDoubleClick={() => startEdit(item)}
                          >
                            {item.availableQuantity}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === item.id ? (
                          <Input
                            type="number"
                            value={editValues.lowStockThreshold}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                lowStockThreshold: e.target.value,
                              }))
                            }
                            className="w-20"
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:bg-accent rounded px-1"
                            onDoubleClick={() => startEdit(item)}
                          >
                            {item.lowStockThreshold}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.availableQuantity === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : item.availableQuantity <= item.lowStockThreshold ? (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-800"
                          >
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            In Stock
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant={item.blocked ? "destructive" : "default"}
                          onClick={() => toggleBlockItem(item.id)}
                        >
                          {item.blocked ? "Blocked" : "Available"}
                        </Button>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustQuantity(item.id, -1)}
                            disabled={item.availableQuantity === 0}
                          >
                            -
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustQuantity(item.id, 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustQuantity(item.id, 10)}
                          >
                            +10
                          </Button>
                        </div>
                      </td>
                      <td className="p-3">
                        {editingId === item.id ? (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={saveEdit}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(item)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add Item Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
              <DialogDescription>
                Enter details for the new inventory item
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={newItem.itemName}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      itemName: e.target.value,
                    }))
                  }
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="Enter price"
                />
              </div>
              <div className="space-y-2">
                <Label>Available Quantity</Label>
                <Input
                  type="number"
                  value={newItem.availableQuantity}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      availableQuantity: e.target.value,
                    }))
                  }
                  placeholder="Enter quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={newItem.lowStockThreshold}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                  placeholder="Enter low stock alert level"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addNewItem}
                  disabled={
                    !newItem.itemName ||
                    !newItem.price ||
                    !newItem.availableQuantity
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Add Stock Dialog */}
        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Add Stock</DialogTitle>
              <DialogDescription>
                Add quantity to existing items or create new items
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={quickAddData.date}
                  onChange={(e) =>
                    setQuickAddData((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Date will persist until changed manually
                </p>
              </div>

              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={quickAddData.itemPrefix}
                  onChange={(e) => handlePrefixSearch(e.target.value)}
                  placeholder="Type item name or prefix..."
                />

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="border rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setQuickAddData((prev) => ({
                            ...prev,
                            itemPrefix: item.itemName,
                          }));
                          setSuggestions([]);
                        }}
                      >
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-gray-500">
                          Current stock: {item.availableQuantity} • ₹
                          {item.price}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {quickAddData.itemPrefix &&
                  stockItems.find(
                    (item) =>
                      item.itemName.toLowerCase() ===
                      quickAddData.itemPrefix.toLowerCase(),
                  )
                    ? "Will add to existing item"
                    : quickAddData.itemPrefix
                      ? "Will create new item"
                      : "Type to search existing items or create new"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Quantity to Add</Label>
                <Input
                  type="number"
                  value={quickAddData.quantity}
                  onChange={(e) =>
                    setQuickAddData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    setSuggestions([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickAdd}
                  disabled={!quickAddData.itemPrefix || !quickAddData.quantity}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sample Data Generator */}
        <SampleDataGenerator />
      </div>
    </Layout>
  );
}
