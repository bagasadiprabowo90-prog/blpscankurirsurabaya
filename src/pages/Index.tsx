import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ScanInput } from '@/components/ScanInput';
import { CategoryTabs } from '@/components/CategoryTabs';
import { ResiTable } from '@/components/ResiTable';
import { StatsCard } from '@/components/StatsCard';
import { ActionButtons } from '@/components/ActionButtons';
import { 
  addResi, 
  addBulkResi, 
  getAllResi, 
  deleteResi, 
  deleteDuplicates, 
  resetAllData, 
  deleteResiByCategory,
  getStats,
  reorderRowNumbers,
  markAsSynced,
  exportToJSON,
  importFromJSON,
  ResiRecord 
} from '@/lib/db';
import { CourierCategory, COURIER_CATEGORIES } from '@/lib/courierCategories';
import { soundManager } from '@/lib/soundManager';
import { exportToExcel } from '@/lib/excelExport';
import { syncToGoogleSheets } from '@/lib/googleSheetsSync';
import { printReport } from '@/lib/printUtils';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useScanQueue } from '@/hooks/useScanQueue';
import { useGlobalScanCapture } from '@/hooks/useGlobalScanCapture';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FlaskConical, Clock, UploadCloud } from 'lucide-react';


const Index = () => {
  const [records, setRecords] = useState<ResiRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<CourierCategory>('shopee');
  const [stats, setStats] = useState({
    total: 0,
    duplicates: 0,
    byCategory: {} as Record<CourierCategory, number>,
  });
  const [lastResult, setLastResult] = useState<{ success: boolean; isDuplicate: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ synced: number; total: number; startTime: number } | null>(null);
  const activeCategoryRef = useRef(activeCategory);
  const { toast } = useToast();

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allRecords, statsData] = await Promise.all([
        getAllResi(),
        getStats(),
      ]);
      setRecords(allRecords);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Filter records by category
  const filteredRecords = useMemo(() => {
    return records.filter(r => r.category === activeCategory);
  }, [records, activeCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CourierCategory, number> = {} as Record<CourierCategory, number>;
    for (const category of COURIER_CATEGORIES) {
      counts[category.id] = 0;
    }
    for (const record of records) {
      counts[record.category] = (counts[record.category] || 0) + 1;
    }
    return counts;
  }, [records]);

  const processScan = useCallback(async (resi: string): Promise<boolean> => {
    try {
      const result = await addResi(resi, activeCategoryRef.current);
      
      if (result.isWrongCategory) {
        soundManager.playReject();
        toast({
          title: "Salah Tab!",
          description: `Resi ini milik ${result.detectedCategory?.toUpperCase()}, bukan ${activeCategoryRef.current.toUpperCase()}`,
          variant: "destructive",
        });
        setLastResult({ success: false, isDuplicate: false }); // bisa tambah field error di state jika diperlukan, tapi success: false sudah memunculkan merah (atau kita butuh shake)
        // Kita trigger shake lewat lastResult
        setLastResult({ success: false, isDuplicate: true }); // hack sementara agar komponen ScanInput mendeteksi error dan shake
        setTimeout(() => setLastResult(null), 1500);
        return false;
      }
      
      const { record, isDuplicate } = result as { record: ResiRecord; isDuplicate: boolean };
      
      setRecords(prev => [...prev, record]);
      setStats(prev => ({
        total: prev.total + 1,
        duplicates: prev.duplicates + (isDuplicate ? 1 : 0),
        byCategory: {
          ...prev.byCategory,
          [record.category]: (prev.byCategory[record.category] || 0) + 1,
        },
      }));
      
      setLastResult({ success: true, isDuplicate });
      
      if (isDuplicate) {
        soundManager.playDuplicateAlert();
        toast({
          title: "Resi Duplikat!",
          description: `${resi} sudah pernah diinput sebelumnya`,
          variant: "destructive",
        });
      } else {
        soundManager.playSuccess();
      }
      
      // Reset result indicator after delay
      setTimeout(() => setLastResult(null), 1500);
      // Hanya resi yang BUKAN wrong category yang dihitung sebagai terscan
      // Duplikat tetap dihitung karena resi valid (hanya sudah ada sebelumnya)
      return !isDuplicate;
    } catch (error) {
      console.error('Error adding resi:', error);
      soundManager.playError();
      return false;
    }
  }, [toast]);

  // Scan queue for handling rapid scanning
  const { addToQueue, queueLength, isProcessing: isQueueProcessing, processedCount, resetCount } = useScanQueue({
    onProcess: processScan,
    debounceMs: 30,
  });

  // Global keyboard capture for barcode scanner (works even when input not focused)
  useGlobalScanCapture({
    onScan: addToQueue,
    enabled: !isLoading,
    minLength: 5,
    maxGapMs: 50,
  });

  // Handle single scan from input
  const handleScan = useCallback((resi: string) => {
    addToQueue(resi);
  }, [addToQueue]);

  const handleBulkUpload = useCallback(async (resiList: string[]) => {
    setIsLoading(true);
    try {
      // Pass activeCategory to force all bulk resi into current tab's category
      const { records: newRecords, duplicates, rejected } = await addBulkResi(resiList, activeCategory);
      
      setRecords(prev => [...prev, ...newRecords]);
      await loadData(); // Refresh stats
      
      if (rejected > 0) {
        toast({
          title: "Beberapa Resi Ditolak",
          description: `${newRecords.length} berhasil, ${duplicates} duplikat, ${rejected} ditolak karena salah kurir`,
          variant: "destructive",
        });
        soundManager.playReject();
      } else {
        toast({
          title: "Upload Berhasil",
          description: `${newRecords.length} resi ditambahkan (${duplicates} duplikat)`,
        });
        
        if (duplicates > 0) {
          soundManager.playDuplicateAlert();
        } else {
          soundManager.playSuccess();
        }
      }
    } catch (error) {
      console.error('Error bulk upload:', error);
      toast({
        title: "Upload Gagal",
        description: "Terjadi kesalahan saat memproses file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, activeCategory]);

  // Handle delete single record
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteResi(id);
      await reorderRowNumbers(); // Reorder after single delete
      await loadData(); // Refresh all data
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  }, []);

  // Handle delete all duplicates
  const handleDeleteDuplicates = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await deleteDuplicates();
      await loadData();
      
      toast({
        title: "Duplikat Dihapus",
        description: `${count} resi duplikat telah dihapus`,
      });
    } catch (error) {
      console.error('Error deleting duplicates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle reset all data
  const handleReset = useCallback(async () => {
    setIsLoading(true);
    try {
      await resetAllData();
      setRecords([]);
      setStats({ total: 0, duplicates: 0, byCategory: {} as Record<CourierCategory, number> });
      
      toast({
        title: "Data Direset",
        description: "Semua data telah dihapus",
      });
    } catch (error) {
      console.error('Error resetting data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle reset current category
  const handleResetCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const deletedCount = await deleteResiByCategory(activeCategory);
      await loadData();
      
      toast({
        title: "Data Tab Direset",
        description: `${deletedCount} resi di tab ini berhasil dihapus`,
      });
      soundManager.playSuccess();
    } catch (error) {
      console.error('Error resetting category data:', error);
      toast({
        title: "Gagal",
        description: "Gagal mereset data tab",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, toast, loadData]);

  // Handle export to Excel
  const handleExportExcel = useCallback(async () => {
    try {
      await exportToExcel(records);
      toast({
        title: "Export Berhasil",
        description: "File Excel telah diunduh",
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat export file",
        variant: "destructive",
      });
    }
  }, [records, toast]);

  // Handle sync to Google Sheets
  const runGoogleSheetsSync = useCallback(async (mode: 'normal' | 'force') => {
    setIsLoading(true);
    const startTime = Date.now();
    setSyncProgress({ synced: 0, total: 0, startTime });

    try {
      const force = mode === 'force';
      const unsyncedRecords = records.filter(r => !r.syncedToSheet);

      // Kalau semua sudah ditandai synced tapi sheet masih kosong, offer force sync
      if (!force && unsyncedRecords.length === 0) {
        toast({
          title: 'Sudah ditandai tersinkron',
          description:
            'Di HP ini semua data sudah ditandai “synced”. Jika Google Sheets masih kosong, klik Sync Ulang Semua.',
          action: (
            <ToastAction altText="Sync ulang semua" onClick={() => runGoogleSheetsSync('force')}>
              Sync Ulang
            </ToastAction>
          ),
        });
        return;
      }

      const targetRecords = force ? records : unsyncedRecords;
      const result = await syncToGoogleSheets(
        targetRecords,
        (synced, total) => {
          setSyncProgress({ synced, total, startTime });
        },
        { force }
      );

      if (result.success && result.syncedCount && result.syncedCount > 0) {
        const syncedIds = targetRecords.map(r => r.id);
        await markAsSynced(syncedIds);
        setRecords(prev => prev.map(r => (syncedIds.includes(r.id) ? { ...r, syncedToSheet: true } : r)));
      }

      toast({
        title: result.success ? 'Sync Terkirim' : 'Sync',
        description: result.success 
          ? `${result.syncedCount} resi dikirim. Cek Google Sheets untuk konfirmasi.`
          : result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: 'Sync Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat sync',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setSyncProgress(null);
    }
  }, [records, toast]);

  const handleSyncGoogleSheets = useCallback(async () => {
    await runGoogleSheetsSync('normal');
  }, [runGoogleSheetsSync]);

  // Handle print report
  const handlePrintReport = useCallback(() => {
    printReport(filteredRecords, activeCategory);
  }, [filteredRecords, activeCategory]);

  // Handle export JSON
  const handleExportJSON = useCallback(async () => {
    try {
      const jsonData = await exportToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resi-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Berhasil",
        description: "File JSON telah diunduh",
      });
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast({
        title: "Backup Gagal",
        description: "Terjadi kesalahan saat export",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle import JSON
  const handleImportJSON = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const { imported, skipped } = await importFromJSON(text);
      await loadData();
      
      toast({
        title: "Restore Berhasil",
        description: `${imported} resi ditambahkan, ${skipped} dilewati (sudah ada)`,
      });
    } catch (error) {
      console.error('Error importing JSON:', error);
      toast({
        title: "Restore Gagal",
        description: error instanceof Error ? error.message : "Format file tidak valid",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Generate dummy test data (only for 'spare' category)
  const handleGenerateTestData = useCallback(async () => {
    if (activeCategory !== 'spare') return;
    
    setIsLoading(true);
    try {
      const testResiList = Array.from({ length: 50 }, (_, i) => 
        `TEST${Date.now()}${String(i + 1).padStart(4, '0')}`
      );
      
      const { records: newRecords } = await addBulkResi(testResiList, 'spare');
      setRecords(prev => [...prev, ...newRecords]);
      await loadData();
      
      toast({
        title: "Test Data Dibuat",
        description: `${newRecords.length} resi dummy ditambahkan ke tab Lainnya`,
      });
    } catch (error) {
      console.error('Error generating test data:', error);
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat membuat data test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, toast]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header — nameplate mesin */}
      <header className="shrink-0 z-50 bg-[hsl(var(--ink))] text-[hsl(var(--ink-foreground))]">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-sm bg-primary flex items-center justify-center border-2 border-[hsl(var(--ink-foreground)/0.25)] shrink-0">
                <span className="font-display font-bold text-base sm:text-lg text-primary-foreground leading-none">BLP</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-bold uppercase tracking-wide text-lg sm:text-xl leading-none truncate">
                  Scan Kurir Surabaya
                </h1>
                <p className="font-mono text-[10px] sm:text-xs text-[hsl(var(--ink-foreground)/0.65)] mt-1 truncate">
                  Scan &amp; Kelola Resi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <ActionButtons
                onExportExcel={handleExportExcel}
                onSyncGoogleSheets={handleSyncGoogleSheets}
                onDeleteDuplicates={handleDeleteDuplicates}
                onReset={handleReset}
                onPrintReport={handlePrintReport}
                onExportJSON={handleExportJSON}
                onImportJSON={handleImportJSON}
                duplicateCount={stats.duplicates}
                isLoading={isLoading}
                activeCategoryName={COURIER_CATEGORIES.find(c => c.id === activeCategory)?.name || 'Aktif'}
                onResetCategory={handleResetCategory}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Sync Progress Bar */}
      {syncProgress && syncProgress.total > 0 && (() => {
        const percentage = Math.round((syncProgress.synced / syncProgress.total) * 100);
        const elapsedMs = Date.now() - syncProgress.startTime;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        
        // Calculate estimated time remaining
        let etaText = "Menghitung...";
        if (syncProgress.synced > 0) {
          const msPerItem = elapsedMs / syncProgress.synced;
          const remainingItems = syncProgress.total - syncProgress.synced;
          const remainingMs = msPerItem * remainingItems;
          const remainingSec = Math.ceil(remainingMs / 1000);
          
          if (remainingSec < 60) {
            etaText = `~${remainingSec} detik lagi`;
          } else {
            const mins = Math.floor(remainingSec / 60);
            const secs = remainingSec % 60;
            etaText = `~${mins}m ${secs}s lagi`;
          }
        }
        
        // Format elapsed time
        const elapsedMin = Math.floor(elapsedSec / 60);
        const elapsedSecRemainder = elapsedSec % 60;
        const elapsedText = elapsedMin > 0 
          ? `${elapsedMin}m ${elapsedSecRemainder}s` 
          : `${elapsedSec}s`;

        return (
          <div className="shrink-0 z-40 bg-card/95 backdrop-blur-sm border-b px-4 py-3">
            <div className="container max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress 
                    value={percentage} 
                    className="h-3"
                  />
                </div>
                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                  {percentage}%
                </span>
              </div>
              <div className="tabular flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <UploadCloud className="h-3.5 w-3.5" />
                  {syncProgress.synced.toLocaleString()}/{syncProgress.total.toLocaleString()} resi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {elapsedText} • {etaText}
                </span>
              </div>
              <p className="text-xs text-primary font-medium mt-1">
                Mengirim ke Google Sheets…
              </p>
            </div>
          </div>
        );
      })()}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 container max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-5 pb-4 sm:pb-5">
        {/* Category Tabs - Full Width at Top */}
        <div className="shrink-0 mb-3 sm:mb-4">
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            counts={categoryCounts}
          />
        </div>

        <div className="grid lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0">
          {/* Left Column - Input & Stats */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4 overflow-y-auto pr-1">
            <ScanInput
              onScan={handleScan}
              onBulkUpload={handleBulkUpload}
              disabled={isLoading}
              lastResult={lastResult}
              activeCategory={activeCategory}
              queueLength={queueLength}
              processedCount={processedCount}
              onResetCount={resetCount}
            />
            
            {/* Test Data Button - Only for 'spare' category */}
            {activeCategory === 'spare' && (
              <Button
                onClick={handleGenerateTestData}
                disabled={isLoading}
                variant="outline"
                className="w-full gap-2 border-dashed"
              >
                <FlaskConical className="w-4 h-4" />
                Generate 50 Data Test (untuk testing sync)
              </Button>
            )}
            
            <StatsCard
              total={stats.total}
              duplicates={stats.duplicates}
              byCategory={categoryCounts}
            />
          </div>

          {/* Right Column - Data Table */}
          <div className="lg:col-span-8 flex flex-col min-h-0">
            <ResiTable
              records={filteredRecords}
              onDelete={handleDelete}
              showCategory={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
