import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountManager, useAccount } from "@/components/AccountManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  FileText,
  Database,
  Shield,
} from "lucide-react";

// Helper function to ensure invoice settings have proper defaults
const ensureInvoiceSettingsDefaults = (settings: any, activeAccount: any) => {
  return {
    headerTitle: settings?.headerTitle || "Bill of Supply",
    agencyName: settings?.agencyName || activeAccount?.name || "",
    agencyAddress: settings?.agencyAddress || activeAccount?.address || "",
    phone: settings?.phone || activeAccount?.phone || "+91 98765 43210",
    email: settings?.email || activeAccount?.email || "contact@agency.com",
    declaration:
      settings?.declaration ||
      activeAccount?.footerText ||
      "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
    signatureText: settings?.signatureText || "Authorized Signature",
    logoUrl: settings?.logoUrl || "",
    signatureImageUrl: settings?.signatureImageUrl || "",
    authorizedSignatureText: settings?.authorizedSignatureText || "",
    gstNumber: settings?.gstNumber || "",
  };
};

export default function Settings() {
  const { activeAccount } = useAccount();

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
        signatureImageUrl: "",
        authorizedSignatureText: "",
        gstNumber: "",
      };
    try {
      const storageKey = `settings_invoice_${activeAccount.id}`;
      const saved = localStorage.getItem(storageKey);
      return saved
        ? ensureInvoiceSettingsDefaults(JSON.parse(saved), activeAccount)
        : ensureInvoiceSettingsDefaults(null, activeAccount);
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
        signatureImageUrl: "",
        authorizedSignatureText: "",
        gstNumber: "",
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
          setInvoiceSettings(
            ensureInvoiceSettingsDefaults(
              JSON.parse(savedInvoice),
              activeAccount,
            ),
          );
        } else {
          // Use account data as defaults for new accounts
          setInvoiceSettings(
            ensureInvoiceSettingsDefaults(null, activeAccount),
          );
        }
      } catch {
        // Reset to defaults on error - using account data when available
        setInvoiceSettings(ensureInvoiceSettingsDefaults(null, activeAccount));
      }
    }
  }, [activeAccount?.id]);

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
                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input
                        value={invoiceSettings.gstNumber}
                        onChange={(e) =>
                          setInvoiceSettings((prev) => ({
                            ...prev,
                            gstNumber: e.target.value,
                          }))
                        }
                        placeholder="GST Number (e.g., 27ABCDE1234F1Z5)"
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

                  <div className="space-y-2">
                    <Label>Signature Image (PNG)</Label>
                    <Input
                      type="file"
                      accept="image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            setInvoiceSettings((prev) => ({
                              ...prev,
                              signatureImageUrl: dataUrl,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a PNG image for signature (will appear on right
                      side of PDF)
                    </p>
                    {invoiceSettings.signatureImageUrl && (
                      <div className="mt-2">
                        <img
                          src={invoiceSettings.signatureImageUrl}
                          alt="Signature Preview"
                          className="max-w-32 max-h-16 border rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1"
                          onClick={() =>
                            setInvoiceSettings((prev) => ({
                              ...prev,
                              signatureImageUrl: "",
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Authorized Signature Text</Label>
                    <Input
                      value={invoiceSettings.authorizedSignatureText}
                      onChange={(e) =>
                        setInvoiceSettings((prev) => ({
                          ...prev,
                          authorizedSignatureText: e.target.value,
                        }))
                      }
                      placeholder="Authorized Signature (appears below signature image)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Text that appears below the signature image
                    </p>
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
                        {invoiceSettings.gstNumber && (
                          <p className="text-xs">
                            GST: {invoiceSettings.gstNumber}
                          </p>
                        )}
                      </div>
                      <div className="mt-8 pt-4 border-t text-xs">
                        <p>{invoiceSettings.declaration}</p>
                        <div className="mt-4 flex justify-between items-end">
                          <div className="text-center flex-1">
                            <p>{invoiceSettings.signatureText}</p>
                          </div>
                          {invoiceSettings.signatureImageUrl && (
                            <div className="text-center">
                              <img
                                src={invoiceSettings.signatureImageUrl}
                                alt="Signature"
                                className="max-w-24 max-h-12 mx-auto"
                              />
                              {invoiceSettings.authorizedSignatureText && (
                                <p className="text-xs mt-1">
                                  {invoiceSettings.authorizedSignatureText}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <SettingsIcon className="h-4 w-4 mr-2" />
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
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Import Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
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
