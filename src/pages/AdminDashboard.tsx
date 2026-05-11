import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  CreditCard,
  Calendar,
  DollarSign,
  Menu,
  X,
  LogOut,
  Settings,
  RefreshCw,
  Users,
  Phone,
  Building2,
} from "lucide-react";
import {
  getBookings,
  getBookingStats,
  subscribeBookingUpdates,
  type RecordedBooking,
} from "../lib/adminBookingStore";

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabId = "analytics" | "payments" | "bookings" | "settings";

function formatIdr(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Seri harian untuk chart (hari terakhir `days`). */
function getDailySeries(bookings: RecordedBooking[], days: number): { date: string; count: number; revenue: number }[] {
  const end = new Date();
  const series: { date: string; count: number; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    series.push({ date: toLocalYmd(d), count: 0, revenue: 0 });
  }
  const idx = new Map(series.map((s, i) => [s.date, i]));
  for (const b of bookings) {
    const day = b.recordedAt.slice(0, 10);
    const i = idx.get(day);
    if (i !== undefined) {
      series[i].count += 1;
      series[i].revenue += Number.isFinite(b.gross_amount) ? b.gross_amount : 0;
    }
  }
  return series;
}

function BarTrendChart({
  title,
  subtitle,
  series,
  valueKey,
  formatValue,
  accentClass,
}: {
  title: string;
  subtitle: string;
  series: { date: string; count: number; revenue: number }[];
  valueKey: "count" | "revenue";
  formatValue: (n: number) => string;
  accentClass: string;
}) {
  const values = series.map((s) => s[valueKey]);
  const max = Math.max(1, ...values);

  return (
    <div className="bg-white rounded-xl p-6 border border-surface-dark shadow-sm">
      <h3 className="font-display font-bold text-lg text-primary mb-1">{title}</h3>
      <p className="text-text-light text-sm mb-6">{subtitle}</p>
      <div className="flex items-end justify-between gap-1 h-52 px-1">
        {series.map((s) => {
          const v = s[valueKey];
          const pct = (v / max) * 100;
          return (
            <div key={s.date} className="flex-1 min-w-0 flex flex-col items-center gap-2">
              <div className="relative w-full max-w-[28px] mx-auto flex flex-col justify-end h-40">
                <div
                  className={`w-full rounded-t-md transition-all ${accentClass} ${v === 0 ? "opacity-25" : "opacity-100 shadow-md"}`}
                  style={{ height: `${Math.max(v === 0 ? 0 : 8, pct)}%` }}
                  title={`${s.date}: ${formatValue(v)}`}
                />
              </div>
              <span className="text-[9px] font-medium text-text-light tabular-nums leading-none text-center w-full truncate">
                {s.date.slice(8)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-text-light mt-4 text-center">Sumbu X: tanggal (bulan berjalan)</p>
    </div>
  );
}

function LineRevenueChart({ series }: { series: { date: string; count: number; revenue: number }[] }) {
  const w = 100;
  const h = 48;
  const values = series.map((s) => s.revenue);
  const max = Math.max(1, ...values);
  const linePoints = series
    .map((s, i) => {
      const x = series.length <= 1 ? w / 2 : (i / (series.length - 1)) * w;
      const y = h - (s.revenue / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const fillPoints = `0,${h} ${linePoints} ${w},${h}`;

  return (
    <div className="bg-white rounded-xl p-6 border border-surface-dark shadow-sm">
      <h3 className="font-display font-bold text-lg text-primary mb-1">Kurva pendapatan</h3>
      <p className="text-text-light text-sm mb-4">Total harian dari pembayaran tercatat (14 hari)</p>
      <div className="relative h-40 w-full">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="adminRevFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4A574" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon fill="url(#adminRevFill)" points={fillPoints} />
          <polyline
            fill="none"
            stroke="#C19652"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={linePoints}
          />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-text-light mt-2 font-medium">
        <span>{series[0]?.date.slice(5) ?? "—"}</span>
        <span>{series[series.length - 1]?.date.slice(5) ?? "—"}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => subscribeBookingUpdates(refresh), [refresh]);

  const bookings = getBookings();
  const stats = getBookingStats();
  const series14 = getDailySeries(bookings, 14);

  const menuItems: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "payments", label: "Pembayaran", icon: CreditCard },
    { id: "bookings", label: "Data Booking", icon: Calendar },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-surface-dark sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-surface rounded-lg transition-colors lg:hidden shrink-0"
              aria-label="Menu"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
            </button>
            <img src="/images/logo.png" alt="" className="w-9 h-9 object-contain rounded-lg ring-1 ring-accent/30 shrink-0 hidden sm:block" />
            <h1 className="font-display font-bold text-lg sm:text-xl text-primary truncate">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-dark hover:bg-surface text-primary text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 top-[57px] z-30 w-64 bg-white border-r border-surface-dark min-h-[calc(100vh-57px)] lg:static lg:translate-x-0 lg:opacity-100 lg:top-auto lg:min-h-[calc(100vh-57px)] lg:sticky lg:self-start lg:top-[57px] flex flex-col"
            >
              <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        if (typeof window !== "undefined" && window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                        active ? "bg-primary text-white shadow-md" : "hover:bg-surface text-text"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${active ? "text-accent" : "text-text-light"}`} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-primary-dark/50 lg:hidden top-[57px]"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 min-h-[calc(100vh-57px)] relative z-10 lg:z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "analytics" && <AnalyticsSection stats={stats} bookings={bookings} series14={series14} />}
              {activeTab === "payments" && <PaymentsSection bookings={bookings} />}
              {activeTab === "bookings" && <BookingsDataSection bookings={bookings} />}
              {activeTab === "settings" && <SettingsSection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function AnalyticsSection({
  stats,
  bookings,
  series14,
}: {
  stats: { count: number; revenue: number };
  bookings: RecordedBooking[];
  series14: { date: string; count: number; revenue: number }[];
}) {
  const recent = bookings.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-primary mb-1">Analytics Overview</h2>
        <p className="text-text-light text-sm">Ringkasan booking dan pendapatan Wolio Hills</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-surface-dark shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <span className="text-xs font-medium text-text-light bg-surface px-2 py-1 rounded">Kumulatif</span>
          </div>
          <p className="text-3xl font-display font-black text-primary tabular-nums">{stats.count}</p>
          <p className="text-sm text-text-light mt-1">Total booking</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-6 border border-surface-dark shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center ring-1 ring-accent/40">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-text-light bg-surface px-2 py-1 rounded">Kumulatif</span>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-primary tabular-nums">{formatIdr(stats.revenue)}</p>
          <p className="text-sm text-text-light mt-1">Total pendapatan</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarTrendChart
          title="Tren booking"
          subtitle="Jumlah transaksi sukses per hari (14 hari terakhir)"
          series={series14}
          valueKey="count"
          formatValue={(n) => `${n} booking`}
          accentClass="bg-primary"
        />
        <BarTrendChart
          title="Pendapatan harian"
          subtitle="Nominal per hari (14 hari terakhir)"
          series={series14}
          valueKey="revenue"
          formatValue={(n) => formatIdr(n)}
          accentClass="bg-accent"
        />
      </div>

      <LineRevenueChart series={series14} />

      <div className="bg-white rounded-xl border border-surface-dark shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-dark flex items-center justify-between">
          <h3 className="font-bold text-lg text-primary">Booking terbaru</h3>
        </div>
        {recent.length === 0 ? (
          <p className="text-text-light text-sm text-center py-12 px-6">Belum ada data booking.</p>
        ) : (
          <ul className="divide-y divide-surface-dark">
            {recent.map((b) => (
              <li key={b.order_id + b.recordedAt} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4 hover:bg-surface/60">
                <div>
                  <p className="font-semibold text-primary">{b.guestName}</p>
                  <p className="text-xs text-text-light font-mono">{b.order_id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-text-light">
                  <span>
                    {b.checkIn} → {b.checkOut}
                  </span>
                  <span className="font-display font-bold text-accent">{formatIdr(b.gross_amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PaymentsSection({ bookings }: { bookings: RecordedBooking[] }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-primary mb-1">Manajemen Pembayaran</h2>
        <p className="text-text-light text-sm">Monitor transaksi pembayaran sukses</p>
      </div>

      <div className="bg-white rounded-xl border border-surface-dark shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-dark flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-lg text-primary">Transaksi terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-xs font-medium text-text uppercase tracking-wider">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-text-light">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.order_id + b.recordedAt} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-primary">#{b.order_id.slice(-12)}</td>
                    <td className="px-6 py-4 text-text">{b.guestName}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{formatIdr(b.gross_amount)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                        {b.transaction_status || "completed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-light text-xs whitespace-nowrap">{formatWhen(b.recordedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BookingsDataSection({ bookings }: { bookings: RecordedBooking[] }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-primary mb-1">Data Booking</h2>
        <p className="text-text-light text-sm">Detail reservasi dari pembayaran tercatat</p>
      </div>

      <div className="bg-white rounded-xl border border-surface-dark shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="bg-primary text-white text-left text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Tamu</th>
                <th className="px-4 py-3 font-semibold">Kontak</th>
                <th className="px-4 py-3 font-semibold">Check-in / out</th>
                <th className="px-4 py-3 font-semibold">Properti</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold">Waktu bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-text-light">
                    Belum ada data booking.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.order_id + b.recordedAt} className="hover:bg-surface/50 transition-colors align-top">
                    <td className="px-4 py-3 font-mono text-xs text-primary font-medium max-w-[140px] break-all">{b.order_id}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-text-light shrink-0" />
                        {b.guestName}
                      </span>
                      <span className="text-xs text-text-light block mt-0.5">{b.guestEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-text-light text-xs">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {b.guestPhone || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text whitespace-nowrap">
                      {b.checkIn}
                      <span className="text-text-light mx-1">→</span>
                      {b.checkOut}
                    </td>
                    <td className="px-4 py-3 text-text max-w-[180px]">
                      <span className="flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-text-light shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{b.propertyName || "—"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold text-primary whitespace-nowrap">{formatIdr(b.gross_amount)}</td>
                    <td className="px-4 py-3 text-text-light text-xs whitespace-nowrap">{formatWhen(b.recordedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="font-display font-bold text-2xl text-primary">Pengaturan</h2>
      <div className="bg-white rounded-xl border border-surface-dark shadow-sm p-8 space-y-4 text-sm text-text-light leading-relaxed">
        <p>
          Kredensial admin: <span className="font-mono text-xs text-primary">src/data/adminData.json</span> (demo — produksi wajib backend).
        </p>
        <p>
          Booking &amp; pendapatan diambil dari <span className="font-semibold text-primary">localStorage</span> setelah pembayaran Midtrans sukses.
        </p>
      </div>
    </div>
  );
}
