import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useAccount } from "@/components/AccountManager";
import { useBill } from "@/components/BillContext";
import { useCustomer } from "@/components/CustomerContext";
import { useStock } from "@/components/StockContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountManager } from "@/components/AccountManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  FileText,
  Database,
  Shield,
  Download,
  Upload,
} from "lucide-react";

export default function Settings() {
  const { activeAccount, accounts } = useAccount();
  const { bills } = useBill();
  const { customers } = useCustomer();
  const { stockItems } = useStock();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState(() => {
    if (!activeAccount)
      return {
        lowStock: true,
        newTransactions: true,
        dailyReports: false,
        systemUpdates: true,
      };
    try {
      const storageKey = `settings_notifications_${activeAccount.id}`;
      const saved = localStorage.getItem(storageKey);
      return saved
        ? JSON.parse(saved)
        : {
            lowStock: true,
            newTransactions: true,
            dailyReports: false,
            systemUpdates: true,
          };
    } catch {
      return {
        lowStock: true,
        newTransactions: true,
        dailyReports: false,
        systemUpdates: true,
      };
    }
  });

  const [preferences, setPreferences] = useState(() => {
    if (!activeAccount)
      return {
        defaultOutputFolder: "",
        autoBackup: true,
        lowStockThreshold: 10,
        billNumberPrefix: "",
        dateFormat: "DD-MM-YYYY",
      };
    try {
      const storageKey = `settings_preferences_${activeAccount.id}`;
      const saved = localStorage.getItem(storageKey);
      return saved
        ? JSON.parse(saved)
        : {
            defaultOutputFolder: "",
            autoBackup: true,
            lowStockThreshold: 10,
            billNumberPrefix: "",
            dateFormat: "DD-MM-YYYY",
          };
    } catch {
      return {
        defaultOutputFolder: "",
        autoBackup: true,
        lowStockThreshold: 10,
        billNumberPrefix: "",
        dateFormat: "DD-MM-YYYY",
      };
    }
  });

  const [invoiceSettings, setInvoiceSettings] = useState(() => {
    if (!activeAccount)
      return {
        headerTitle: "Bill of Supply",
        agencyName: "Sadhana Agency",
        agencyAddress: "Harsila (Dewalchaura), Bageshwar, Uttarakhand",
        phone: "+91 98765 43210",
        email: "contact@sadhanaagency.com",
        declaration:
          "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
        signatureText: "Authorized Signature",
        logoUrl: "",
      };
    try {
      const storageKey = `settings_invoice_${activeAccount.id}`;
      const saved = localStorage.getItem(storageKey);
      return saved
        ? JSON.parse(saved)
        : {
            headerTitle: "Bill of Supply",
            agencyName: activeAccount.name,
            agencyAddress: activeAccount.address,
            phone: activeAccount.phone || "+91 98765 43210",
            email: activeAccount.email || "contact@agency.com",
            declaration:
              activeAccount.footerText ||
              "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
            signatureText: "Authorized Signature",
            logoUrl: "",
          };
    } catch {
      return {
        headerTitle: "Bill of Supply",
        agencyName: "Sadhana Agency",
        agencyAddress: "Harsila (Dewalchaura), Bageshwar, Uttarakhand",
        phone: "+91 98765 43210",
        email: "contact@sadhanaagency.com",
        declaration:
          "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
        signatureText: "Authorized Signature",
        logoUrl: "",
      };
    }
  });

  // Save to account-specific localStorage
  useEffect(() => {
    if (activeAccount) {
      try {
        const notificationsKey = `settings_notifications_${activeAccount.id}`;
        localStorage.setItem(notificationsKey, JSON.stringify(notifications));
      } catch (error) {
        console.warn("Failed to save notifications settings:", error);
      }
    }
  }, [notifications, activeAccount]);

  useEffect(() => {
    if (activeAccount) {
      try {
        const preferencesKey = `settings_preferences_${activeAccount.id}`;
        localStorage.setItem(preferencesKey, JSON.stringify(preferences));
      } catch (error) {
        console.warn("Failed to save preferences:", error);
      }
    }
  }, [preferences, activeAccount]);

  useEffect(() => {
    if (activeAccount) {
      try {
        const invoiceKey = `settings_invoice_${activeAccount.id}`;
        localStorage.setItem(invoiceKey, JSON.stringify(invoiceSettings));
      } catch (error) {
        console.warn("Failed to save invoice settings:", error);
      }
    }
  }, [invoiceSettings, activeAccount]);

  // Load settings when switching accounts
  useEffect(() => {
    if (activeAccount) {
      try {
        const notificationsKey = `settings_notifications_${activeAccount.id}`;
        const preferencesKey = `settings_preferences_${activeAccount.id}`;
        const invoiceKey = `settings_invoice_${activeAccount.id}`;

        const savedNotifications = localStorage.getItem(notificationsKey);
        const savedPreferences = localStorage.getItem(preferencesKey);
        const savedInvoice = localStorage.getItem(invoiceKey);

        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        }

        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }

        if (savedInvoice) {
          setInvoiceSettings(JSON.parse(savedInvoice));
        } else {
          // Use account data as defaults for new accounts
          setInvoiceSettings({
            headerTitle: "Bill of Supply",
            agencyName: activeAccount.name,
            agencyAddress: activeAccount.address,
            phone: activeAccount.phone || "+91 98765 43210",
            email: activeAccount.email || "contact@agency.com",
            declaration:
              activeAccount.footerText ||
              "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
            signatureText: "Authorized Signature",
            logoUrl: "",
          });
        }
      } catch {
        // Reset to defaults on error - using account data when available
        setInvoiceSettings({
          headerTitle: "Bill of Supply",
          agencyName: activeAccount.name,
          agencyAddress: activeAccount.address,
          phone: activeAccount.phone || "+91 98765 43210",
          email: activeAccount.email || "contact@agency.com",
          declaration:
            activeAccount.footerText ||
            "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
          signatureText: "Authorized Signature",
          logoUrl: "",
        });
      }
    }
  }, [activeAccount?.id]);

  // Export all data function
  const exportAllData = () => {
    try {
      if (!activeAccount) {
        toast({
          title: "No Active Account",
          description: "Please select an account before exporting data.",
          variant: "destructive",
        });
        return;
      }

      // Gather all data for the active account
      const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        accountId: activeAccount.id,
        accountName: activeAccount.name,
        data: {
          // Account data
          accounts: accounts,
          activeAccountId: activeAccount.id,

          // Business data
          bills: bills,
          customers: customers,
          stockItems: stockItems,

          // Settings data
          notifications: notifications,
          preferences: preferences,
          invoiceSettings: invoiceSettings,
        },
      };

      // Create and download the backup file
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_${activeAccount.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Data backup exported successfully for ${activeAccount.name}.`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Import data function
  const importData = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);

        // Validate backup data structure
        if (!backupData.version || !backupData.data) {
          throw new Error("Invalid backup file format");
        }

        if (!activeAccount) {
          toast({
            title: "No Active Account",
            description: "Please select an account before importing data.",
            variant: "destructive",
          });
          return;
        }

        // Confirm import with user
        const confirmed = window.confirm(
          `Import data from backup created on ${new Date(backupData.timestamp).toLocaleDateString()}?\n\nThis will replace current data for the active account. This action cannot be undone.`
        );

        if (!confirmed) return;

        // Store data in localStorage for the active account
        const accountId = activeAccount.id;

        // Import business data
        if (backupData.data.bills) {
          localStorage.setItem(`bills_${accountId}`, JSON.stringify(backupData.data.bills));
        }

        if (backupData.data.customers) {
          localStorage.setItem(`customers_${accountId}`, JSON.stringify(backupData.data.customers));
        }

        if (backupData.data.stockItems) {
          localStorage.setItem(`stockItems_${accountId}`, JSON.stringify(backupData.data.stockItems));
        }

        // Import settings data
        if (backupData.data.notifications) {
          localStorage.setItem(`settings_notifications_${accountId}`, JSON.stringify(backupData.data.notifications));
          setNotifications(backupData.data.notifications);
        }

        if (backupData.data.preferences) {
          localStorage.setItem(`settings_preferences_${accountId}`, JSON.stringify(backupData.data.preferences));
          setPreferences(backupData.data.preferences);
        }

        if (backupData.data.invoiceSettings) {
          localStorage.setItem(`settings_invoice_${accountId}`, JSON.stringify(backupData.data.invoiceSettings));
          setInvoiceSettings(backupData.data.invoiceSettings);
        }

        toast({
          title: "Import Successful",
          description: "Data has been imported successfully. Please refresh the page to see changes.",
        });

        // Suggest page refresh for complete data reload
        setTimeout(() => {
          if (window.confirm("Refresh the page now to load imported data?")) {
            window.location.reload();
          }
        }, 2000);

      } catch (error) {
        console.error("Import failed:", error);
        toast({
          title: "Import Failed",
          description: "Failed to import data. Please check the file format and try again.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clear cache function
  const clearCache = () => {
    const confirmed = window.confirm(
      "Clear all cached data? This will remove all stored information and reset the application."
    );

    if (confirmed) {
      try {
        localStorage.clear();
        toast({
          title: "Cache Cleared",
          description: "All cached data has been cleared. Please refresh the page.",
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error("Failed to clear cache:", error);
        toast({
          title: "Clear Failed",
          description: "Failed to clear cache. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings & Configuration</h1>
            <p className="text-muted-foreground">
              Manage application settings, account profiles, and system
              preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="accounts">
              <Building2 className="h-4 w-4 mr-2" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="invoice">
              <FileText className="h-4 w-4 mr-2" />
              Invoice
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing">
              <FileText className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Account Management Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <AccountManager />
          </TabsContent>

          {/* Invoice Settings Tab */}
          <TabsContent value="invoice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Header Settings</CardTitle>
                <CardDescription>
                  Customize the header information that appears on all generated
                  bills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Header Title</Label>
                      <Input
                        value={invoiceSettings.headerTitle}
                        onChange={(e) =>
                          setInvoiceSettings((prev) => ({
                            ...prev,
                            headerTitle: e.target.value,
                          }))
                        }
                        placeholder="Bill of Supply"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agency Name</Label>
                      <Input
                        value={invoiceSettings.agencyName}
                        onChange={(e) =>
                          setInvoiceSettings((prev) => ({
                            ...prev,
                            agencyName: e.target.value,
                          }))
                        }
                        placeholder="Agency Name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Agency Address</Label>
                    <Textarea
                      value={invoiceSettings.agencyAddress}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({
                          ...prev,
                          agencyAddress: e.target.value,
                        }))
                      }
                      placeholder="Complete agency address"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={invoiceSettings.phone}
                        onChange={(e) =>
                          setInvoiceSettings((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={invoiceSettings.email}
                        onChange={(e) =>
                          setInvoiceSettings((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="contact@agency.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Logo URL (Optional)</Label>
                    <Input
                      value={invoiceSettings.logoUrl}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({
                          ...prev,
                          logoUrl: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Footer Settings</CardTitle>
                <CardDescription>
                  Customize the footer information and signature details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Declaration Text</Label>
                    <Textarea
                      value={invoiceSettings.declaration}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({
                          ...prev,
                          declaration: e.target.value,
                        }))
                      }
                      placeholder="Declaration text for composition scheme..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Signature Text</Label>
                    <Input
                      value={invoiceSettings.signatureText}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({
                          ...prev,
                          signatureText: e.target.value,
                        }))
                      }
                      placeholder="Authorized Signature"
                    />
                  </div>

                  <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div className="text-sm space-y-2 border p-4 bg-white rounded">
                      <div className="text-center">
                        <h3 className="font-bold text-lg">
                          {invoiceSettings.headerTitle}
                        </h3>
                        <h4 className="font-semibold">
                          {invoiceSettings.agencyName}
                        </h4>
                        <p className="text-xs">
                          {invoiceSettings.agencyAddress}
                        </p>
                        {invoiceSettings.phone && (
                          <p className="text-xs">
                            Phone: {invoiceSettings.phone}
                          </p>
                        )}
                        {invoiceSettings.email && (
                          <p className="text-xs">
                            Email: {invoiceSettings.email}
                          </p>
                        )}
                      </div>
                      <div className="mt-8 pt-4 border-t text-xs">
                        <p>{invoiceSettings.declaration}</p>
                        <div className="mt-4 text-center">
                          <p>{invoiceSettings.signatureText}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Settings className="h-4 w-4 mr-2" />
                      Save Invoice Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure when and how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when items fall below threshold
                      </p>
                    </div>
                    <Switch
                      checked={notifications.lowStock}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          lowStock: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Transactions</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert when new transactions are imported
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newTransactions}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          newTransactions: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily sales summary reports
                      </p>
                    </div>
                    <Switch
                      checked={notifications.dailyReports}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          dailyReports: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Important system and security updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          systemUpdates: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Configuration</CardTitle>
                <CardDescription>
                  Configure bill generation settings and PDF preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bill Number Prefix</Label>
                      <Input
                        value={preferences.billNumberPrefix}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            billNumberPrefix: e.target.value,
                          }))
                        }
                        placeholder="e.g., SA-"
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional prefix for bill numbers (e.g., SA-1001)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Input
                        value={preferences.dateFormat}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            dateFormat: e.target.value,
                          }))
                        }
                        placeholder="DD-MM-YYYY"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Format for dates in bills and reports
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Output Folder</Label>
                    <Input
                      value={preferences.defaultOutputFolder}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          defaultOutputFolder: e.target.value,
                        }))
                      }
                      placeholder="Choose default folder for exports..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Default location for saving bills and reports
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">PDF Settings</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-muted">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Include Page Numbers</Label>
                          <p className="text-sm text-muted-foreground">
                            Add page numbers to PDF reports
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Watermark</Label>
                          <p className="text-sm text-muted-foreground">
                            Add watermark to all PDFs
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Merge Individual Bills</Label>
                          <p className="text-sm text-muted-foreground">
                            Include individual bills in mega report
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>
                  Configure system behavior and data management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Low Stock Threshold</Label>
                      <Input
                        type="number"
                        value={preferences.lowStockThreshold}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            lowStockThreshold: parseInt(e.target.value) || 0,
                          }))
                        }
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default threshold for low stock alerts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically backup data daily
                      </p>
                    </div>
                    <Switch
                      checked={preferences.autoBackup}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          autoBackup: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Data Management</h4>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={exportAllData}
                        disabled={!activeAccount}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={importData}
                        disabled={!activeAccount}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={clearCache}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>

                      {/* Hidden file input for import */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        style={{ display: "none" }}
                      />
                    </div>

                    <div className="text-sm text-muted-foreground space-y-2 mt-4">
                      <p><strong>Export:</strong> Creates a complete backup of all your data for the active account.</p>
                      <p><strong>Import:</strong> Restores data from a previously exported backup file.</p>
                      <p><strong>Clear Cache:</strong> Removes all stored data and resets the application.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Information</CardTitle>
                <CardDescription>
                  System details and version information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Version:</span>
                    <span className="text-sm">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Updated:</span>
                    <span className="text-sm">January 15, 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Database:</span>
                    <span className="text-sm">Local Storage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Platform:</span>
                    <span className="text-sm">Web Application</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
