import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Smartphone, Filter, ChevronLeft, ChevronRight, Trash2, AlertTriangle } from "lucide-react";
import Layout from "../../components/ui/Layout";
import BackButton from "../../components/ui/BackButton";
import DeviceCard from "../../components/ui/DeviceCard";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Spinner, EmptyState } from "../../components/ui/Toast";
import { api } from "../../lib/api";
import { toast } from "../../components/ui/Toast";
import type { Device, DeviceStatus } from "../../types";

const PAGE_SIZE = 12;

export default function DeviceList() {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<Device | null>(null);
  const [newStatus, setNewStatus] = useState<DeviceStatus>("active");
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listDevices({ search, status: statusFilter, page, page_size: PAGE_SIZE });
      setDevices(res.devices);
      setTotal(res.total);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const openStatusModal = (device: Device) => {
    setStatusModal(device);
    setNewStatus(device.status);
  };

  const updateStatus = async () => {
    if (!statusModal) return;
    setUpdating(true);
    try {
      const { device } = await api.updateDeviceStatus(statusModal.id, newStatus);
      setDevices((prev) => prev.map((d) => (d.id === device.id ? device : d)));
      toast.success(t("devices.updateStatus"));
      setStatusModal(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDevice(deleteTarget.id);
      setDevices((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setTotal((prev) => prev - 1);
      toast.success(t("devices.deleteSuccess"));
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout>
      <BackButton to="/dashboard" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("devices.title")}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("devices.subtitle")}</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              placeholder={t("devices.search")}
            />
          </div>
          <div className="sm:w-48">
            <Select
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("common.all")}</option>
              <option value="active">{t("status.active")}</option>
              <option value="reported_stolen">{t("status.reported_stolen")}</option>
              <option value="under_maintenance">{t("status.under_maintenance")}</option>
            </Select>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">{t("devices.total", { count: total })}</p>
      </div>

      {loading ? (
        <Spinner label={t("common.loading")} />
      ) : devices.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Smartphone className="w-7 h-7" />}
            title={t("common.noData")}
            description={t("devices.search")}
          />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((d) => (
              <div key={d.id} className="relative group card p-1 flex flex-col justify-between">
                <DeviceCard device={d} onClick={() => openStatusModal(d)} />
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-b-lg border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <button
                    onClick={(e) => { e.stopPropagation(); openStatusModal(d); }}
                    className="font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    {t("devices.updateStatus")}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }}
                    title={t("devices.delete")}
                    className="p-1.5 rounded text-neutral-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Page {page} / {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("common.back")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("common.next")}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={t("devices.updateStatus")}
      >
        {statusModal && (
          <div className="space-y-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-0.5">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{statusModal.brand} {statusModal.model}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{statusModal.serial_number}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{statusModal.owner_name}</p>
              {statusModal.registered_by_name && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t("verify.registeredBy")}: {statusModal.registered_by_name}{statusModal.registered_by_username ? ` (${statusModal.registered_by_username})` : ""}</p>
              )}
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
              <Button variant="outline" onClick={() => setStatusModal(null)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={updateStatus} loading={updating}>
                {t("common.save")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">{t("devices.deleteConfirmTitle")}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t("devices.deleteConfirmMessage")}</p>
          {deleteTarget && (
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-5">
              {deleteTarget.brand} {deleteTarget.model}
              <span className="block text-xs text-neutral-400 mt-1">{deleteTarget.owner_name}</span>
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
    </Layout>
  );
}
