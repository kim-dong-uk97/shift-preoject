import type { Metadata } from "next";
import "galmuri/dist/galmuri.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abyss",
  description: "나만의 맞춤 AI Agent 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="antialiased">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
