import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  UserPlus, Users as UsersIcon, Power, Shield,
  Trash2, Mail, Phone, AlertTriangle, Crown, Search,
} from "lucide-react";
import Layout from "../../components/ui/Layout";
import BackButton from "../../components/ui/BackButton";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Spinner, EmptyState } from "../../components/ui/Toast";
import { api } from "../../lib/api";
import { toast } from "../../components/ui/Toast";
import { useAuthStore } from "../../store/auth";
import type { AppUser } from "../../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserManagement() {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<"security" | "admin">("security");
  const [emailError, setEmailError] = useState("");
  const [creating, setCreating] = useState(false);

  const [query, setQuery] = useState("");

  const isAdmin = me?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const { users } = await api.listUsers();
      setUsers(users);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError(t("users.emailRequired"));
      return false;
    }
    if (!EMAIL_RE.test(value.trim())) {
      setEmailError(t("users.emailInvalid"));
      return false;
    }
    setEmailError("");
    return true;
  };

  const createUser = async () => {
    if (!newUsername.trim() || !newFullName.trim()) {
      toast.error("Username and full name are required");
      return;
    }
    if (!validateEmail(newEmail)) return;
    setCreating(true);
    try {
      await api.createUser(newUsername.trim(), newFullName.trim(), newEmail.trim(), newPhone.trim() || undefined, newRole);
      toast.success(t("users.created"));
      setModalOpen(false);
      setNewUsername(""); setNewFullName(""); setNewEmail(""); setNewPhone(""); setNewRole("security");
      setEmailError("");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (user: AppUser) => {
    try {
      const { user: updated } = await api.toggleUser(user.id, !user.is_active);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(updated.is_active ? t("users.activate") : t("users.deactivate"));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(t("users.deleteSuccess"));
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <BackButton to="/dashboard" />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("users.title")}</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("users.subtitle")}</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            {t("users.addNew")}
          </Button>
        </div>

        {isAdmin && (
          <div className="card p-4 mb-5 bg-primary-50/50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <p className="text-xs text-primary-800 dark:text-primary-300">{t("users.adminCreateNote")}</p>
          </div>
        )}

        <div className="mb-5">
          <Input
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            placeholder={t("users.title")}
          />
        </div>

        {loading ? (
          <Spinner label={t("common.loading")} />
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<UsersIcon className="w-7 h-7" />}
              title={t("common.noData")}
              description={query ? "No users match your search." : undefined}
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((u) => {
              const isUserAdmin = u.role === "admin";
              const isMainAdmin = u.username.toLowerCase() === "admin" || u.id === "usr_admin_1";
              const isSelf = u.id === me?.id;
              return (
                <div
                  key={u.id}
                  className="card p-5 flex flex-col gap-4 hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isUserAdmin ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    }`}>
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{u.full_name}</h3>
                        {isMainAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Crown className="w-3 h-3 text-amber-600" /> Primary Admin
                          </span>
                        ) : isUserAdmin ? (
                          <Crown className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                        ) : null}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">@{u.username}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-success-500" : "bg-neutral-400"}`} />
                      <span className={`text-xs font-medium ${u.is_active ? "text-success-700 dark:text-success-400" : "text-neutral-400"}`}>
                        {u.is_active ? t("users.active") : t("users.inactive")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isUserAdmin
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-inset ring-primary-600/20"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    }`}>
                      {t(`roles.${u.role}`)}
                    </span>

                    <div className="flex items-center gap-1">
                      {isMainAdmin ? (
                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">
                          <Shield className="w-3 h-3 text-amber-500" /> Immutable
                        </span>
                      ) : u.must_change_password ? (
                        <span className="text-[10px] text-warning-600 dark:text-warning-400 font-medium mr-1">
                          {t("users.mustChange")}
                        </span>
                      ) : null}

                      {!isMainAdmin && !isUserAdmin && !isSelf && (
                        <>
                          <button
                            onClick={() => toggleActive(u)}
                            title={u.is_active ? t("users.deactivate") : t("users.activate")}
                            className={`p-2 rounded-lg transition-colors ${
                              u.is_active
                                ? "text-neutral-500 dark:text-neutral-400 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-600 dark:hover:text-error-400"
                                : "text-neutral-500 dark:text-neutral-400 hover:bg-success-50 dark:hover:bg-success-900/20 hover:text-success-600 dark:hover:text-success-400"
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title={t("users.delete")}
                            className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t("users.addNew")}>
          <div className="space-y-4">
            <Input
              name="newUsername"
              label={t("users.username")}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. jdoe"
              autoFocus
            />
            <Input
              name="newFullName"
              label={t("users.fullName")}
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="John Doe"
            />
            <div>
              <Input
                name="newEmail"
                label={t("users.email")}
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(newEmail)}
                icon={<Mail className="w-4 h-4" />}
                placeholder="john@selamsecurity.com"
                error={emailError || undefined}
              />
            </div>
            <Input
              name="newPhone"
              label={t("users.phone")}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
              placeholder="+251..."
            />
            {isAdmin && (
              <Select
                name="newRole"
                label={t("users.role")}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "security" | "admin")}
              >
                <option value="security">{t("roles.security")}</option>
                <option value="admin">{t("roles.admin")}</option>
              </Select>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("users.defaultPasswordNote")}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={createUser} loading={creating}>{t("common.save")}</Button>
            </div>
          </div>
        </Modal>

        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">{t("users.deleteConfirmTitle")}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t("users.deleteConfirmMessage")}</p>
            {deleteTarget && (
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-5">
                {deleteTarget.full_name} <span className="text-neutral-400 font-normal">@{deleteTarget.username}</span>
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">
                {t("common.cancel")}
              </Button>
              <Button variant="danger" onClick={confirmDelete} loading={deleting} className="flex-1">
                <Trash2 className="w-4 h-4" />
                {t("common.confirm")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
