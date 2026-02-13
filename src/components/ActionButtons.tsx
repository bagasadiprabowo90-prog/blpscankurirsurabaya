import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  RefreshCw, 
  Trash2, 
  FileSpreadsheet,
  Link,
  MoreHorizontal,
  Printer,
  Download,
  Upload,
} from 'lucide-react';

interface ActionButtonsProps {
  onExportExcel: () => void;
  onSyncGoogleSheets: () => void;
  onDeleteDuplicates: () => void;
  onReset: () => void;
  onPrintReport: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  duplicateCount: number;
  isLoading?: boolean;
}

export function ActionButtons({
  onExportExcel,
  onSyncGoogleSheets,
  onDeleteDuplicates,
  onReset,
  onPrintReport,
  onExportJSON,
  onImportJSON,
  duplicateCount,
  isLoading,
}: ActionButtonsProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Delete Duplicates - Visible button */}
        {duplicateCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Duplikat ({duplicateCount})</span>
          </Button>
        )}

        {/* Print Report */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrintReport}
          disabled={isLoading}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Print</span>
        </Button>

        {/* Export Excel */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          disabled={isLoading}
          className="gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Excel</span>
        </Button>

        {/* Sync Google Sheets */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncGoogleSheets}
          disabled={isLoading}
          className="gap-2"
        >
          <Link className="w-4 h-4" />
          <span className="hidden sm:inline">Sync</span>
        </Button>

        {/* More Options - Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Backup (Export JSON)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Restore (Import JSON)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setResetDialogOpen(true)}
              className="text-destructive"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Semua Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Semua Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua data resi yang sudah diinput. 
              Data yang sudah di-export ke Excel atau sync ke Google Sheets tidak akan terpengaruh.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onReset();
                setResetDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Reset Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Duplicates Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Duplikat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus {duplicateCount} resi duplikat dari database.
              Resi asli (non-duplikat) tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteDuplicates();
                setDeleteDialogOpen(false);
              }}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Ya, Hapus Duplikat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
