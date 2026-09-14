import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./icons.css"; // Material Symbols — faqat ishlatilgan ikonkalar (tools/icon-subset.mjs)
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
