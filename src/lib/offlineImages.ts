import { getDB } from "./db";

// To avoid DB upgrade issues, we can just use localStorage for small compressed images 
// or let's just add it to IDB if we can upgrade. Wait, changing IDB version can cause issues if open.
// A simpler offline storage just for this: localforage isn't installed. 
// We can use a separate IDB for images to avoid upgrading guardian-db.
import { openDB } from "idb";

const imageDB = openDB("guardian-images", 1, {
  upgrade(db) {
    db.createObjectStore("images");
  },
});

export async function saveOfflineImage(id: string, base64: string) {
  const db = await imageDB;
  await db.put("images", base64, id);
}

export async function getOfflineImage(id: string) {
  const db = await imageDB;
  return db.get("images", id);
}

export async function removeOfflineImage(id: string) {
  const db = await imageDB;
  await db.delete("images", id);
}
