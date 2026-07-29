import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { QrCode, Hash, Search, AlertTriangle, Phone, User, Smartphone, Palette, Calendar, ShieldCheck, Edit2 } from "lucide-react";
import Layout from "../components/ui/Layout";
import BackButton from "../components/ui/BackButton";
import QRScanner from "../components/ui/QRScanner";
import DeviceCard from "../components/ui/DeviceCard";
import StatusBadge from "../components/ui/StatusBadge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import { EmptyState, toast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { getDeviceImageUrl } from "../lib/imageUpload";
import type { Device, DeviceStatus, VerifyResult } from "../types";

type Method = "qr" | "serial" | "name";

export default function VerifyDevice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("qr");
  const [serial, setSerial] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [selected, setSelected] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLookup, setLastLookup] = useState<{ method: Method; value: string } | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<DeviceStatus>("active");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleUpdateStatus = async () => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      const { device: updated } = await api.updateDeviceStatus(selected.id, newStatus);
      setSelected(updated);
      if (result) {
        setResult({
          ...result,
          devices: result.devices.map((d) => (d.id === updated.id ? updated : d)),
        });
      }
      toast.success(t("devices.updateStatus"));
      setStatusModalOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const runVerify = async (m: Method, value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelected(null);
    setLastLookup({ method: m, value });
    try {
      const res = await api.verify(m, value.trim());
      setResult(res);
      if (res.found && res.devices.length === 1) setSelected(res.devices[0]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onQrScanned = (decoded: string) => {
    runVerify("qr", decoded);
  };

  const tabs: { key: Method; label: string; icon: typeof QrCode }[] = [
    { key: "qr", label: t("verify.scanQr"), icon: QrCode },
    { key: "serial", label: t("verify.enterSerial"), icon: Hash },
    { key: "name", label: t("verify.searchByName"), icon: Search },
  ];

  const imageUrl = getDeviceImageUrl(selected?.image_path || null);

  return (
    <Layout>
      <BackButton to="/dashboard" />
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("verify.title")}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("verify.subtitle")}</p>
        </div>

        {/* Method tabs */}
        <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-6 w-full sm:w-auto sm:inline-flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setMethod(tab.key); setResult(null); setSelected(null); setError(null); }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  method === tab.key ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-300 shadow-sm" : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="card p-6 mb-6">
          {method === "qr" && <QRScanner onResult={onQrScanned} />}
          {method === "serial" && (
            <form
              onSubmit={(e) => { e.preventDefault(); runVerify("serial", serial); }}
              className="space-y-3"
            >
              <Input
                name="serial"
                label={t("verify.enterSerial")}
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                icon={<Hash className="w-4 h-4" />}
                placeholder="SN-123456"
                autoFocus
              />
              <Button type="submit" loading={loading} fullWidth>
                <Search className="w-4 h-4" />
                {t("verify.lookup")}
              </Button>
            </form>
          )}
          {method === "name" && (
            <form
              onSubmit={(e) => { e.preventDefault(); runVerify("name", name); }}
              className="space-y-3"
            >
              <Input
                name="name"
                label={t("verify.searchByName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                placeholder="John Doe"
                autoFocus
              />
              <Button type="submit" loading={loading} fullWidth>
                <Search className="w-4 h-4" />
                {t("verify.lookup")}
              </Button>
            </form>
          )}
        </div>

        {error && (
          <div className="card p-4 mb-6 bg-error-50 border-error-200">
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {result.found ? (
              <>
                {result.devices.length > 1 && (
                  <div className="card p-4">
                    <p className="text-sm font-medium text-neutral-700 mb-3">
                      {t("verify.matchesFound", { count: result.devices.length })}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {result.devices.map((d) => (
                        <DeviceCard key={d.id} device={d} onClick={() => setSelected(d)} />
                      ))}
                    </div>
                  </div>
                )}

                {selected && (
                  <div className="card overflow-hidden animate-scale-in">
                    <div className="px-5 py-4 bg-success-50 border-b border-success-200 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-success-600" />
                      <p className="font-semibold text-success-800">{t("verify.result")}: {t("results.found")}</p>
                    </div>
                    <div className="p-5">
                      <div className="grid md:grid-cols-[200px_1fr] gap-5">
                        {imageUrl ? (
                          <img src={imageUrl} alt={selected.brand} className="w-full h-48 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700" />
                        ) : (
                          <div className="w-full h-48 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Smartphone className="w-10 h-10 text-neutral-400" />
                          </div>
                        )}
                        <div className="space-y-4">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{selected.brand} {selected.model}</h3>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{selected.serial_number}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={selected.status} />
                              <button
                                onClick={() => {
                                  setNewStatus(selected.status);
                                  setStatusModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors text-xs flex items-center gap-1 font-medium"
                                title={t("devices.updateStatus")}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-primary-600" />
                                <span>{t("devices.updateStatus")}</span>
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("verify.owner")}</p>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">{selected.owner_name}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t(`register.${selected.owner_role === "student" ? "student" : "staff"}`)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("verify.phone")}</p>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">{selected.owner_phone}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("verify.color")}</p>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">{selected.color || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("verify.registeredOn")}</p>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">{new Date(selected.registered_at).toLocaleDateString()}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("verify.registeredBy")}</p>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {selected.registered_by_name || selected.registered_by_username || "—"}
                                {selected.registered_by_name && selected.registered_by_username
                                  ? ` (${selected.registered_by_username})`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card p-8 border-error-200">
                <EmptyState
                  icon={<AlertTriangle className="w-7 h-7 text-error-500" />}
                  title={t("verify.notFound")}
                  description={t("verify.notFoundDesc")}
                />
                {result.offer_register && lastLookup && (
                  <div className="mt-4 flex flex-col items-center gap-3">
                    <p className="text-sm font-medium text-neutral-700">{t("verify.offerRegister")}</p>
                    <Button onClick={() => navigate("/register", { state: { presetSerial: lastLookup.method === "serial" ? lastLookup.value : undefined } })}>
                      {t("verify.goRegister")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} title={t("devices.updateStatus")}>
        {selected && (
          <div className="space-y-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-0.5">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selected.brand} {selected.model}</p>
              <p className="text-xs text-neutral-500 font-mono">{selected.serial_number}</p>
            </div>
            <Select
              name="newStatus"
              label={t("verify.status")}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as DeviceStatus)}
            >
              <option value="active">{t("status.active")}</option>
              <option value="reported_stolen">{t("status.reported_stolen")}</option>
              <option value="under_maintenance">{t("status.under_maintenance")}</option>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdateStatus} loading={updatingStatus}>
                {t("common.save")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
