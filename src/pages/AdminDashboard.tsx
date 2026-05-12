import { useCallback, useEffect, useId, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import {
  BarChart3,
  CreditCard,
  Calendar,
  DollarSign,
  LogOut,
  RefreshCw,
  Users,
  Phone,
  Building2,
  Download,
  LineChart,
  Layers,
} from "lucide-react";
import {
  deriveBookingStats,
  fetchAllBookingsSorted,
  subscribeBookingUpdates,
  type PaymentUiStatus,
  type RecordedBooking,
} from "../lib/adminBookingStore";

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabId = "analytics" | "payments" | "bookings";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

type TimeRangePreset = "1d" | "1w" | "1m" | "1y" | "all";

type PaymentStatusFilter = "all" | PaymentUiStatus;

const TIME_RANGE_OPTIONS: { value: TimeRangePreset; label: string }[] = [
  { value: "1d", label: "1 hari" },
  { value: "1w", label: "1 minggu" },
  { value: "1m", label: "1 bulan" },
  { value: "1y", label: "1 tahun" },
  { value: "all", label: "Semua waktu" },
];

const PAYMENT_STATUS_FILTER_OPTIONS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "berhasil", label: "Berhasil" },
  { value: "pending", label: "Pending" },
  { value: "gagal", label: "Gagal" },
  { value: "dibatalkan", label: "Cancel" },
];

function bookingTimeMs(b: RecordedBooking): number {
  const t = new Date(b.recordedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

function getTimeRangeCutoffMs(preset: Exclude<TimeRangePreset, "all">): number {
  const MS_DAY = 86_400_000;
  const now = Date.now();
  switch (preset) {
    case "1d":
      return now - MS_DAY;
    case "1w":
      return now - 7 * MS_DAY;
    case "1m":
      return now - 30 * MS_DAY;
    case "1y":
      return now - 365 * MS_DAY;
  }
}

function filterBookingsByTimeRange(bookings: RecordedBooking[], preset: TimeRangePreset): RecordedBooking[] {
  if (preset === "all") return bookings;
  const cutoff = getTimeRangeCutoffMs(preset);
  return bookings.filter((b) => bookingTimeMs(b) >= cutoff);
}

function trendDaysForPreset(preset: TimeRangePreset): number {
  switch (preset) {
    case "1d":
      return 1;
    case "1w":
      return 7;
    case "1m":
      return 30;
    case "1y":
      return 365;
    case "all":
      return 0;
  }
}

/** Satu bucket per hari kalender dari `start` sampai `end` (inklusif, jam 00:00 lokal). */
function getDailySeriesFromStartEnd(
  bookings: RecordedBooking[],
  start: Date,
  end: Date
): { date: string; count: number; revenue: number }[] {
  const series: { date: string; count: number; revenue: number }[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  if (cur > endDay) return [{ date: toLocalYmd(endDay), count: 0, revenue: 0 }];
  while (cur <= endDay) {
    series.push({ date: toLocalYmd(new Date(cur)), count: 0, revenue: 0 });
    cur.setDate(cur.getDate() + 1);
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

/** Seri harian mengikuti rentang waktu (rolling untuk 1d–1y; rentang penuh untuk all, dibatasi 730 hari). */
function getDailySeriesForTimeRange(bookings: RecordedBooking[], preset: TimeRangePreset): { date: string; count: number; revenue: number }[] {
  if (preset !== "all") {
    const days = trendDaysForPreset(preset);
    return getDailySeries(bookings, Math.max(1, days));
  }
  const times = bookings.map(bookingTimeMs).filter((t) => t > 0);
  if (times.length === 0) return getDailySeries(bookings, 1);
  const minMs = Math.min(...times);
  const start = new Date(minMs);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const span = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const MAX = 730;
  if (span > MAX) {
    const cappedStart = new Date(end.getTime() - (MAX - 1) * 86_400_000);
    cappedStart.setHours(0, 0, 0, 0);
    return getDailySeriesFromStartEnd(bookings, cappedStart, end);
  }
  return getDailySeriesFromStartEnd(bookings, start, end);
}

function slicePage<T>(items: T[], page: number, pageSize: number): T[] {
  const p = Math.max(1, page);
  const start = (p - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPagesFor(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

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

type TrendMetric = "count" | "revenue";
type TrendChartKind = "bar" | "line" | "area";

function paymentStatusLabel(s: PaymentUiStatus): string {
  switch (s) {
    case "berhasil":
      return "Berhasil";
    case "pending":
      return "Pending";
    case "gagal":
      return "Gagal";
    case "dibatalkan":
      return "Cancel";
    default:
      return String(s);
  }
}

function paymentStatusBadgeClass(s: PaymentUiStatus): string {
  switch (s) {
    case "berhasil":
      return "bg-emerald-100 text-emerald-900";
    case "pending":
      return "bg-amber-100 text-amber-950";
    case "gagal":
      return "bg-red-100 text-red-900";
    case "dibatalkan":
      return "bg-slate-200 text-slate-800";
    default:
      return "bg-surface text-text";
  }
}

/** Kolom CSV laporan: header bahasa Indonesia, mudah dibuka di Excel */
const BOOKING_CSV_SPEC: { key: keyof RecordedBooking; header: string }[] = [
  { key: "order_id", header: "Order_ID" },
  { key: "transaction_id", header: "Transaction_ID" },
  { key: "guestName", header: "Nama_Tamu" },
  { key: "guestEmail", header: "Email" },
  { key: "guestPhone", header: "Telepon" },
  { key: "gross_amount", header: "Total_IDR_hanya_jika_berhasil" },
  { key: "checkIn", header: "Check_in" },
  { key: "checkOut", header: "Check_out" },
  { key: "propertyName", header: "Properti" },
  { key: "payment_type", header: "Metode_pembayaran" },
  { key: "payment_status", header: "Keterangan_pembayaran" },
  { key: "transaction_status", header: "Status_Midtrans" },
  { key: "recordedAt", header: "Waktu_dicatat_ISO" },
];

function csvEscapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportDailySeriesCsv(series: { date: string; count: number; revenue: number }[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const header = "Tanggal,Jumlah_Booking,Pendapatan_IDR";
  const rows = series.map((s) => `${s.date},${s.count},${s.revenue}`).join("\r\n");
  const BOM = "\uFEFF";
  downloadBlob(`wolio-tren-harian-${stamp}.csv`, new Blob([BOM + header + "\r\n" + rows], { type: "text/csv;charset=utf-8;" }));
}

function exportBookingsCsv(bookings: RecordedBooking[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const header = BOOKING_CSV_SPEC.map((c) => c.header).join(",");
  const rows = bookings
    .map((b) =>
      BOOKING_CSV_SPEC.map((c) => {
        const raw =
          c.key === "payment_status" ? paymentStatusLabel(b.payment_status) : String(b[c.key] ?? "");
        return csvEscapeCell(raw);
      }).join(",")
    )
    .join("\r\n");
  const BOM = "\uFEFF";
  downloadBlob(`wolio-booking-${stamp}.csv`, new Blob([BOM + header + "\r\n" + rows], { type: "text/csv;charset=utf-8;" }));
}

function TrendBarBody({
  series,
  valueKey,
  formatValue,
  accentClass,
}: {
  series: { date: string; count: number; revenue: number }[];
  valueKey: TrendMetric;
  formatValue: (n: number) => string;
  accentClass: string;
}) {
  const values = series.map((s) => s[valueKey]);
  const max = Math.max(1, ...values);

  return (
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
  );
}

function LineAreaTrendSvg({
  series,
  valueKey,
  kind,
  strokeColor,
  fillGradientId,
}: {
  series: { date: string; count: number; revenue: number }[];
  valueKey: TrendMetric;
  kind: "line" | "area";
  strokeColor: string;
  fillGradientId: string;
}) {
  const w = 100;
  const h = 48;
  const max = Math.max(1, ...series.map((s) => s[valueKey]));
  const linePoints = series
    .map((s, i) => {
      const x = series.length <= 1 ? w / 2 : (i / (series.length - 1)) * w;
      const y = h - (s[valueKey] / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const fillPoints = `0,${h} ${linePoints} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
      {kind === "area" && (
        <>
          <defs>
            <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.38" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon fill={`url(#${fillGradientId})`} points={fillPoints} />
        </>
      )}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={linePoints}
      />
    </svg>
  );
}

function segmentBtn(active: boolean) {
  return `rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
    active ? "bg-primary text-white shadow-sm" : "text-text hover:bg-surface"
  }`;
}

function TimeRangeSelect({
  id,
  value,
  onChange,
  className = "",
}: {
  id: string;
  value: TimeRangePreset;
  onChange: (v: TimeRangePreset) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <label htmlFor={id} className="whitespace-nowrap text-xs font-semibold text-text">
        Rentang waktu
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRangePreset)}
        className="rounded-lg border border-surface-dark bg-white px-2.5 py-1.5 text-xs font-medium text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
      >
        {TIME_RANGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaymentStatusFilterSelect({
  id,
  value,
  onChange,
  className = "",
}: {
  id: string;
  value: PaymentStatusFilter;
  onChange: (v: PaymentStatusFilter) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <label htmlFor={id} className="whitespace-nowrap text-xs font-semibold text-text">
        Status pembayaran
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as PaymentStatusFilter)}
        className="rounded-lg border border-surface-dark bg-white px-2.5 py-1.5 text-xs font-medium text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
      >
        {PAYMENT_STATUS_FILTER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DailyTrendExplorer({ bookings }: { bookings: RecordedBooking[] }) {
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("1m");
  const [metric, setMetric] = useState<TrendMetric>("count");
  const [chartKind, setChartKind] = useState<TrendChartKind>("bar");
  const trendTimeSelectId = useId();
  const fillId = useId().replace(/:/g, "_");

  const filteredBookings = filterBookingsByTimeRange(bookings, timeRange);
  const series = getDailySeriesForTimeRange(bookings, timeRange);
  const rangeDescription = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label ?? timeRange;

  const strokeColor = metric === "count" ? "#2D3748" : "#C19652";
  const barClass = metric === "count" ? "bg-primary" : "bg-accent";
  const metricLabel = metric === "count" ? "Jumlah booking per hari" : "Pendapatan (IDR) per hari";
  const formatVal = (n: number) => (metric === "count" ? `${n} booking` : formatIdr(n));

  return (
    <div className="bg-white rounded-xl border border-surface-dark shadow-sm p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-lg text-primary">Tren harian</h3>
          <p className="mt-1 text-sm text-text-light">
            Agregasi per hari berdasarkan waktu pembayaran tercatat — rentang: <span className="font-semibold text-primary">{rangeDescription}</span>
            {timeRange === "all" && series.length >= 730 ? " (tampilan grafik dibatasi 730 hari terakhir agar ringan)." : ""}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          <TimeRangeSelect id={trendTimeSelectId} value={timeRange} onChange={setTimeRange} />
          <div className="flex items-center gap-2 rounded-lg border border-surface-dark bg-surface/40 p-1">
            <span className="pl-2 text-[10px] font-bold uppercase tracking-wider text-text-light">Metrik</span>
            <button type="button" className={segmentBtn(metric === "count")} onClick={() => setMetric("count")}>
              Booking
            </button>
            <button type="button" className={segmentBtn(metric === "revenue")} onClick={() => setMetric("revenue")}>
              Pendapatan
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-surface-dark bg-surface/40 p-1">
            <span className="pl-2 text-[10px] font-bold uppercase tracking-wider text-text-light">Grafik</span>
            <button type="button" className={segmentBtn(chartKind === "bar")} onClick={() => setChartKind("bar")} title="Diagram batang">
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Batang
              </span>
            </button>
            <button type="button" className={segmentBtn(chartKind === "line")} onClick={() => setChartKind("line")} title="Diagram garis">
              <span className="inline-flex items-center gap-1">
                <LineChart className="h-3.5 w-3.5" />
                Garis
              </span>
            </button>
            <button type="button" className={segmentBtn(chartKind === "area")} onClick={() => setChartKind("area")} title="Diagram area">
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                Area
              </span>
            </button>
          </div>
        </div>
      </div>

      <p className="mb-4 mt-4 text-sm text-text-light">{metricLabel}</p>

      {chartKind === "bar" ? (
        <TrendBarBody series={series} valueKey={metric} formatValue={formatVal} accentClass={barClass} />
      ) : (
        <LineAreaTrendSvg series={series} valueKey={metric} kind={chartKind} strokeColor={strokeColor} fillGradientId={fillId} />
      )}

      <div className="mt-2 flex justify-between text-[10px] font-medium text-text-light">
        <span>{series[0]?.date ?? "—"}</span>
        <span>{series[series.length - 1]?.date ?? "—"}</span>
      </div>
      <p className="mt-3 text-center text-[11px] text-text-light">Sumbu X: tanggal (sesuai rentang waktu)</p>

      <div className="mt-8 border-t border-surface-dark pt-6">
        <h4 className="mb-1 font-display text-base font-bold text-primary">Tabel tren harian</h4>
        <p className="mb-3 text-xs text-text-light">
          Mengikuti rentang waktu di atas; satu baris per tanggal (sumbu X grafik).
        </p>
        <div className="max-h-64 overflow-auto rounded-lg border border-surface-dark">
          <table className="w-full min-w-[280px] text-sm">
            <thead className="sticky top-0 bg-surface text-left text-xs font-semibold uppercase tracking-wider text-text">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-right">Booking</th>
                <th className="px-4 py-3 text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark">
              {series.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-light">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                series.map((row) => (
                  <tr key={row.date} className="hover:bg-surface/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{row.date}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text">{row.count}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-text">{formatIdr(row.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-surface-dark pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-light">Ekspor data</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportDailySeriesCsv(series)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-dark bg-white px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-surface"
          >
            <Download className="h-3.5 w-3.5" />
            CSV tren
          </button>
          <button
            type="button"
            onClick={() => exportBookingsCsv(filteredBookings)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" />
            CSV booking
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("analytics");
  const [bookings, setBookings] = useState<RecordedBooking[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void fetchAllBookingsSorted()
      .then((list) => {
        setBookings(list);
        setLoadError(null);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Gagal memuat data"));
  }, []);

  useEffect(() => subscribeBookingUpdates(refresh), [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = deriveBookingStats(bookings);

  const menuItems: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "payments", label: "Pembayaran", icon: CreditCard },
    { id: "bookings", label: "Data Booking", icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-surface">
      <header className="sticky top-0 z-50 w-full shrink-0 border-b border-surface-dark bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-[100vw] min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <img
              src={`${import.meta.env.BASE_URL.replace(/\/?$/, "/")}images/logo.ico`}
              alt=""
              width={36}
              height={36}
              className="h-8 w-8 shrink-0 rounded-lg object-contain ring-1 ring-accent/30 sm:h-9 sm:w-9"
            />
            <h1 className="min-w-0 truncate font-display text-lg font-bold text-primary sm:text-xl">Admin Dashboard</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-dark px-2.5 py-2 text-primary transition-colors hover:bg-surface sm:px-3"
              aria-label="Refresh data"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden text-xs font-semibold sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light sm:px-4"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 w-full min-w-0 flex-1">
        <aside
          className="flex w-[3.25rem] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-surface-dark bg-white py-3 sm:w-14 lg:hidden"
          aria-label="Navigasi menu"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => setActiveTab(item.id)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors sm:h-12 sm:w-12 ${
                  active ? "bg-primary text-white shadow-md" : "text-text-light hover:bg-surface hover:text-primary"
                }`}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-accent" : ""}`} />
              </button>
            );
          })}
        </aside>

        <aside
          id="admin-sidebar"
          className="hidden w-64 shrink-0 flex-col border-r border-surface-dark bg-white lg:flex"
          aria-label="Menu lengkap"
        >
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                    active ? "bg-primary text-white shadow-md" : "text-text hover:bg-surface"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? "text-accent" : "text-text-light"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loadError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong className="font-semibold">Data Supabase tidak terbaca:</strong> {loadError}. Pastikan{" "}
              <code className="rounded bg-white px-1 font-mono text-xs">VITE_SUPABASE_URL</code> dan{" "}
              <code className="rounded bg-white px-1 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> benar di{" "}
              <code className="rounded bg-white px-1 font-mono text-xs">.env</code>, dan tabel{" "}
              <code className="rounded bg-white px-1 font-mono text-xs">bookings</code> ada di proyek Supabase Anda.
            </div>
          )}
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "analytics" && <AnalyticsSection stats={stats} bookings={bookings} />}
              {activeTab === "payments" && <PaymentsSection bookings={bookings} />}
              {activeTab === "bookings" && <BookingsDataSection bookings={bookings} />}
            </m.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function ClientPaginationFooter({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  selectId,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  selectId: string;
}) {
  const pages = totalPagesFor(totalItems, pageSize);
  const safePage = Math.min(Math.max(1, page), pages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(totalItems, safePage * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-surface-dark bg-surface/40 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-text-light tabular-nums">
        {totalItems === 0 ? "Tidak ada data untuk ditampilkan." : `Menampilkan ${from}–${to} dari ${totalItems} data`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="text-xs font-semibold text-text">
          Baris per halaman
        </label>
        <select
          id={selectId}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-surface-dark bg-white px-2.5 py-1.5 text-xs font-medium text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1 || totalItems === 0}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-lg border border-surface-dark bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <span className="min-w-[7rem] text-center text-xs font-medium text-text-light tabular-nums">
          Halaman {safePage} / {pages}
        </span>
        <button
          type="button"
          disabled={safePage >= pages || totalItems === 0}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-lg border border-surface-dark bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

function AnalyticsSection({
  stats,
  bookings,
}: {
  stats: { count: number; revenue: number };
  bookings: RecordedBooking[];
}) {
  const recentListSelectId = useId();
  const recentTimeSelectId = useId();
  const [timeRangeRecent, setTimeRangeRecent] = useState<TimeRangePreset>("all");
  const [recentPage, setRecentPage] = useState(1);
  const [recentPageSize, setRecentPageSize] = useState(10);

  const filteredRecent = filterBookingsByTimeRange(bookings, timeRangeRecent);

  useEffect(() => {
    setRecentPage(1);
  }, [recentPageSize, timeRangeRecent]);

  useEffect(() => {
    const tp = totalPagesFor(filteredRecent.length, recentPageSize);
    setRecentPage((p) => Math.min(p, tp));
  }, [filteredRecent.length, recentPageSize]);

  const recentTp = totalPagesFor(filteredRecent.length, recentPageSize);
  const recentSafePage = Math.min(Math.max(1, recentPage), recentTp);
  const pagedRecent = slicePage(filteredRecent, recentSafePage, recentPageSize);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-primary mb-1">Analytics Overview</h2>
        <p className="text-text-light text-sm">Ringkasan booking dan pendapatan Wolio Hills</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <m.div
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
        </m.div>

        <m.div
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
        </m.div>
      </div>

      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <DailyTrendExplorer bookings={bookings} />
      </m.div>

      <div className="bg-white rounded-xl border border-surface-dark shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-surface-dark px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold text-lg text-primary">Booking terbaru</h3>
          <TimeRangeSelect id={recentTimeSelectId} value={timeRangeRecent} onChange={setTimeRangeRecent} />
        </div>
        {filteredRecent.length === 0 ? (
          <p className="text-text-light text-sm text-center py-12 px-6">Belum ada data booking untuk rentang ini.</p>
        ) : (
          <ul className="divide-y divide-surface-dark">
            {pagedRecent.map((b) => (
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
        <ClientPaginationFooter
          page={recentPage}
          pageSize={recentPageSize}
          totalItems={filteredRecent.length}
          onPageChange={setRecentPage}
          onPageSizeChange={setRecentPageSize}
          selectId={`recent-${recentListSelectId}`}
        />
      </div>
    </div>
  );
}

function PaymentsSection({ bookings }: { bookings: RecordedBooking[] }) {
  const pageSizeSelectId = useId();
  const timeSelectId = useId();
  const payStatusFilterId = useId();
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("all");
  const [payStatusFilter, setPayStatusFilter] = useState<PaymentStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const timeFiltered = filterBookingsByTimeRange(bookings, timeRange);
  const filtered =
    payStatusFilter === "all" ? timeFiltered : timeFiltered.filter((b) => b.payment_status === payStatusFilter);

  useEffect(() => {
    setPage(1);
  }, [pageSize, timeRange, payStatusFilter]);

  useEffect(() => {
    const tp = totalPagesFor(filtered.length, pageSize);
    setPage((p) => Math.min(p, tp));
  }, [filtered.length, pageSize]);

  const payTp = totalPagesFor(filtered.length, pageSize);
  const paySafePage = Math.min(Math.max(1, page), payTp);
  const pagedRows = slicePage(filtered, paySafePage, pageSize);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-primary mb-1">Manajemen Pembayaran</h2>
        <p className="text-text-light text-sm">Semua transaksi tercatat — status pembayaran mengikuti Midtrans</p>
      </div>

      <div className="bg-white rounded-xl border border-surface-dark shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-surface-dark p-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h3 className="font-bold text-lg text-primary">Transaksi terbaru</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <TimeRangeSelect id={timeSelectId} value={timeRange} onChange={setTimeRange} />
            <PaymentStatusFilterSelect id={payStatusFilterId} value={payStatusFilter} onChange={setPayStatusFilter} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportBookingsCsv(filtered)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-dark bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-surface transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-xs font-medium text-text uppercase tracking-wider">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Nominal</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-text-light">
                    Belum ada transaksi untuk rentang ini.
                  </td>
                </tr>
              ) : (
                pagedRows.map((b) => (
                  <tr key={b.order_id + b.recordedAt} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-primary">#{b.order_id.slice(-12)}</td>
                    <td className="px-6 py-4 text-text">{b.guestName}</td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {b.payment_status === "berhasil" ? formatIdr(b.gross_amount) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${paymentStatusBadgeClass(b.payment_status)}`}
                      >
                        {paymentStatusLabel(b.payment_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-light text-xs whitespace-nowrap">{formatWhen(b.recordedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ClientPaginationFooter
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          selectId={`payments-${pageSizeSelectId}`}
        />
      </div>
    </div>
  );
}

function BookingsDataSection({ bookings }: { bookings: RecordedBooking[] }) {
  const pageSizeSelectId = useId();
  const timeSelectId = useId();
  const payStatusFilterId = useId();
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("all");
  const [payStatusFilter, setPayStatusFilter] = useState<PaymentStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const timeFiltered = filterBookingsByTimeRange(bookings, timeRange);
  const filtered =
    payStatusFilter === "all" ? timeFiltered : timeFiltered.filter((b) => b.payment_status === payStatusFilter);

  useEffect(() => {
    setPage(1);
  }, [pageSize, timeRange, payStatusFilter]);

  useEffect(() => {
    const tp = totalPagesFor(filtered.length, pageSize);
    setPage((p) => Math.min(p, tp));
  }, [filtered.length, pageSize]);

  const bookTp = totalPagesFor(filtered.length, pageSize);
  const bookSafePage = Math.min(Math.max(1, page), bookTp);
  const pagedRows = slicePage(filtered, bookSafePage, pageSize);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl text-primary mb-1">Data Booking</h2>
        <p className="text-text-light text-sm">Detail reservasi dari pembayaran tercatat</p>
      </div>

      <div className="bg-white rounded-xl border border-surface-dark shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-surface-dark px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
          <h3 className="font-bold text-lg text-primary">Daftar booking</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <TimeRangeSelect id={timeSelectId} value={timeRange} onChange={setTimeRange} />
            <PaymentStatusFilterSelect id={payStatusFilterId} value={payStatusFilter} onChange={setPayStatusFilter} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportBookingsCsv(filtered)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-dark bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-surface transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            </div>
          </div>
        </div>
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
                <th className="px-4 py-3 font-semibold">Pembayaran</th>
                <th className="px-4 py-3 font-semibold">Waktu bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-text-light">
                    Belum ada data booking untuk rentang ini.
                  </td>
                </tr>
              ) : (
                pagedRows.map((b) => (
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
                    <td className="px-4 py-3 text-right font-display font-bold text-primary whitespace-nowrap">
                      {b.payment_status === "berhasil" ? formatIdr(b.gross_amount) : "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${paymentStatusBadgeClass(b.payment_status)}`}
                      >
                        {paymentStatusLabel(b.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-light text-xs whitespace-nowrap">{formatWhen(b.recordedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ClientPaginationFooter
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          selectId={`bookings-${pageSizeSelectId}`}
        />
      </div>
    </div>
  );
}

