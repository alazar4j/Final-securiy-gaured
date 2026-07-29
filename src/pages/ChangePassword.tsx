import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Lock, KeyRound } from "lucide-react";
import Layout from "../components/ui/Layout";
import BackButton from "../components/ui/BackButton";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { toast, ErrorBanner } from "../components/ui/Toast";
import { api } from "../lib/api";

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError(t("changePassword.mismatch"));
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(current, next);
      toast.success(t("changePassword.success"));
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <BackButton to="/dashboard" />
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("changePassword.title")}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("changePassword.subtitle")}</p>
        </div>
        <div className="card p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <ErrorBanner message={error} />
            <Input
              name="current"
              type="password"
              label={t("changePassword.current")}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              autoFocus
              required
            />
            <Input
              name="new"
              type="password"
              label={t("changePassword.new")}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              icon={<KeyRound className="w-4 h-4" />}
              required
            />
            <Input
              name="confirm"
              type="password"
              label={t("changePassword.confirm")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              icon={<KeyRound className="w-4 h-4" />}
              required
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              {t("common.save")}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
