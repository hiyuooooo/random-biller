import React, { useState, createContext, useContext } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Edit2,
  Settings,
  Check,
  MapPin,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  headerText: string;
  footerText: string;
  logoUrl?: string;
  isActive: boolean;
}

interface AccountContextType {
  accounts: Account[];
  activeAccount: Account | null;
  setActiveAccount: (account: Account) => void;
  addAccount: (account: Omit<Account, "id" | "isActive">) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
}

const defaultAccounts: Account[] = [
  {
    id: "1",
    name: "Sadhana Agency",
    address: "Harsila (Dewalchaura), Bageshwar, Uttarakhand",
    phone: "+91 98765 43210",
    email: "contact@sadhanaagency.com",
    headerText: "Sadhana Agency",
    footerText:
      "We hereby declare that the tax on supplies has been paid by us under the composition scheme.",
    isActive: true,
  },
  {
    id: "2",
    name: "Himalaya Traders",
    address: "Market Road, Almora, Uttarakhand",
    phone: "+91 97654 32109",
    email: "info@himalayatraders.com",
    headerText: "Himalaya Traders",
    footerText:
      "Thank you for your business. All goods sold are non-returnable.",
    isActive: false,
  },
];

const AccountContext = createContext<AccountContextType | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage or use defaults
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem("accounts");
      return saved ? JSON.parse(saved) : defaultAccounts;
    } catch {
      return defaultAccounts;
    }
  });

  const [activeAccount, setActiveAccountState] = useState<Account | null>(
    () => {
      try {
        const saved = localStorage.getItem("activeAccount");
        if (saved) {
          return JSON.parse(saved);
        }
        const loadedAccounts = JSON.parse(
          localStorage.getItem("accounts") || "[]",
        );
        return (
          loadedAccounts.find((acc: Account) => acc.isActive) ||
          loadedAccounts[0] ||
          accounts[0]
        );
      } catch {
        return accounts.find((acc) => acc.isActive) || accounts[0];
      }
    },
  );

  // Mark as initialized after first render
  React.useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever data changes
  React.useEffect(() => {
    try {
      localStorage.setItem("accounts", JSON.stringify(accounts));
    } catch (error) {
      console.warn("Failed to save accounts to localStorage:", error);
    }
  }, [accounts]);

  React.useEffect(() => {
    try {
      localStorage.setItem("activeAccount", JSON.stringify(activeAccount));
    } catch (error) {
      console.warn("Failed to save active account to localStorage:", error);
    }
  }, [activeAccount]);

  const setActiveAccount = (account: Account) => {
    // Force save current account data before switching
    try {
      if (activeAccount) {
        // Force all contexts to save their current data
        window.dispatchEvent(
          new CustomEvent("force-save-account-data", {
            detail: { accountId: activeAccount.id },
          }),
        );
      }
    } catch (error) {}

    // Update account states
    setAccounts((prev) =>
      prev.map((acc) => ({ ...acc, isActive: acc.id === account.id })),
    );
    setActiveAccountState(account);

    // Force immediate data refresh for new account with Promise-based approach
    Promise.resolve().then(() => {
      // Dispatch multiple events to ensure all contexts refresh
      window.dispatchEvent(new Event("account-switched"));
      window.dispatchEvent(
        new CustomEvent("load-account-data", {
          detail: { accountId: account.id },
        }),
      );
    });
  };

  const addAccount = (accountData: Omit<Account, "id" | "isActive">) => {
    const newAccount: Account = {
      ...accountData,
      id: Date.now().toString(),
      isActive: false,
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  const updateAccount = (id: string, accountData: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...accountData } : acc)),
    );
    if (activeAccount?.id === id) {
      setActiveAccountState((prev) =>
        prev ? { ...prev, ...accountData } : null,
      );
    }
  };

  const deleteAccount = (id: string) => {
    // Prevent deleting the last account
    if (accounts.length <= 1) {
      alert(
        "Cannot delete the last account. You must have at least one account.",
      );
      return;
    }

    // Clear all data associated with this account
    try {
      const keysToRemove = [
        `bills_${id}`,
        `transactions_${id}`,
        `stockItems_${id}`,
        `billBlocker_startingNumber_${id}`,
        `billBlocker_blockedNumbers_${id}`,
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(`Cleared all data for account ${id}`);
    } catch (error) {
      console.warn("Failed to clear account data:", error);
    }

    // If deleting the active account, switch to another one first
    if (activeAccount?.id === id) {
      const otherAccount = accounts.find((acc) => acc.id !== id);
      if (otherAccount) {
        setActiveAccount(otherAccount);
      }
    }

    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        setActiveAccount,
        addAccount,
        updateAccount,
        deleteAccount,
      }}
    >
      {isInitialized ? children : <div>Loading accounts...</div>}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return context;
}

export function AccountSelector() {
  const { accounts, activeAccount, setActiveAccount } = useAccount();

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={activeAccount?.id}
        onValueChange={(accountId) => {
          const account = accounts.find((acc) => acc.id === accountId);
          if (account) setActiveAccount(account);
        }}
      >
        <SelectTrigger className="w-48" aria-label="Select account">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AccountManager() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccount();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    headerText: "",
    footerText: "",
    logoUrl: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      headerText: "",
      footerText: "",
      logoUrl: "",
    });
  };

  const handleAddAccount = () => {
    addAccount(formData);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      address: account.address,
      phone: account.phone || "",
      email: account.email || "",
      headerText: account.headerText,
      footerText: account.footerText,
      logoUrl: account.logoUrl || "",
    });
  };

  const handleUpdateAccount = () => {
    if (editingAccount) {
      updateAccount(editingAccount.id, formData);
      setEditingAccount(null);
      resetForm();
    }
  };

  const handleDeleteAccount = (account: Account) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${account.name}"? This action cannot be undone and will permanently remove all data associated with this account.`,
    );

    if (confirmed) {
      deleteAccount(account.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Account Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage multiple business accounts and their settings
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className={account.isActive ? "border-primary" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>{account.name}</span>
                </CardTitle>
                {account.isActive && <Badge variant="default">Active</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span className="text-sm">{account.address}</span>
                </div>
                {account.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{account.phone}</span>
                  </div>
                )}
                {account.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{account.email}</span>
                  </div>
                )}
                <div className="pt-2 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditAccount(account)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteAccount(account)}
                    disabled={accounts.length <= 1}
                    title={
                      accounts.length <= 1
                        ? "Cannot delete the last account"
                        : "Delete account"
                    }
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>
              Create a new business account with custom header and footer
              settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter business name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Enter complete business address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label>Header Text (for Bills)</Label>
              <Input
                value={formData.headerText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    headerText: e.target.value,
                  }))
                }
                placeholder="Text to show at top of bills"
              />
            </div>

            <div className="space-y-2">
              <Label>Footer Text (for Bills)</Label>
              <Textarea
                value={formData.footerText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    footerText: e.target.value,
                  }))
                }
                placeholder="Declaration text for bottom of bills"
                rows={2}
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
                onClick={handleAddAccount}
                disabled={!formData.name || !formData.address}
              >
                Add Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog
        open={!!editingAccount}
        onOpenChange={() => setEditingAccount(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update account information and bill settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter business name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Enter complete business address"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label>Header Text (for Bills)</Label>
              <Input
                value={formData.headerText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    headerText: e.target.value,
                  }))
                }
                placeholder="Text to show at top of bills"
              />
            </div>

            <div className="space-y-2">
              <Label>Footer Text (for Bills)</Label>
              <Textarea
                value={formData.footerText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    footerText: e.target.value,
                  }))
                }
                placeholder="Declaration text for bottom of bills"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingAccount(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAccount}
                disabled={!formData.name || !formData.address}
              >
                <Check className="h-4 w-4 mr-2" />
                Update Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
