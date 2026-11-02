const DEVICE_KEY = "cvopencode:device-id";

export function getDeviceId() {
  if (typeof window === "undefined") return null;

  let id = window.localStorage.getItem(DEVICE_KEY);

  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }

  return id;
}

async function resolveDirectory(parts, create) {
  let handle = await navigator.storage.getDirectory();

  for (const part of parts) {
    handle = await handle.getDirectoryHandle(part, { create });
  }

  return handle;
}

export async function writeOpfs(path, blob) {
  const parts = path.split("/");
  const fileName = parts.pop();
  const directory = await resolveDirectory(parts, true);
  const fileHandle = await directory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  await writable.write(blob);
  await writable.close();

  return path;
}

export async function readOpfs(path) {
  try {
    const parts = path.split("/");
    const fileName = parts.pop();
    const directory = await resolveDirectory(parts, false);
    const fileHandle = await directory.getFileHandle(fileName);
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

export async function removeOpfs(path) {
  try {
    const parts = path.split("/");
    const fileName = parts.pop();
    const directory = await resolveDirectory(parts, false);
    await directory.removeEntry(fileName);
    return true;
  } catch {
    return false;
  }
}

export async function ensurePersistentStorage() {
  if (!navigator.storage?.persist) return false;

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null;

  try {
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}
