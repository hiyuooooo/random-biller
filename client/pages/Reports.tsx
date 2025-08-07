import React, { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SampleDataGenerator } from "@/components/SampleDataGenerator";
import HtmlReportProcessor from "@/components/HtmlReportProcessor";
import {
  Download,
  FileText,
  Package,
  TrendingUp,
  AlertTriangle,
  Filter,
  Eye,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useBill } from "@/components/BillContext";
import { useAccount } from "@/components/AccountManager";
import { Switch } from "@/components/ui/switch";

// Mock data for reports
const mockBillReports = [
  {
    billNo: 1001,
    customerName: "Rajesh Kumar",
    date: "15-01-2024",
    subTotal: 340,
    expectedTotal: 350,
    difference: -10,
    status: "Under",
  },
  {
    billNo: 1002,
    customerName: "Priya Sharma",
    date: "15-01-2024",
    subTotal: 280,
    expectedTotal: 250,
    difference: 30,
    status: "Over",
  },
  {
    billNo: 1003,
    customerName: "Ahmed Ali",
    date: "14-01-2024",
    subTotal: 420,
    expectedTotal: 380,
    difference: 40,
    status: "Over",
  },
  {
    billNo: 1004,
    customerName: "Sunita Devi",
    date: "14-01-2024",
    subTotal: 230,
    expectedTotal: 280,
    difference: -50,
    status: "Under",
  },
  {
    billNo: 1005,
    customerName: "Vikram Singh",
    date: "13-01-2024",
    subTotal: 520,
    expectedTotal: 500,
    difference: 20,
    status: "Over",
  },
];

const mockStockReport = [
  {
    itemName: "Rice (1kg)",
    price: 80,
    availableQuantity: 120,
    value: 9600,
    status: "In Stock",
  },
  {
    itemName: "Wheat Flour (1kg)",
    price: 45,
    availableQuantity: 180,
    value: 8100,
    status: "In Stock",
  },
  {
    itemName: "Sugar (1kg)",
    price: 60,
    availableQuantity: 15,
    value: 900,
    status: "Low Stock",
  },
  {
    itemName: "Cooking Oil (1L)",
    price: 120,
    availableQuantity: 65,
    value: 7800,
    status: "In Stock",
  },
  {
    itemName: "Tea (250g)",
    price: 180,
    availableQuantity: 8,
    value: 1440,
    status: "Low Stock",
  },
  {
    itemName: "Honey (250g)",
    price: 180,
    availableQuantity: 0,
    value: 0,
    status: "Out of Stock",
  },
];

const mockSalesReport = [
  {
    period: "Today",
    sales: 2450,
    transactions: 8,
    cashSales: 1200,
    gpaySales: 1250,
  },
  {
    period: "Yesterday",
    sales: 3200,
    transactions: 12,
    cashSales: 1800,
    gpaySales: 1400,
  },
  {
    period: "This Week",
    sales: 18500,
    transactions: 45,
    cashSales: 8200,
    gpaySales: 10300,
  },
  {
    period: "This Month",
    sales: 75600,
    transactions: 180,
    cashSales: 35200,
    gpaySales: 40400,
  },
];

export default function Reports() {
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("billing");
  const [bulkPdfDateRange, setBulkPdfDateRange] = useState({
    from: "",
    to: "",
  });
  const [includeGST, setIncludeGST] = useState(false);
  const { bills } = useBill();
  const { activeAccount } = useAccount();
  const navigate = useNavigate();

  const navigateToBill = (billNumber: number) => {
    // Navigate to bills page with a query parameter to highlight the specific bill and open edit
    navigate(`/bills?highlight=${billNumber}&edit=true`);
  };

  // Filter bill reports based on mismatch threshold
  const mismatchReports = useMemo(() => {
    return bills.filter((bill) => Math.abs(bill.difference) > 25);
  }, [bills]);

  const filteredBillReports = useMemo(() => {
    return bills.filter((bill) => {
      const matchesSearch =
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber.toString().includes(searchTerm);
      return matchesSearch;
    });
  }, [bills, searchTerm]);

  const generateBillReport = () => {
    const reportData = bills.map((bill) => ({
      "Bill No": bill.billNumber,
      "Customer Name": bill.customerName,
      Date: bill.date,
      "Sub Total": bill.subTotal,
      "Expected Total": bill.expectedTotal,
      Difference: bill.difference,
      Status:
        Math.abs(bill.difference) > 25
          ? bill.difference > 0
            ? "Under"
            : "Over"
          : "Within Range",
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Billing Report");
    XLSX.writeFile(workbook, "billing_report.xlsx");
  };

  const generateStockReport = () => {
    const reportData = mockStockReport.map((item) => ({
      "Item Name": item.itemName,
      Price: item.price,
      "Available Quantity": item.availableQuantity,
      "Total Value": item.value,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Report");
    XLSX.writeFile(workbook, "stock_report.xlsx");
  };

  const generateMismatchReport = () => {
    const reportData = mismatchReports.map((bill) => ({
      "Bill No": bill.billNumber,
      "Customer Name": bill.customerName,
      Date: bill.date,
      "Sub Total": bill.subTotal,
      "Expected Total": bill.expectedTotal,
      Difference: bill.difference,
      Status: bill.difference > 0 ? "Under" : "Over",
      "Difference Amount": Math.abs(bill.difference),
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mismatch Report");
    XLSX.writeFile(workbook, "mismatch_report.xlsx");
  };

  const generateMegaReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mega Sale Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .bill-section { margin-bottom: 20px; page-break-inside: avoid; }
          .bill-header { background-color: #f5f5f5; padding: 10px; margin-bottom: 10px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 12px; }
          .items-table th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .grand-total { font-size: 18px; font-weight: bold; text-align: center; margin-top: 30px; padding: 15px; background-color: #e7f3ff; }
          @media print {
            .bill-section {
              page-break-after: auto;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Mega Sale Report</h2>
          <h3>Sadhana Agency</h3>
        </div>

        ${bills
          .map(
            (bill, index) => `
          <div class="bill-section">
            <div class="bill-header">
              <h4>Bill No: ${bill.billNumber} | Customer: ${bill.customerName} | Date: ${bill.date} | Payment: ${bill.paymentMode}</h4>
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
                    (item, itemIndex) => `
                  <tr>
                    <td>${itemIndex + 1}</td>
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
                  <td colspan="4">Sub Total:</td>
                  <td>₹${bill.subTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        `,
          )
          .join("")}

        <div class="grand-total">
          <div>TOTAL SALES: ₹${bills.reduce((sum, bill) => sum + bill.subTotal, 0).toLocaleString()}</div>
          <div style="font-size: 14px; margin-top: 10px;">
            Total Bills: ${bills.length} | Total Items: ${bills.reduce((sum, bill) => sum + bill.items.length, 0)}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadMegaReportHTML = () => {
    try {
      if (bills.length === 0) {
        alert(
          "No bills available to generate report. Please create some bills first.",
        );
        return;
      }

      const htmlContent = generateMegaReportHTML();
      const blob = new Blob([htmlContent], {
        type: "text/html; charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Mega_Sale_Report_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Mega report HTML downloaded successfully!");
    } catch (error) {
      console.error("Error generating mega report:", error);
      alert("Error generating mega report. Please try again.");
    }
  };

  const generateMegaReportPDF = async () => {
    try {
      if (bills.length === 0) {
        alert(
          "No bills available to generate report. Please create some bills first.",
        );
        return;
      }

      // Create a temporary HTML element with the report content
      const htmlContent = generateMegaReportHTML();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "140mm"; // Reduced width to account for 70mm left margin
      tempDiv.style.backgroundColor = "white";
      document.body.appendChild(tempDiv);

      // Wait for images and content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 529, // Reduced width for content area (140mm)
        height: 1123, // A4 height in pixels at 96 DPI
      });

      // Remove temporary element
      document.body.removeChild(tempDiv);

      // Create PDF with 70mm left margin
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const leftMargin = 70; // 70mm left margin as requested
      const contentWidth = pdfWidth - leftMargin; // Available content width
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page with 70mm left margin
      pdf.addImage(imgData, "PNG", leftMargin, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", leftMargin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Download PDF
      pdf.save(
        `Mega_Sale_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      );

      console.log("Mega report PDF downloaded successfully with 70mm left margin!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const generateBulkPDFs = async () => {
    try {
      if (bills.length === 0) {
        alert("No bills available to generate PDFs.");
        return;
      }

      const { from, to } = bulkPdfDateRange;
      if (!from || !to) {
        alert(
          "Please select both start and end dates for bulk PDF generation.",
        );
        return;
      }

      // Filter bills by date range
      const filteredBills = bills.filter((bill) => {
        const billDate = new Date(bill.date.split("-").reverse().join("-")); // Convert DD-MM-YYYY to YYYY-MM-DD
        const startDate = new Date(from);
        const endDate = new Date(to);
        return billDate >= startDate && billDate <= endDate;
      });

      if (filteredBills.length === 0) {
        alert("No bills found in the selected date range.");
        return;
      }

      const confirmed = confirm(
        `Generate ${filteredBills.length} separate PDF files for bills in the selected date range?`,
      );
      if (!confirmed) return;

      // Generate PDF for each bill
      for (let i = 0; i < filteredBills.length; i++) {
        const bill = filteredBills[i];
        await generateSingleBillPDF(bill, i, filteredBills.length);
        // Add small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      alert(`Successfully generated ${filteredBills.length} PDF files!`);
    } catch (error) {
      console.error("Error generating bulk PDFs:", error);
      alert("Error generating bulk PDFs. Please try again.");
    }
  };

  const generateSingleBillPDF = async (
    bill: any,
    index: number,
    total: number,
  ) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .bill-header { background-color: #f5f5f5; padding: 10px; margin-bottom: 10px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>BILL</h2>
          <h3>Sadhana Agency</h3>
        </div>

        <div class="bill-header">
          <h4>Bill No: ${bill.billNumber} | Customer: ${bill.customerName} | Date: ${bill.date} | Payment: ${bill.paymentMode}</h4>
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
                (item: any, itemIndex: number) => `
              <tr>
                <td>${itemIndex + 1}</td>
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
              <td colspan="4">Sub Total:</td>
              <td>₹${bill.subTotal}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    // Create temporary element
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.width = "210mm";
    tempDiv.style.backgroundColor = "white";
    document.body.appendChild(tempDiv);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Convert to PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(tempDiv);

    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(
      `Bill_${bill.billNumber}_${bill.customerName.replace(/\s+/g, "_")}.pdf`,
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate comprehensive reports for billing, stock, and sales
              analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={includeGST}
                onCheckedChange={setIncludeGST}
              />
              <label className="text-sm font-medium">Include GST</label>
            </div>
            <div className="flex space-x-2">
              <Button onClick={downloadMegaReportHTML} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Download HTML
              </Button>
              <Button onClick={generateMegaReportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("processor")}>
                <Code className="h-4 w-4 mr-2" />
                HTML Processor
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
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
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total Sales</p>
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
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Mismatches (Above ₹25)</p>
                  <p className="text-2xl font-bold">{mismatchReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Stock Value</p>
                  <p className="text-2xl font-bold">
                    ₹
                    {mockStockReport
                      .reduce((sum, item) => sum + item.value, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="billing">Billing Reports</TabsTrigger>
            <TabsTrigger value="mismatch">Mismatches</TabsTrigger>
            <TabsTrigger value="mega">Mega Report</TabsTrigger>
            <TabsTrigger value="processor">HTML Processor</TabsTrigger>
            <TabsTrigger value="stock">Stock Reports</TabsTrigger>
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          {/* Billing Reports Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Report Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={dateFilter.from}
                      onChange={(e) =>
                        setDateFilter((prev) => ({
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
                      value={dateFilter.to}
                      onChange={(e) =>
                        setDateFilter((prev) => ({
                          ...prev,
                          to: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Search Customer</Label>
                    <Input
                      placeholder="Search by customer or bill number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <div className="flex space-x-2">
              <Button onClick={generateBillReport}>
                <Download className="h-4 w-4 mr-2" />
                Export All Bills
              </Button>
              <Button onClick={generateMismatchReport} variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Export Mismatches Only
              </Button>
            </div>

            {/* Billing Report Table */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Report</CardTitle>
                <CardDescription>
                  Expected vs Generated totals with mismatch highlighting (Above
                  ₹25 difference)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Bill No</th>
                        <th className="text-left p-3 font-medium">Customer</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">
                          Generated Total
                        </th>
                        <th className="text-left p-3 font-medium">
                          Expected Total
                        </th>
                        <th className="text-left p-3 font-medium">
                          Difference
                        </th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBillReports.map((bill, index) => (
                        <tr
                          key={`billing-report-${bill.id}-${index}`}
                          className={cn(
                            "border-b hover:bg-accent/50 transition-colors",
                            Math.abs(bill.difference) > 25 &&
                              "bg-red-50 border-red-200",
                          )}
                        >
                          <td className="p-3 font-medium">{bill.billNumber}</td>
                          <td className="p-3">{bill.customerName}</td>
                          <td className="p-3">{bill.date}</td>
                          <td className="p-3">₹{bill.subTotal}</td>
                          <td className="p-3">₹{bill.expectedTotal}</td>
                          <td className="p-3">
                            <span
                              className={cn(
                                "font-medium",
                                bill.difference > 0
                                  ? "text-red-600"
                                  : "text-green-600",
                              )}
                            >
                              {bill.difference > 0 ? "+" : ""}₹{bill.difference}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                Math.abs(bill.difference) > 25
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {Math.abs(bill.difference) > 30
                                ? `${bill.difference > 0 ? "Under" : "Over"} ₹${Math.abs(bill.difference)}`
                                : "Within Range"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mismatch Reports Tab */}
          <TabsContent value="mismatch" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Billing Mismatches</h3>
                <p className="text-sm text-muted-foreground">
                  Bills with differences greater than ₹25 between expected and
                  generated totals
                </p>
              </div>
              <Button
                onClick={generateMismatchReport}
                disabled={mismatchReports.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Mismatches ({mismatchReports.length})
              </Button>
            </div>

            {mismatchReports.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      No Mismatches Found
                    </h3>
                    <p className="text-sm">
                      All bills are within the ±₹25 tolerance range
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">
                    ⚠️ Billing Mismatches ({mismatchReports.length})
                  </CardTitle>
                  <CardDescription>
                    These bills have significant differences between expected
                    and generated totals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Bill No</th>
                          <th className="text-left p-3 font-medium">
                            Customer
                          </th>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">
                            Generated
                          </th>
                          <th className="text-left p-3 font-medium">
                            Expected
                          </th>
                          <th className="text-left p-3 font-medium">
                            Difference
                          </th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mismatchReports.map((bill, index) => (
                          <tr
                            key={`mismatch-report-${bill.id}-${index}`}
                            className="border-b bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                            onClick={() => navigateToBill(bill.billNumber)}
                            title="Click to view this bill in Bills section"
                          >
                            <td className="p-3 font-medium text-blue-600 hover:text-blue-800">
                              {bill.billNumber}
                            </td>
                            <td className="p-3">{bill.customerName}</td>
                            <td className="p-3">{bill.date}</td>
                            <td className="p-3 font-medium">
                              ₹{bill.subTotal}
                            </td>
                            <td className="p-3 font-medium">
                              ₹{bill.expectedTotal}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-red-600">
                                {bill.difference > 0 ? "+" : ""}₹
                                {bill.difference}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant="destructive">
                                {bill.difference > 0 ? "Under" : "Over"} by ₹
                                {Math.abs(bill.difference)}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-sm text-muted-foreground">
                                {bill.items.length} items
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      Mismatch Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Mismatches:</span>
                        <span className="ml-2">{mismatchReports.length}</span>
                      </div>
                      <div>
                        <span className="font-medium">Over-Generated:</span>
                        <span className="ml-2">
                          {
                            mismatchReports.filter((b) => b.difference < 0)
                              .length
                          }
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Under-Generated:</span>
                        <span className="ml-2">
                          {
                            mismatchReports.filter((b) => b.difference > 0)
                              .length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* HTML Processor Tab */}
          <TabsContent value="processor" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">HTML Report Processor</h3>
                <p className="text-sm text-muted-foreground">
                  BeautifulSoup-like HTML manipulation for report customization
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Advanced Processing</span>
              </div>
            </div>

            <HtmlReportProcessor />
          </TabsContent>

          {/* Mega Report Tab */}
          <TabsContent value="mega" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Mega Sale Report</h3>
                <p className="text-sm text-muted-foreground">
                  Consolidated report of all generated bills with summary totals
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={downloadMegaReportHTML}>
                  <FileText className="h-4 w-4 mr-2" />
                  Download HTML
                </Button>
                <Button onClick={generateMegaReportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const htmlContent = generateMegaReportHTML();
                    const newWindow = window.open("", "_blank");
                    if (newWindow) {
                      newWindow.document.write(htmlContent);
                      newWindow.document.close();
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Bulk PDF Generation */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk PDF Generation</CardTitle>
                <CardDescription>
                  Generate separate PDF files for all bills within a date range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-from-date">From Date</Label>
                    <Input
                      id="bulk-from-date"
                      type="date"
                      value={bulkPdfDateRange.from}
                      onChange={(e) =>
                        setBulkPdfDateRange((prev) => ({
                          ...prev,
                          from: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-to-date">To Date</Label>
                    <Input
                      id="bulk-to-date"
                      type="date"
                      value={bulkPdfDateRange.to}
                      onChange={(e) =>
                        setBulkPdfDateRange((prev) => ({
                          ...prev,
                          to: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Button
                      onClick={generateBulkPDFs}
                      disabled={
                        !bulkPdfDateRange.from ||
                        !bulkPdfDateRange.to ||
                        bills.length === 0
                      }
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Bulk PDFs
                    </Button>
                  </div>
                </div>
                {bulkPdfDateRange.from && bulkPdfDateRange.to && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    {
                      bills.filter((bill) => {
                        const billDate = new Date(
                          bill.date.split("-").reverse().join("-"),
                        );
                        const startDate = new Date(bulkPdfDateRange.from);
                        const endDate = new Date(bulkPdfDateRange.to);
                        return billDate >= startDate && billDate <= endDate;
                      }).length
                    }{" "}
                    bills found in selected date range
                  </div>
                )}
              </CardContent>
            </Card>

            {bills.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      No Bills Generated
                    </h3>
                    <p className="text-sm">
                      Generate some bills from transactions to see the mega
                      report
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Mega Report Preview ({bills.length} bills)
                  </CardTitle>
                  <CardDescription>
                    All bills consolidated in sequence with final totals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto border rounded-lg p-4 bg-white">
                    <div className="space-y-6">
                      {bills.map((bill, index) => (
                        <div key={`mega-report-${bill.id}-${index}`} className="border-b pb-4">
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <p className="font-medium">
                                Bill No: {bill.billNumber}
                              </p>
                              <p className="text-sm">
                                Customer: {bill.customerName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">Date: {bill.date}</p>
                              <p className="text-sm">
                                Payment: {bill.paymentMode}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-2 text-xs font-medium mb-2">
                            <div>Sr. No.</div>
                            <div>Item</div>
                            <div>Qty</div>
                            <div>Rate</div>
                            <div>Amount</div>
                          </div>

                          {bill.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="grid grid-cols-5 gap-2 text-xs py-1"
                            >
                              <div>{itemIndex + 1}</div>
                              <div className="truncate">{item.name}</div>
                              <div>{item.quantity}</div>
                              <div>₹{item.price}</div>
                              <div>₹{item.total}</div>
                            </div>
                          ))}

                          <div className="flex justify-end mt-2 text-sm font-medium">
                            <div className="flex space-x-4">
                              <span>Sub Total: ₹{bill.subTotal}</span>
                              {Math.abs(bill.difference) > 0 && (
                                <span
                                  className={
                                    bill.difference > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }
                                >
                                  ({bill.difference > 0 ? "+" : ""}₹
                                  {bill.difference})
                                </span>
                              )}
                              {bill.tolerance > 0 && (
                                <span className="text-orange-600 text-xs">
                                  Tolerance: ±{bill.tolerance}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4 text-right">
                        <div className="text-lg font-bold">
                          Total Sales: ₹
                          {bills
                            .reduce((sum, bill) => sum + bill.subTotal, 0)
                            .toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ({bills.length} bills |{" "}
                          {bills.reduce(
                            (sum, bill) => sum + bill.items.length,
                            0,
                          )}{" "}
                          items)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Stock Reports Tab */}
          <TabsContent value="stock" className="space-y-6">
            <div className="flex space-x-2">
              <Button onClick={generateStockReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Stock Report
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current Stock Summary</CardTitle>
                <CardDescription>
                  Complete inventory report with values and stock status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Item Name</th>
                        <th className="text-left p-3 font-medium">Price</th>
                        <th className="text-left p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">
                          Total Value
                        </th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockStockReport.map((item, index) => (
                        <tr
                          key={index}
                          className={cn(
                            "border-b hover:bg-accent/50 transition-colors",
                            item.status === "Out of Stock" && "bg-red-50",
                            item.status === "Low Stock" && "bg-orange-50",
                          )}
                        >
                          <td className="p-3">{item.itemName}</td>
                          <td className="p-3">₹{item.price}</td>
                          <td className="p-3 font-medium">
                            {item.availableQuantity}
                          </td>
                          <td className="p-3">
                            ₹{item.value.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                item.status === "Out of Stock"
                                  ? "destructive"
                                  : item.status === "Low Stock"
                                    ? "secondary"
                                    : "default"
                              }
                              className={
                                item.status === "Low Stock"
                                  ? "bg-orange-100 text-orange-800"
                                  : item.status === "In Stock"
                                    ? "bg-green-100 text-green-800"
                                    : ""
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Analytics Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>
                  Sales breakdown by period and payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockSalesReport.map((period, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">{period.period}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Sales:</span>
                            <span className="font-medium">
                              ₹{period.sales.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Transactions:</span>
                            <span className="font-medium">
                              {period.transactions}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Cash:</span>
                            <span className="font-medium">
                              ₹{period.cashSales.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">GPay:</span>
                            <span className="font-medium">
                              ₹{period.gpaySales.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Data Tab */}
          <TabsContent value="import" className="space-y-6">
            <SampleDataGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
