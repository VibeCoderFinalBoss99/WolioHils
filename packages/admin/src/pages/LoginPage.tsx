import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { m } from "motion/react";
import { Eye, EyeOff, Key, Lock, Mail, LayoutDashboard } from "lucide-react";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const FAIL_KEY = "wolio_admin_login_fails";
const LOCK_KEY = "wolio_admin_lock_until";
const MAX_FAILS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function getLockUntil(): number {
  try {
    return Number(localStorage.getItem(LOCK_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

function getFails(): number {
  try {
    return Number(localStorage.getItem(FAIL_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

function setFails(n: number) {
  try {
    localStorage.setItem(FAIL_KEY, String(n));
  } catch {
    /* */
  }
}

function setLockUntil(ts: number) {
  try {
    localStorage.setItem(LOCK_KEY, String(ts));
  } catch {
    /* */
  }
}

function clearLockState() {
  try {
    localStorage.removeItem(FAIL_KEY);
    localStorage.removeItem(LOCK_KEY);
  } catch {
    /* */
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading: authLoading } = useAuth(); // ✅ tambah session
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // ✅ Redirect ke dashboard jika sudah login sebagai admin
  useEffect(() => {
    if (authLoading) return;
    if (session && isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, session, isAdmin, navigate]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // ✅ Tampilkan loading screen saat sesi sedang dicek
  // Ini mencegah form login muncul sebentar sebelum redirect
  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-text font-sans">
        Memuat sesi…
      </div>
    );
  }

  const lockUntil = getLockUntil();
  const locked = now < lockUntil;
  const remainingSec = locked ? Math.ceil((lockUntil - now) / 1000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (locked) {
      setError(`Terlalu banyak percobaan. Coba lagi dalam ${remainingSec} d.`);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabase();
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr || !data.user) {
        const fails = getFails() + 1;
        setFails(fails);
        if (fails >= MAX_FAILS) {
          setLockUntil(Date.now() + LOCKOUT_MS);
          setFails(0);
          setError(`Terkunci 5 menit setelah ${MAX_FAILS}x gagal.`);
        } else {
          setError(`Email atau password salah. (${fails}/${MAX_FAILS})`);
        }
        return;
      }

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profErr || (profile as { role?: string } | null)?.role !== "admin") {
        await supabase.auth.signOut();
        const fails = getFails() + 1;
        setFails(fails);
        if (fails >= MAX_FAILS) {
          setLockUntil(Date.now() + LOCKOUT_MS);
          setFails(0);
          setError("Akses ditolak. Akun bukan admin. Terkunci 5 menit.");
        } else {
          setError(`Akses ditolak — bukan admin. (${fails}/${MAX_FAILS})`);
        }
        return;
      }

      clearLockState();
      // ✅ Tidak perlu navigate manual — useEffect di atas akan handle
      // setelah AuthContext update session & isAdmin
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-surface border border-surface-dark rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-6 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute top-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[150px]" />
      <div className="w-full max-w-md relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-deep p-8 md:p-10 gold-border"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <h1 className="font-display font-bold text-primary text-2xl mb-2">Admin Wolio Hills</h1>
            <p className="text-text-light text-sm">Masuk dengan akun Supabase (role admin)</p>
          </div>

          {locked && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-950">
              Akun terkunci sementara. Tunggu <strong>{remainingSec}</strong> detik.
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
                disabled={locked || submitting}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                <Key className="w-3.5 h-3.5" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  required
                  disabled={locked || submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-primary"
                  aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <m.button
              type="submit"
              disabled={locked || submitting}
              whileHover={{ scale: locked ? 1 : 1.02 }}
              whileTap={{ scale: locked ? 1 : 0.98 }}
              className="w-full bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Lock className="w-4 h-4" />
              {submitting ? "Memproses…" : "Masuk"}
            </m.button>
          </form>
        </m.div>
      </div>
    </div>
  );
}
