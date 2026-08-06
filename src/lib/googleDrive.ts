import { getAccessToken } from './googleAuth';

const DRIVE_API_PREFIX = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_PREFIX = 'https://www.googleapis.com/upload/drive/v3/files';

export const findFolder = async (folderName: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');
  
  const q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await fetch(`${DRIVE_API_PREFIX}?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to search drive for folder');
  const data = await res.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

export const createFolder = async (folderName: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const res = await fetch(DRIVE_API_PREFIX, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  
  if (!res.ok) throw new Error('Failed to create folder');
  const data = await res.json();
  return data.id;
};

export const findSubFolder = async (parentFolderId: string, folderName: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');
  
  const q = `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await fetch(`${DRIVE_API_PREFIX}?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to search subfolder');
  const data = await res.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

export const createSubFolder = async (parentFolderId: string, folderName: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const res = await fetch(DRIVE_API_PREFIX, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });
  
  if (!res.ok) throw new Error('Failed to create subfolder');
  const data = await res.json();
  return data.id;
};

let folderPromise: Promise<string> | null = null;

export const getOrCreateFolder = async () => {
  const folderName = 'mootu_LevelUp_Files';
  if (folderPromise) return folderPromise;

  folderPromise = (async () => {
    try {
      let folderId = await findFolder(folderName);
      if (!folderId) {
        folderId = await createFolder(folderName);
      }
      return folderId;
    } catch (e) {
      folderPromise = null;
      throw e;
    }
  })();

  return folderPromise;
};

export const getOrCreateYearFolder = async (year: string) => {
  const rootFolderId = await getOrCreateFolder();
  const cleanYear = year ? String(year).trim() : new Date().getFullYear() + 543;
  const folderName = `พ.ศ. ${cleanYear}`;

  let subFolderId = await findSubFolder(rootFolderId, folderName);
  if (!subFolderId) {
    subFolderId = await createSubFolder(rootFolderId, folderName);
  }
  return subFolderId;
};

export const copyFileBackup = async (fileId: string, newTitle: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const res = await fetch(`${DRIVE_API_PREFIX}/${fileId}/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: newTitle,
    }),
  });

  if (!res.ok) throw new Error('Failed to create backup copy');
  return await res.json();
};

export const uploadFile = async (file: File, folderId: string, customName?: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const metadata = {
    name: customName || file.name,
    parents: [folderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(`${DRIVE_UPLOAD_PREFIX}?uploadType=multipart&fields=id,name,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) throw new Error('Failed to upload file');
  return await res.json();
};

export const listFiles = async (folderId: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const q = `'${folderId}' in parents and trashed=false`;
  const res = await fetch(`${DRIVE_API_PREFIX}?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,iconLink)&orderBy=createdTime desc`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('Failed to list files');
  const data = await res.json();
  return data.files || [];
};
