import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  useCustomer,
  type Customer,
  type CustomerTransaction,
} from "@/components/CustomerContext";
import { useTransaction } from "@/components/TransactionContext";
import { useBill } from "@/components/BillContext";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  CreditCard,
  Calendar,
  TrendingUp,
  Eye,
  Phone,
  Mail,
  MapPin,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Customers() {
  const { customers, syncCustomersFromTransactions } = useCustomer();
  const { transactions } = useTransaction();
  const { bills } = useBill();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Function to get bills for a specific customer
  const getCustomerBills = (customerName: string) => {
    return bills.filter(
      (bill) => bill.customerName.toLowerCase() === customerName.toLowerCase(),
    );
  };

  // Function to navigate to bills page with customer filter
  const navigateToBills = (customerName: string) => {
    navigate(`/bills?customer=${encodeURIComponent(customerName)}`);
  };

  // Function to navigate to specific bill
  const navigateToBill = (billNumber: number) => {
    navigate(`/bills?highlight=${billNumber}`);
  };

  // Sync customers from transactions on component mount
  useEffect(() => {
    if (transactions.length > 0) {
      syncCustomersFromTransactions(transactions);
    }
  }, [transactions]); // Remove syncCustomersFromTransactions from dependencies to prevent multiple calls

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPayment =
        paymentFilter === "all" || customer.preferredPayment === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [customers, searchTerm, paymentFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce(
      (sum, customer) => sum + customer.totalAmount,
      0,
    );
    const cashCustomers = customers.filter(
      (c) => c.preferredPayment === "Cash",
    ).length;
    const gpayCustomers = customers.filter(
      (c) => c.preferredPayment === "GPay",
    ).length;
    const avgTransactionValue =
      totalRevenue /
        customers.reduce((sum, c) => sum + c.totalTransactions, 0) || 0;

    return {
      totalCustomers,
      totalRevenue,
      cashCustomers,
      gpayCustomers,
      avgTransactionValue,
    };
  }, [customers]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">
              View and manage customer information, transaction history, and
              payment preferences
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => syncCustomersFromTransactions(transactions)}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync from Transactions
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalRevenue.toLocaleString()}
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
                  <p className="text-sm font-medium">Payment Mix</p>
                  <p className="text-lg font-bold">
                    {stats.cashCustomers}C / {stats.gpayCustomers}D
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Avg Transaction</p>
                  <p className="text-2xl font-bold">
                    ₹{Math.round(stats.avgTransactionValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Customers</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, phone, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="payment-filter">Payment Method</Label>
                <select
                  id="payment-filter"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <option value="all">All Methods</option>
                  <option value="Cash">Cash Only</option>
                  <option value="GPay">GPay Only</option>
                  <option value="Bank">Bank Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <Badge
                    variant={
                      customer.preferredPayment === "Cash"
                        ? "secondary"
                        : customer.preferredPayment === "GPay"
                          ? "default"
                          : "outline"
                    }
                  >
                    {customer.preferredPayment}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Transactions:
                      </span>
                      <span className="font-medium">
                        {customer.totalTransactions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Amount:
                      </span>
                      <span className="font-medium">
                        ₹{customer.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Last Transaction:
                      </span>
                      <span className="font-medium">
                        {customer.lastTransaction}
                      </span>
                    </div>

                    {(() => {
                      const customerBills = getCustomerBills(customer.name);
                      return customerBills.length > 0 ? (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">
                              Bills Generated:
                            </span>
                            <span className="font-medium">
                              {customerBills.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">
                              Bills Total:
                            </span>
                            <span className="font-medium">
                              ₹
                              {customerBills
                                .reduce((sum, bill) => sum + bill.subTotal, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Latest Bill:
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const latestBill = customerBills.sort(
                                  (a, b) => b.billNumber - a.billNumber,
                                )[0];
                                navigateToBill(latestBill.billNumber);
                              }}
                              className="font-medium text-blue-600 hover:text-blue-800 underline"
                            >
                              #
                              {
                                customerBills.sort(
                                  (a, b) => b.billNumber - a.billNumber,
                                )[0]?.billNumber
                              }
                            </button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToBills(customer.name);
                            }}
                            className="w-full mt-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                          >
                            View All Bills ({customerBills.length})
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground text-center py-1">
                            No bills generated yet
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Customers Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || paymentFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "No customers available for this account"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Customer Detail Dialog */}
        <Dialog
          open={!!selectedCustomer}
          onOpenChange={() => setSelectedCustomer(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer?.name} - Transaction History
              </DialogTitle>
              <DialogDescription>
                Complete transaction history and customer details
              </DialogDescription>
            </DialogHeader>

            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Contact Information</h4>
                    {selectedCustomer.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Transaction Summary</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span className="font-medium">
                          {selectedCustomer.totalTransactions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-medium">
                          ₹{selectedCustomer.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Preferred Payment:</span>
                        <Badge variant="outline">
                          {selectedCustomer.preferredPayment}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div>
                  <h4 className="font-medium mb-3">Transaction History</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Payment</th>
                          <th className="text-left p-2">Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b">
                            <td className="p-2">{transaction.date}</td>
                            <td className="p-2 font-medium">
                              ₹{transaction.amount}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  transaction.paymentMode === "Cash"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {transaction.paymentMode}
                              </Badge>
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {transaction.items?.join(", ") || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
