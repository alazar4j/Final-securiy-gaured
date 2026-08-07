import imageCompression from "browser-image-compression";
import { saveOfflineImage } from "./offlineImages";

export async function compressAndUploadImage(
  file: File,
  deviceId: string
): Promise<{ path: string; publicUrl: string } | null> {
  console.log("Compressing image:", file.name, file.type, file.size);
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: false,
      fileType: "image/jpeg",
    });
    console.log("Compressed image size:", compressed.size);

    if (!navigator.onLine) {
      // Offline mode handling
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
      
      const offlineId = "offline_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      await saveOfflineImage(offlineId, dataUrl);
      
      return { path: "offline:" + offlineId, publicUrl: dataUrl };
    }

    const formData = new FormData();
    formData.append("image", compressed);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      console.error("Upload error:", await response.text());
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error("Image processing error:", err);
    return null;
  }
}

export function getDeviceImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("offline:")) {
    // We can't render it directly from just "offline:" easily unless we load it, 
    // but the UI components that render previews already use the publicUrl state 
    // during registration. In DeviceCard, they might see "offline:" path.
    // If they do, they'd need an async fetch. 
    // For now, if we return path it will break img src.
    // In our offline implementation we just return a placeholder or handle it in the component.
    return null;
  }
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
}
