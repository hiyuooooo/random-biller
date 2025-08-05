import React from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  Package,
  AlertTriangle,
  FileText,
  CreditCard,
  DollarSign,
  Activity,
  Upload,
  Download,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

const statsCards = [
  {
    title: "Total Sales",
    value: "₹2,45,670",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    description: "This month",
  },
  {
    title: "Transactions",
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    icon: Receipt,
    description: "Total processed",
  },
  {
    title: "Active Customers",
    value: "342",
    change: "+5.1%",
    trend: "up",
    icon: Users,
    description: "This month",
  },
  {
    title: "Low Stock Items",
    value: "23",
    change: "+3",
    trend: "down",
    icon: Package,
    description: "Need attention",
  },
];

const recentTransactions = [
  {
    id: "TXN-001",
    customer: "Rajesh Kumar",
    amount: "₹2,450",
    mode: "GPay",
    date: "2024-01-15",
    status: "completed",
  },
  {
    id: "TXN-002",
    customer: "Priya Sharma",
    amount: "₹1,200",
    mode: "Cash",
    date: "2024-01-15",
    status: "completed",
  },
  {
    id: "TXN-003",
    customer: "Ahmed Ali",
    amount: "₹3,750",
    mode: "GPay",
    date: "2024-01-14",
    status: "pending",
  },
  {
    id: "TXN-004",
    customer: "Sunita Devi",
    amount: "₹850",
    mode: "Cash",
    date: "2024-01-14",
    status: "completed",
  },
  {
    id: "TXN-005",
    customer: "Vikram Singh",
    amount: "₹4,200",
    mode: "GPay",
    date: "2024-01-14",
    status: "completed",
  },
];

const quickActions = [
  {
    title: "Import Transactions",
    description: "Upload customer Excel file",
    icon: Upload,
    href: "/transactions",
    color: "bg-blue-500",
  },
  {
    title: "Generate Bills",
    description: "Create and export bills",
    icon: FileText,
    href: "/transactions",
    color: "bg-green-500",
  },
  {
    title: "Manage Stock",
    description: "Update inventory items",
    icon: Package,
    href: "/stock",
    color: "bg-purple-500",
  },
  {
    title: "Bill Blocker",
    description: "Configure blocked numbers",
    icon: AlertTriangle,
    href: "/bill-blocker",
    color: "bg-orange-500",
  },
  {
    title: "Export Reports",
    description: "Download detailed reports",
    icon: Download,
    href: "/reports",
    color: "bg-teal-500",
  },
  {
    title: "View Analytics",
    description: "Business insights",
    icon: Activity,
    href: "/analytics",
    color: "bg-indigo-500",
  },
];

export default function Index() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to BillMaster Pro - Your complete billing solution
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {stat.change}
                  </span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and workflows for efficient billing management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                    <div className={`p-2 rounded-md ${action.color}`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest customer transactions and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {transaction.customer}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {transaction.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          transaction.mode === "GPay" ? "default" : "secondary"
                        }
                      >
                        {transaction.mode}
                      </Badge>
                      <span className="font-medium">{transaction.amount}</span>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          transaction.status === "completed"
                            ? "bg-green-500"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link to="/transactions">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system state and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Bill Generation</span>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Low Stock Alert</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    23 items
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Data Sync</span>
                  </div>
                  <Badge variant="default" className="bg-blue-500">
                    Synced
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Blocked Bills</span>
                  </div>
                  <Badge variant="secondary">15 numbers</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to set up your billing workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">1. Import Data</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your customer Excel file to begin transaction
                  management
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">2. Setup Stock</h3>
                <p className="text-sm text-muted-foreground">
                  Configure your inventory items with quantities and prices
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">3. Configure Blockers</h3>
                <p className="text-sm text-muted-foreground">
                  Set up bill number blocking for better control
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">4. Generate Bills</h3>
                <p className="text-sm text-muted-foreground">
                  Create, validate, and export professional bills
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
