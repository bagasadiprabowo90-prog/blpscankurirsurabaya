import { useEffect, useRef, useCallback } from 'react';
import { ResiRecord } from '@/lib/db';
import { syncToGoogleSheets } from '@/lib/googleSheetsSync';

interface UseAutoSyncOptions {
  records: ResiRecord[];
  intervalMinutes?: number;
  onSyncComplete?: (result: { success: boolean; message: string }) => void;
  enabled?: boolean;
}

export function useAutoSync({
  records,
  intervalMinutes = 5,
  onSyncComplete,
  enabled = true,
}: UseAutoSyncOptions) {
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  const performSync = useCallback(async () => {
    // Skip if already syncing or no records
    if (isSyncingRef.current || records.length === 0) return;
    
    // Check if there are unsynced records
    const unsyncedRecords = records.filter(r => !r.syncedToSheet);
    if (unsyncedRecords.length === 0) return;

    isSyncingRef.current = true;
    
    try {
      const result = await syncToGoogleSheets(records);
      lastSyncRef.current = Date.now();
      onSyncComplete?.(result);
    } catch (error) {
      console.error('Auto-sync error:', error);
      onSyncComplete?.({ success: false, message: 'Auto-sync gagal' });
    } finally {
      isSyncingRef.current = false;
    }
  }, [records, onSyncComplete]);

  useEffect(() => {
    if (!enabled) return;

    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Initial sync after 30 seconds if there are unsynced records
    const initialTimeout = setTimeout(() => {
      performSync();
    }, 30000);

    // Regular interval sync
    const interval = setInterval(() => {
      performSync();
    }, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [enabled, intervalMinutes, performSync]);

  return {
    lastSync: lastSyncRef.current,
    isSyncing: isSyncingRef.current,
    syncNow: performSync,
  };
}
