import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Sidebar from "@/components/Sidebar";

const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });
export const metadata: Metadata = { title: "Asset Management" };

const themeScript = `(function(){try{var r=document.documentElement;var m=localStorage.getItem("mode");if(!m)m=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";r.dataset.theme=m;r.classList.toggle("dark",m==="dark")}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={font.className}>
        <Sidebar />
        <main>{children}</main>
      </body>
    </html>
  );
}