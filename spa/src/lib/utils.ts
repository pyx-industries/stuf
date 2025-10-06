import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
