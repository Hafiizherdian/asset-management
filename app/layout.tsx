import "./globals.css";
import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });
export const metadata: Metadata = { title: "Asset Management" };

const themeScript = `(function(){try{var r=document.documentElement;var m=localStorage.getItem("mode");if(m!=="dark"&&m!=="light")m="light";r.dataset.theme=m;r.classList.toggle("dark",m==="dark")}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-mono", jetbrainsMono.variable)}>
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