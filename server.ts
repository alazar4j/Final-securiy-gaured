import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// In-memory data store for standalone execution (with seed data)
interface AppUser {
  id: string;
  username: string;
  password_hash: string;
  role: "admin" | "security";
  full_name: string;
  email: string;
  phone?: string;
  language: "en" | "am";
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  last_login_at?: string;
}

interface Device {
  id: string;
  owner_name: string;
  owner_role: "student" | "staff";
  owner_phone: string;
  brand: string;
  model: string;
  color?: string;
  serial_number?: string;
  qr_token: string;
  status: "active" | "reported_stolen" | "under_maintenance";
  image_path?: string;
  image_paths?: string[];
  registered_by: string;
  registered_by_username: string;
  registered_by_name: string;
  registered_at: string;
  updated_at?: string;
}

interface AuditLog {
  id: string;
  event_type: string;
  actor_id?: string;
  actor_username?: string;
  target_device_id?: string;
  lookup_value?: string;
  result: string;
  details?: any;
  created_at: string;
}

interface Session {
  token: string;
  user_id: string;
  expires_at: string;
}

// Seed Users
const users: AppUser[] = [
  {
    id: "usr_admin_1",
    username: "admin",
    password_hash: "1234", // Simple demo verification
    role: "admin",
    full_name: "System Administrator",
    email: "alazarginbaru1@gmail.com",
    phone: "+251911000000",
    language: "en",
    is_active: true,
    must_change_password: false,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "usr_sec_1",
    username: "security1",
    password_hash: "1234",
    role: "security",
    full_name: "Abebe Kebede",
    email: "abebe@selamsecurity.edu.et",
    phone: "+251912345678",
    language: "en",
    is_active: true,
    must_change_password: false,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

// Seed Devices
const devices: Device[] = [
  {
    id: "dev_1",
    owner_name: "Dawit Bekele",
    owner_role: "student",
    owner_phone: "+251922334455",
    brand: "Dell",
    model: "XPS 15",
    color: "Silver",
    serial_number: "DLXPS15-2024-9981",
    qr_token: "QR-DLXPS15-2024-9981",
    status: "active",
    registered_by: "usr_sec_1",
    registered_by_username: "security1",
    registered_by_name: "Abebe Kebede",
    registered_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "dev_2",
    owner_name: "Dr. Aster Tadesse",
    owner_role: "staff",
    owner_phone: "+251911223344",
    brand: "Apple",
    model: "MacBook Pro 16",
    color: "Space Gray",
    serial_number: "C02G1234MD6R",
    qr_token: "QR-C02G1234MD6R",
    status: "active",
    registered_by: "usr_admin_1",
    registered_by_username: "admin",
    registered_by_name: "System Administrator",
    registered_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: "dev_3",
    owner_name: "Sami Yohannes",
    owner_role: "student",
    owner_phone: "+251933445566",
    brand: "Lenovo",
    model: "ThinkPad T14",
    color: "Black",
    serial_number: "LNV-TP14-88210",
    qr_token: "QR-LNV-TP14-88210",
    status: "reported_stolen",
    registered_by: "usr_sec_1",
    registered_by_username: "security1",
    registered_by_name: "Abebe Kebede",
    registered_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "dev_4",
    owner_name: "Marta Haile",
    owner_role: "student",
    owner_phone: "+251944556677",
    brand: "HP",
    model: "Spectre x360",
    color: "Poseidon Blue",
    serial_number: "HP-SPC-90021",
    qr_token: "QR-HP-SPC-90021",
    status: "under_maintenance",
    registered_by: "usr_admin_1",
    registered_by_username: "admin",
    registered_by_name: "System Administrator",
    registered_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Seed Audit Logs
const auditLogs: AuditLog[] = [
  {
    id: "aud_1",
    event_type: "register",
    actor_id: "usr_sec_1",
    actor_username: "security1",
    target_device_id: "dev_1",
    result: "created",
    details: { serial_number: "DLXPS15-2024-9981" },
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "aud_2",
    event_type: "scan_qr",
    actor_id: "usr_sec_1",
    actor_username: "security1",
    target_device_id: "dev_2",
    lookup_value: "QR-C02G1234MD6R",
    result: "found",
    details: { match_count: 1, device_name: "Apple MacBook Pro 16", owner_name: "Dr. Aster Tadesse" },
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const sessions: Session[] = [];
const otps: { user_id: string; otp_code: string; expires_at: string; used: boolean }[] = [];

// Helper Auth Middleware
function getUserFromReq(req: express.Request): AppUser | null {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const sess = sessions.find((s) => s.token === token && new Date(s.expires_at) > new Date());
  if (!sess) return null;
  return users.find((u) => u.id === sess.user_id && u.is_active) || null;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  (req as any).user = user;
  next();
}

function addAuditLog(event: {
  event_type: string;
  actor_id?: string;
  actor_username?: string;
  target_device_id?: string;
  lookup_value?: string;
  result: string;
  details?: any;
}) {
  auditLogs.unshift({
    id: "aud_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    ...event,
    created_at: new Date().toISOString(),
  });
}

// ============================ API Routes ============================
const apiRouter = express.Router();

// Auth Routes
apiRouter.post("/auth/login", (req, res) => {
  const username = (req.body?.username || "").trim().toLowerCase();
  const password = req.body?.password || "";
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = users.find((u) => u.username.toLowerCase() === username);
  if (!user || !user.is_active) {
    addAuditLog({
      event_type: "failed_login",
      actor_username: username,
      result: "failure",
      details: { reason: "no_user_or_inactive" },
    });
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // Password verify (accept 1234 or matching hash)
  if (password !== user.password_hash && password !== "1234") {
    addAuditLog({
      event_type: "failed_login",
      actor_id: user.id,
      actor_username: username,
      result: "failure",
      details: { reason: "wrong_password" },
    });
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
  sessions.push({ token, user_id: user.id, expires_at: expiresAt });
  user.last_login_at = new Date().toISOString();

  addAuditLog({
    event_type: "login",
    actor_id: user.id,
    actor_username: username,
    result: "success",
  });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      must_change_password: user.must_change_password,
      language: user.language,
      phone: user.phone,
    },
  });
});

apiRouter.post("/auth/logout", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const idx = sessions.findIndex((s) => s.token === token);
  if (idx !== -1) sessions.splice(idx, 1);
  return res.json({ ok: true });
});

apiRouter.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user as AppUser;
  return res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      language: user.language,
      must_change_password: user.must_change_password,
    },
  });
});

apiRouter.post("/auth/forgot-password", async (req, res) => {
  const identifier = (req.body?.username || "").trim().toLowerCase();
  if (!identifier) return res.status(400).json({ error: "Username or email is required" });
  const user = users.find((u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier);
  if (user) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.push({
      user_id: user.id,
      otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });
    addAuditLog({
      event_type: "forgot_password_otp",
      actor_id: user.id,
      actor_username: user.username,
      result: "success",
      details: { email_sent_to: user.email, otp },
    });

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "alazarginbaru1@gmail.com",
          pass: "aveqjhyvpnyadndp",
        },
      });

      await transporter.sendMail({
        from: '"Selam Security" <alazarginbaru1@gmail.com>',
        to: user.email,
        subject: "Your Password Recovery Code",
        text: `Your password recovery code is: ${otp}\n\nThis code will expire in 10 minutes.`,
      });
      console.log(`OTP email sent to ${user.email}`);
    } catch (err) {
      console.error("Failed to send OTP email:", err);
    }

    const parts = user.email.split("@");
    const maskedEmail = parts[0].length > 2
      ? `${parts[0][0]}***${parts[0].slice(-1)}@${parts[1]}`
      : user.email;

    return res.json({
      ok: true,
      message: `Recovery email with code sent to ${maskedEmail}`,
      email: maskedEmail,
      username: user.username,
    });
  }
  return res.json({ ok: true, message: "If the account exists, a recovery code has been generated." });
});

apiRouter.post("/auth/reset-password", (req, res) => {
  const identifier = (req.body?.username || "").trim().toLowerCase();
  const otp = (req.body?.otp || "").trim();
  const newPassword = req.body?.new_password || "";
  if (!identifier || !otp || !newPassword) {
    return res.status(400).json({ error: "Username/Email, OTP, and new password are required" });
  }
  const user = users.find((u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier);
  if (!user) return res.status(400).json({ error: "Invalid OTP or account" });

  const record = otps.find(
    (o) => o.user_id === user.id && o.otp_code === otp && !o.used && new Date(o.expires_at) > new Date()
  );
  if (!record) return res.status(400).json({ error: "Invalid or expired OTP" });

  record.used = true;
  user.password_hash = newPassword;
  user.must_change_password = false;

  addAuditLog({
    event_type: "password_reset",
    actor_id: user.id,
    actor_username: user.username,
    result: "success",
  });
  return res.json({ ok: true });
});

apiRouter.post("/auth/change-password", requireAuth, (req, res) => {
  const user = (req as any).user as AppUser;
  const current = req.body?.current_password;
  const next = req.body?.new_password;
  if (!current || !next) return res.status(400).json({ error: "Current and new passwords required" });
  if (user.password_hash !== current && current !== "1234") {
    return res.status(401).json({ error: "Current password incorrect" });
  }
  user.password_hash = next;
  user.must_change_password = false;
  return res.json({ ok: true });
});

apiRouter.post("/auth/language", requireAuth, (req, res) => {
  const user = (req as any).user as AppUser;
  const lang = req.body?.language;
  if (lang === "en" || lang === "am") {
    user.language = lang;
    return res.json({ ok: true });
  }
  return res.status(400).json({ error: "Invalid language" });
});

// Devices Routes
apiRouter.get("/devices", requireAuth, (req, res) => {
  const search = (req.query.search as string || "").toLowerCase();
  const status = req.query.status as string || "";
  const page = parseInt((req.query.page as string) || "1", 10);
  const pageSize = parseInt((req.query.page_size as string) || "20", 10);

  let list = devices.slice();
  if (status) {
    list = list.filter((d) => d.status === status);
  }
  if (search) {
    list = list.filter(
      (d) =>
        d.owner_name.toLowerCase().includes(search) ||
        (d.serial_number && d.serial_number.toLowerCase().includes(search)) ||
        d.brand.toLowerCase().includes(search) ||
        d.model.toLowerCase().includes(search)
    );
  }

  const total = list.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = list.slice(startIndex, startIndex + pageSize);

  return res.json({ devices: paginated, total, page, page_size: pageSize });
});

apiRouter.post("/devices", requireAuth, (req, res) => {
  const user = (req as any).user as AppUser;
  const d = req.body?.device;
  if (!d) return res.status(400).json({ error: "Device data required" });

  const required = ["owner_name", "owner_role", "owner_phone", "brand", "model"];
  for (const f of required) {
    if (!d[f] || String(d[f]).trim() === "") return res.status(400).json({ error: `Missing field: ${f}` });
  }

  const serial = (d.serial_number || "").trim();
  if (serial && devices.some((dev) => dev.serial_number === serial)) {
    return res.status(409).json({ error: "A device with this serial number already exists" });
  }

  const id = "dev_" + Date.now();
  const qr_token = "QR-" + (serial || id);
  const newDev: Device = {
    id,
    owner_name: d.owner_name.trim(),
    owner_role: d.owner_role,
    owner_phone: d.owner_phone.trim(),
    brand: d.brand.trim(),
    model: d.model.trim(),
    color: d.color?.trim(),
    serial_number: serial || undefined,
    qr_token,
    status: d.status || "active",
    image_path: d.image_path,
    image_paths: Array.isArray(d.image_paths) ? d.image_paths : undefined,
    registered_by: user.id,
    registered_by_username: user.username,
    registered_by_name: user.full_name,
    registered_at: new Date().toISOString(),
  };

  devices.unshift(newDev);

  addAuditLog({
    event_type: "register",
    actor_id: user.id,
    actor_username: user.username,
    target_device_id: id,
    result: "created",
    details: { serial_number: serial },
  });

  return res.json({ device: newDev });
});

apiRouter.get("/devices/:id", requireAuth, (req, res) => {
  const dev = devices.find((d) => d.id === req.params.id);
  if (!dev) return res.status(404).json({ error: "Device not found" });
  return res.json({ device: dev });
});

apiRouter.patch("/devices/:id/status", requireAuth, (req, res) => {
  const user = (req as any).user as AppUser;
  const dev = devices.find((d) => d.id === req.params.id);
  if (!dev) return res.status(404).json({ error: "Device not found" });
  const status = req.body?.status;
  if (!["active", "reported_stolen", "under_maintenance"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const oldStatus = dev.status;
  dev.status = status;
  dev.updated_at = new Date().toISOString();

  addAuditLog({
    event_type: "update_status",
    actor_id: user.id,
    actor_username: user.username,
    target_device_id: dev.id,
    result: "success",
    details: { old_status: oldStatus, new_status: status },
  });

  return res.json({ device: dev });
});

apiRouter.delete("/devices/:id", requireAdmin, (req, res) => {
  const user = (req as any).user as AppUser;
  const idx = devices.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Device not found" });
  const dev = devices[idx];
  devices.splice(idx, 1);

  addAuditLog({
    event_type: "delete_device",
    actor_id: user.id,
    actor_username: user.username,
    target_device_id: req.params.id,
    result: "success",
    details: {
      action: "delete_device",
      device_name: `${dev.brand} ${dev.model}`,
      owner_name: dev.owner_name,
      deleted_by: user.username,
    },
  });

  return res.json({ ok: true });
});

// Verify (Scan)
apiRouter.post("/verify", requireAuth, (req, res) => {
  const user = (req as any).user as AppUser;
  const method = req.body?.method;
  const value = (req.body?.value || "").trim();
  if (!method || !value) return res.status(400).json({ error: "Method and value are required" });

  let matches: Device[] = [];
  if (method === "qr") {
    matches = devices.filter((d) => d.qr_token === value || d.id === value || d.serial_number === value);
  } else if (method === "serial") {
    matches = devices.filter((d) => d.serial_number?.toLowerCase() === value.toLowerCase());
  } else if (method === "name") {
    matches = devices.filter((d) => d.owner_name.toLowerCase().includes(value.toLowerCase()));
  }

  if (matches.length === 0) {
    addAuditLog({
      event_type: method === "qr" ? "scan_qr" : method === "serial" ? "lookup_serial" : "lookup_name",
      actor_id: user.id,
      actor_username: user.username,
      lookup_value: value,
      result: "not_found",
    });
    return res.json({ found: false, devices: [], offer_register: true });
  }

  const first = matches[0];
  addAuditLog({
    event_type: method === "qr" ? "scan_qr" : method === "serial" ? "lookup_serial" : "lookup_name",
    actor_id: user.id,
    actor_username: user.username,
    target_device_id: first.id,
    lookup_value: value,
    result: "found",
    details: {
      match_count: matches.length,
      device_name: `${first.brand} ${first.model}`,
      owner_name: first.owner_name,
    },
  });

  return res.json({ found: true, devices: matches });
});

// Admin Users Routes
apiRouter.get("/admin/users", requireAdmin, (req, res) => {
  return res.json({
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      language: u.language,
      is_active: u.is_active,
      must_change_password: u.must_change_password,
      last_login_at: u.last_login_at,
      created_at: u.created_at,
    })),
  });
});

apiRouter.post("/admin/users", requireAdmin, (req, res) => {
  const actor = (req as any).user as AppUser;
  const username = (req.body?.username || "").trim().toLowerCase();
  const full_name = (req.body?.full_name || "").trim();
  const email = (req.body?.email || "").trim().toLowerCase();
  const phone = req.body?.phone?.trim();
  const role = req.body?.role === "admin" ? "admin" : "security";

  if (!username || !full_name || !email) {
    return res.status(400).json({ error: "Username, full name, and email are required" });
  }

  if (users.some((u) => u.username.toLowerCase() === username)) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const newUsr: AppUser = {
    id: "usr_" + Date.now(),
    username,
    password_hash: "1234",
    role,
    full_name,
    email,
    phone,
    language: "en",
    is_active: true,
    must_change_password: true,
    created_at: new Date().toISOString(),
  };

  users.unshift(newUsr);

  addAuditLog({
    event_type: "register",
    actor_id: actor.id,
    actor_username: actor.username,
    result: "created",
    details: { new_user: username, new_user_role: role },
  });

  return res.json({ user: newUsr });
});

apiRouter.patch("/admin/users/:id", requireAdmin, (req, res) => {
  const actor = (req as any).user as AppUser;
  if (req.params.id === actor.id) {
    return res.status(400).json({ error: "Cannot deactivate your own account" });
  }
  const target = users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });

  if (target.id === "usr_admin_1" || target.username.toLowerCase() === "admin") {
    return res.status(403).json({ error: "The primary administrator account cannot be deactivated or modified." });
  }

  target.is_active = !!req.body?.is_active;
  return res.json({ user: target });
});

apiRouter.delete("/admin/users/:id", requireAdmin, (req, res) => {
  const actor = (req as any).user as AppUser;
  if (req.params.id === actor.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  const target = users[idx];
  if (target.id === "usr_admin_1" || target.username.toLowerCase() === "admin") {
    return res.status(403).json({ error: "The primary administrator account cannot be deleted." });
  }

  if (target.role === "admin") {
    return res.status(400).json({ error: "Cannot delete admin accounts" });
  }

  users.splice(idx, 1);
  return res.json({ ok: true });
});

// Admin Audit Logs & Stats
apiRouter.get("/admin/audit", requireAdmin, (req, res) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const pageSize = parseInt((req.query.page_size as string) || "50", 10);
  const eventType = req.query.event_type as string || "";
  const result = req.query.result as string || "";

  let list = auditLogs.slice();
  if (eventType) list = list.filter((l) => l.event_type === eventType);
  if (result) list = list.filter((l) => l.result === result);

  const total = list.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = list.slice(startIndex, startIndex + pageSize);

  return res.json({ logs: paginated, total, page, page_size: pageSize });
});

apiRouter.get("/admin/stats", requireAdmin, (req, res) => {
  const totalDevs = devices.length;
  const stolen = devices.filter((d) => d.status === "reported_stolen").length;
  const maint = devices.filter((d) => d.status === "under_maintenance").length;
  const totalUsers = users.length;
  const last24h = auditLogs.filter(
    (a) => new Date(a.created_at) >= new Date(Date.now() - 86400000)
  ).length;

  return res.json({
    devices: totalDevs,
    reported_stolen: stolen,
    under_maintenance: maint,
    users: totalUsers,
    scans_24h: last24h,
  });
});

// Upload Route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ path: req.file.filename, publicUrl: `/uploads/${req.file.filename}` });
});

// Mount router under both /api and /functions/v1/api for full compatibility
app.use("/api", apiRouter);
app.use("/functions/v1/api", apiRouter);

// Start Server with Vite Middleware in Development
async function startServer() {
  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Guardian Security Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
