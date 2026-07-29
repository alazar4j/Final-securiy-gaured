export type Role = "admin" | "security";
export type Language = "en" | "am";

export interface AppUser {
  id: string;
  username: string;
  role: Role;
  full_name: string;
  email: string;
  phone?: string | null;
  language: Language;
  must_change_password: boolean;
  is_active?: boolean;
  last_login_at?: string | null;
  created_at?: string;
}

export type DeviceStatus = "active" | "reported_stolen" | "under_maintenance";
export type OwnerRole = "student" | "staff";

export interface Device {
  id: string;
  owner_name: string;
  owner_role: OwnerRole;
  owner_phone: string;
  brand: string;
  model: string;
  color: string | null;
  serial_number: string | null;
  image_path: string | null;
  image_paths: string[] | null;
  qr_token: string;
  status: DeviceStatus;
  registered_by: string | null;
  registered_by_username: string | null;
  registered_by_name: string | null;
  registered_at: string;
  updated_at: string;
}

export type AuditEventType =
  | "scan_qr"
  | "lookup_serial"
  | "lookup_name"
  | "register"
  | "update_status"
  | "login"
  | "logout"
  | "failed_login"
  | "forgot_password_otp"
  | "password_reset"
  | "unknown_device_prompt"
  | "delete_device";

export type AuditResult = "found" | "not_found" | "success" | "failure" | "created";

export interface AuditLog {
  id: string;
  event_type: AuditEventType;
  actor_id: string | null;
  actor_username: string | null;
  target_device_id: string | null;
  lookup_value: string | null;
  result: AuditResult;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Session {
  token: string;
  user: AppUser;
}

export interface VerifyResult {
  found: boolean;
  devices: Device[];
  offer_register?: boolean;
}

export interface Stats {
  devices: number;
  reported_stolen: number;
  under_maintenance: number;
  users: number;
  scans_24h: number;
}
