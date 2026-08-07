import { EDGE_FUNCTION_URL } from "./supabase";
import type {
  AppUser,
  AuditLog,
  Device,
  DeviceStatus,
  Session,
  Stats,
  VerifyResult,
} from "../types";

function getToken(): string | null {
  return localStorage.getItem("selam_token");
}

async function apiCall<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${EDGE_FUNCTION_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (data && typeof data === "object" && "error" in data && typeof (data as Record<string, unknown>).error === "string") {
      message = (data as Record<string, string>).error;
    }
    throw new Error(message);
  }
  return data as T;
}

const backendApi = {
  // Auth
  login: (username: string, password: string) =>
    apiCall<Session>("/auth/login", { method: "POST", body: { username, password } }),
  logout: () => apiCall<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => apiCall<{ user: AppUser }>("/auth/me"),
  forgotPassword: (username: string) =>
    apiCall<{ ok: boolean; message?: string; email?: string; username?: string; otp?: string }>("/auth/forgot-password", {
      method: "POST",
      body: { username },
    }),
  resetPassword: (username: string, otp: string, new_password: string) =>
    apiCall<{ ok: boolean }>("/auth/reset-password", {
      method: "POST",
      body: { username, otp, new_password },
    }),
  changePassword: (current_password: string, new_password: string) =>
    apiCall<{ ok: boolean }>("/auth/change-password", {
      method: "POST",
      body: { current_password, new_password },
    }),
  updateLanguage: (language: "en" | "am") =>
    apiCall<{ ok: boolean }>("/auth/language", { method: "POST", body: { language } }),

  // Devices
  listDevices: (params: { search?: string; status?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.status) q.set("status", params.status);
    if (params.page) q.set("page", String(params.page));
    if (params.page_size) q.set("page_size", String(params.page_size));
    const qs = q.toString();
    return apiCall<{ devices: Device[]; total: number; page: number; page_size: number }>(
      `/devices${qs ? `?${qs}` : ""}`
    );
  },
  getDevice: (id: string) => apiCall<{ device: Device }>(`/devices/${id}`),
  registerDevice: (device: Partial<Device>) =>
    apiCall<{ device: Device }>("/devices", { method: "POST", body: { device } }),
  updateDeviceStatus: (id: string, status: DeviceStatus) =>
    apiCall<{ device: Device }>(`/devices/${id}/status`, { method: "PATCH", body: { status } }),
  deleteDevice: (id: string) =>
    apiCall<{ ok: boolean }>(`/devices/${id}`, { method: "DELETE" }),

  // Verify (scan)
  verify: (method: "qr" | "serial" | "name", value: string) =>
    apiCall<VerifyResult>("/verify", { method: "POST", body: { method, value } }),

  // Admin
  listUsers: () => apiCall<{ users: AppUser[] }>("/admin/users"),
  createUser: (username: string, full_name: string, email: string, phone?: string, role?: "admin" | "security") =>
    apiCall<{ user: AppUser }>("/admin/users", { method: "POST", body: { username, full_name, email, phone, role } }),
  toggleUser: (id: string, is_active: boolean) =>
    apiCall<{ user: AppUser }>(`/admin/users/${id}`, { method: "PATCH", body: { is_active } }),
  deleteUser: (id: string) =>
    apiCall<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
  listAudit: (params: { event_type?: string; result?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.event_type) q.set("event_type", params.event_type);
    if (params.result) q.set("result", params.result);
    if (params.page) q.set("page", String(params.page));
    if (params.page_size) q.set("page_size", String(params.page_size));
    const qs = q.toString();
    return apiCall<{ logs: AuditLog[]; total: number; page: number; page_size: number }>(
      `/admin/audit${qs ? `?${qs}` : ""}`
    );
  },
  getAuditCharts: () => apiCall<{ chartData: { date: string, registrations: number, verifications: number }[] }>("/admin/audit/charts"),
  stats: () => apiCall<Stats>("/admin/stats"),
  adminAssistant: (prompt: string, history?: any[]) => 
    apiCall<{ text: string }>("/admin/assistant", { 
      method: "POST", 
      body: { prompt, history } 
    }),
};

import {
  enqueueSyncOperation,
  cacheDevices,
  getCachedDevices,
  getCachedDeviceById,
  searchDevicesByName,
  saveDeviceToCache,
  findDeviceByQr,
  findDevicesBySerial,
} from "./db";

// Process queue on load if online
import { processSyncQueue } from "./sync";
if (typeof window !== "undefined" && navigator.onLine) {
  setTimeout(processSyncQueue, 1000);
}

export const api = {
  ...backendApi,
  
  listDevices: async (params: { search?: string; status?: string; page?: number; page_size?: number } = {}) => {
    if (!navigator.onLine) {
      let list = await getCachedDevices();
      if (params.status) {
        list = list.filter((d) => d.status === params.status);
      }
      if (params.search) {
        const lower = params.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.owner_name.toLowerCase().includes(lower) ||
            (d.serial_number && d.serial_number.toLowerCase().includes(lower)) ||
            d.brand.toLowerCase().includes(lower) ||
            d.model.toLowerCase().includes(lower)
        );
      }
      const page = params.page || 1;
      const pageSize = params.page_size || 20;
      const total = list.length;
      const startIndex = (page - 1) * pageSize;
      const paginated = list.slice(startIndex, startIndex + pageSize);
      return { devices: paginated, total, page, page_size: pageSize };
    }
    
    try {
      const res = await backendApi.listDevices(params);
      // Cache the result if no filters
      if (!params.search && !params.status && (!params.page || params.page === 1)) {
        await cacheDevices(res.devices);
      } else {
        await cacheDevices(res.devices); // Just cache them anyway
      }
      return res;
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        // Fallback to cache if network error despite navigator.onLine being true
        return { devices: await getCachedDevices(), total: 0, page: 1, page_size: 20 };
      }
      throw err;
    }
  },

  getDevice: async (id: string) => {
    if (!navigator.onLine) {
      const dev = await getCachedDeviceById(id);
      if (!dev) throw new Error("Device not found in local cache");
      return { device: dev };
    }
    try {
      const res = await backendApi.getDevice(id);
      await saveDeviceToCache(res.device);
      return res;
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        const dev = await getCachedDeviceById(id);
        if (dev) return { device: dev };
      }
      throw err;
    }
  },

  registerDevice: async (device: Partial<Device>) => {
    if (!navigator.onLine) {
      const tempId = "offline_" + Date.now();
      const qr_token = "QR-" + (device.serial_number || tempId);
      const newDev: Device = {
        id: tempId,
        owner_name: device.owner_name || "",
        owner_role: device.owner_role || "student",
        owner_phone: device.owner_phone || "",
        brand: device.brand || "",
        model: device.model || "",
        color: device.color || null,
        serial_number: device.serial_number || null,
        qr_token,
        status: device.status || "active",
        image_path: device.image_path || null,
        image_paths: device.image_paths || undefined,
        registered_by: "offline_user",
        registered_by_username: "offline",
        registered_by_name: "Offline User",
        registered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await saveDeviceToCache(newDev);
      await enqueueSyncOperation({
        type: "CREATE_DEVICE",
        payload: device,
      });
      
      return { device: newDev };
    }
    
    const res = await backendApi.registerDevice(device);
    await saveDeviceToCache(res.device);
    return res;
  },

  updateDeviceStatus: async (id: string, status: DeviceStatus) => {
    if (!navigator.onLine) {
      const dev = await getCachedDeviceById(id);
      if (!dev) throw new Error("Device not found in local cache");
      
      dev.status = status;
      dev.updated_at = new Date().toISOString();
      await saveDeviceToCache(dev);
      
      await enqueueSyncOperation({
        type: "UPDATE_STATUS",
        payload: { id, status },
      });
      
      return { device: dev };
    }
    
    const res = await backendApi.updateDeviceStatus(id, status);
    await saveDeviceToCache(res.device);
    return res;
  },

  verify: async (method: "qr" | "serial" | "name", value: string) => {
    if (!navigator.onLine) {
      let devices: Device[] = [];
      if (method === "qr") {
        const d = await findDeviceByQr(value);
        if (d) devices = [d];
      } else if (method === "serial") {
        devices = await findDevicesBySerial(value);
      } else if (method === "name") {
        devices = await searchDevicesByName(value);
      }
      
      await enqueueSyncOperation({
        type: "VERIFY",
        payload: { method, value },
      });
      
      return { devices, found: devices.length > 0, offer_register: true, offline: true } as VerifyResult;
    }
    
    const res = await backendApi.verify(method, value);
    return res;
  }
};
