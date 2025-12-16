import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string, separator = "-") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${separator}{2,}`, "g"), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, "g"), "");
}
