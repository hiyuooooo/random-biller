import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAccount } from "@/components/AccountManager";
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
  Shield,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  X,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BillBlocker() {
  const { activeAccount } = useAccount();

  const [startingBillNumber, setStartingBillNumber] = useState(() => {
    if (!activeAccount) return "1001";
    try {
      const storageKey = `billBlocker_startingNumber_${activeAccount.id}`;
      return localStorage.getItem(storageKey) || "1001";
    } catch {
      return "1001";
    }
  });

  const [blockedNumbers, setBlockedNumbers] = useState<number[]>(() => {
    if (!activeAccount) return [1005, 1010, 1015, 1020, 1025];
    try {
      const storageKey = `billBlocker_blockedNumbers_${activeAccount.id}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [1005, 1010, 1015, 1020, 1025];
    } catch {
      return [1005, 1010, 1015, 1020, 1025];
    }
  });

  // Save to account-specific localStorage
  useEffect(() => {
    if (activeAccount) {
      try {
        const numberKey = `billBlocker_startingNumber_${activeAccount.id}`;
        localStorage.setItem(numberKey, startingBillNumber);
      } catch (error) {
        console.warn("Failed to save starting bill number:", error);
      }
    }
  }, [startingBillNumber, activeAccount]);

  useEffect(() => {
    if (activeAccount) {
      try {
        const numbersKey = `billBlocker_blockedNumbers_${activeAccount.id}`;
        localStorage.setItem(numbersKey, JSON.stringify(blockedNumbers));
      } catch (error) {
        console.warn("Failed to save blocked numbers:", error);
      }
    }
  }, [blockedNumbers, activeAccount]);

  // Load data when switching accounts
  useEffect(() => {
    if (activeAccount) {
      try {
        const numberKey = `billBlocker_startingNumber_${activeAccount.id}`;
        const numbersKey = `billBlocker_blockedNumbers_${activeAccount.id}`;

        const savedNumber = localStorage.getItem(numberKey);
        const savedNumbers = localStorage.getItem(numbersKey);

        if (savedNumber) setStartingBillNumber(savedNumber);
        else setStartingBillNumber("1001");

        if (savedNumbers) setBlockedNumbers(JSON.parse(savedNumbers));
        else setBlockedNumbers([1005, 1010, 1015, 1020, 1025]);
      } catch {
        setStartingBillNumber("1001");
        setBlockedNumbers([1005, 1010, 1015, 1020, 1025]);
      }
    }
  }, [activeAccount?.id]);
  const [consumedNumbers, setConsumedNumbers] = useState<number[]>([
    1001, 1002, 1003, 1004,
  ]);
  const [bulkBlockInput, setBulkBlockInput] = useState("");

  // Generate bill slots array
  const billSlots = useMemo(() => {
    const start = parseInt(startingBillNumber) || 1001;
    const slots = [];
    for (let i = 0; i < 150; i++) {
      const billNumber = start + i;
      const status = consumedNumbers.includes(billNumber)
        ? "consumed"
        : blockedNumbers.includes(billNumber)
          ? "blocked"
          : "available";
      slots.push({ number: billNumber, status });
    }
    return slots;
  }, [startingBillNumber, blockedNumbers, consumedNumbers]);

  const stats = useMemo(() => {
    const available = billSlots.filter((s) => s.status === "available").length;
    const blocked = billSlots.filter((s) => s.status === "blocked").length;
    const consumed = billSlots.filter((s) => s.status === "consumed").length;

    return { available, blocked, consumed, total: billSlots.length };
  }, [billSlots]);

  const toggleBillBlock = (billNumber: number) => {
    if (consumedNumbers.includes(billNumber)) return; // Can't modify consumed bills

    setBlockedNumbers((prev) =>
      prev.includes(billNumber)
        ? prev.filter((n) => n !== billNumber)
        : [...prev, billNumber],
    );
  };

  const selectAllVisible = () => {
    const availableNumbers = billSlots
      .filter((slot) => slot.status === "available")
      .map((slot) => slot.number);
    setBlockedNumbers((prev) => [...new Set([...prev, ...availableNumbers])]);
  };

  const clearAllBlocked = () => {
    setBlockedNumbers([]);
  };

  const invertSelection = () => {
    const availableNumbers = billSlots
      .filter((slot) => slot.status === "available")
      .map((slot) => slot.number);
    const currentlyBlocked = billSlots
      .filter((slot) => slot.status === "blocked")
      .map((slot) => slot.number);

    setBlockedNumbers(availableNumbers);
  };

  const addBulkBlocked = () => {
    if (!bulkBlockInput.trim()) return;

    const numbers = bulkBlockInput
      .split(",")
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n) && !consumedNumbers.includes(n));

    setBlockedNumbers((prev) => [...new Set([...prev, ...numbers])]);
    setBulkBlockInput("");
  };

  const removeSpecificBlocked = (billNumber: number) => {
    setBlockedNumbers((prev) => prev.filter((n) => n !== billNumber));
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case "blocked":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "consumed":
        return "bg-gray-500 text-white cursor-not-allowed";
      case "available":
        return "bg-green-500 hover:bg-green-600 text-white cursor-pointer";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bill Blocker</h1>
            <p className="text-muted-foreground">
              Manage blocked bill numbers and control bill generation sequence
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Available</p>
                  <p className="text-2xl font-bold">{stats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <X className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Blocked</p>
                  <p className="text-2xl font-bold">{stats.blocked}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Consumed</p>
                  <p className="text-2xl font-bold">{stats.consumed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Range</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Range Configuration</CardTitle>
            <CardDescription>
              Set the starting bill number to display the next 150 bill slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-4">
              <div className="space-y-2">
                <Label>Starting Bill Number</Label>
                <Input
                  type="number"
                  value={startingBillNumber}
                  onChange={(e) => setStartingBillNumber(e.target.value)}
                  placeholder="Enter starting bill number"
                  className="w-48"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Range: {startingBillNumber} -{" "}
                  {parseInt(startingBillNumber || "1001") + 149}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={selectAllVisible} variant="outline" size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Select All Available
                </Button>
                <Button onClick={clearAllBlocked} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Blocked
                </Button>
                <Button onClick={invertSelection} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Invert Selection
                </Button>
              </div>

              <div className="flex space-x-2">
                <Input
                  value={bulkBlockInput}
                  onChange={(e) => setBulkBlockInput(e.target.value)}
                  placeholder="Enter bill numbers to block (e.g., 1005,1010,1015)"
                  className="flex-1"
                />
                <Button
                  onClick={addBulkBlocked}
                  disabled={!bulkBlockInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Block Numbers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill Number Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Number Grid</CardTitle>
            <CardDescription>
              Click on any bill number to toggle its blocked status. Red =
              Blocked, Green = Available, Gray = Consumed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {billSlots.map((slot) => (
                <button
                  key={slot.number}
                  onClick={() => toggleBillBlock(slot.number)}
                  disabled={slot.status === "consumed"}
                  className={cn(
                    "p-2 text-xs font-medium rounded transition-colors",
                    getSlotColor(slot.status),
                  )}
                  title={`Bill ${slot.number} - ${slot.status}`}
                >
                  {slot.number}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Blocked List */}
        <Card>
          <CardHeader>
            <CardTitle>Currently Blocked Bills</CardTitle>
            <CardDescription>
              List of all blocked bill numbers with option to remove specific
              ones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {blockedNumbers.length === 0 ? (
              <p className="text-muted-foreground">
                No bills are currently blocked
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {blockedNumbers
                    .sort((a, b) => a - b)
                    .map((billNumber) => (
                      <div
                        key={billNumber}
                        className="flex items-center space-x-1"
                      >
                        <Badge variant="destructive">{billNumber}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeSpecificBlocked(billNumber)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {blockedNumbers.length} bill numbers are blocked
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Notice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Bill Generation Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                When generating bills, the system will automatically:
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Skip all blocked bill numbers</li>
                <li>Advance to the next unblocked number automatically</li>
                <li>Mark used numbers as consumed</li>
                <li>Update this grid to reflect the current state</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
