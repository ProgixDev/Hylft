import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "Hylift Admin",
  description: "Hylift Administration Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
