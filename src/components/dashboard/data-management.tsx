"use client";

import React from "react";
import { useBudget } from "@/contexts/budget-context";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  CloudDownload,
  CloudUpload,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { BudgetState } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { format } from "date-fns";

export function DataManagement() {
  const {
    state,
    dispatch,
    isSyncEnabled,
    isSyncStatusReady,
    isComparing,
    isSyncing,
    shouldHighlightSyncFromCloud,
    canSyncToCloud,
    canSyncFromCloud,
    currentVersion,
    serverVersion,
    compareResult,
    compareWithCloud,
    syncFromCloud,
    syncToCloud,
  } = useBudget();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importStrategy, setImportStrategy] = React.useState<
    "REPLACE" | "NEXT_MONTH"
  >("REPLACE");
  const [importedData, setImportedData] = React.useState<BudgetState | null>(
    null,
  );
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = React.useState(false);

  const handleExport = () => {
    try {
      const budgetDate = state.currentMonth
        ? new Date(state.currentMonth)
        : new Date();
      const monthYear = format(budgetDate, "MMMM-yyyy");

      // Add metadata to exported file
      const exportData = {
        ...state,
        monthDescription: state.monthDescription || "",
        metadata: {
          exportDate: new Date().toISOString(),
          month: budgetDate.getMonth(),
          year: budgetDate.getFullYear(),
          monthLabel: format(budgetDate, "MMMM yyyy"),
          version: "1.0",
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${monthYear}_budget-report.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Your data has been exported." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export data.",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === "string") {
          const parsedData = JSON.parse(text);
          // Basic validation
          if ("moneySources" in parsedData) {
            // Check for missing fields and show warning
            const missingFields: string[] = [];
            if (!parsedData.metadata) missingFields.push("metadata");
            if (!parsedData.templates && !parsedData.transactionTemplates)
              missingFields.push("templates");
            if (!parsedData.currentMonth) missingFields.push("month/year");
            if (!parsedData.history) missingFields.push("history");

            if (missingFields.length > 0) {
              toast({
                title: "Old File Format Detected",
                description: `Missing: ${missingFields.join(
                  ", ",
                )}. Defaults will be applied.`,
                variant: "default",
              });
            }
            setImportedData(parsedData);
            setIsImportDialogOpen(true);
          } else {
            throw new Error("Invalid file format.");
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: "Invalid JSON file or format.",
        });
        setImportedData(null);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  };

  const confirmImport = () => {
    if (importedData) {
      const hasMetadata = !!importedData.metadata;
      dispatch({
        type: "IMPORT_DATA",
        payload: { state: importedData, strategy: importStrategy },
      });
      toast({
        title: "Import Successful",
        description: hasMetadata
          ? `Data has been imported with the '${importStrategy}' strategy.`
          : `Data imported (legacy format). Some fields were set to defaults.`,
      });
      setIsImportDialogOpen(false);
      setImportedData(null);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="w-full max-w-[90vw] sm:max-w-lg p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Choose Import Strategy</DialogTitle>
            <DialogDescription>
              How would you like to import this budget data?
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-4 py-4 max-h-[calc(90vh-180px)]">
            <RadioGroup
              defaultValue="REPLACE"
              onValueChange={(value: "REPLACE" | "NEXT_MONTH") =>
                setImportStrategy(value)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REPLACE" id="r1" />
                <Label htmlFor="r1">
                  <span className="font-semibold">Replace Everything</span>
                  <p className="text-sm text-muted-foreground">
                    Deletes all current data and replaces it with the data from
                    the file.
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NEXT_MONTH" id="r2" />
                <Label htmlFor="r2">
                  <span className="font-semibold">Start Next Month</span>
                  <p className="text-sm text-muted-foreground">
                    Keeps your budget sources and balances, but resets all
                    spending and transactions. Ideal for a new month.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="px-4 pb-4 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmImport}>Confirm Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="rounded-full px-3 py-1">
          Local v{currentVersion}
        </Badge>
        <Badge
          variant={serverVersion > currentVersion ? "destructive" : "outline"}
          className="rounded-full px-3 py-1"
        >
          Server v{serverVersion}
        </Badge>
      </div>

      <div className="flex flex-nowrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          className="whitespace-nowrap flex-shrink-0"
        >
          <Download className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="whitespace-nowrap flex-shrink-0"
        >
          <Upload className="h-4 w-4 mr-2" />
          Export
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!isSyncEnabled || !isSyncStatusReady || !canSyncToCloud}
              className="whitespace-nowrap flex-shrink-0"
              title={
                !isSyncEnabled
                  ? "Sign in to enable cloud sync"
                  : !isSyncStatusReady
                    ? "Checking cloud status..."
                    : shouldHighlightSyncFromCloud
                      ? "Cloud data is newer. Sync from cloud first."
                      : undefined
              }
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              Sync to Cloud
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sync to Cloud?</AlertDialogTitle>
              <AlertDialogDescription>
                This will upload your local data and overwrite the cloud data
                for the current month.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={syncToCloud}>
                Sync Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="outline"
          size="sm"
          disabled={!isSyncEnabled || !isSyncStatusReady || isComparing}
          onClick={async () => {
            const result = await compareWithCloud();
            if (result) {
              setIsCompareDialogOpen(true);
            }
          }}
          className="whitespace-nowrap flex-shrink-0"
          title={
            !isSyncEnabled
              ? "Sign in to enable cloud sync"
              : !isSyncStatusReady
                ? "Checking cloud status..."
                : undefined
          }
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isComparing ? "animate-spin" : ""}`}
          />
          Fetch & Compare
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={
                !isSyncEnabled || !isSyncStatusReady || !canSyncFromCloud
              }
              className={
                `whitespace-nowrap flex-shrink-0 transition-all duration-300 ` +
                (shouldHighlightSyncFromCloud
                  ? "border-primary/60 bg-primary/5 text-primary shadow-sm shadow-primary/10"
                  : "")
              }
              title={
                !isSyncEnabled
                  ? "Sign in to enable cloud sync"
                  : !isSyncStatusReady
                    ? "Checking cloud status..."
                    : undefined
              }
            >
              <CloudDownload className="h-4 w-4 mr-2" />
              Sync from Cloud
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sync from Cloud?</AlertDialogTitle>
              <AlertDialogDescription>
                This will download the cloud data and overwrite your local data
                for the current month.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={syncFromCloud}>
                Sync Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Cloud Comparison</DialogTitle>
            <DialogDescription>
              Review the cloud snapshot against your local data before syncing.
            </DialogDescription>
          </DialogHeader>

          {compareResult ? (
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Local v{compareResult.localVersion}
                </Badge>
                <Badge
                  variant={
                    compareResult.serverVersion > compareResult.localVersion
                      ? "destructive"
                      : "outline"
                  }
                >
                  Server v{compareResult.serverVersion}
                </Badge>
                <Badge variant="secondary">{compareResult.month}</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="mb-2 text-sm font-semibold">
                    Local Snapshot
                  </div>
                  <pre className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                    {JSON.stringify(compareResult.localState, null, 2)}
                  </pre>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="mb-2 text-sm font-semibold">
                    Cloud Snapshot
                  </div>
                  <pre className="whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                    {JSON.stringify(compareResult.serverState, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b px-3 py-2 text-sm font-semibold">
                  Diff Summary
                </div>
                <div className="divide-y">
                  {compareResult.rows.map((row) => (
                    <div
                      key={row.section}
                      className="grid gap-2 px-3 py-3 md:grid-cols-[180px_1fr_1fr] md:items-start"
                    >
                      <div className="text-sm font-medium">{row.section}</div>
                      <div className="text-xs text-muted-foreground">
                        <div className="font-semibold text-foreground">
                          Local
                        </div>
                        <div>{row.localSummary}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div className="font-semibold text-foreground">
                          Cloud
                        </div>
                        <div>{row.serverSummary}</div>
                      </div>
                      <div className="md:col-span-3 text-xs text-muted-foreground">
                        {row.detail}
                        <span
                          className={
                            row.isDifferent
                              ? "ml-2 text-amber-600"
                              : "ml-2 text-emerald-600"
                          }
                        >
                          {row.isDifferent ? "different" : "same"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCompareDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={async () => {
                await syncFromCloud();
                setIsCompareDialogOpen(false);
              }}
            >
              Sync from Cloud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
