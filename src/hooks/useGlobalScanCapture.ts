import { useEffect, useRef, useCallback } from 'react';
import { isInputFocused } from '@/components/ScanInput';

interface UseGlobalScanCaptureOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxGapMs?: number; // Max time between keystrokes to be considered scanner input
}

/**
 * Global keyboard listener for barcode scanners.
 * Barcode scanners typically send characters very quickly followed by Enter.
 * This hook captures that pattern even when input is not focused.
 */
export function useGlobalScanCapture({
  onScan,
  enabled = true,
  minLength = 5,
  maxGapMs = 50,
}: UseGlobalScanCaptureOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearBuffer = useCallback(() => {
    bufferRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const processBuffer = useCallback(() => {
    const barcode = bufferRef.current.trim();
    if (barcode.length >= minLength) {
      onScan(barcode);
    }
    clearBuffer();
  }, [onScan, minLength, clearBuffer]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      
      // Skip if scan input is focused - it will handle the scan itself
      if (isInputFocused()) {
        return;
      }
      
      const target = e.target as HTMLElement;
      
      // Skip if user is typing in a regular input/textarea
      const isInTextInput = 
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (isInTextInput) {
        return;
      }

      // Check time gap - if too long, clear buffer (human typing)
      if (now - lastKeyTimeRef.current > maxGapMs && bufferRef.current.length > 0) {
        clearBuffer();
      }
      
      lastKeyTimeRef.current = now;

      // Handle Enter key - process the buffer
      if (e.key === 'Enter') {
        e.preventDefault();
        processBuffer();
        return;
      }

      // Only capture printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key.toUpperCase();
        
        // Set timeout to clear buffer if no more input
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(clearBuffer, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      clearBuffer();
    };
  }, [enabled, maxGapMs, clearBuffer, processBuffer]);

  return { clearBuffer };
}
