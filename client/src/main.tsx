import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ScrollToTop />
          <Toaster position="bottom-right" />
          <App />
          <FloatingContact />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
