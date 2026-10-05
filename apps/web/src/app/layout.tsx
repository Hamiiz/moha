import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Moha Driving lessons Booking",
  description: "Book certified 90-minute driving lessons with instant pickup validation and transparent pricing.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
              <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <a href="/" className="font-extrabold text-xl tracking-tight text-brand-700 flex items-center gap-2">
                  <span>Moha Driving</span>
                </a>
                <div className="flex items-center gap-3">
                  <a
                    href="/instructor/login"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Instructor Portal
                  </a>
                  <a
                    href="/book"
                    className="inline-flex items-center justify-center font-semibold rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition-colors"
                  >
                    Book Session
                  </a>
                </div>
              </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
              {children}
            </main>

            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Moha Driving Instruction. All rights reserved.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
