import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge and deduplicate Tailwind CSS class names using clsx and tailwind-merge
 * @param inputs - Class names to merge (strings, arrays, objects, or conditional values)
 * @returns Merged and deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract initials from a person's name
 * @param name - The full name to extract initials from
 * @param maxLetters - Maximum number of initials to return (default: 2)
 * @returns Uppercase initials from the name, or empty string if name is empty
 */
export function getInitials(name: string, maxLetters = 2): string {
  if (!name) return "";

  return name
    .trim()
    .split(/[\s-]+/) // split on spaces OR hyphens
    .map((word) => word[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, maxLetters)
    .join("");
}

/**
 * Download a blob as a file by creating and clicking a temporary anchor element
 * @param blob - The blob to download
 * @param filename - The filename to use for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Format file size in bytes to megabytes
 * @param bytes - File size in bytes
 * @returns Formatted size in MB (1 decimal place)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return "0";
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(1);
}

/**
 * Format date and time in GB format
 * @param dateString - ISO date string
 * @returns Formatted date and time (DD/MM/YYYY HH:MM AM/PM)
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

/**
 * Format date in GB short format for filter labels
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date (D MMM YYYY) e.g. "1 Jan 2024"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
