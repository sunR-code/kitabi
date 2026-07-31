import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kitab-i Admin",
  description: "Admin Dashboard untuk mengelola konten buku Kitab-i",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
