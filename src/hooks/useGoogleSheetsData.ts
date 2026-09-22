import { useState, useEffect } from 'react';
import { getSheetData, getOrCreateSpreadsheet } from '../lib/googleSheets';
import { getAccessToken } from '../lib/googleAuth';

export function useGoogleSheetsData<T>(sheetName: string, mapRowInfo: (row: any[], index: number) => T, deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const token = await getAccessToken();
        if (!token) {
           if (mounted) setLoading(false);
           return;
        }

        setLoading(true);
        const spreadsheetId = await getOrCreateSpreadsheet();
        localStorage.setItem('spreadsheetId', spreadsheetId); // Cache id
        
        const res = await getSheetData(spreadsheetId, sheetName);
        if (mounted) {
          const rows = res.values || [];
          if (rows.length <= 1) { // Only headers
             setData([]);
          } else {
             // Remove headers, preserve sheet row index (index + 2), and map non-empty rows
             const records = rows.slice(1)
               .map((row, index) => ({ row, sheetRowIndex: index + 2 }))
               .filter(({ row }) => row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
               .map(({ row, sheetRowIndex }) => mapRowInfo(row, sheetRowIndex));
             setData(records);
             try {
               localStorage.setItem(`cache_${sheetName}`, JSON.stringify(records));
             } catch {}
          }
        }
      } catch (err: any) {
        console.error(`Error fetching ${sheetName}: `, err);
        // Fallback to cached records if network or sheet fetch fails
        try {
          const cached = localStorage.getItem(`cache_${sheetName}`);
          if (cached && mounted) {
            setData(JSON.parse(cached));
          }
        } catch {}
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Checking if we have an access token (could be passed via Auth trigger but assuming caller manages login)
    loadData();

    return () => {
      mounted = false;
    };
  }, [...deps, refreshTrigger]);

  return { data, loading, error, refetch };
}
