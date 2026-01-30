import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "../../styles/globals.css";
import AdminLayout from "../components/layout-shell";
import Providers from "../components/providers";
import { ErrorHandler } from "./error-handler";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "SUPER_TRUTH // Command Center",
  description: "Independent Operator Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-mono">
        <ErrorHandler />
        <Providers>
          <AdminLayout>{children}</AdminLayout>
        </Providers>
      </body>
    </html>
  );
}

