import React, { useState } from "react";
import { m } from "motion/react";
import { Eye, EyeOff, Key, Lock, User, LayoutDashboard } from "lucide-react";
import type { PageName } from "../App";

interface AdminLoginPageProps {
  onLogin: (success: boolean) => void;
  navigate: (page: PageName) => void;
}

export default function AdminLoginPage({ onLogin, navigate }: AdminLoginPageProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const adminUser = import.meta.env.VITE_ADMIN_USERNAME ?? "";
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

    setTimeout(() => {
      if (!adminUser || !adminPass) {
        setError("Admin belum dikonfigurasi: set VITE_ADMIN_USERNAME dan VITE_ADMIN_PASSWORD di .env");
        setIsLoading(false);
        return;
      }
      if (credentials.username === adminUser && credentials.password === adminPass) {
        onLogin(true);
      } else {
        setError("Username atau password salah");
      }
      setIsLoading(false);
    }, 400);
  };

  const inputClass = "w-full bg-surface border border-surface-dark rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div aria-hidden className="pointer-events-none absolute top-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[150px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8"
        >
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:border-accent/40 hover:bg-accent/10"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
              Kembali ke dashboard
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center ring-2 ring-accent/40"
            >
              <Key className="h-10 w-10 text-accent" strokeWidth={2} aria-hidden />
            </m.div>
            <h1 className="font-display font-black text-primary text-3xl mb-2">Admin Login</h1>
            <p className="text-text-light text-sm">Masuk ke dashboard administrasi Wolio Hills</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className={`${inputClass} pl-10`}
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-text text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className={`${inputClass} pl-10 pr-10`}
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <m.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-error/10 border border-error/30 rounded-lg p-3 text-error text-sm"
              >
                {error}
              </m.div>
            )}

            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold text-sm tracking-wider uppercase px-6 py-3.5 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Login"}
            </m.button>
          </form>
        </m.div>
      </div>
    </div>
  );
}
