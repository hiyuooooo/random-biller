import React, { useState } from "react";
import { useIterationMonitor } from "./IterationMonitor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Activity,
  Target,
  TrendingUp,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function IterationMonitorTab() {
  const { currentIterations, completedIterations, clearHistory } =
    useIterationMonitor();

  const [selectedIteration, setSelectedIteration] = useState<string | null>(
    null,
  );

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    return `${duration.toFixed(0)}ms`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: "default",
      completed: "secondary",
      failed: "destructive",
      pending: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const selectedIterationData = selectedIteration
    ? [...currentIterations, ...completedIterations].find(
        (iter) => iter.id === selectedIteration,
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Bill Generation Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring of 200-iteration bill generation algorithm
          </p>
        </div>
        <Button
          variant="outline"
          onClick={clearHistory}
          disabled={completedIterations.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{currentIterations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">
                  {completedIterations.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total Processed</p>
                <p className="text-2xl font-bold">
                  {currentIterations.length + completedIterations.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Iterations ({currentIterations.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedIterations.length})
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedIteration}>
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {currentIterations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No active bill generation processes. Generate bills to see
                  real-time iteration progress.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {currentIterations.map((iteration) => (
                <Card
                  key={iteration.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelectedIteration(iteration.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-lg">
                        <Hash className="h-4 w-4 mr-2" />
                        Bill #{iteration.billNumber}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(iteration.status)}
                        {getStatusBadge(iteration.status)}
                      </div>
                    </div>
                    <CardDescription>
                      Target: ₹{iteration.targetTotal} | Duration:{" "}
                      {formatDuration(iteration.startTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{iteration.currentIteration}/200 iterations</span>
                      </div>
                      <Progress
                        value={(iteration.currentIteration / 200) * 100}
                        className="h-2"
                      />
                      {iteration.bestMatch && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Best Total</p>
                            <p className="font-semibold">
                              ₹{iteration.bestMatch.total}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Items</p>
                            <p className="font-semibold">
                              {iteration.bestMatch.items.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Difference</p>
                            <p
                              className={cn(
                                "font-semibold",
                                iteration.bestMatch.difference <= 30
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              ₹{iteration.bestMatch.difference}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedIterations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No completed iterations yet. Generated bills will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Final Total</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedIterations.map((iteration) => (
                  <TableRow key={iteration.id}>
                    <TableCell>#{iteration.billNumber}</TableCell>
                    <TableCell>₹{iteration.targetTotal}</TableCell>
                    <TableCell>
                      {iteration.bestMatch
                        ? `₹${iteration.bestMatch.total}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {iteration.bestMatch
                        ? iteration.bestMatch.items.length
                        : 0}
                    </TableCell>
                    <TableCell>
                      {iteration.bestMatch && (
                        <span
                          className={cn(
                            iteration.bestMatch.difference <= 30
                              ? "text-green-600"
                              : "text-red-600",
                          )}
                        >
                          ₹{iteration.bestMatch.difference}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDuration(iteration.startTime, iteration.endTime)}
                    </TableCell>
                    <TableCell>{getStatusBadge(iteration.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedIteration(iteration.id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedIterationData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Iteration Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Bill Number
                      </p>
                      <p className="font-semibold">
                        #{selectedIterationData.billNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Target Total
                      </p>
                      <p className="font-semibold">
                        ₹{selectedIterationData.targetTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div>{getStatusBadge(selectedIterationData.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">
                        {formatDuration(
                          selectedIterationData.startTime,
                          selectedIterationData.endTime,
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedIterationData.bestMatch && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Final Result
                      </p>
                      <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-semibold">
                            ₹{selectedIterationData.bestMatch.total}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Number of Items:</span>
                          <span className="font-semibold">
                            {selectedIterationData.bestMatch.items.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Difference:</span>
                          <span
                            className={cn(
                              "font-semibold",
                              selectedIterationData.bestMatch.difference <= 30
                                ? "text-green-600"
                                : "text-red-600",
                            )}
                          >
                            ₹{selectedIterationData.bestMatch.difference}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Iteration Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {selectedIterationData.logs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          No logs available
                        </p>
                      ) : (
                        selectedIterationData.logs.map((log, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2 p-2 rounded-lg bg-muted/30"
                          >
                            <Badge variant="outline" className="text-xs">
                              {log.iteration}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm break-words">
                                {log.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
