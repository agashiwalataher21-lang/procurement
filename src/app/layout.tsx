import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { RoleProvider } from "@/context/RoleContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bait Al Hadaf General Trading L.L.C. - Procurement ERP",
  description: "Complete Procurement Management Web Application for Motorcycle and Generator Spare Parts Trading in Dubai, UAE.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased`}>
        <ThemeProvider>
          <RoleProvider>
            <SidebarProvider>
              <div className="flex h-screen overflow-hidden">
                {/* Sidebar - Absolute positioning, does not overlap content */}
                <Sidebar />

                {/* Main Content Area - Adjusted to accommodate sidebar */}
                <div className="flex flex-col flex-1 h-full overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] dark:bg-slate-950">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster position="top-right" richColors closeButton />
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
