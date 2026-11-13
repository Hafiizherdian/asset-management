import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Sidebar from "@/components/Sidebar";

const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });
export const metadata: Metadata = { title: "Asset Management" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={font.className}>
        <Sidebar />
        <main>{children}</main>
      </body>
    </html>
  );
}