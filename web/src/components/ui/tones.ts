import type { Tone } from "@/lib/types";

/** Yumshoq fon + to'q matn (chip, ikonka kvadrati). */
export const softTone: Record<Tone, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary-fixed text-on-primary-fixed-variant",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-error-container text-on-error-container",
  gold: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  navy: "bg-primary-container text-on-primary",
};

/** To'liq rangli fon. */
export const solidTone: Record<Tone, string> = {
  neutral: "bg-inverse-surface text-inverse-on-surface",
  primary: "bg-primary text-on-primary",
  success: "bg-success text-on-success",
  warning: "bg-warning text-on-warning",
  danger: "bg-error text-on-error",
  gold: "bg-gold text-on-tertiary-fixed",
  navy: "bg-primary-container text-on-primary",
};

/** Faqat matn rangi. */
export const textTone: Record<Tone, string> = {
  neutral: "text-on-surface-variant",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-error",
  gold: "text-tertiary",
  navy: "text-navy",
};

/** Progress chizig'i rangi. */
export const barTone: Record<Tone, string> = {
  neutral: "bg-outline",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
  gold: "bg-gold",
  navy: "bg-navy",
};

/** StatCard ikonka kvadrati (mockup: bg-surface-container-high text-primary). */
export const iconTileTone: Record<Tone, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-surface-container-high text-primary",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-error-container text-on-error-container",
  gold: "bg-tertiary-fixed text-on-tertiary-fixed",
  navy: "bg-primary-container text-on-primary",
};
