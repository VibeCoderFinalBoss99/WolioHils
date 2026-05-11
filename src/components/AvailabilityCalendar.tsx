import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const pad = first.getDay();
  const days = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  return cells;
}

const WEEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

interface Props {
  bookedSet: Set<string>;
  checkIn: string;
  checkOut: string;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
}

export default function AvailabilityCalendar({ bookedSet, checkIn, checkOut, onChange }: Props) {
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const initial = checkIn ? parseYmd(checkIn) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const cells = useMemo(() => monthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const inSelectedRange = (ymd: string): boolean => {
    if (!checkIn || !checkOut) return false;
    return ymd > checkIn && ymd < checkOut;
  };

  const isBooked = (d: Date) => bookedSet.has(toYmd(d));

  const handleDayClick = (d: Date) => {
    const ymd = toYmd(d);
    if (d < today) return;
    if (isBooked(d)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: ymd, checkOut: "" });
      return;
    }

    if (checkIn && !checkOut) {
      if (ymd <= checkIn) {
        onChange({ checkIn: ymd, checkOut: "" });
        return;
      }
      const start = parseYmd(checkIn);
      const end = new Date(d);
      for (let x = new Date(start); x < end; x.setDate(x.getDate() + 1)) {
        if (bookedSet.has(toYmd(x))) return;
      }
      onChange({ checkIn, checkOut: ymd });
    }
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(viewYear, viewMonth, 1));

  return (
    <div className="rounded-2xl border border-surface-dark bg-surface/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-white/80 transition-colors cursor-pointer" aria-label="Bulan sebelumnya">
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
        <span className="font-display font-bold text-primary text-sm capitalize">{label}</span>
        <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-white/80 transition-colors cursor-pointer" aria-label="Bulan berikutnya">
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-text-light mb-2">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="aspect-square" />;
          const ymd = toYmd(cell);
          const past = cell < today;
          const booked = isBooked(cell);
          const selectedStart = checkIn === ymd;
          const selectedEnd = checkOut === ymd;
          const range = inSelectedRange(ymd);
          const disabled = past || booked;

          let cls =
            "aspect-square rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer select-none ";
          if (booked) cls += "bg-red-600 text-white line-through decoration-white/80 ";
          else if (past) cls += "text-text-light/40 cursor-not-allowed ";
          else if (selectedStart || selectedEnd) cls += "bg-accent text-primary ring-2 ring-accent ";
          else if (range) cls += "bg-accent/25 text-primary ";
          else cls += "hover:bg-accent/15 text-primary ";

          return (
            <button key={ymd} type="button" disabled={disabled} onClick={() => handleDayClick(cell)} className={cls}>
              {cell.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-text-light">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-600 shrink-0" /> Sudah dibooking
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-accent shrink-0" /> Check-in / Check-out
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-accent/25 shrink-0" /> Range menginap
        </span>
      </div>
    </div>
  );
}
