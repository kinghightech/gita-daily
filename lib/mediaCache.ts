import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR_NAME = 'supabase-media-cache';
const inflightDownloads = new Map<string, Promise<string>>();

function getCacheBaseDirectory(): string | null {
  return FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;
}

function getExtensionFromUri(uri: string): string {
  try {
    const { pathname } = new URL(uri);
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    return match ? `.${match[1].toLowerCase()}` : '';
  } catch {
    const match = uri.split('?')[0]?.match(/\.([a-z0-9]+)$/i);
    return match ? `.${match[1].toLowerCase()}` : '';
  }
}

function sanitizeCacheKey(cacheKey: string): string {
  return cacheKey.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'media';
}

async function ensureCacheDirectory(cacheDirectory: string) {
  const info = await FileSystem.getInfoAsync(cacheDirectory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true });
  }
}

export async function getCachedMediaUri(remoteUri: string, cacheKey: string): Promise<string> {
  if (!remoteUri.startsWith('http')) return remoteUri;

  const baseDirectory = getCacheBaseDirectory();
  if (!baseDirectory) return remoteUri;

  const cacheDirectory = `${baseDirectory}${CACHE_DIR_NAME}/`;
  const extension = getExtensionFromUri(remoteUri);
  const localUri = `${cacheDirectory}${sanitizeCacheKey(cacheKey)}${extension}`;

  const existing = await FileSystem.getInfoAsync(localUri);
  if (existing.exists && !existing.isDirectory && existing.size > 0) {
    return localUri;
  }

  const existingDownload = inflightDownloads.get(localUri);
  if (existingDownload) return existingDownload;

  const downloadPromise = (async () => {
    await ensureCacheDirectory(cacheDirectory);

    const tempUri = `${localUri}.download`;
    await FileSystem.deleteAsync(tempUri, { idempotent: true });

    const result = await FileSystem.downloadAsync(remoteUri, tempUri);
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Media download failed with HTTP ${result.status}`);
    }

    await FileSystem.deleteAsync(localUri, { idempotent: true });
    await FileSystem.moveAsync({ from: tempUri, to: localUri });

    return localUri;
  })()
    .catch((error) => {
      console.warn('Falling back to remote media URL after cache failure', error);
      return remoteUri;
    })
    .finally(() => {
      inflightDownloads.delete(localUri);
    });

  inflightDownloads.set(localUri, downloadPromise);
  return downloadPromise;
}
