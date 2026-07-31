import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollText, Filter, ChevronLeft, ChevronRight, Search, User, Smartphone, Download, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Layout from "../../components/ui/Layout";
import BackButton from "../../components/ui/BackButton";
import OptionPicker from "../../components/ui/OptionPicker";
import { Spinner, EmptyState, toast } from "../../components/ui/Toast";
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
  const [chartData, setChartData] = useState<{ date: string; registrations: number; verifications: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

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

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await api.getAuditCharts();
        // Keep the dates formatted nicely for display (e.g. MM/DD)
        const formatted = res.chartData.map(d => {
          const dateParts = d.date.split("-");
          return {
            ...d,
            displayDate: `${dateParts[1]}/${dateParts[2]}` // MM/DD
          };
        });
        setChartData(formatted);
      } catch (err) {
        console.error("Failed to load chart data", err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, []);

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

  const handleExportCSV = async () => {
    try {
      const res = await api.listAudit({
        event_type: eventFilter || undefined,
        result: resultFilter || undefined,
        page: 1,
        page_size: 999999,
      });
      
      const allLogs = res.logs;
      const headers = ["ID", "Date", "Event", "Actor ID", "Actor Username", "Target Device ID", "Lookup Value", "Result", "Details"];
      
      const rows = allLogs.map(log => [
        log.id,
        new Date(log.created_at).toLocaleString(),
        t(`events.${log.event_type}`),
        log.actor_id || "",
        log.actor_username || "",
        log.target_device_id || "",
        log.lookup_value || "",
        t(`results.${log.result}`),
        formatDetails(log.details)
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Layout>
      <BackButton to="/dashboard" />
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("audit.title")}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("audit.subtitle")}</p>
        </div>
        <Button onClick={handleExportCSV} disabled={total === 0 || loading} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          {t("audit.exportCsv") || "Export CSV"}
        </Button>
      </div>

      <div className="card p-4 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-500" />
          {t("audit.activity30Days") || "Activity Last 30 Days"}
        </h2>
        <div className="h-64 w-full">
          {chartLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Spinner />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12, fill: '#737373' }}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#171717', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  name={t("audit.verifications") || "Verifications (Scans)"}
                  type="monotone" 
                  dataKey="verifications" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  name={t("audit.registrations") || "Registrations"}
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-neutral-500">
              No data available
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <OptionPicker
              title={t("audit.filterEvent")}
              placeholder={t("audit.filterEvent")}
              value={eventFilter}
              onChange={(val) => setEventFilter(val)}
              icon={<Filter className="w-4 h-4" />}
              searchable={true}
              options={[
                { value: "", label: `${t("common.all")} (${t("audit.filterEvent")})` },
                ...eventTypes.map((e) => ({
                  value: e,
                  label: t(`events.${e}`),
                })),
              ]}
            />
          </div>
          <div className="sm:w-60">
            <OptionPicker
              title={t("audit.filterResult")}
              placeholder={t("audit.filterResult")}
              value={resultFilter}
              onChange={(val) => setResultFilter(val)}
              icon={<Filter className="w-4 h-4" />}
              options={[
                { value: "", label: `${t("common.all")} (${t("audit.filterResult")})` },
                ...results.map((r) => ({
                  value: r,
                  label: t(`results.${r}`),
                })),
              ]}
            />
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
