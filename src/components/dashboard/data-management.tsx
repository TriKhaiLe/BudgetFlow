"use client";

import React from "react";
import { useBudget } from "@/contexts/budget-context";
import { Button } from "@/components/ui/button";
import { Download, Upload, CloudDownload, CloudUpload } from "lucide-react";
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
import type { BudgetState } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { format } from "date-fns";

export function DataManagement() {
  const {
    state,
    dispatch,
    isSyncEnabled,
    isSyncing,
    shouldHighlightSyncFromCloud,
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

      <div className="flex flex-wrap gap-2 justify-center">
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
              disabled={!isSyncEnabled || isSyncing}
              className="whitespace-nowrap flex-shrink-0"
              title={
                !isSyncEnabled ? "Sign in to enable cloud sync" : undefined
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!isSyncEnabled || isSyncing}
              className={
                `whitespace-nowrap flex-shrink-0 transition-all duration-300 ` +
                (shouldHighlightSyncFromCloud
                  ? "border-primary/60 bg-primary/5 text-primary shadow-sm shadow-primary/10"
                  : "")
              }
              title={
                !isSyncEnabled ? "Sign in to enable cloud sync" : undefined
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
    </>
  );
}
