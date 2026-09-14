import urfon from "./tailwind.urfon.cjs";

// Shriftlar self-hosted (@fontsource-variable): oila nomi "Inter Variable" / "Manrope Variable".
// Preset'dagi har bir stekning boshiga variable nomini qo'shamiz, qolgan zaxira stek o'zgarmaydi.
const VARIABLE = { Inter: "Inter Variable", Manrope: "Manrope Variable" };
const fontFamily = Object.fromEntries(
  Object.entries(urfon.theme.extend.fontFamily).map(([key, stack]) => [
    key,
    stack.flatMap((f) => (VARIABLE[f] ? [VARIABLE[f], f] : [f])),
  ]),
);

/** @type {import('tailwindcss').Config} */
export default {
  presets: [urfon],
  content: { relative: true, files: ["./index.html", "./src/**/*.{ts,tsx}"] },
  theme: {
    extend: {
      fontFamily,
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "dialog-in": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.97)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "sheet-in": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "pop-in": "pop-in 140ms ease-out",
        "dialog-in": "dialog-in 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-in": "sheet-in 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
