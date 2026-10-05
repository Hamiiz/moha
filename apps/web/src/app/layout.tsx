import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { InstructorDrawer } from "@/components/InstructorDrawer";

export const metadata: Metadata = {
  title: "DriveEasy — Toronto Driving Lessons & Road Test Booking",
  description: "Book certified 90-minute driving lessons with instant pickup validation and transparent pricing.",
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
                  <span>🚗 DriveEasy</span>
                </a>
                <a
                  href="/book"
                  className="inline-flex items-center justify-center font-semibold rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 transition-colors"
                >
                  Book Session
                </a>
              </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
              {children}
            </main>

            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} DriveEasy Toronto. All rights reserved.
            </footer>
          </div>

          <InstructorDrawer />
        </Providers>
      </body>
    </html>
  );
}
