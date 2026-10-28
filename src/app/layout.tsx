import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Envision Studio · Project workspace", template: "%s · Envision Studio" },
  description: "A focused project and task workspace for Envision Studio."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers><ToastProvider><AppShell>{children}</AppShell></ToastProvider></Providers></body></html>;
}
