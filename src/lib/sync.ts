import { api } from "./api";
import {
  enqueueSyncOperation,
  getPendingSyncOperations,
  markSyncOperationComplete,
  markSyncOperationFailed,
  saveDeviceToCache,
} from "./db";
import { toast } from "../components/ui/Toast";
import { getOfflineImage, removeOfflineImage } from "./offlineImages";

let isSyncing = false;

// Helper to upload base64 image back to server
async function uploadOfflineImage(dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append("image", blob, "offline_upload.jpg");
    
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      const data = await response.json();
      return data.path;
    }
  } catch (err) {
    console.error("Failed to upload offline image", err);
  }
  return null;
}

export async function processSyncQueue() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;

  try {
    const ops = await getPendingSyncOperations();
    if (ops.length === 0) return;

    for (const op of ops) {
      if (op.status === "pending" || op.status === "failed") {
        try {
          if (op.type === "CREATE_DEVICE") {
            const devicePayload = { ...op.payload };
            
            // Check for offline images and upload them first
            if (devicePayload.image_paths && Array.isArray(devicePayload.image_paths)) {
              const updatedPaths: string[] = [];
              for (const path of devicePayload.image_paths) {
                if (path.startsWith("offline:")) {
                  const offlineId = path.split("offline:")[1];
                  const dataUrl = await getOfflineImage(offlineId);
                  if (dataUrl) {
                    const realPath = await uploadOfflineImage(dataUrl);
                    if (realPath) {
                      updatedPaths.push(realPath);
                      await removeOfflineImage(offlineId);
                    }
                  }
                } else {
                  updatedPaths.push(path);
                }
              }
              devicePayload.image_paths = updatedPaths;
              if (updatedPaths.length > 0) {
                devicePayload.image_path = updatedPaths[0];
              }
            }
            
            await api.registerDevice(devicePayload);
          } else if (op.type === "UPDATE_STATUS") {
            await api.updateDeviceStatus(op.payload.id, op.payload.status);
          } else if (op.type === "VERIFY") {
            await api.verify(op.payload.method, op.payload.value);
          }
          await markSyncOperationComplete(op.id);
        } catch (err: any) {
          console.error(`Sync failed for operation ${op.id}:`, err);
          await markSyncOperationFailed(op.id, err.message || "Unknown error");
        }
      }
    }
    
    toast.success("Offline changes synced successfully");
    
    // Refresh device list in cache
    await api.listDevices();
    
  } catch (err) {
    console.error("Queue processing error:", err);
  } finally {
    isSyncing = false;
  }
}

// Start listener
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    toast.success("Back online. Syncing changes...");
    processSyncQueue();
  });
}
