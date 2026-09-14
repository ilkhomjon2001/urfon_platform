// Nusxa: asl manba design-system/tailwind.urfon.js (oʻzgartirmang — avval aslini yangilang, keyin shu yerga koʻchiring)
/*
 * URFON dizayn tizimi — yagona Tailwind konfiguratsiyasi (manba: design-system/DIZAYN-TIZIMI.md).
 *
 * Bitta fayl ikki joyda ishlaydi:
 *  - Stitch mockuplari (Play CDN): <script src="https://cdn.tailwindcss.com"></script> dan KEYIN
 *    <script src="../../design-system/tailwind.urfon.js"></script> — window.tailwind.config ni o'rnatadi.
 *  - React ilova (Tailwind v3): tailwind.config.js ichida presets: [require("../design-system/tailwind.urfon.js")]
 *
 * Token nomlari Stitch HTML dagi klasslar bilan bir xil (bg-primary, text-on-surface-variant ...),
 * shuning uchun mockup markupini ilovaga ko'chirganda klasslar o'zgarmaydi.
 */
(function (root) {
  const brand = {
    navy: "#16307E",   // sidebar/sarlavha tayanchi, hover
    blue: "#1E4FC2",   // asosiy amallar, faol holat, havolalar
    gold: "#FFC93C",   // aksent (<5% yuza): yutuq, tanga, "yangi" belgisi
    canvas: "#F5F7FC", // sahifa foni
  };

  // Brend ko'kidan hosil qilingan shkala — Tailwind'ning blue/indigo klasslari ham shu rangga tushadi.
  const brandScale = {
    50: "#EEF3FF", 100: "#DCE5FB", 200: "#B9CBF6", 300: "#8EABEF", 400: "#5F87E0",
    500: "#3565D3", 600: "#1E4FC2", 700: "#1A43A6", 800: "#173A8F", 900: "#16307E", 950: "#0E1F52",
  };
  const goldScale = {
    50: "#FFFAEB", 100: "#FFF2C7", 200: "#FFE58F", 300: "#FFD85E", 400: "#FFC93C",
    500: "#F5B31A", 600: "#D99210", 700: "#B06F0E", 800: "#8C5612", 900: "#744714", 950: "#432505",
  };
  // Semantik ranglar DESIGN.md bo'yicha: success = green-600, danger = red-600, warning = amber-600.
  const greenScale = {
    50: "#F0FDF4", 100: "#DCFCE7", 200: "#BBF7D0", 300: "#86EFAC", 400: "#4ADE80",
    500: "#22C55E", 600: "#16A34A", 700: "#15803D", 800: "#166534", 900: "#14532D", 950: "#052E16",
  };
  const redScale = {
    50: "#FEF2F2", 100: "#FEE2E2", 200: "#FECACA", 300: "#FCA5A5", 400: "#F87171",
    500: "#EF4444", 600: "#DC2626", 700: "#B91C1C", 800: "#991B1B", 900: "#7F1D1D", 950: "#450A0A",
  };

  const colors = {
    // Sirtlar va matn (neytral = Tailwind slate)
    background: brand.canvas,
    "on-background": "#0F172A",
    surface: "#FFFFFF",
    "surface-bright": "#FFFFFF",
    "surface-dim": "#D5DDEC",
    "surface-variant": "#DAE3F1",
    "surface-container-lowest": "#FFFFFF",
    "surface-container-low": "#F3F6FC",
    "surface-container": "#EDF2F9",
    "surface-container-high": "#E3EAF5",
    "surface-container-highest": "#DAE3F1",
    "on-surface": "#0F172A",
    "on-surface-variant": "#475569",
    "on-surface-muted": "#64748B",
    outline: "#94A3B8",
    "outline-variant": "#E2E8F0",
    "border-subtle": "#E2E8F0",
    "inverse-surface": "#0F172A",
    "inverse-on-surface": "#F1F5F9",
    "inverse-primary": brandScale[200],

    // Asosiy (brend ko'k) — hover va "container" holati navy
    primary: brand.blue,
    "on-primary": "#FFFFFF",
    "primary-container": brand.navy,
    "on-primary-container": "#C7D5F8",
    "primary-hover": brand.navy,
    "primary-light": brandScale[50],
    "primary-fixed": brandScale[100],
    "primary-fixed-dim": brandScale[200],
    "on-primary-fixed": brandScale[950],
    "on-primary-fixed-variant": brand.navy,
    "surface-tint": brand.blue,

    // Ikkilamchi (navy oilasi)
    secondary: brand.navy,
    "on-secondary": "#FFFFFF",
    "secondary-container": brandScale[100],
    "on-secondary-container": brand.navy,
    "secondary-fixed": "#E6ECFA",
    "secondary-fixed-dim": "#C3D0F2",
    "on-secondary-fixed": brandScale[950],
    "on-secondary-fixed-variant": "#22398A",

    // Uchlamchi (brend sariq) — yutuq, tanga, "tavsiya"
    tertiary: "#7A5200",
    "on-tertiary": "#FFFFFF",
    "tertiary-container": "#5C3F00",
    "on-tertiary-container": brand.gold,
    "tertiary-fixed": "#FFEDB8",
    "tertiary-fixed-dim": brand.gold,
    "tertiary-fixed-variant": "#7A5200",
    "on-tertiary-fixed": "#3D2A00",
    "on-tertiary-fixed-variant": "#7A5200",
    "secondary-accent": brand.gold,

    // Semantik holatlar
    error: redScale[600],
    "on-error": "#FFFFFF",
    "error-container": redScale[100],
    "on-error-container": redScale[800],
    success: greenScale[600],
    "on-success": "#FFFFFF",
    "success-container": greenScale[100],
    "on-success-container": greenScale[700],
    warning: "#D97706",
    "on-warning": "#FFFFFF",
    "warning-container": "#FEF3C7",
    "on-warning-container": "#B45309",

    // Brend nomlari (o'qilishi oson aliaslar)
    navy: brand.navy,
    gold: brand.gold,

    // Tailwind standart palitralarini brendga bog'lash
    blue: brandScale,
    indigo: brandScale,
    yellow: goldScale,
    emerald: greenScale,
    green: greenScale,
    rose: redScale,
    red: redScale,
  };

  const sans = ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"];
  const display = ["Manrope", "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"];

  const type = {
    "display-lg": ["40px", "48px", "-0.02em", "700", display],
    "display-sm": ["32px", "40px", "-0.015em", "700", display],
    "headline-xl": ["28px", "36px", "-0.01em", "700", display],
    "headline-xl-mobile": ["24px", "32px", "-0.01em", "700", display],
    "headline-lg": ["22px", "30px", "-0.01em", "600", display],
    "headline-md": ["18px", "26px", "-0.005em", "600", display],
    "headline-sm": ["16px", "24px", "0em", "600", display],
    "metric-num": ["28px", "32px", "-0.02em", "700", display],
    "body-lg": ["16px", "24px", "0em", "400", sans],
    "body-md": ["14px", "20px", "0em", "400", sans],
    "body-sm": ["12px", "18px", "0.005em", "400", sans],
    "label-lg": ["14px", "20px", "0.01em", "600", sans],
    "label-md": ["12px", "16px", "0.02em", "600", sans],
    "label-sm": ["11px", "14px", "0.03em", "600", sans],
  };
  const fontFamily = { sans, display, body: sans };
  const fontSize = {};
  for (const [name, [size, lineHeight, letterSpacing, fontWeight, family]] of Object.entries(type)) {
    fontFamily[name] = family;
    fontSize[name] = [size, { lineHeight, letterSpacing, fontWeight }];
  }

  const config = {
    darkMode: "class",
    theme: {
      extend: {
        colors,
        fontFamily,
        fontSize,
        // Kartalar rounded-xl (12px), tugma/input rounded-lg (8px), modal rounded-2xl (16px), chip rounded-full.
        borderRadius: {
          DEFAULT: "0.25rem",
          lg: "0.5rem",
          xl: "0.75rem",
          "2xl": "1rem",
          "3xl": "1.5rem",
          full: "9999px",
        },
        spacing: {
          "space-xs": "0.25rem",
          "space-sm": "0.5rem",
          "space-md": "1rem",
          "space-lg": "1.5rem",
          "space-xl": "2rem",
          gutter: "1.5rem",
          "gutter-mobile": "1rem",
          margin: "2rem",
          "margin-mobile": "1rem",
        },
        // Elevation darajalari (DESIGN.md): card = 1-daraja, float = 2-daraja (dropdown, hover), modal = 3-daraja.
        boxShadow: {
          xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
          card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
          float: "0 8px 16px -4px rgba(22, 48, 126, 0.06), 0 4px 6px -2px rgba(22, 48, 126, 0.04)",
          modal: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)",
        },
        opacity: { 85: "0.85" },
        width: { sidebar: "16rem" },
      },
    },
  };

  if (typeof module !== "undefined" && module.exports) module.exports = config;
  if (root && root.tailwind) root.tailwind.config = config;
})(typeof window !== "undefined" ? window : globalThis);
