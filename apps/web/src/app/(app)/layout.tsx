import Link from "next/link";
import { Providers } from "@/components/Providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Minimal app nav — shared by /book and /instructor/* */}
      <nav className="hero-bg sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group cursor-pointer hover:opacity-95 transition-opacity">
              <div
                className="w-8 h-8 bg-secondary-container flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-on-secondary-container text-[18px]">
                  directions_car
                </span>
              </div>
              <div>
                <div
                  className="text-inverse-on-surface font-bold text-[15px] leading-tight group-hover:text-white transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Moha Driving
                </div>
                <div className="text-[#82f5c1] text-[10px] font-semibold tracking-widest uppercase">
                  West Toronto
                </div>
              </div>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/book"
                className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-on-secondary text-sm font-semibold hover:bg-secondary/90 transition-colors"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Simple footer */}
      <footer className="bg-inverse-surface border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#7c839b]">
          <p>© {new Date().getFullYear()} Moha Driving School. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>MTO Certified · West Toronto, ON</span>
            <span>·</span>
            <Link href="/instructor/login" className="hover:text-[#82f5c1] transition-colors">
              Instructor Portal
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
