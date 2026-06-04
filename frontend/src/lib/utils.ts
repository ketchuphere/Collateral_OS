import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${Math.round(score)}/100`;
}

export function formatLtv(ltv: number | null | undefined): string {
  if (ltv == null) return "—";
  return `${Math.round(ltv)}%`;
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null) return "bg-muted-foreground";
  if (score >= 75) return "bg-emerald-400";
  if (score >= 55) return "bg-amber-400";
  if (score >= 35) return "bg-orange-400";
  return "bg-red-400";
}

export function riskBadgeClass(risk: string | null | undefined): string {
  switch (risk) {
    case "low": return "badge-low";
    case "moderate": return "badge-moderate";
    case "high": return "badge-high";
    case "critical": return "badge-critical";
    default: return "bg-muted text-muted-foreground border border-border";
  }
}

export function severityBadgeClass(severity: string): string {
  switch (severity) {
    case "critical": return "badge-critical";
    case "high": return "badge-high";
    case "medium": return "badge-moderate";
    case "low": return "badge-low";
    default: return "bg-muted text-muted-foreground border border-border";
  }
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "assessed": return "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20";
    case "pending": return "bg-blue-400/10 text-blue-400 border border-blue-400/20";
    case "under_assessment": return "bg-amber-400/10 text-amber-400 border border-amber-400/20";
    case "flagged": return "bg-red-400/10 text-red-400 border border-red-400/20";
    case "completed": return "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20";
    case "processing": return "bg-amber-400/10 text-amber-400 border border-amber-400/20";
    case "failed": return "bg-red-400/10 text-red-400 border border-red-400/20";
    case "approved": return "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20";
    case "rejected": return "bg-red-400/10 text-red-400 border border-red-400/20";
    case "under_review": return "bg-amber-400/10 text-amber-400 border border-amber-400/20";
    case "disbursed": return "bg-blue-400/10 text-blue-500 border border-blue-400/20";
    default: return "bg-muted text-muted-foreground border border-border";
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function propertyTypeLabel(type: string): string {
  const map: Record<string, string> = {
    residential_apartment: "Residential Apartment",
    residential_villa: "Residential Villa",
    commercial_office: "Commercial Office",
    commercial_retail: "Commercial Retail",
    land: "Land / Plot",
    industrial: "Industrial",
  };
  return map[type] ?? type;
}
