import { openDB, DBSchema } from "idb";
import type { Device } from "../types";

export interface SyncOperation {
  id: string; // uuid for the operation
  timestamp: string;
  type: "CREATE_DEVICE" | "UPDATE_STATUS" | "VERIFY";
  payload: any;
  status: "pending" | "failed";
  error?: string;
}

interface GuardianDB extends DBSchema {
  devices: {
    key: string;
    value: Device;
    indexes: {
      "by-serial": string;
      "by-name": string;
      "by-qr": string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncOperation;
    indexes: {
      "by-timestamp": string;
    };
  };
}

let dbPromise: ReturnType<typeof openDB<GuardianDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GuardianDB>("guardian-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("devices")) {
          const deviceStore = db.createObjectStore("devices", { keyPath: "id" });
          deviceStore.createIndex("by-serial", "serial_number", { unique: false });
          deviceStore.createIndex("by-name", "owner_name", { unique: false });
          deviceStore.createIndex("by-qr", "qr_token", { unique: true });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
          syncStore.createIndex("by-timestamp", "timestamp", { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export async function clearCache() {
  const db = await getDB();
  await db.clear("devices");
}

export async function saveDeviceToCache(device: Device) {
  const db = await getDB();
  await db.put("devices", device);
}

export async function cacheDevices(devices: Device[]) {
  const db = await getDB();
  const tx = db.transaction("devices", "readwrite");
  for (const d of devices) {
    tx.store.put(d);
  }
  await tx.done;
}

export async function getCachedDevices() {
  const db = await getDB();
  return db.getAll("devices");
}

export async function getCachedDeviceById(id: string) {
  const db = await getDB();
  return db.get("devices", id);
}

export async function findDeviceByQr(qrToken: string) {
  const db = await getDB();
  return db.getFromIndex("devices", "by-qr", qrToken);
}

export async function findDevicesBySerial(serial: string) {
  const db = await getDB();
  return db.getAllFromIndex("devices", "by-serial", serial);
}

export async function searchDevicesByName(name: string) {
  const db = await getDB();
  const all = await db.getAll("devices");
  const lower = name.toLowerCase();
  return all.filter(d => d.owner_name.toLowerCase().includes(lower));
}

export async function enqueueSyncOperation(op: Omit<SyncOperation, "id" | "status" | "timestamp">) {
  const db = await getDB();
  const operation: SyncOperation = {
    ...op,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    status: "pending",
  };
  await db.put("syncQueue", operation);
  return operation;
}

export async function getPendingSyncOperations() {
  const db = await getDB();
  const tx = db.transaction("syncQueue", "readonly");
  const ops = await tx.store.getAll();
  // Sort by timestamp
  return ops.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function markSyncOperationComplete(id: string) {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

export async function markSyncOperationFailed(id: string, error: string) {
  const db = await getDB();
  const op = await db.get("syncQueue", id);
  if (op) {
    op.status = "failed";
    op.error = error;
    await db.put("syncQueue", op);
  }
}
