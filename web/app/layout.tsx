import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Header from "./components/Header";
import ToastProvider from "./components/ToastContainer";
import DrawerProvider from "./components/Drawer";
import ThemeProvider from "./components/ThemeProvider";
import CommandPalette from "./components/CommandPalette";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "ARCA SENTRY — Compliance Operations Center",
  description: "Continuous compliance auditing for enterprise AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <DrawerProvider>
              <CommandPalette>
                <Header />
                <main>{children}</main>
                <footer className="footer">
                  ARCA SENTRY · Continuous compliance auditing for enterprise AI
                </footer>
              </CommandPalette>
            </DrawerProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
