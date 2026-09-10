const PH_TZ = "Asia/Manila";

function partsOf(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour") === "24" ? "00" : pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
}

export function phDateString(value: string | Date = new Date()): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? "";
  }

  const { year, month, day } = partsOf(date);
  return `${year}-${month}-${day}`;
}

export function phDateTimeLabel(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const date = new Date(`${value.trim()}T12:00:00+08:00`);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: PH_TZ,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return phDateString(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function phNowDateTime(value: Date = new Date()): string {
  const { year, month, day, hour, minute, second } = partsOf(value);
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function phIsoFromDate(dateStr: string, previousIso?: string): string {
  if (previousIso && phDateString(previousIso) === dateStr) {
    return previousIso;
  }

  const today = phDateString();
  const time = dateStr === today ? phNowDateTime().slice(11) : "12:00:00";
  return `${dateStr}T${time}+08:00`;
}

export function previousPhDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00+08:00`);
  date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
  return phDateString(date);
}

export function phTimestamp(value: string | Date): number {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  }

  const trimmed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00+08:00`).getTime();
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed.replace(" ", "T")}+08:00`).getTime();
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
