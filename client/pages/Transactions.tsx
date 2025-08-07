import React, { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  Save,
  Filter,
  Edit2,
  Check,
  X,
  AlertTriangle,
  FileText,
  Calculator,
  Calendar,
  User,
  CreditCard,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SampleDataGenerator } from "@/components/SampleDataGenerator";
import { useBill } from "@/components/BillContext";
import { useTransaction } from "@/components/TransactionContext";
import { useStock } from "@/components/StockContext";
import { useAccount } from "@/components/AccountManager";

// Mock transaction data
const mockTransactions = [
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
    customerName: "Priya Sharma_c",
    total: 1200,
    paymentMode: "Cash",
    isValid: true,
  },
  {
    id: 3,
    date: "14-01-2024",
    customerName: "Ahmed Ali",
    total: "invalid",
    paymentMode: "GPay",
    isValid: false,
  },
  {
    id: 4,
    date: "14-01-2024",
    customerName: "Sunita Devi_c",
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
    customerName: "Meera Patel_c",
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
    customerName: "Rohit Kumar_c",
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

interface Transaction {
  id: number;
  date: string;
  customerName: string;
  total: number | string;
  paymentMode: "Cash" | "GPay" | "Bank";
  isValid: boolean;
}

export default function Transactions() {
  const {
    transactions,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    addTransaction,
    toggleTransactionSelection,
    selectAllTransactions,
    deselectAllTransactions,
    getSelectedTransactions,
    markBillsGenerated,
    deleteAllTransactions,
  } = useTransaction();

  const handleDeleteAllTransactions = () => {
    if (
      confirm(
        "Are you sure you want to delete ALL transactions? This action cannot be undone.",
      )
    ) {
      deleteAllTransactions();
    }
  };
  const { generateBillsFromTransactions } = useBill();
  const { getUnblockedStock, reduceStock } = useStock();
  const { activeAccount, accounts, setActiveAccount } = useAccount();

  // Test function for account switching
  const testAccountSwitch = () => {
    const otherAccount = accounts.find(acc => acc.id !== activeAccount?.id);
    if (otherAccount) {
      console.log(`🔄 TESTING ACCOUNT SWITCH from ${activeAccount?.name} to ${otherAccount.name}`);
      console.log(`📊 BEFORE: ${activeAccount?.name} has ${transactions.length} transactions`);
      setActiveAccount(otherAccount);
    }
  };
  const [editingId, setEditingId] = useState<number | null>(null);

  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [customerFilter, setCustomerFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [editValues, setEditValues] = useState({
    date: "",
    customerName: "",
    total: "",
    paymentMode: "GPay" as "Cash" | "GPay" | "Bank",
  });
  const [isGenerateBillsOpen, setIsGenerateBillsOpen] = useState(false);
  const [startingBillNumber, setStartingBillNumber] = useState("");
  const [billsToBlock, setBillsToBlock] = useState("");

  // Load blocked bills from Bill Blocker when component mounts
  const loadBlockedBills = () => {
    try {
      const storageKey = `billBlocker_blockedNumbers_${activeAccount?.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const blockedNumbers = JSON.parse(saved);
        if (Array.isArray(blockedNumbers) && blockedNumbers.length > 0) {
          setBillsToBlock(blockedNumbers.join(","));
        }
      }
    } catch (error) {
      console.warn("Failed to load blocked bills:", error);
    }
  };
  const [isTransactionListMinimized, setIsTransactionListMinimized] =
    useState(false);

  // Validate date format (DD-MM-YYYY)
  const isValidDate = (date: string) => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    return regex.test(date);
  };

  // Validate total is numeric
  const isValidTotal = (total: string | number) => {
    return !isNaN(Number(total)) && Number(total) > 0;
  };

  // Determine payment mode based on customer name
  const getPaymentMode = (customerName: string): "Cash" | "GPay" | "Bank" => {
    const lowerName = customerName.toLowerCase();
    if (lowerName.includes("_c") || lowerName === "cash") return "Cash";
    if (lowerName.includes("_b") || lowerName.includes("bank")) return "Bank";
    return "GPay";
  };

  // Filter and sort transactions based on current filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      // Date filter
      if (dateFilter.from || dateFilter.to) {
        const transactionDate = new Date(
          transaction.date.split("-").reverse().join("-"),
        );
        if (dateFilter.from) {
          const fromDate = new Date(dateFilter.from);
          if (transactionDate < fromDate) return false;
        }
        if (dateFilter.to) {
          const toDate = new Date(dateFilter.to);
          if (transactionDate > toDate) return false;
        }
      }

      // Customer name filter
      if (
        customerFilter &&
        !transaction.customerName
          .toLowerCase()
          .includes(customerFilter.toLowerCase())
      ) {
        return false;
      }

      // Payment mode filter
      if (
        paymentModeFilter !== "all" &&
        transaction.paymentMode !== paymentModeFilter
      ) {
        return false;
      }

      return true;
    });

    // Sort transactions by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date.split("-").reverse().join("-"));
      const dateB = new Date(b.date.split("-").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [transactions, dateFilter, customerFilter, paymentModeFilter]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const validTransactions = filteredTransactions.filter(
      (t) => t.isValid && isValidTotal(t.total),
    );
    const totalTransactions = filteredTransactions.length;
    const validTotal = validTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );
    const cashCount = validTransactions.filter(
      (t) => t.paymentMode === "Cash",
    ).length;
    const gpayCount = validTransactions.filter(
      (t) => t.paymentMode === "GPay",
    ).length;
    const invalidCount = filteredTransactions.filter(
      (t) => !t.isValid || !isValidTotal(t.total),
    ).length;

    return {
      totalTransactions,
      validTotal,
      cashCount,
      gpayCount,
      invalidCount,
    };
  }, [filteredTransactions]);

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditValues({
      date: transaction.date,
      customerName: transaction.customerName,
      total: transaction.total.toString(),
      paymentMode: transaction.paymentMode,
    });
  };

  const saveEdit = () => {
    if (editingId === null) return;

    const isValid =
      isValidDate(editValues.date) && isValidTotal(editValues.total);
    const finalTotal = isValidTotal(editValues.total)
      ? Number(editValues.total)
      : editValues.total;

    updateTransaction(editingId, {
      date: editValues.date,
      customerName: editValues.customerName,
      total: finalTotal,
      paymentMode: editValues.paymentMode, // Use manually selected payment mode
      isValid,
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteTransactionLocal = (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(id);
    }
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

          // More flexible column name matching for transactions
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

          // Validate and import transaction data with flexible column names
          const importedTransactions = jsonData
            .map((row: any, index) => {
              const maxId =
                transactions.length > 0
                  ? Math.max(...transactions.map((t) => t.id))
                  : 0;
              const newId = maxId + index + 1;

              const customerName = getColumnValue(row, [
                "Customer Name",
                "customer name",
                "name",
                "Name",
                "Customer",
                "customer",
                "Client",
                "client",
              ]);

              const date = getColumnValue(row, [
                "Date",
                "date",
                "Transaction Date",
                "transaction date",
              ]);

              const total = getColumnValue(row, [
                "Total",
                "total",
                "Amount",
                "amount",
                "Sum",
                "sum",
              ]);

              // Validate data
              const isValidDate = /^\d{2}-\d{2}-\d{4}$/.test(date);
              const isValidTotal = !isNaN(Number(total)) && Number(total) > 0;
              const isValid =
                isValidDate &&
                isValidTotal &&
                customerName &&
                customerName.trim() !== "";

              // Determine payment mode
              const paymentMode = getPaymentMode(customerName || "");

              return {
                id: newId,
                date: date || "",
                customerName: customerName || "",
                total: isValidTotal ? Number(total) : total,
                paymentMode: paymentMode,
                isValid: isValid,
              };
            })
            .filter((t) => t.customerName && t.customerName.trim() !== ""); // Filter out empty rows

          if (importedTransactions.length === 0) {
            alert(
              "No valid transactions found in the file. Please check that your Excel file has columns like 'Customer Name', 'Date', 'Total', etc.",
            );
            return;
          }

          importTransactions(importedTransactions);
          alert(
            `Successfully imported ${importedTransactions.length} transactions from ${file.name}. ${jsonData.length - importedTransactions.length} rows were skipped due to missing or invalid data.`,
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

  const exportTransactions = () => {
    const exportData = transactions.map((t) => ({
      Date: t.date,
      "Customer Name": t.customerName,
      Total: t.total,
      "Payment Mode": t.paymentMode,
      Status: t.isValid ? "Valid" : "Invalid",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transactions_export.xlsx");
  };

  const generateTransactionPDF = async (transaction: any) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transaction ${transaction.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .transaction-details { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>TRANSACTION RECEIPT</h2>
            <h3>Sadhana Agency</h3>
          </div>
          <div class="transaction-details">
            <div class="detail-row">
              <span class="label">Transaction ID:</span>
              <span>${transaction.id}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date:</span>
              <span>${transaction.date}</span>
            </div>
            <div class="detail-row">
              <span class="label">Customer Name:</span>
              <span>${transaction.customerName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Amount:</span>
              <span>₹${transaction.total}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Mode:</span>
              <span>${transaction.paymentMode}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span>${transaction.isValid ? "Valid" : "Invalid"}</span>
            </div>
          </div>
        </body>
        </html>
      `;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "210mm";
      tempDiv.style.backgroundColor = "white";
      document.body.appendChild(tempDiv);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(tempDiv, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 210;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(
        `Transaction_${transaction.id}_${transaction.customerName.replace(/\s+/g, "_")}.pdf`,
      );
    } catch (error) {
      console.error("Error generating transaction PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const generateAllTransactionsPDF = async () => {
    try {
      if (transactions.length === 0) {
        alert("No transactions available to generate PDF.");
        return;
      }

      const confirmed = confirm(
        `Generate PDF for all ${transactions.length} transactions?`,
      );
      if (!confirmed) return;

      for (let i = 0; i < transactions.length; i++) {
        await generateTransactionPDF(transactions[i]);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      alert(`Successfully generated ${transactions.length} transaction PDFs!`);
    } catch (error) {
      console.error("Error generating all transaction PDFs:", error);
      alert("Error generating PDFs. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Transactions</h1>
            <p className="text-muted-foreground">
              Manage customer transactions, validate data, and generate bills
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={testAccountSwitch}
              variant="secondary"
              size="sm"
              className="bg-purple-100 hover:bg-purple-200"
            >
              🔄 Test Account Switch
            </Button>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </span>
              </Button>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
            <Button size="sm" onClick={exportTransactions}>
              <Save className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={generateAllTransactionsPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              All PDFs
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteAllTransactions}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Transactions</p>
                  <p className="text-2xl font-bold">
                    {summary.totalTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{summary.validTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Cash Payments</p>
                  <p className="text-2xl font-bold">{summary.cashCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">GPay Payments</p>
                  <p className="text-2xl font-bold">{summary.gpayCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Invalid Rows</p>
                  <p className="text-2xl font-bold">{summary.invalidCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter transactions by date range, customer, or payment mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, from: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, to: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  placeholder="Search customer..."
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select
                  value={paymentModeFilter}
                  onValueChange={setPaymentModeFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="GPay">GPay</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Alerts */}
        {summary.invalidCount > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {summary.invalidCount} transaction(s) have validation errors.
              Please correct them before generating bills.
            </AlertDescription>
          </Alert>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction List</CardTitle>
                <CardDescription>
                  Double-click any cell to edit. Blue outlined transactions have
                  been used for bill generation. Payment mode is automatically
                  determined by customer name (_c suffix for cash).
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setIsTransactionListMinimized(!isTransactionListMinimized)
                }
              >
                {isTransactionListMinimized ? "Expand" : "Minimize"} List
              </Button>
            </div>
          </CardHeader>
          <CardContent
            className={cn(
              "transition-all duration-300",
              isTransactionListMinimized && "max-h-20 overflow-hidden",
            )}
          >
            {!isTransactionListMinimized ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        selectAllTransactions(filteredTransactions)
                      }
                      disabled={
                        filteredTransactions.filter((t) => t.isValid).length ===
                        0
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select All Filtered
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllTransactions}
                      disabled={getSelectedTransactions().length === 0}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Deselect All
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getSelectedTransactions().length} of{" "}
                    {filteredTransactions.filter((t) => t.isValid).length} valid
                    transactions selected (from {filteredTransactions.length}{" "}
                    filtered)
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={
                                filteredTransactions.filter((t) => t.isValid)
                                  .length > 0 &&
                                filteredTransactions
                                  .filter((t) => t.isValid)
                                  .every((t) => t.selected)
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  selectAllTransactions(filteredTransactions);
                                } else {
                                  deselectAllTransactions();
                                }
                              }}
                            />
                            <span>Select</span>
                          </div>
                        </th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">
                          Customer Name
                        </th>
                        <th className="text-left p-3 font-medium">Total</th>
                        <th className="text-left p-3 font-medium">
                          Payment Mode
                        </th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className={cn(
                            "border-b hover:bg-accent/50 transition-colors",
                            !transaction.isValid && "bg-red-50 border-red-200",
                            transaction.billGenerated &&
                              "bg-blue-50 border-blue-300 ring-2 ring-blue-200",
                          )}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={transaction.selected || false}
                              onCheckedChange={() =>
                                toggleTransactionSelection(transaction.id)
                              }
                              disabled={!transaction.isValid}
                            />
                          </td>
                          <td className="p-3">
                            {editingId === transaction.id ? (
                              <Input
                                value={editValues.date}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    date: e.target.value,
                                  }))
                                }
                                placeholder="DD-MM-YYYY"
                                className={cn(
                                  "w-32",
                                  !isValidDate(editValues.date) &&
                                    "border-red-500",
                                )}
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-accent rounded px-1"
                                onDoubleClick={() => startEdit(transaction)}
                              >
                                {transaction.date}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === transaction.id ? (
                              <Input
                                value={editValues.customerName}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    customerName: e.target.value,
                                  }))
                                }
                                className="w-40"
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-accent rounded px-1"
                                onDoubleClick={() => startEdit(transaction)}
                              >
                                {transaction.customerName}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === transaction.id ? (
                              <Input
                                value={editValues.total}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    total: e.target.value,
                                  }))
                                }
                                className={cn(
                                  "w-24",
                                  !isValidTotal(editValues.total) &&
                                    "border-red-500",
                                )}
                              />
                            ) : (
                              <span
                                className={cn(
                                  "cursor-pointer hover:bg-accent rounded px-1",
                                  !isValidTotal(transaction.total) &&
                                    "text-red-600 font-medium",
                                )}
                                onDoubleClick={() => startEdit(transaction)}
                              >
                                {isValidTotal(transaction.total)
                                  ? `₹${Number(transaction.total).toLocaleString()}`
                                  : transaction.total}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === transaction.id ? (
                              <Select
                                value={editValues.paymentMode}
                                onValueChange={(value) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    paymentMode: value as
                                      | "Cash"
                                      | "GPay"
                                      | "Bank",
                                  }))
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Cash">Cash</SelectItem>
                                  <SelectItem value="GPay">GPay</SelectItem>
                                  <SelectItem value="Bank">Bank</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                variant={
                                  transaction.paymentMode === "GPay"
                                    ? "default"
                                    : transaction.paymentMode === "Bank"
                                      ? "outline"
                                      : "secondary"
                                }
                                className={
                                  transaction.paymentMode === "Bank"
                                    ? "border-blue-500 text-blue-700"
                                    : ""
                                }
                              >
                                {transaction.paymentMode}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                transaction.isValid ? "default" : "destructive"
                              }
                              className={
                                transaction.isValid ? "bg-green-500" : ""
                              }
                            >
                              {transaction.isValid ? "Valid" : "Invalid"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {editingId === transaction.id ? (
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
                                  onClick={() => startEdit(transaction)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    generateTransactionPDF(transaction)
                                  }
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    deleteTransactionLocal(transaction.id)
                                  }
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
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>
                  Transaction list minimized. Click "Expand List" to show all
                  transactions.
                </p>
                <p className="text-sm">
                  Total: {filteredTransactions.length} transactions (
                  {filteredTransactions.filter((t) => t.billGenerated).length}{" "}
                  used for bills)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Filtered
            </Button>
          </div>
          <Button
            disabled={
              summary.invalidCount > 0 || getSelectedTransactions().length === 0
            }
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              setIsGenerateBillsOpen(true);
              loadBlockedBills();
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Bills ({getSelectedTransactions().length} selected)
          </Button>
        </div>

        {/* Sample Data Generator */}
        <SampleDataGenerator />

        {/* Generate Bills Dialog */}
        <Dialog
          open={isGenerateBillsOpen}
          onOpenChange={setIsGenerateBillsOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Bills</DialogTitle>
              <DialogDescription>
                Configure bill generation settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Starting Bill Number</Label>
                <Input
                  type="number"
                  value={startingBillNumber}
                  onChange={(e) => setStartingBillNumber(e.target.value)}
                  placeholder="Enter starting bill number (e.g., 1001)"
                />
              </div>

              <div className="space-y-2">
                <Label>Bills to Block (Optional)</Label>
                <Input
                  value={billsToBlock}
                  onChange={(e) => setBillsToBlock(e.target.value)}
                  placeholder="Enter bill numbers to block (e.g., 1005,1010,1015)"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of bill numbers to skip during generation
                </p>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Generation Summary</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Valid Transactions:</span>
                    <span>
                      {filteredTransactions.length - summary.invalidCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Starting Bill #:</span>
                    <span>{startingBillNumber || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bills to Block:</span>
                    <span>
                      {billsToBlock ? billsToBlock.split(",").length : 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsGenerateBillsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const selectedTransactions = getSelectedTransactions();
                    if (selectedTransactions.length === 0) {
                      alert(
                        "Please select at least one transaction to generate bills.",
                      );
                      return;
                    }

                    const startBillNum = parseInt(startingBillNumber);
                    const blockedNumbers = billsToBlock
                      ? billsToBlock
                          .split(",")
                          .map((n) => parseInt(n.trim()))
                          .filter((n) => !isNaN(n))
                      : [];

                    const generatedBills = generateBillsFromTransactions(
                      selectedTransactions,
                      startBillNum,
                      blockedNumbers,
                      getUnblockedStock(),
                      reduceStock,
                    );

                    // Mark selected transactions as having bills generated
                    markBillsGenerated(selectedTransactions.map((t) => t.id));

                    alert(
                      `Successfully generated ${generatedBills.length} bills! Check the Bills section to view them.`,
                    );
                    setIsGenerateBillsOpen(false);
                    setStartingBillNumber("");
                    setBillsToBlock("");
                  }}
                  disabled={!startingBillNumber}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Bills
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
