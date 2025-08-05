import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Settings,
  Trash2,
  Plus,
  Code,
} from "lucide-react";
import { useBill } from "@/components/BillContext";
import { HtmlProcessor, demonstratePythonWorkflow } from "@/lib/htmlProcessor";

export default function HtmlReportProcessor() {
  const { bills } = useBill();
  const [headerConfig, setHeaderConfig] = useState({
    address: "Shop No. 12, Main Bazaar, Indore, MP - 452001",
    phone: "+91 9876543210",
    gst: "23ABCDE1234F1Z5",
    showAddress: true,
    showPhone: true,
    showGST: true,
  });

  const [footerConfig, setFooterConfig] = useState({
    declaration: "We are under composition scheme under GST.",
    showDeclaration: true,
    customNote: "",
    showCustomNote: false,
  });

  const [processingConfig, setProcessingConfig] = useState({
    removeExpectedVsActual: true,
    removeToleranceRows: false,
    cleanEmptyRows: true,
    addTableBorders: true,
  });

  const [processedHtml, setProcessedHtml] = useState("");

  // HTML manipulation using BeautifulSoup-like utilities
  const processHtmlContent = (htmlContent: string): string => {
    return HtmlProcessor.processHtml(
      htmlContent,
      processingConfig,
      headerConfig,
      footerConfig,
    );
  };

  const generateBaseHtmlReport = (): string => {
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

  const handleProcessReport = () => {
    try {
      if (bills.length === 0) {
        alert(
          "No bills available to process. Please generate some bills from the Transactions or Bills page first.",
        );
        return;
      }

      const baseHtml = generateBaseHtmlReport();
      const processed = processHtmlContent(baseHtml);
      setProcessedHtml(processed);

      console.log("HTML report processed successfully!");
    } catch (error) {
      console.error("Processing error:", error);
      alert("Error processing HTML report. Please try again.");
    }
  };

  const downloadProcessedReport = () => {
    try {
      if (bills.length === 0) {
        alert(
          "No bills available to process. Please generate some bills first.",
        );
        return;
      }

      let htmlToDownload = processedHtml;
      if (!htmlToDownload) {
        handleProcessReport();
        const baseHtml = generateBaseHtmlReport();
        htmlToDownload = processHtmlContent(baseHtml);
      }

      if (!htmlToDownload) {
        alert("Failed to generate HTML report. Please try again.");
        return;
      }

      const blob = new Blob([htmlToDownload], {
        type: "text/html; charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Mega_Sale_Report_${new Date().toISOString().split("T")[0]}_PROCESSED.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("HTML report downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      alert("Error downloading report. Please try again.");
    }
  };

  const previewProcessedReport = () => {
    try {
      if (bills.length === 0) {
        alert(
          "No bills available to preview. Please generate some bills first.",
        );
        return;
      }

      let htmlToPreview = processedHtml;
      if (!htmlToPreview) {
        handleProcessReport();
        const baseHtml = generateBaseHtmlReport();
        htmlToPreview = processHtmlContent(baseHtml);
      }

      if (!htmlToPreview) {
        alert("Failed to generate HTML report for preview. Please try again.");
        return;
      }

      const newWindow = window.open("", "_blank", "width=1200,height=800");
      if (newWindow) {
        newWindow.document.write(htmlToPreview);
        newWindow.document.close();
      } else {
        alert("Popup blocked. Please allow popups and try again.");
      }
    } catch (error) {
      console.error("Preview error:", error);
      alert("Error previewing report. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            HTML Report Processor
          </CardTitle>
          <CardDescription>
            BeautifulSoup-like HTML manipulation for report customization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="header" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="header">Header Config</TabsTrigger>
              <TabsTrigger value="footer">Footer Config</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Header Configuration */}
            <TabsContent value="header" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={headerConfig.showAddress}
                      onCheckedChange={(checked) =>
                        setHeaderConfig((prev) => ({
                          ...prev,
                          showAddress: checked,
                        }))
                      }
                    />
                    <Label>Show Address</Label>
                  </div>

                  {headerConfig.showAddress && (
                    <div className="space-y-2">
                      <Label>Agency Address</Label>
                      <Textarea
                        value={headerConfig.address}
                        onChange={(e) =>
                          setHeaderConfig((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Enter agency address..."
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={headerConfig.showPhone}
                      onCheckedChange={(checked) =>
                        setHeaderConfig((prev) => ({
                          ...prev,
                          showPhone: checked,
                        }))
                      }
                    />
                    <Label>Show Phone</Label>
                  </div>

                  {headerConfig.showPhone && (
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={headerConfig.phone}
                        onChange={(e) =>
                          setHeaderConfig((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Enter phone number..."
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={headerConfig.showGST}
                      onCheckedChange={(checked) =>
                        setHeaderConfig((prev) => ({
                          ...prev,
                          showGST: checked,
                        }))
                      }
                    />
                    <Label>Show GST Number</Label>
                  </div>

                  {headerConfig.showGST && (
                    <div className="space-y-2">
                      <Label>GST Number</Label>
                      <Input
                        value={headerConfig.gst}
                        onChange={(e) =>
                          setHeaderConfig((prev) => ({
                            ...prev,
                            gst: e.target.value,
                          }))
                        }
                        placeholder="Enter GST number..."
                      />
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Header Preview
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>Mega Sale Report</div>
                      <div className="font-medium">Sadhana Agency</div>
                      {headerConfig.showAddress && (
                        <div className="text-xs">{headerConfig.address}</div>
                      )}
                      {headerConfig.showPhone && (
                        <div className="text-xs">
                          Phone: {headerConfig.phone}
                        </div>
                      )}
                      {headerConfig.showGST && (
                        <div className="text-xs">
                          GST No: {headerConfig.gst}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Footer Configuration */}
            <TabsContent value="footer" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={footerConfig.showDeclaration}
                      onCheckedChange={(checked) =>
                        setFooterConfig((prev) => ({
                          ...prev,
                          showDeclaration: checked,
                        }))
                      }
                    />
                    <Label>Show GST Declaration</Label>
                  </div>

                  {footerConfig.showDeclaration && (
                    <div className="space-y-2">
                      <Label>GST Declaration</Label>
                      <Textarea
                        value={footerConfig.declaration}
                        onChange={(e) =>
                          setFooterConfig((prev) => ({
                            ...prev,
                            declaration: e.target.value,
                          }))
                        }
                        placeholder="Enter GST declaration..."
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={footerConfig.showCustomNote}
                      onCheckedChange={(checked) =>
                        setFooterConfig((prev) => ({
                          ...prev,
                          showCustomNote: checked,
                        }))
                      }
                    />
                    <Label>Show Custom Note</Label>
                  </div>

                  {footerConfig.showCustomNote && (
                    <div className="space-y-2">
                      <Label>Custom Footer Note</Label>
                      <Textarea
                        value={footerConfig.customNote}
                        onChange={(e) =>
                          setFooterConfig((prev) => ({
                            ...prev,
                            customNote: e.target.value,
                          }))
                        }
                        placeholder="Enter custom note..."
                        rows={2}
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Footer Preview
                  </h4>
                  <div className="text-sm space-y-2 text-center">
                    {footerConfig.showDeclaration && (
                      <div className="italic text-gray-600 border-t pt-2">
                        {footerConfig.declaration}
                      </div>
                    )}
                    {footerConfig.showCustomNote && footerConfig.customNote && (
                      <div className="text-xs text-gray-500">
                        {footerConfig.customNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Processing Configuration */}
            <TabsContent value="processing" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Row Removal Options</h4>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="flex items-center">
                        <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                        Remove "Expected vs Actual" Rows
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Similar to Python BeautifulSoup row.decompose()
                      </p>
                    </div>
                    <Switch
                      checked={processingConfig.removeExpectedVsActual}
                      onCheckedChange={(checked) =>
                        setProcessingConfig((prev) => ({
                          ...prev,
                          removeExpectedVsActual: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="flex items-center">
                        <Trash2 className="h-4 w-4 mr-2 text-orange-500" />
                        Remove Tolerance Rows
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Remove tolerance information from tables
                      </p>
                    </div>
                    <Switch
                      checked={processingConfig.removeToleranceRows}
                      onCheckedChange={(checked) =>
                        setProcessingConfig((prev) => ({
                          ...prev,
                          removeToleranceRows: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="flex items-center">
                        <Trash2 className="h-4 w-4 mr-2 text-gray-500" />
                        Clean Empty Rows
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Remove rows with no content
                      </p>
                    </div>
                    <Switch
                      checked={processingConfig.cleanEmptyRows}
                      onCheckedChange={(checked) =>
                        setProcessingConfig((prev) => ({
                          ...prev,
                          cleanEmptyRows: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Enhancement Options</h4>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="flex items-center">
                        <Plus className="h-4 w-4 mr-2 text-blue-500" />
                        Add Table Borders
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enhance table styling with borders
                      </p>
                    </div>
                    <Switch
                      checked={processingConfig.addTableBorders}
                      onCheckedChange={(checked) =>
                        setProcessingConfig((prev) => ({
                          ...prev,
                          addTableBorders: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">
                      Processing Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      {processingConfig.removeExpectedVsActual && (
                        <Badge variant="destructive" className="mr-1 mb-1">
                          Remove Expected vs Actual
                        </Badge>
                      )}
                      {processingConfig.removeToleranceRows && (
                        <Badge variant="secondary" className="mr-1 mb-1">
                          Remove Tolerance
                        </Badge>
                      )}
                      {processingConfig.cleanEmptyRows && (
                        <Badge variant="outline" className="mr-1 mb-1">
                          Clean Empty Rows
                        </Badge>
                      )}
                      {processingConfig.addTableBorders && (
                        <Badge variant="default" className="mr-1 mb-1">
                          Add Borders
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex space-x-2">
                  <Button onClick={handleProcessReport} className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Process Report
                  </Button>
                  <Button
                    onClick={() => {
                      const baseHtml = generateBaseHtmlReport();
                      const pythonStyleProcessed =
                        demonstratePythonWorkflow(baseHtml);
                      setProcessedHtml(pythonStyleProcessed);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Python Demo
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={previewProcessedReport}
                    variant="outline"
                    disabled={!processedHtml}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={downloadProcessedReport}
                    disabled={!processedHtml}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {processedHtml && (
                <Card>
                  <CardHeader>
                    <CardTitle>Processed HTML Report</CardTitle>
                    <CardDescription>
                      Report processed with your configurations applied
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
                      <pre className="text-xs whitespace-pre-wrap">
                        {processedHtml.substring(0, 1000)}
                        {processedHtml.length > 1000 && "..."}
                      </pre>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      HTML size: {processedHtml.length} characters
                    </div>
                  </CardContent>
                </Card>
              )}

              {bills.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      No Bills Available
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Generate some bills to test the HTML processor
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Code className="h-4 w-4 mr-2 text-blue-500" />
                    Python BeautifulSoup Equivalent Code
                  </CardTitle>
                  <CardDescription>
                    This web app implements the same functionality as your
                    Python code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-x-auto border">
                    {`# Your original Python BeautifulSoup workflow:
from bs4 import BeautifulSoup

# Load HTML file
with open("Mega_Sale_Report_2025-08-05_FIXED.html", "r", encoding="utf-8") as file:
    soup = BeautifulSoup(file, "html.parser")

# 🔴 Step 1: Remove "Expected vs Actual" Rows
for footer in soup.find_all("tfoot"):
    rows_to_remove = []
    for tr in footer.find_all("tr"):
        if "Expected vs Actual" in tr.get_text():
            rows_to_remove.append(tr)
    for tr in rows_to_remove:
        tr.decompose()  # ← Now implemented in TypeScript above!

# ���� Step 2: Add Address in the Header
header_div = soup.find("div", class_="header")
if header_div:
    new_address = soup.new_tag("p")
    new_address.string = "Shop No. 12, Main Bazaar, Indore, MP - 452001"
    header_div.append(new_address)  # ← Now implemented in TypeScript above!

# 🟢 Step 3: Add Footer Declaration
footer_note = soup.new_tag("div")
footer_note.string = "We are under composition scheme under GST."
footer_note['style'] = "text-align:center; margin-top: 40px; font-size: 14px; ..."
soup.body.append(footer_note)  # ← Now implemented in TypeScript above!

# 💾 Step 4: Save the Final HTML
with open("Mega_Sale_Report_2025-08-05_FINAL.html", "w", encoding="utf-8") as file:
    file.write(str(soup))  # ← Now downloads automatically above!`}
                  </pre>
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅{" "}
                      <strong>
                        All Python BeautifulSoup operations are now available in
                        this web interface!
                      </strong>
                      <br />
                      Click "Python Demo" to run the exact same workflow as your
                      Python code.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
