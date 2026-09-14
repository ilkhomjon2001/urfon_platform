import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Preset'dagi tipografiya tokenlari (text-label-md, font-headline-md ...). tailwind-merge ularni rang deb
// o'ylamasligi uchun font-size / font-family guruhlariga qo'shiladi.
const TYPE_SCALE = [
  "display-lg",
  "display-sm",
  "headline-xl",
  "headline-xl-mobile",
  "headline-lg",
  "headline-md",
  "headline-sm",
  "metric-num",
  "body-lg",
  "body-md",
  "body-sm",
  "label-lg",
  "label-md",
  "label-sm",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TYPE_SCALE }],
      "font-family": [{ font: [...TYPE_SCALE, "display", "body", "sans"] }],
      shadow: [{ shadow: ["xs", "card", "float", "modal"] }],
    },
    theme: {
      spacing: ["space-xs", "space-sm", "space-md", "space-lg", "space-xl", "gutter", "gutter-mobile", "margin", "margin-mobile"],
    },
  },
});

/** Klasslarni birlashtiradi va Tailwind ziddiyatlarini hal qiladi: cn("px-2", cond && "px-4") → "px-4". */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
