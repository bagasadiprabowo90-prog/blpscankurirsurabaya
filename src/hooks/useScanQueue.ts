import { useState, useCallback, useRef, useEffect } from 'react';

interface UseScanQueueOptions {
  onProcess: (resi: string) => Promise<boolean>;
  debounceMs?: number;
}

export function useScanQueue({ onProcess, debounceMs = 50 }: UseScanQueueOptions) {
  const [queue, setQueue] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);

    while (queueRef.current.length > 0) {
      const resi = queueRef.current[0];
      
      try {
        const isValid = await onProcess(resi);
        if (isValid) {
          setProcessedCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error processing resi:', error);
      }

      // Remove processed item
      setQueue(prev => {
        const newQueue = prev.slice(1);
        queueRef.current = newQueue;
        return newQueue;
      });

      // Small delay between processing to prevent overwhelming the DB
      if (queueRef.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, debounceMs));
      }
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [onProcess, debounceMs]);

  const addToQueue = useCallback((resi: string) => {
    const trimmed = resi.trim().toUpperCase();
    if (!trimmed) return;

    setQueue(prev => {
      const newQueue = [...prev, trimmed];
      queueRef.current = newQueue;
      return newQueue;
    });

    // Start processing if not already
    if (!processingRef.current) {
      // Small delay to batch rapid scans
      setTimeout(() => processQueue(), 10);
    }
  }, [processQueue]);

  const resetCount = useCallback(() => {
    setProcessedCount(0);
  }, []);

  return {
    addToQueue,
    queueLength: queue.length,
    isProcessing,
    processedCount,
    resetCount,
  };
}
