"use client";

import { useState } from "react";
import { Shield, Phone, MapPin, Copy, X, Check } from "lucide-react";
import { toast } from "sonner";

interface ScheduleItem {
  id: string;
  time: string;
  student: string;
  phone: string;
  address: string;
  mapsUrl: string;
}

const MOCK_SCHEDULE: ScheduleItem[] = [
  {
    id: "1",
    time: "09:00 AM - 10:30 AM",
    student: "Alice Smith",
    phone: "416-555-0123",
    address: "300 Borough Dr, Scarborough",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=300+Borough+Dr+Scarborough",
  },
  {
    id: "2",
    time: "11:30 AM - 01:00 PM",
    student: "Bob Johnson",
    phone: "647-555-0199",
    address: "100 City Centre Dr, Mississauga",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=100+City+Centre+Dr+Mississauga",
  },
];

export function InstructorDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    toast.success("Student phone number copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Floating Action Badge Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl hover:bg-slate-800 transition-all active:scale-95 border border-slate-700"
      >
        <Shield className="h-4 w-4 text-brand-500" />
        <span>Instructor Drawer</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
        />
      )}

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Today's Schedule & Quick Actions</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Instructor Shortcuts
              </p>
              <a
                href="https://business.google.com/n/15174751428373661115/profile?hl=en&fid=6617246450351903208"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Google Business Profile</span>
              </a>
            </div>

            {MOCK_SCHEDULE.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md">
                    {item.time}
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">{item.student}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.phone}</span>
                  </div>

                  <button
                    onClick={() => handleCopyPhone(item.phone, item.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedId === item.id ? "Copied" : "Copy Phone"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[220px]">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.address}</span>
                  </div>

                  <a
                    href={item.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-600 hover:underline shrink-0"
                  >
                    Maps Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
