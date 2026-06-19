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
             // Remove headers and map
             const records = rows.slice(1).map(mapRowInfo);
             setData(records);
          }
        }
      } catch (err: any) {
        console.error(`Error fetching ${sheetName}: `, err);
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
