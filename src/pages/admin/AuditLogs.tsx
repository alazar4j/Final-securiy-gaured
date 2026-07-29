import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollText, Filter, ChevronLeft, ChevronRight, Search, User, Smartphone } from "lucide-react";
import Layout from "../../components/ui/Layout";
import BackButton from "../../components/ui/BackButton";
import { Select } from "../../components/ui/Input";
import { Spinner, EmptyState } from "../../components/ui/Toast";
import Button from "../../components/ui/Button";
import { api } from "../../lib/api";
import type { AuditLog, AuditEventType, AuditResult } from "../../types";

const PAGE_SIZE = 25;

const resultColors: Record<AuditResult, string> = {
  found: "bg-success-50 text-success-700 ring-success-600/20",
  success: "bg-success-50 text-success-700 ring-success-600/20",
  created: "bg-primary-50 text-primary-700 ring-primary-600/20",
  not_found: "bg-error-50 text-error-700 ring-error-600/20",
  failure: "bg-error-50 text-error-700 ring-error-600/20",
};

const eventTypes: AuditEventType[] = [
  "scan_qr", "lookup_serial", "lookup_name", "register", "update_status",
  "login", "logout", "failed_login", "forgot_password_otp", "password_reset", "unknown_device_prompt", "delete_device",
];

const results: AuditResult[] = ["found", "not_found", "success", "failure", "created"];

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listAudit({
        event_type: eventFilter || undefined,
        result: resultFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [eventFilter, resultFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [eventFilter, resultFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDetails = (details: Record<string, unknown> | null): string => {
    if (!details) return "—";
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(", ");
  };

  const getDetail = (log: AuditLog, key: string): string | null => {
    if (!log.details) return null;
    const val = (log.details as Record<string, unknown>)[key];
    return val != null ? String(val) : null;
  };

  return (
    <Layout>
      <BackButton to="/dashboard" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("audit.title")}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("audit.subtitle")}</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select name="event" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
              <option value="">{t("audit.filterEvent")}</option>
              {eventTypes.map((e) => (
                <option key={e} value={e}>{t(`events.${e}`)}</option>
              ))}
            </Select>
          </div>
          <div className="sm:w-48">
            <Select name="result" value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
              <option value="">{t("audit.filterResult")}</option>
              {results.map((r) => (
                <option key={r} value={r}>{t(`results.${r}`)}</option>
              ))}
            </Select>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">{total} {t("audit.title").toLowerCase()}</p>
      </div>

      {loading ? (
        <Spinner label={t("common.loading")} />
      ) : error ? (
        <div className="card">
          <EmptyState icon={<ScrollText className="w-7 h-7" />} title={error} />
        </div>
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ScrollText className="w-7 h-7" />} title={t("common.noData")} />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                  <tr className="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="px-4 py-3">{t("audit.eventType")}</th>
                    <th className="px-4 py-3">{t("audit.actor")}</th>
                    <th className="px-4 py-3">{t("audit.lookupValue")}</th>
                    <th className="px-4 py-3">{t("verify.owner")}</th>
                    <th className="px-4 py-3">{t("audit.result")}</th>
                    <th className="px-4 py-3">{t("audit.time")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {logs.map((log) => {
                    const ownerName = getDetail(log, "owner_name");
                    const deviceName = getDetail(log, "device_name");
                    return (
                    <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{t(`events.${log.event_type}`)}</span>
                        {deviceName && (
                          <span className="block text-xs text-neutral-400 mt-0.5">{deviceName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{log.actor_username || "—"}</td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 font-mono text-xs">{log.lookup_value || "—"}</td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 text-sm">{ownerName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${resultColors[log.result]}`}>
                          {t(`results.${log.result}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => {
              const ownerName = getDetail(log, "owner_name");
              const deviceName = getDetail(log, "device_name");
              return (
              <div key={log.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{t(`events.${log.event_type}`)}</p>
                    {deviceName && <p className="text-xs text-neutral-400 mt-0.5">{deviceName}</p>}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${resultColors[log.result]}`}>
                    {t(`results.${log.result}`)}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <p><span className="font-medium text-neutral-700 dark:text-neutral-300">{t("audit.actor")}:</span> {log.actor_username || "—"}</p>
                  {log.lookup_value && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">{t("audit.lookupValue")}:</span> <span className="font-mono">{log.lookup_value}</span></p>}
                  {ownerName && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">{t("verify.owner")}:</span> {ownerName}</p>}
                  <p><span className="font-medium text-neutral-700 dark:text-neutral-300">{t("audit.time")}:</span> {new Date(log.created_at).toLocaleString()}</p>
                  {log.details && <p className="text-neutral-400 mt-1">{formatDetails(log.details)}</p>}
                </div>
              </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Page {page} / {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" /> {t("common.back")}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t("common.next")} <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
