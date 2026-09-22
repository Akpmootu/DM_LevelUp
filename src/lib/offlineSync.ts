import { getOrCreateSpreadsheet, addSheet, appendRow } from './googleSheets';
import { getOrCreateFolder, uploadFile } from './googleDrive';
import axios from 'axios';

export interface OfflineQueueItem {
  id: string;
  type: 'official' | 'training' | 'experience' | 'leave';
  sheetName: string;
  title: string;
  values: any[];
  fileData?: {
    name: string;
    type: string;
    base64: string;
  };
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

const STORAGE_KEY = 'ssj_offline_sync_queue';

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline queue from localStorage', e);
    return [];
  }
}

export function saveOfflineQueue(items: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: items.length } }));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
}

export function addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'status'>): OfflineQueueItem {
  const current = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    ...item,
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    status: 'pending',
  };
  current.push(newItem);
  saveOfflineQueue(current);
  return newItem;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function removeOfflineQueueItem(id: string): void {
  const current = getOfflineQueue();
  const filtered = current.filter((item) => item.id !== id);
  saveOfflineQueue(filtered);
}

export function clearOfflineQueue(): void {
  saveOfflineQueue([]);
}

// Convert base64 data to File object for upload
function base64ToFile(base64: string, filename: string, mimeType: string): File {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
}

// Sync all pending offline items to Google Sheets and Drive
export async function syncOfflineQueue(
  onProgress?: (synced: number, total: number, currentItem: OfflineQueueItem) => void
): Promise<{ success: boolean; syncedCount: number; errors: any[] }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  let spreadsheetId: string | null = null;
  try {
    spreadsheetId = await getOrCreateSpreadsheet();
  } catch (e: any) {
    return { success: false, syncedCount: 0, errors: [e.message || 'Cannot access Google Sheets'] };
  }

  const errors: any[] = [];
  let syncedCount = 0;
  const remaining: OfflineQueueItem[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    if (onProgress) {
      onProgress(syncedCount, queue.length, item);
    }

    try {
      let finalValues = [...item.values];

      // If item has offline attached file, upload to Google Drive first
      if (item.fileData && item.fileData.base64) {
        try {
          const folderId = await getOrCreateFolder();
          const fileObj = base64ToFile(item.fileData.base64, item.fileData.name, item.fileData.type);
          const fileUrl = await uploadFile(fileObj, folderId);

          // Update file reference URL in values
          // By convention, file url is the last element
          if (finalValues.length > 0) {
            finalValues[finalValues.length - 1] = fileUrl;
          }
        } catch (fileErr) {
          console.warn(`Failed to upload offline file for ${item.title}`, fileErr);
        }
      }

      await addSheet(spreadsheetId, item.sheetName);
      await appendRow(spreadsheetId, item.sheetName, finalValues);

      syncedCount++;

      // Send Telegram notification if online
      try {
        await axios.post('/api/notify', {
          message: `🔄 <b>ซิงค์ข้อมูลออฟไลน์สำเร็จ: ${item.sheetName}</b>\n📌 ${item.title}\n⏰ บันทึกเมื่อ: ${new Date(item.timestamp).toLocaleString('th-TH')}`,
          platform: 'telegram',
        });
      } catch (err) {
        // Notification failure is non-blocking
      }
    } catch (err: any) {
      console.error(`Error syncing item ${item.id}`, err);
      item.status = 'failed';
      item.error = err.message || 'ซิงค์ล้มเหลว';
      remaining.push(item);
      errors.push({ id: item.id, error: err.message });
    }
  }

  saveOfflineQueue(remaining);

  // Dispatch global sync completed event
  window.dispatchEvent(new CustomEvent('offline-sync-completed', { detail: { syncedCount, errorsCount: errors.length } }));

  return {
    success: errors.length === 0,
    syncedCount,
    errors,
  };
}
