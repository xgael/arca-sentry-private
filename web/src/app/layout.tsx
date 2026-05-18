import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import CommandPalette from "@/components/chrome/CommandPalette";
import BackendStatusBanner from "@/components/chrome/BackendStatusBanner";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-geist",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "ARCA SENTRY — Compliance Operations Center",
  description: "Continuous compliance auditing for enterprise AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${jetbrainsMono.variable}`}>
      <body>
        <I18nProvider>
          <ToastProvider position="top-center">
            <BackendStatusBanner />
            {children}
            <CommandPalette />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
