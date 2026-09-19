import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDateParts(date: Date, timeZone: string = "Asia/Kolkata") {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone,
    });
    const parts = formatter.formatToParts(date);
    let year = 0;
    let monthStr = "";
    let monthIndex = 0;
    let day = 0;
    for (const part of parts) {
      if (part.type === "year") year = parseInt(part.value, 10);
      if (part.type === "month") {
        monthStr = part.value;
        monthIndex = MONTH_ABBRS.indexOf(monthStr);
      }
      if (part.type === "day") day = parseInt(part.value, 10);
    }
    return { year, month: monthIndex, monthStr, day };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      monthStr: MONTH_ABBRS[date.getMonth()] || "",
      day: date.getDate(),
    };
  }
}

export function isEpochOrInvalid(dateString: string | null | undefined): boolean {
  if (!dateString) return true;
  const str = String(dateString).trim();
  if (str === "" || str.startsWith("1970-01-01")) return true;
  const d = new Date(str);
  return isNaN(d.getTime()) || d.getFullYear() <= 1970;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString || isEpochOrInvalid(dateString)) return "";
  const str = String(dateString).trim();

  // Handle pure YYYY-MM-DD calendar dates strictly to prevent timezone shifts
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    return `${MONTH_ABBRS[month] || ""} ${day}, ${year}`;
  }

  const date = new Date(str);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString || isEpochOrInvalid(dateString)) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatDateTimeWithTz(
  dateString?: string | null,
  timeZone: string = "Asia/Kolkata",
  tzLabel: string = "IST"
): string {
  if (!dateString || isEpochOrInvalid(dateString)) return "Date unavailable";
  const date = new Date(dateString);

  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(date);

    return `${formatted} ${tzLabel}`;
  } catch {
    return formatDate(dateString);
  }
}

export function formatEventDateRange(
  startStr?: string | null,
  endStr?: string | null,
  options: { timeZone?: string } = { timeZone: "Asia/Kolkata" }
): string {
  if (isEpochOrInvalid(startStr)) {
    return "Date unavailable";
  }

  const tz = options.timeZone || "Asia/Kolkata";
  const start = new Date(startStr!);
  const p1 = getDateParts(start, tz);

  if (isEpochOrInvalid(endStr)) {
    return `${p1.monthStr} ${p1.day}, ${p1.year}`;
  }

  const end = new Date(endStr!);
  const p2 = getDateParts(end, tz);

  // Same calendar day
  if (p1.year === p2.year && p1.month === p2.month && p1.day === p2.day) {
    return `${p1.monthStr} ${p1.day}, ${p1.year}`;
  }

  // Same month and year: "Oct 25 – 27, 2026"
  if (p1.year === p2.year && p1.month === p2.month) {
    return `${p1.monthStr} ${p1.day} – ${p2.day}, ${p1.year}`;
  }

  // Same year, different months: "Oct 28 – Nov 2, 2026"
  if (p1.year === p2.year) {
    return `${p1.monthStr} ${p1.day} – ${p2.monthStr} ${p2.day}, ${p1.year}`;
  }

  // Different years: "Dec 30, 2026 – Jan 3, 2027"
  return `${p1.monthStr} ${p1.day}, ${p1.year} – ${p2.monthStr} ${p2.day}, ${p2.year}`;
}

export function formatRegistrationDeadline(
  deadlineStr?: string | null
): { text: string; isClosed: boolean } {
  if (isEpochOrInvalid(deadlineStr)) {
    return { text: "Open registration", isClosed: false };
  }

  const deadline = new Date(deadlineStr!);
  const now = Date.now();

  if (deadline.getTime() < now) {
    return { text: "Registration closed", isClosed: true };
  }

  return {
    text: `Register by ${formatDate(deadlineStr)}`,
    isClosed: false,
  };
}

export function formatFullDateTime(dateString: string): string {
  if (!dateString || isEpochOrInvalid(dateString)) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatTimeAgo(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function getInitials(name: string): string {
  if (!name) return "IC";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}
