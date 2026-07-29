import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock } from "lucide-react";
import { useAuthStore } from "../store/auth";
import AuthShell from "../components/auth/AuthShell";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { toast, ErrorBanner } from "../components/ui/Toast";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      toast.success(t("dashboard.welcome", { name: user.full_name }));
      navigate("/dashboard");
    } catch (err) {
      setError(t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("login.title")}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("login.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Input
          name="username"
          label={t("login.username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder=""
          icon={<User className="w-4 h-4" />}
          autoFocus
          required
        />
        <Input
          name="password"
          type="password"
          label={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••"
          icon={<Lock className="w-4 h-4" />}
          required
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700">
            {t("login.forgotPassword")}
          </Link>
        </div>
        <Button type="submit" fullWidth size="lg" loading={loading}>
          {t("login.signIn")}
        </Button>
      </form>

    </AuthShell>
  );
}
