import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

const BUCKET = "device-images";

export async function compressAndUploadImage(
  file: File,
  deviceId: string
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: "image/jpeg",
    });

    const ext = "jpg";
    const path = `${deviceId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressed, { contentType: "image/jpeg", upsert: true });
    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  } catch (err) {
    console.error("Image processing error:", err);
    return null;
  }
}

export function getDeviceImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
