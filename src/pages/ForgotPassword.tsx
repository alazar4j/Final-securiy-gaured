import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { User, KeyRound, ArrowLeft, MailCheck } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { toast, ErrorBanner } from "../components/ui/Toast";
import { api } from "../lib/api";

type Step = "request" | "reset";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [identity, setIdentity] = useState("");
  const [dispatchedEmail, setDispatchedEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(identity.trim());
      setDispatchedEmail(res.email || identity.trim());
      setStep("reset");
      toast.success(res.message || t("forgot.emailSent"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("forgot.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(identity.trim(), otp.trim(), newPassword);
      toast.success(t("forgot.success"));
      navigate("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("forgot.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("forgot.subtitle")}</p>
      </div>

      {step === "request" ? (
        <form onSubmit={onRequestOtp} className="space-y-4">
          <ErrorBanner message={error} />
          <Input
            name="identity"
            label="Username or Registered Email"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            icon={<User className="w-4 h-4" />}
            placeholder="e.g. security1 or user@selamsecurity.edu.et"
            autoFocus
            required
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t("forgot.requestOtp")}
          </Button>
        </form>
      ) : (
        <form onSubmit={onReset} className="space-y-4">
          <div className="px-4 py-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300 text-sm space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <MailCheck className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <p>Recovery email dispatched!</p>
            </div>
            <p className="text-xs opacity-90">
              A 6-digit recovery code has been sent to <span className="font-medium">{dispatchedEmail}</span>. Please check your inbox and enter the code below.
            </p>
          </div>
          <ErrorBanner message={error} />
          <Input
            name="otp"
            label={t("forgot.otp")}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            icon={<KeyRound className="w-4 h-4" />}
            placeholder="123456"
            autoFocus
            required
          />
          <Input
            name="newPassword"
            type="password"
            label={t("forgot.newPassword")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            name="confirmPassword"
            type="password"
            label={t("forgot.confirmNewPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t("forgot.reset")}
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("forgot.backToLogin")}
      </Link>
    </AuthShell>
  );
}
