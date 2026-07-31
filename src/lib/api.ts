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

export const api = {
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
};
