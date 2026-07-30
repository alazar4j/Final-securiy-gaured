import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "./store/auth";
import { ToastContainer } from "./components/ui/Toast";
import ProtectedRoute from "./components/ui/ProtectedRoute";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import RegisterDevice from "./pages/RegisterDevice";
import { lazy, Suspense } from "react";
import { Spinner } from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import DeviceList from "./pages/admin/DeviceList";
import AuditLogs from "./pages/admin/AuditLogs";
import UserManagement from "./pages/admin/UserManagement";

const VerifyDevice = lazy(() => import("./pages/VerifyDevice"));

function AppRoutes() {
  const { i18n } = useTranslation();
  const { user, initialized, fetchMe } = useAuthStore();

  useEffect(() => {
    if (!initialized) fetchMe();
  }, [initialized, fetchMe]);

  useEffect(() => {
    const savedLang = localStorage.getItem("app_language");
    const targetLang = savedLang === "am" || savedLang === "en" ? savedLang : user?.language || "en";
    if (targetLang && i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang);
      document.documentElement.lang = targetLang;
    }
    if (user && savedLang && (savedLang === "am" || savedLang === "en") && user.language !== savedLang) {
      useAuthStore.getState().setLanguage(savedLang as "en" | "am");
    }
  }, [user, i18n]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute><RegisterDevice /></ProtectedRoute>} />
      <Route path="/verify" element={<ProtectedRoute><Suspense fallback={<Spinner label="" />}><VerifyDevice /></Suspense></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

      <Route path="/admin/devices" element={<ProtectedRoute adminOnly><DeviceList /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
