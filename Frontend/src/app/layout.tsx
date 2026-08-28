import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/store/Providers";

export const metadata: Metadata = {
  title: "SchoolERP - School Management System",
  description: "Complete school management platform for administrators, teachers, and parents",
  icons: {
    icon: '/screen.png?v=2',
    shortcut: '/screen.png?v=2',
    apple: '/screen.png?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
