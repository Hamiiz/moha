"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPublicSettings, getPublicFleet } from "@/lib/api";
import type { PublicSettings, VehicleItem } from "@/lib/types";

// ─── Default Fallbacks ────────────────────────────────────────────────────────
const DEFAULT_RATES = {
  g2: 55,
  g: 60,
  beginner: 50,
  refresher: 55,
};

const DEFAULT_FLEET: VehicleItem[] = [
  {
    id: "v-1",
    name: "2023 Toyota Corolla",
    subtitle: "Primary training vehicle",
    badgeText: "Most Popular",
    badgeIcon: "star",
    features: ["Automatic trans.", "Dual controls", "360° backup cam", "A/C + heated seats"],
  },
  {
    id: "v-2",
    name: "2022 Honda Civic",
    subtitle: "Secondary training vehicle",
    badgeText: "DriveTest Ready",
    badgeIcon: "verified",
    features: ["Automatic trans.", "Dual controls", "Blind spot sensors", "A/C + heated seats"],
  },
];

// ─── Review data ─────────────────────────────────────────────────────────────
const REVIEWS = [
  {
    initials: "A",
    name: "Aisha K.",
    meta: "G2 · Toronto · 2 months ago",
    quote:
      "Passed my G2 first try. Moha is incredibly patient and knows every road examiner's expectations. Worth every dollar.",
  },
  {
    initials: "M",
    name: "Marcus L.",
    meta: "G · Downtown Toronto · 3 months ago",
    quote:
      "Took my G test after just 2 sessions. The route practice was exactly what DriveTest uses. Highly recommend.",
  },
  {
    initials: "S",
    name: "Sara P.",
    meta: "G2 · North York · 1 month ago",
    quote:
      "Best instructor in Toronto. Showed up on time, very professional, and the pickup from home was super convenient.",
  },
  {
    initials: "J",
    name: "Jordan T.",
    meta: "G2 · Etobicoke · 2 weeks ago",
    quote:
      "I was so nervous before my test. After 2 lessons with Moha, I felt confident. Passed! Thank you so much.",
  },
  {
    initials: "R",
    name: "Rania M.",
    meta: "G · Scarborough · 1 month ago",
    quote:
      "Super detail oriented. He showed me exact spots where examiners watch for errors. Passed my G with zero demerits.",
  },
];

export default function HomePage() {
  const [settings, setSettings] = useState<PublicSettings>({
    phone: "(647) 912-7040",
    email: "mohadriving@gmail.com",
    instructorName: "Moha",
    bannerNotice: "",
    hourlyRates: DEFAULT_RATES,
    bufferMinutes: 30,
    lessonDurationMinutes: 90,
    baseAddress: "1002 King Street West, Toronto, ON M6K 1J7",
  });

  const [fleet, setFleet] = useState<VehicleItem[]>(DEFAULT_FLEET);
  const [lessonType, setLessonType] = useState<keyof typeof DEFAULT_RATES>("g2");
  const [hours, setHours] = useState(2);

  useEffect(() => {
    getPublicSettings()
      .then((data) => {
        if (data && data.hourlyRates) setSettings(data);
      })
      .catch(() => {});

    getPublicFleet()
      .then((data) => {
        if (data && data.length > 0) setFleet(data);
      })
      .catch(() => {});
  }, []);

  const rates = settings.hourlyRates || DEFAULT_RATES;
  const rate = rates[lessonType] ?? 55;
  const total = rate * hours;
  const phoneTel = `tel:${settings.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <div className="bg-surface text-on-surface">
      {/* ───── Optional Banner Notice ───── */}
      {settings.bannerNotice && (
        <div className="bg-secondary text-on-secondary px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px]">campaign</span>
          <span>{settings.bannerNotice}</span>
        </div>
      )}

      {/* ───── Navigation ───── */}
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

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#why" className="nav-link">Services</a>
              <a href="#vehicles" className="nav-link">Fleet</a>
              <a href="#reviews" className="nav-link">Reviews</a>
            </div>

            {/* CTAs */}
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

      {/* ───── Hero ───── */}
      <section className="hero-bg min-h-[88vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="space-y-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-container/20 border border-secondary-container/40 text-secondary-container text-[11px] font-bold tracking-widest uppercase"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-[14px]">verified</span>
                MTO-Certified Instructor · West Toronto
              </div>

              <div className="space-y-4">
                <h1
                  className="text-white font-extrabold leading-[1.05]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "clamp(36px, 5vw, 56px)",
                    letterSpacing: "-0.035em",
                  }}
                >
                  Pass Your Road Test<br />
                  <span className="text-[#82f5c1]">First Try.</span>
                </h1>
                <p className="text-[#bec6e0] text-[16px] leading-[26px] max-w-md">
                  G2 and G road test prep with West Toronto's most detail-oriented instructor.
                  Flexible pickup, weekend slots, and a 94% first-attempt pass rate.
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 py-4 border-t border-white/10">
                <div>
                  <div className="text-[#82f5c1] font-bold text-[22px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    94%
                  </div>
                  <div className="text-[#bec6e0] text-[12px]">First-attempt pass rate</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <div className="text-[#82f5c1] font-bold text-[22px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    200+
                  </div>
                  <div className="text-[#bec6e0] text-[12px]">Students certified</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <div className="text-[#82f5c1] font-bold text-[22px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    4.9★
                  </div>
                  <div className="text-[#bec6e0] text-[12px]">Google rating</div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/book"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-secondary text-on-secondary font-semibold text-[15px] hover:bg-secondary/90 transition-colors"
                  style={{ borderRadius: "0.25rem" }}
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  Book a Lesson
                </Link>
                <a
                  href={phoneTel}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 border border-white/20 text-[#eaf1ff] font-medium text-[15px] hover:bg-white/5 transition-colors"
                  style={{ borderRadius: "0.25rem" }}
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  {settings.phone}
                </a>
              </div>
            </div>

            {/* Right: Fare Estimator */}
            <div
              className="bg-[#131b2e] border border-white/10 p-6 space-y-5"
              style={{ borderRadius: "0.5rem" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold text-[16px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Instant Price Estimate
                  </div>
                  <div className="text-[#7c839b] text-[13px] mt-0.5">No surprise charges — ever</div>
                </div>
                <div
                  className="w-9 h-9 bg-secondary/20 flex items-center justify-center"
                  style={{ borderRadius: "0.25rem" }}
                >
                  <span className="material-symbols-outlined text-secondary text-[20px]">calculate</span>
                </div>
              </div>

              {/* Lesson type grid */}
              <div className="space-y-2">
                <label className="text-[#7c839b] text-[11px] font-bold tracking-widest uppercase">
                  Lesson Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "g2", label: "G2 Road Test Prep" },
                    { id: "g", label: "G Road Test Prep" },
                    { id: "beginner", label: "Beginner Lessons" },
                    { id: "refresher", label: "Refresher" },
                  ].map((lt) => (
                    <button
                      key={lt.id}
                      onClick={() => setLessonType(lt.id as keyof typeof DEFAULT_RATES)}
                      className={`px-3 py-2.5 border text-[13px] font-medium transition-all ${
                        lessonType === lt.id
                          ? "lesson-btn-active"
                          : "border-white/10 text-[#7c839b]"
                      }`}
                      style={{ borderRadius: "0.25rem" }}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[#7c839b] text-[11px] font-bold tracking-widest uppercase">
                    Duration
                  </label>
                  <span className="text-white text-[13px] font-semibold">
                    {hours === 1 ? "1 hour" : `${hours} hours`}
                  </span>
                </div>
                <input
                  type="range"
                  className="fare-slider w-full"
                  min={1}
                  max={4}
                  step={0.5}
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-[#7c839b] text-[11px]">
                  <span>1 hr</span>
                  <span>4 hrs</span>
                </div>
              </div>

              {/* Price display */}
              <div
                className="bg-[#0b1c30] border border-white/10 p-4 flex items-center justify-between"
                style={{ borderRadius: "0.25rem" }}
              >
                <div>
                  <div className="text-[#7c839b] text-[11px] font-bold tracking-widest uppercase">
                    Estimated Total
                  </div>
                  <div
                    className="text-[#82f5c1] font-bold text-[28px] mt-1"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    ${total}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#7c839b] text-[11px]">${rate}/hr</div>
                  <div className="text-[#7c839b] text-[11px]">Tax included</div>
                </div>
              </div>

              <Link
                href="/book"
                className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-on-secondary font-semibold text-[14px] hover:bg-secondary/90 transition-colors"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                Book This Slot
              </Link>
              <p className="text-[#7c839b] text-[11px] text-center">
                Free cancellation up to 24 hrs before lesson
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Trust bar ───── */}
      <div className="bg-primary-container border-y border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide">
            {[
              { icon: "shield_check", text: "MTO Certified" },
              { icon: "schedule", text: "Same-week availability" },
              { icon: "location_on", text: "Pickup anywhere in West Toronto & GTA" },
              { icon: "payments", text: "e-Transfer · Cash · No hidden fees" },
              { icon: "star", text: "4.9★ on Google" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                {i > 0 && <div className="w-px h-4 bg-white/10 flex-shrink-0" />}
                <span className="material-symbols-outlined text-secondary-container text-[16px]">
                  {item.icon}
                </span>
                <span className="text-[#7c839b] text-[12px] font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ───── 90-Minute Difference ───── */}
      <section id="why" className="py-16 lg:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface-variant text-[11px] font-bold tracking-widest uppercase"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-[14px]">timer</span>
                Why Moha
              </div>
              <h2
                className="font-bold leading-tight"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "clamp(28px, 4vw, 36px)",
                  letterSpacing: "-0.025em",
                  color: "#0b1c30",
                }}
              >
                The 90-Minute<br />Difference
              </h2>
              <p className="text-on-surface-variant text-[16px] leading-[26px]">
                Most students fail because they practice habits, not precision. Moha's methodology focuses
                on the exact manoeuvres MTO examiners score — mirror checks, shoulder checks, and intersection
                behaviour — in real West Toronto DriveTest routes.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: "route",
                    title: "Real Test Routes",
                    desc: "Practice on the actual roads used in G2/G road tests at Downsview & Etobicoke DriveTest centres.",
                  },
                  {
                    icon: "checklist",
                    title: "MTO Rubric Scoring",
                    desc: "Get graded exactly how MTO examiners grade — know your score before the real test.",
                  },
                  {
                    icon: "location_on",
                    title: "Door-to-Door Pickup",
                    desc: "We come to you — home, work, or transit hub — anywhere in West Toronto.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-4 p-4 bg-surface-container-low border border-outline-variant"
                    style={{ borderRadius: "0.25rem" }}
                  >
                    <div
                      className="w-9 h-9 bg-secondary-container flex items-center justify-center flex-shrink-0"
                      style={{ borderRadius: "0.25rem" }}
                    >
                      <span className="material-symbols-outlined text-on-secondary-container text-[18px]">
                        {f.icon}
                      </span>
                    </div>
                    <div>
                      <div
                        className="font-semibold text-[15px] text-on-surface"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {f.title}
                      </div>
                      <div className="text-on-surface-variant text-[14px] mt-1">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison table */}
            <div
              className="bg-surface-container-lowest border border-outline-variant overflow-hidden"
              style={{ borderRadius: "0.5rem" }}
            >
              <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant">
                <div
                  className="text-on-surface font-semibold text-[14px]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Why students choose Moha
                </div>
              </div>
              <div className="divide-y divide-outline-variant">
                <div className="grid grid-cols-3 px-6 py-3 text-[11px] font-bold tracking-widest uppercase text-on-surface-variant bg-surface-container-low">
                  <span>Feature</span>
                  <span className="text-center">Others</span>
                  <span className="text-center text-secondary">Moha</span>
                </div>
                {[
                  { label: "Real test routes", others: "close", alt: false },
                  { label: "MTO rubric practice", others: "close", alt: true },
                  { label: "Free pickup", others: "close", alt: false },
                  { label: "Weekend slots", others: "remove", alt: true },
                  { label: "No hidden fees", others: "remove", alt: false },
                  { label: "Same-week slots", others: "close", alt: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-3 px-6 py-3.5 items-center ${row.alt ? "bg-surface-container-low/40" : ""}`}
                  >
                    <span className="text-[14px] text-on-surface">{row.label}</span>
                    <span className="text-center">
                      <span
                        className={`material-symbols-outlined text-[18px] ${row.others === "close" ? "text-error" : "text-on-surface-variant"}`}
                      >
                        {row.others}
                      </span>
                    </span>
                    <span className="text-center">
                      <span className="material-symbols-outlined filled text-secondary text-[18px]">
                        check_circle
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Vehicle Showcase ───── */}
      <section id="vehicles" className="py-16 lg:py-20 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface-variant text-[11px] font-bold tracking-widest uppercase"
              style={{ borderRadius: "0.25rem" }}
            >
              <span className="material-symbols-outlined text-[14px]">directions_car</span>
              Our Fleet
            </div>
            <h2
              className="font-bold"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "clamp(24px, 3vw, 32px)",
                letterSpacing: "-0.02em",
                color: "#0b1c30",
              }}
            >
              Test-Ready Vehicles
            </h2>
            <p className="text-on-surface-variant text-[15px] max-w-xl mx-auto">
              All vehicles are dual-controlled, fully insured, and maintained to DriveTest standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {fleet.map((v) => (
              <div
                key={v.id || v.name}
                className="bg-surface-container-lowest border border-outline-variant p-6 transition-shadow hover:shadow-md"
                style={{ borderRadius: "0.5rem" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div
                      className="font-bold text-[18px] text-on-surface"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {v.name}
                    </div>
                    <div className="text-on-surface-variant text-[13px] mt-1">{v.subtitle}</div>
                  </div>
                  {v.badgeText && (
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold"
                      style={{ borderRadius: "0.25rem" }}
                    >
                      <span className="material-symbols-outlined text-[12px]">{v.badgeIcon || "verified"}</span>
                      {v.badgeText}
                    </div>
                  )}
                </div>
                <div
                  className="h-32 bg-surface-container flex items-center justify-center mb-4"
                  style={{ borderRadius: "0.25rem" }}
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[64px]">
                    directions_car
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {v.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                      <span className="text-[13px] text-on-surface-variant">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Reviews ───── */}
      <section id="reviews" className="py-16 bg-surface overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface-variant text-[11px] font-bold tracking-widest uppercase"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-[14px]">star</span>
                Reviews
              </div>
              <h2
                className="font-bold mt-3"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "clamp(24px, 3vw, 32px)",
                  letterSpacing: "-0.02em",
                  color: "#0b1c30",
                }}
              >
                Students Who Passed First Try
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div
                className="text-[#0b1c30] font-bold text-[32px]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                4.9
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined filled text-[#f59e0b] text-[16px]">
                      star
                    </span>
                  ))}
                </div>
                <div className="text-on-surface-variant text-[12px]">from 85+ Google reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling ticker — duplicate for seamless loop */}
        <div className="overflow-hidden">
          <div className="review-track">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div
                key={i}
                className="w-72 flex-shrink-0 bg-surface-container-lowest border border-outline-variant p-5"
                style={{ borderRadius: "0.5rem" }}
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="material-symbols-outlined filled text-[#f59e0b] text-[14px]">
                      star
                    </span>
                  ))}
                </div>
                <p className="text-on-surface text-[14px] leading-[22px] mb-4">"{r.quote}"</p>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[12px]"
                    style={{ borderRadius: "50%" }}
                  >
                    {r.initials}
                  </div>
                  <div>
                    <div className="text-on-surface font-semibold text-[13px]">{r.name}</div>
                    <div className="text-on-surface-variant text-[11px]">{r.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="py-16 bg-primary-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 text-on-primary-container text-[11px] font-bold tracking-widest uppercase"
              style={{ borderRadius: "0.25rem" }}
            >
              <span className="material-symbols-outlined text-[14px]">military_tech</span>
              Road Test Readiness
            </div>
            <h2
              className="font-bold text-inverse-on-surface"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "clamp(28px, 4vw, 36px)",
                letterSpacing: "-0.025em",
              }}
            >
              Ready to Pass?<br />Let's Make It Official.
            </h2>
            <p className="text-on-primary-container text-[16px] leading-[26px]">
              Book your first lesson today. Most students are test-ready in 2–3 sessions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/book"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-secondary text-on-secondary font-semibold text-[15px] hover:bg-secondary/90 transition-colors"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                Book Your First Lesson
              </Link>
              <a
                href={phoneTel}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-on-primary-container/30 text-on-primary-container font-medium text-[15px] hover:bg-white/5 transition-colors"
                style={{ borderRadius: "0.25rem" }}
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                Call {settings.phone}
              </a>
            </div>
            <p className="text-on-primary-container/70 text-[13px]">
              Free cancellation · No credit card required to book
            </p>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="bg-inverse-surface py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3 group inline-flex cursor-pointer hover:opacity-95 transition-opacity">
                <div
                  className="w-7 h-7 bg-secondary-container flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ borderRadius: "0.25rem" }}
                >
                  <span className="material-symbols-outlined text-on-secondary-container text-[16px]">
                    directions_car
                  </span>
                </div>
                <span
                  className="text-inverse-on-surface font-bold text-[15px] group-hover:text-white transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Moha Driving
                </span>
              </Link>
              <p className="text-on-primary-container text-[13px] leading-[20px]">
                West Toronto's precision driving instructor. G2 & G road test prep with real route practice.
              </p>
            </div>
            <div>
              <div className="text-[#7c839b] text-[11px] font-bold tracking-widest uppercase mb-3">
                Services
              </div>
              <div className="space-y-2">
                {["G2 Road Test Prep", "G Road Test Prep", "Beginner Lessons", "Refresher Lessons"].map(
                  (s) => (
                    <Link
                      key={s}
                      href="/book"
                      className="block text-inverse-on-surface text-[13px] hover:text-[#82f5c1] transition-colors"
                    >
                      {s}
                    </Link>
                  )
                )}
              </div>
            </div>
            <div>
              <div className="text-[#7c839b] text-[11px] font-bold tracking-widest uppercase mb-3">
                Contact
              </div>
              <div className="space-y-2">
                <a
                  href={phoneTel}
                  className="flex items-center gap-2 text-inverse-on-surface text-[13px] hover:text-[#82f5c1] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  {settings.phone}
                </a>
                <div className="flex items-center gap-2 text-inverse-on-surface text-[13px]">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  West Toronto, Ontario
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-[#7c839b]">
            <p>© {new Date().getFullYear()} Moha Driving School. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>MTO Certified · West Toronto, ON</span>
              <span>·</span>
              <Link href="/instructor/login" className="hover:text-[#82f5c1] transition-colors">
                Instructor Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ───── Sticky mobile bar ───── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-inverse-surface border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <a
            href={phoneTel}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/20 text-inverse-on-surface text-[14px] font-medium"
            style={{ borderRadius: "0.25rem" }}
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            Call
          </a>
          <Link
            href="/book"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary text-on-secondary text-[14px] font-semibold"
            style={{ borderRadius: "0.25rem" }}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
