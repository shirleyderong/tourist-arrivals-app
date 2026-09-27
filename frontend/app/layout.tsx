import "./globals.css";
import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Philippine Tourist Arrivals - Forecasting Lab",
  description: "LSTM forecasting + SHAP explainability for Philippine tourist arrivals",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Sidebar />
          <main className="content">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </body>
    </html>
  );
}
