'use client';

import React from 'react';
import { useBudget } from '@/contexts/budget-context';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileJson, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import type { BudgetState } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { format } from 'date-fns';


export function DataManagement() {
  const { state, dispatch } = useBudget();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importStrategy, setImportStrategy] = React.useState<'REPLACE' | 'NEXT_MONTH'>('REPLACE');
  const [importedData, setImportedData] = React.useState<BudgetState | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);


  const handleExport = () => {
    try {
      const jsonString = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      const budgetDate = state.currentMonth ? new Date(state.currentMonth) : new Date();
      const monthYear = format(budgetDate, 'MMMM-yyyy');
      const exportDate = format(new Date(), 'yyyy-MM-dd');
      a.download = `budgetflow-backup_${monthYear}_(exported_on_${exportDate}).json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Success', description: 'Your data has been exported.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to export data.' });
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
            if (typeof text === 'string') {
                const parsedData = JSON.parse(text);
                // Basic validation
                if ('moneySources' in parsedData && 'transactions' in parsedData) {
                    setImportedData(parsedData);
                    setIsImportDialogOpen(true);
                } else {
                    throw new Error("Invalid file format.");
                }
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Import Failed', description: 'Invalid JSON file or format.'});
            setImportedData(null);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const confirmImport = () => {
    if (importedData) {
        dispatch({ type: 'IMPORT_DATA', payload: { state: importedData, strategy: importStrategy }});
        toast({ title: "Import Successful", description: `Data has been imported with the '${importStrategy}' strategy.`});
        setIsImportDialogOpen(false);
        setImportedData(null);
    }
  }


  return (
    <>
      <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Choose Import Strategy</DialogTitle>
                <DialogDescription>How would you like to import this budget data?</DialogDescription>
            </DialogHeader>
            <RadioGroup defaultValue="REPLACE" onValueChange={(value: 'REPLACE' | 'NEXT_MONTH') => setImportStrategy(value)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="REPLACE" id="r1" />
                    <Label htmlFor="r1">
                        <span className="font-semibold">Replace Everything</span>
                        <p className="text-sm text-muted-foreground">Deletes all current data and replaces it with the data from the file.</p>
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NEXT_MONTH" id="r2" />
                    <Label htmlFor="r2">
                        <span className="font-semibold">Start Next Month</span>
                        <p className="text-sm text-muted-foreground">Keeps your budget sources and balances, but resets all spending and transactions. Ideal for a new month.</p>
                    </Label>
                </div>
            </RadioGroup>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                <Button onClick={confirmImport}>Confirm Import</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleImportClick}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </>
  );
}
