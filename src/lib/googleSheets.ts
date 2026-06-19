import { getAccessToken } from './googleAuth';

const GOOGLE_API_PREFIX = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_PREFIX = 'https://www.googleapis.com/drive/v3/files';

export const createSpreadsheet = async (title: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const res = await fetch(GOOGLE_API_PREFIX, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Profile' } },
        { properties: { title: 'Official History' } },
        { properties: { title: 'Training History' } },
        { properties: { title: 'Work Experience' } }
      ]
    }),
  });
  
  if (!res.ok) throw new Error('Failed to create spreadsheet');
  const data = await res.json();
  
  // Set the headers
  await appendRow(data.spreadsheetId, 'Profile', ['ID', 'Data', 'CreatedAt']);
  await appendRow(data.spreadsheetId, 'Official History', ['Date', 'Title', 'Detail', 'Status', 'CreatedAt']);
  await appendRow(data.spreadsheetId, 'Training History', ['Date', 'Course', 'Location', 'CreatedAt']);
  await appendRow(data.spreadsheetId, 'Work Experience', ['Period', 'Role', 'Company', 'Description', 'CreatedAt']);

  return data.spreadsheetId;
};

export const findSpreadsheet = async (title: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');
  
  const q = `name='${title}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const res = await fetch(`${DRIVE_API_PREFIX}?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to search drive');
  const data = await res.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

export const getOrCreateSpreadsheet = async () => {
  return '1ktkgcHMhD0MEQjCzmfvdms5ln6c0hvJ3e1kkoZ8gH5A';
};

export const getSheetData = async (spreadsheetId: string, range: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const res = await fetch(`${GOOGLE_API_PREFIX}/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
     const error = await res.json();
     if (error.error?.message?.includes('Unable to parse range:')) {
        // Sheet does not exist or empty
        await addSheet(spreadsheetId, range.split('!')[0]);
        return { values: [] };
     }
     throw new Error('Failed to fetch sheet data');
  }
  
  return await res.json();
};

export const addSheet = async (spreadsheetId: string, title: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const res = await fetch(`${GOOGLE_API_PREFIX}/${spreadsheetId}:batchUpdate`, {
     method: 'POST',
     headers: {
       Authorization: `Bearer ${token}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       requests: [
         {
           addSheet: {
             properties: {
               title: title
             }
           }
         }
       ]
     })
  });
  
  if (!res.ok) {
     const errorText = await res.text();
     if (res.status === 400 && errorText.includes('already exists')) {
       // Sheet already exists, so maybe it's just hidden or empty
       return { success: true };
     }
     throw new Error(`Failed to add sheet: ${errorText}`);
  }
  
  const data = await res.json();
  // Add a placeholder header row for new sheets
  try {
     await appendRow(spreadsheetId, title, ['Key', 'Data', 'Created At']);
  } catch (e) {
     console.error('Failed to append header', e);
  }
  
  return data;
};

export const appendRow = async (spreadsheetId: string, range: string, values: any[]) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const res = await fetch(`${GOOGLE_API_PREFIX}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values]
    })
  });
  
  if (!res.ok) {
     throw new Error('Failed to append row');
  }
  return await res.json();
};

export const updateRow = async (spreadsheetId: string, range: string, rowIndex: number, values: any[]) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  // Ensure sheet exists is tricky here, but assuming it exists if we are updating a row
  const rowA1 = `${range}!A${rowIndex}`;
  const res = await fetch(`${GOOGLE_API_PREFIX}/${spreadsheetId}/values/${rowA1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values]
    })
  });

  if (!res.ok) throw new Error('Failed to update row');
  return await res.json();
};
