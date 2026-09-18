import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely (later classes win). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Generate a short, human-friendly reference code (e.g. DOC-7K3Q9D). */
export function generateReference(prefix = "DOC") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${code}`;
}
