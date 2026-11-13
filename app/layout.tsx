import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { getAreaFilter, getAreaOptions } from "@/lib/queries";

const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });
export const metadata: Metadata = { title: "Asset Management" };

const themeScript = `(function(){try{var d=document.documentElement;var m=localStorage.getItem("mode");if(!m)m=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";d.dataset.mode=m;var a=localStorage.getItem("accent");if(a&&a!=="green")d.dataset.accent=a}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [areas, selected] = await Promise.all([getAreaOptions(), getAreaFilter()]);

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={font.className}>
        <Sidebar areas={areas} selected={selected} />
        <main>{children}</main>
      </body>
    </html>
  );
}