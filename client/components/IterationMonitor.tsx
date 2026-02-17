import React, { createContext, useContext, useState, useEffect } from "react";

interface IterationData {
  id: string;
  billNumber: number;
  targetTotal: number;
  currentIteration: number;
  totalIterations: number;
  bestMatch: {
    items: any[];
    total: number;
    difference: number;
  } | null;
  status: "pending" | "running" | "completed" | "failed";
  startTime: number;
  endTime?: number;
  logs: Array<{
    iteration: number;
    message: string;
    timestamp: number;
    type: "info" | "success" | "warning" | "error";
  }>;
}

interface IterationMonitorContextType {
  currentIterations: IterationData[];
  completedIterations: IterationData[];
  startIteration: (billNumber: number, targetTotal: number) => string;
  updateIteration: (id: string, data: Partial<IterationData>) => void;
  logIteration: (
    id: string,
    iteration: number,
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ) => void;
  completeIteration: (id: string, finalData: Partial<IterationData>) => void;
  clearHistory: () => void;
}

const IterationMonitorContext =
  createContext<IterationMonitorContextType | null>(null);

export function IterationMonitorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentIterations, setCurrentIterations] = useState<IterationData[]>(
    [],
  );
  const [completedIterations, setCompletedIterations] = useState<
    IterationData[]
  >([]);

  const startIteration = (billNumber: number, targetTotal: number): string => {
    const id = `iter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newIteration: IterationData = {
      id,
      billNumber,
      targetTotal,
      currentIteration: 0,
      totalIterations: 200,
      bestMatch: null,
      status: "pending",
      startTime: Date.now(),
      logs: [],
    };

    setCurrentIterations((prev) => [...prev, newIteration]);
    return id;
  };

  const updateIteration = (id: string, data: Partial<IterationData>) => {
    setCurrentIterations((prev) =>
      prev.map((iter) => (iter.id === id ? { ...iter, ...data } : iter)),
    );
  };

  const logIteration = (
    id: string,
    iteration: number,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    const logEntry = {
      iteration,
      message,
      timestamp: Date.now(),
      type,
    };

    setCurrentIterations((prev) =>
      prev.map((iter) =>
        iter.id === id
          ? {
              ...iter,
              logs: [...iter.logs, logEntry],
              currentIteration: Math.max(iter.currentIteration, iteration),
            }
          : iter,
      ),
    );
  };

  const completeIteration = (id: string, finalData: Partial<IterationData>) => {
    setCurrentIterations((prev) => {
      const iterationToComplete = prev.find((iter) => iter.id === id);
      if (iterationToComplete) {
        const completedIteration = {
          ...iterationToComplete,
          ...finalData,
          status: "completed" as const,
          endTime: Date.now(),
        };

        setCompletedIterations((prevCompleted) => [
          ...prevCompleted,
          completedIteration,
        ]);
        return prev.filter((iter) => iter.id !== id);
      }
      return prev;
    });
  };

  const clearHistory = () => {
    setCompletedIterations([]);
    setCurrentIterations([]);
  };

  return (
    <IterationMonitorContext.Provider
      value={{
        currentIterations,
        completedIterations,
        startIteration,
        updateIteration,
        logIteration,
        completeIteration,
        clearHistory,
      }}
    >
      {children}
    </IterationMonitorContext.Provider>
  );
}

export function useIterationMonitor() {
  const context = useContext(IterationMonitorContext);
  if (!context) {
    throw new Error(
      "useIterationMonitor must be used within IterationMonitorProvider",
    );
  }
  return context;
}
