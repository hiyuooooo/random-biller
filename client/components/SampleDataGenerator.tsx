import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import * as XLSX from "xlsx";

export function SampleDataGenerator() {
  const generateStockSample = () => {
    // Sample stock data based on your Python code
    const stockData = [
      { "Item Name": "Rice (1kg)", Price: 80, "Available Quantity": 150 },
      {
        "Item Name": "Wheat Flour (1kg)",
        Price: 45,
        "Available Quantity": 200,
      },
      { "Item Name": "Sugar (1kg)", Price: 60, "Available Quantity": 100 },
      { "Item Name": "Cooking Oil (1L)", Price: 120, "Available Quantity": 80 },
      { "Item Name": "Pulses (1kg)", Price: 95, "Available Quantity": 120 },
      { "Item Name": "Tea (250g)", Price: 180, "Available Quantity": 60 },
      { "Item Name": "Salt (1kg)", Price: 25, "Available Quantity": 300 },
      { "Item Name": "Spices Mix (100g)", Price: 40, "Available Quantity": 90 },
      { "Item Name": "Biscuits (Pack)", Price: 35, "Available Quantity": 150 },
      { "Item Name": "Soap (100g)", Price: 30, "Available Quantity": 200 },
      { "Item Name": "Shampoo (200ml)", Price: 85, "Available Quantity": 45 },
      { "Item Name": "Toothpaste (100g)", Price: 55, "Available Quantity": 75 },
      { "Item Name": "Detergent (1kg)", Price: 65, "Available Quantity": 90 },
      {
        "Item Name": "Milk Powder (500g)",
        Price: 220,
        "Available Quantity": 35,
      },
      { "Item Name": "Honey (250g)", Price: 180, "Available Quantity": 25 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(stockData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Data");
    XLSX.writeFile(workbook, "sample_stock_data.xlsx");
  };

  const generateCustomerSample = () => {
    // Sample customer data based on your Python code format
    const customerData = [
      { Date: "15-01-2024", "Customer Name": "Rajesh Kumar", Total: 450 },
      { Date: "15-01-2024", "Customer Name": "Priya Sharma_c", Total: 320 },
      { Date: "14-01-2024", "Customer Name": "Ahmed Ali", Total: 380 },
      { Date: "14-01-2024", "Customer Name": "Sunita Devi_c", Total: 280 },
      { Date: "13-01-2024", "Customer Name": "Vikram Singh", Total: 520 },
      { Date: "13-01-2024", "Customer Name": "Meera Patel_c", Total: 350 },
      { Date: "12-01-2024", "Customer Name": "Arjun Reddy", Total: 420 },
      { Date: "12-01-2024", "Customer Name": "Kavita Singh", Total: 290 },
      { Date: "11-01-2024", "Customer Name": "Rohit Kumar_c", Total: 310 },
      { Date: "11-01-2024", "Customer Name": "Anita Sharma", Total: 480 },
      { Date: "10-01-2024", "Customer Name": "cash", Total: 220 },
      { Date: "10-01-2024", "Customer Name": "Deepak Thapa", Total: 390 },
      { Date: "09-01-2024", "Customer Name": "Sunita Bisht_c", Total: 340 },
      { Date: "09-01-2024", "Customer Name": "Ramesh Joshi", Total: 460 },
      { Date: "08-01-2024", "Customer Name": "Pooja Negi", Total: 380 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(customerData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Data");
    XLSX.writeFile(workbook, "sample_customer_data.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Sample XLSX Files
        </CardTitle>
        <CardDescription>
          Download sample XLSX files to understand the required format for
          import
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Stock Data Sample</h4>
              <p className="text-sm text-muted-foreground">
                Contains: Item Name, Price, Available Quantity
              </p>
            </div>
            <Button onClick={generateStockSample} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Customer Transactions Sample</h4>
              <p className="text-sm text-muted-foreground">
                Contains: Date (DD-MM-YYYY), Customer Name, Total
              </p>
            </div>
            <Button onClick={generateCustomerSample} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Important Notes:</h5>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • Customer names ending with "_c" are treated as Cash customers
              </li>
              <li>
                • Customer name "cash" (case-insensitive) is also treated as
                Cash
              </li>
              <li>• Date format must be DD-MM-YYYY</li>
              <li>• All price and quantity fields must be numeric</li>
              <li>• Column headers must match exactly as shown in samples</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
