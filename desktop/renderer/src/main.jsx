import React from "react";
import {
  createRoot,
} from "react-dom/client";

import App from "./App.jsx";

import {
  LanguageProvider,
} from "./i18n/LanguageContext.jsx";

import {
  ThemeProvider,
} from "./theme/ThemeContext.jsx";

import {
  AccessibilityProvider,
} from "./accessibility/AccessibilityContext.jsx";

import "./styles.css";

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </AccessibilityProvider>
  </React.StrictMode>
);
