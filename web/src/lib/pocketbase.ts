import PocketBase from 'pocketbase';

export const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const reunionAccessStorageKey = 'hoplop.reunion_access_code';
export const pb = new PocketBase(pocketBaseUrl);

export const getFileUrl = (collection: string, recordId: string, filename: string) => {
  if (!filename) return '';
  return `${pocketBaseUrl}/api/files/${collection}/${recordId}/${filename}`;
};

export const getStoredReunionAccessCode = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(reunionAccessStorageKey) ?? '';
};
