import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

const BUCKET = "device-images";

export async function compressAndUploadImage(
  file: File,
  deviceId: string
): Promise<{ path: string; publicUrl: string } | null> {
  console.log("Compressing image:", file.name, file.type, file.size);
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: false, // Try disabling web worker for debugging
      fileType: "image/jpeg",
    });
    console.log("Compressed image size:", compressed.size);

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
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return path;
  return `/uploads/${path}`;
}
