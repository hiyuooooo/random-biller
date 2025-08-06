import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  Database,
  FileText,
  Package,
  CreditCard,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { useBill } from "./BillContext";
import { useTransaction } from "./TransactionContext";
import { useStock } from "./StockContext";
import { useAccount } from "./AccountManager";
import * as XLSX from "xlsx";

interface BackupData {
  version: string;
  timestamp: string;
  accountId: string;
  accountName: string;
  bills: any[];
  transactions: any[];
  stock: any[];
  invoiceSettings?: any;
}

export function BackupSystem() {
  const { bills } = useBill();
  const { transactions } = useTransaction();
  const { stockItems } = useStock();
  const { activeAccount } = useAccount();
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [restorePreview, setRestorePreview] = useState<BackupData | null>(null);

  // Create comprehensive backup as JSON
  const createBackup = () => {
    if (!activeAccount) {
      alert("No active account selected. Cannot create backup.");
      return;
    }

    // Get invoice settings for backup
    let invoiceSettings = null;
    try {
      const invoiceKey = `settings_invoice_${activeAccount.id}`;
      const savedInvoice = localStorage.getItem(invoiceKey);
      if (savedInvoice) {
        invoiceSettings = JSON.parse(savedInvoice);
      }
    } catch (error) {
      console.warn("Could not backup invoice settings:", error);
    }

    const backupData: BackupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      accountId: activeAccount.id,
      accountName: activeAccount.name,
      bills: bills,
      transactions: transactions,
      stock: stockItems,
      invoiceSettings: invoiceSettings,
    };

    // Create JSON string with proper formatting
    const jsonString = JSON.stringify(backupData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Backup_${activeAccount.name.replace(/\s+/g, "_")}_${timestamp}.json`;

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(
      `Backup created successfully: ${filename}\n\nThis JSON backup contains:\n- ${bills.length} bills\n- ${transactions.length} transactions\n- ${stockItems.length} stock items`,
    );
  };

  // Handle backup file upload and preview
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const backupData = JSON.parse(jsonString) as BackupData;

        // Validate backup data structure
        if (
          !backupData.version ||
          !backupData.timestamp ||
          !backupData.accountName
        ) {
          alert("Invalid backup file format: Missing required fields.");
          return;
        }

        // Ensure arrays exist
        backupData.bills = backupData.bills || [];
        backupData.transactions = backupData.transactions || [];
        backupData.stock = backupData.stock || [];

        setRestorePreview(backupData);
        setIsRestoreDialogOpen(true);
      } catch (error) {
        console.error("Error reading backup file:", error);
        alert(
          "Error reading backup file. Please ensure it's a valid JSON backup file created by this system.",
        );
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  // Restore from backup
  const restoreFromBackup = async () => {
    if (!restorePreview || !activeAccount) {
      alert("No backup data to restore or no active account.");
      return;
    }

    // Final confirmation
    const confirmed = confirm(
      `⚠️ WARNING: This will replace ALL current data with backup data!\n\n` +
        `Backup from: ${new Date(restorePreview.timestamp).toLocaleString()}\n` +
        `Account: ${restorePreview.accountName}\n` +
        `Bills: ${restorePreview.bills.length}\n` +
        `Transactions: ${restorePreview.transactions.length}\n` +
        `Stock Items: ${restorePreview.stock.length}\n\n` +
        `Current data will be permanently lost. Continue?`,
    );

    if (!confirmed) return;

    try {
      // Import bills
      if (restorePreview.bills && Array.isArray(restorePreview.bills)) {
        localStorage.setItem(
          `bills_${activeAccount.id}`,
          JSON.stringify(restorePreview.bills),
        );
        console.log(
          `Restored ${restorePreview.bills.length} bills to localStorage`,
        );
      }

      // Import transactions
      if (
        restorePreview.transactions &&
        Array.isArray(restorePreview.transactions)
      ) {
        localStorage.setItem(
          `transactions_${activeAccount.id}`,
          JSON.stringify(restorePreview.transactions),
        );
        console.log(
          `Restored ${restorePreview.transactions.length} transactions to localStorage`,
        );
      }

      // Import stock
      if (restorePreview.stock && Array.isArray(restorePreview.stock)) {
        localStorage.setItem(
          `stockItems_${activeAccount.id}`,
          JSON.stringify(restorePreview.stock),
        );
        console.log(
          `Restored ${restorePreview.stock.length} stock items to localStorage`,
        );
      }

      // Import invoice settings
      if (restorePreview.invoiceSettings) {
        localStorage.setItem(
          `settings_invoice_${activeAccount.id}`,
          JSON.stringify(restorePreview.invoiceSettings),
        );
        console.log("Restored invoice settings to localStorage");
      }

      // Close dialog first
      setIsRestoreDialogOpen(false);
      setRestorePreview(null);

      // Trigger account switch event to force refresh contexts
      window.dispatchEvent(new CustomEvent("account-switched"));

      alert(
        `Backup restored successfully!\n\n` +
          `✓ ${restorePreview.bills?.length || 0} bills restored\n` +
          `✓ ${restorePreview.transactions?.length || 0} transactions restored\n` +
          `✓ ${restorePreview.stock?.length || 0} stock items restored\n` +
          `✓ Invoice settings ${restorePreview.invoiceSettings ? 'restored' : 'not included'}\n\n` +
          `Data has been refreshed automatically.`,
      );
    } catch (error) {
      console.error("Error restoring backup:", error);
      alert("Error restoring backup. Please try again.");
    }
  };

  const getBackupStats = () => {
    return {
      bills: bills.length,
      transactions: transactions.length,
      stock: stockItems.length,
      totalItems: bills.length + transactions.length + stockItems.length,
    };
  };

  const stats = getBackupStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Backup & Restore System
          </CardTitle>
          <CardDescription>
            Create comprehensive backups of all your bills, transactions, and
            stock data. Backups include complete data for easy restoration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Data Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Bills</p>
                      <p className="text-2xl font-bold">{stats.bills}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Transactions</p>
                      <p className="text-2xl font-bold">{stats.transactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Stock Items</p>
                      <p className="text-2xl font-bold">{stats.stock}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Total Records</p>
                      <p className="text-2xl font-bold">{stats.totalItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Backup Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={createBackup}
                disabled={!activeAccount || stats.totalItems === 0}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Create Backup ({stats.totalItems} records)
              </Button>

              <label className="flex-1">
                <Button variant="outline" asChild className="w-full">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Restore from Backup
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Information */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Backup Information:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Backups are saved as JSON files with complete data</li>
                  <li>• Includes all bills, transactions, and stock data</li>
                  <li>• Account-specific backups preserve data separately</li>
                  <li>• Restoration will replace all current data</li>
                  <li>
                    • Keep backups safe - they contain sensitive business data
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Restore Preview Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Restore Backup Preview</DialogTitle>
            <DialogDescription>
              Review the backup data before restoration. This will replace all
              current data.
            </DialogDescription>
          </DialogHeader>

          {restorePreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Backup Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(restorePreview.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-sm text-muted-foreground">
                    {restorePreview.accountName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-lg font-bold">
                    {restorePreview.bills?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Bills</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-lg font-bold">
                    {restorePreview.transactions?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Package className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-lg font-bold">
                    {restorePreview.stock?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Stock Items</p>
                </div>
              </div>

              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Warning:</strong> Restoring this backup will
                  permanently replace all current data. Make sure to create a
                  backup of your current data if needed.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsRestoreDialogOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="destructive" onClick={restoreFromBackup}>
                  <Check className="h-4 w-4 mr-2" />
                  Restore Data
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
