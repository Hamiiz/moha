"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getInstructorSettings,
  updateInstructorWeeklySchedule,
  getInstructorHubs,
  createInstructorHub,
  deleteInstructorHub,
  getPublicPackages,
  createInstructorPackage,
  deleteInstructorPackage,
  getInstructorBookings,
  deleteInstructorBooking,
} from "@/lib/api";
import {
  Clock,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Phone,
  Copy,
  Check,
  LogOut,
  Loader2,
  Shield,
  Tag,
  CheckCircle,
  User,
  Mail,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface DaySchedule {
  day:       "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  label:     string;
  startHour: number;
  endHour:   number;
  isOff:     boolean;
}

export default function InstructorDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "packages" | "hubs" | "bookings">("schedule");

  // Per-day schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Hubs state (Auto-Geocoded)
  const [hubs, setHubs] = useState<any[]>([]);
  const [newHubName, setNewHubName] = useState("");
  const [newHubAddress, setNewHubAddress] = useState("");
  const [addingHub, setAddingHub] = useState(false);

  // Packages state
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgBadge, setPkgBadge] = useState("");
  const [addingPkg, setAddingPkg] = useState(false);

  // Bookings state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const parseBookingDetails = (b: any) => {
    const desc = b.description || "";

    // Phone parsing
    const phoneMatch = desc.match(/Phone:\s*([^\n]+)/i) || desc.match(/(\+?\d[\d\s\-\(\)]{8,}\d)/);
    const phone = phoneMatch ? phoneMatch[1].trim() : "";

    // Email parsing
    const emailMatch = desc.match(/Email:\s*([^\n]+)/i);
    const email = emailMatch ? emailMatch[1].trim() : "";

    // Experience level parsing
    const levelMatch = desc.match(/Level:\s*([^\n]+)/i);
    const level = levelMatch ? levelMatch[1].trim() : "";

    // Student Name parsing
    let studentName = "";
    const nameMatch = desc.match(/Name:\s*([^\n]+)/i);
    if (nameMatch) {
      studentName = nameMatch[1].trim();
    } else if (b.summary) {
      studentName = b.summary.replace(/^Driving Lesson:\s*/i, "").trim();
    }

    // Google Maps URL parsing
    const directionsMatch = desc.match(/Directions:\s*(https?:\/\/[^\s\n]+)/i);
    const mapsUrl = directionsMatch
      ? directionsMatch[1].trim()
      : b.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.location)}`
      : null;

    // Total Price parsing
    const totalMatch = desc.match(/Total:\s*\$?([0-9.]+)/i);
    const total = totalMatch ? totalMatch[1] : null;

    const startTime = b.start ? new Date(b.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
    const endTime = b.end ? new Date(b.end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

    return {
      studentName: studentName || "Student",
      phone,
      email,
      level,
      total,
      location: b.location || "Pickup location specified",
      mapsUrl,
      timeRange: startTime && endTime ? `${startTime} - ${endTime}` : startTime || "Scheduled Slot",
    };
  };

  useEffect(() => {
    const stored = localStorage.getItem("instructor_token");
    if (!stored) {
      router.push("/instructor/login");
      return;
    }
    setToken(stored);
    loadSettings(stored);
    loadHubs(stored);
    loadPackages();
    loadBookings(stored, selectedDate);
  }, []);

  const loadSettings = async (tok: string) => {
    try {
      const data = await getInstructorSettings(tok);
      setWeeklySchedule(data.weeklySchedule || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadHubs = async (tok: string) => {
    try {
      const data = await getInstructorHubs(tok);
      setHubs(data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadPackages = async () => {
    try {
      const data = await getPublicPackages();
      setPackagesList(data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadBookings = async (tok: string, date: string) => {
    setLoadingBookings(true);
    try {
      const data = await getInstructorBookings(tok, date);
      setBookings(data.bookings || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleSaveWeeklySchedule = async () => {
    if (!token) return;
    setSavingSchedule(true);
    try {
      await updateInstructorWeeklySchedule(token, weeklySchedule);
      toast.success("Per-day working hours updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDayChange = (index: number, field: keyof DaySchedule, value: any) => {
    setWeeklySchedule((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index]!, [field]: value };
      }
      return next;
    });
  };

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddingHub(true);
    try {
      const created = await createInstructorHub(token, {
        name: newHubName,
        address: newHubAddress,
      });
      setHubs((prev) => [...prev, created]);
      setNewHubName("");
      setNewHubAddress("");
      toast.success("Pickup Hub added & auto-geocoded successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingHub(false);
    }
  };

  const handleDeleteHub = async (id: string) => {
    if (!token) return;
    try {
      await deleteInstructorHub(token, id);
      setHubs((prev) => prev.filter((h) => h.id !== id));
      toast.success("Pickup Hub removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddingPkg(true);
    try {
      const created = await createInstructorPackage(token, {
        title: pkgTitle,
        description: pkgDesc,
        basePrice: parseFloat(pkgPrice),
        badge: pkgBadge.trim() || undefined,
      });
      setPackagesList((prev) => [...prev, created]);
      setPkgTitle("");
      setPkgDesc("");
      setPkgPrice("");
      setPkgBadge("");
      toast.success("Package added successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingPkg(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!token) return;
    try {
      await deleteInstructorPackage(token, id);
      setPackagesList((prev) => prev.filter((p) => p.id !== id));
      toast.success("Package deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!token || !confirm("Cancel this booking?")) return;
    try {
      await deleteInstructorBooking(token, id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success("Booking cancelled");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("instructor_token");
    router.push("/instructor/login");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">Instructor Management Portal</h1>
          </div>
          <p className="text-sm text-slate-500">
            Customize daily working hours, manage pricing & packages, and auto-geocode pickup hubs.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "schedule" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Clock className="h-4 w-4 inline mr-1.5" />
          Per-Day Working Hours
        </button>

        <button
          onClick={() => setActiveTab("packages")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "packages" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Tag className="h-4 w-4 inline mr-1.5" />
          Prices & Packages ({packagesList.length})
        </button>

        <button
          onClick={() => setActiveTab("hubs")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "hubs" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <MapPin className="h-4 w-4 inline mr-1.5" />
          Pickup Hubs ({hubs.length})
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "bookings" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-1.5" />
          Daily Schedule
        </button>
      </div>

      {/* TAB 1: PER-DAY WORKING HOURS */}
      {activeTab === "schedule" && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Per-Day Working Hours & Days Off</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize working start & end times for each day of the week, or toggle a day off.
            </p>
          </div>

          <div className="space-y-3">
            {weeklySchedule.map((day, idx) => (
              <div
                key={day.day}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 ${
                  day.isOff ? "bg-slate-100/60 border-slate-200 opacity-70" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3 w-36 shrink-0">
                  <input
                    type="checkbox"
                    id={`off-${day.day}`}
                    checked={!day.isOff}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDayChange(idx, "isOff", !e.target.checked)}
                    className="h-4 w-4 accent-brand-600 rounded"
                  />
                  <label htmlFor={`off-${day.day}`} className="font-bold text-slate-800 text-sm cursor-pointer">
                    {day.label}
                  </label>
                </div>

                {day.isOff ? (
                  <span className="text-xs font-semibold text-slate-400 italic">Day Off (No slots generated)</span>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <select
                      value={day.startHour}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDayChange(idx, "startHour", Number(e.target.value))}
                      className="rounded-lg border border-slate-300 p-2 text-xs font-semibold"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00 ({i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`})
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400">to</span>
                    <select
                      value={day.endHour}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDayChange(idx, "endHour", Number(e.target.value))}
                      className="rounded-lg border border-slate-300 p-2 text-xs font-semibold"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00 ({i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleSaveWeeklySchedule} disabled={savingSchedule} className="w-full">
            {savingSchedule ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Per-Day Schedule"}
          </Button>
        </Card>
      )}

      {/* TAB 2: PRICES & PACKAGES */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Lesson Package / Rate</h3>
            <form onSubmit={handleAddPackage} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pkgTitle">Package Title</Label>
                  <Input
                    id="pkgTitle"
                    placeholder="e.g., Highway Intensive 90-Min"
                    value={pkgTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPkgTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pkgPrice">Price (CAD $)</Label>
                  <Input
                    id="pkgPrice"
                    type="number"
                    placeholder="e.g., 95"
                    value={pkgPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPkgPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pkgDesc">Description</Label>
                <Input
                  id="pkgDesc"
                  placeholder="e.g., 90-minute session focused on 401 highway merging and high-speed lane changes."
                  value={pkgDesc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPkgDesc(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="pkgBadge">Optional Badge / Promo Tag</Label>
                <Input
                  id="pkgBadge"
                  placeholder="e.g., Popular, Save $50, Most Recommended"
                  value={pkgBadge}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPkgBadge(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={addingPkg} className="w-full">
                {addingPkg ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Package"}
              </Button>
            </form>
          </Card>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Active Packages Shown to Students</h4>
            {packagesList.map((pkg) => (
              <Card key={pkg.id} className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{pkg.title}</span>
                    {pkg.badge && <Badge variant="success">{pkg.badge}</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{pkg.description}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-extrabold text-slate-900 text-lg">${pkg.basePrice} CAD</span>
                  <Button variant="danger" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUTO-GEOCODED PICKUP HUBS */}
      {activeTab === "hubs" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add Pickup Hub (Auto-Geocoded)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simply type the hub name and street address. Latitude and longitude are calculated automatically!
              </p>
            </div>

            <form onSubmit={handleAddHub} className="space-y-3">
              <div>
                <Label htmlFor="hubName">Hub Name</Label>
                <Input
                  id="hubName"
                  placeholder="e.g., Dufferin Mall Pickup Point"
                  value={newHubName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHubName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="hubAddress">Street Address</Label>
                <Input
                  id="hubAddress"
                  placeholder="e.g., 900 Dufferin St, Toronto, ON"
                  value={newHubAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHubAddress(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={addingHub} className="w-full">
                {addingHub ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add & Auto-Geocode Hub"}
              </Button>
            </form>
          </Card>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Active Meeting Hubs</h4>
            {hubs.map((hub) => (
              <Card key={hub.id} className="flex items-center justify-between p-4">
                <div>
                  <h5 className="font-bold text-slate-900">{hub.name}</h5>
                  <p className="text-xs text-slate-500">{hub.address}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDeleteHub(hub.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DAILY SCHEDULE */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Booked Driving Lessons</h3>
              <p className="text-xs text-slate-500">Tap phone to dial student or open direct pickup maps directions.</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="dateSelect" className="mb-0 text-xs font-bold text-slate-700">Date:</Label>
              <input
                id="dateSelect"
                type="date"
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSelectedDate(e.target.value);
                  if (token) loadBookings(token, e.target.value);
                }}
                className="rounded-xl border border-slate-300 p-2 text-xs font-semibold bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {loadingBookings && (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm font-medium">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              <span>Loading scheduled lessons...</span>
            </div>
          )}

          {!loadingBookings && bookings.length === 0 && (
            <Card className="text-center py-12 text-slate-400 space-y-2">
              <Calendar className="h-10 w-10 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">No lessons scheduled for {selectedDate}</p>
              <p className="text-xs text-slate-400">All slots for this day are currently open.</p>
            </Card>
          )}

          {!loadingBookings &&
            bookings.map((b) => {
              const details = parseBookingDetails(b);
              const isCopied = copiedPhoneId === b.id;

              return (
                <Card
                  key={b.id}
                  className="p-5 space-y-4 border-slate-200 shadow-xs hover:shadow-md transition-all bg-white rounded-2xl"
                >
                  {/* Top Header: Time Slot & Level */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 font-extrabold text-xs tracking-wide">
                        <Clock className="h-3.5 w-3.5 text-brand-600" />
                        {details.timeRange}
                      </span>
                      {details.level && (
                        <Badge variant="default" className="capitalize text-xs font-bold border-brand-200 text-brand-800 bg-brand-50/50">
                          {details.level}
                        </Badge>
                      )}
                    </div>
                    {details.total && (
                      <span className="font-black text-slate-900 text-base">
                        ${details.total} <span className="text-xs text-slate-400 font-normal">CAD</span>
                      </span>
                    )}
                  </div>

                  {/* Main Grid: Student Info & Phone Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Student Details & Instant Call */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                          <User className="h-4 w-4 text-brand-600" />
                        </div>
                        <span>{details.studentName}</span>
                      </div>

                      {details.phone ? (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Contact Phone</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* INSTANT CALL BUTTON */}
                            <a
                              href={`tel:${details.phone}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-sm shrink-0"
                            >
                              <Phone className="h-3.5 w-3.5 fill-current" />
                              <span>Call Client ({details.phone})</span>
                            </a>

                            {/* COPY PHONE BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(details.phone);
                                setCopiedPhoneId(b.id);
                                toast.success("Phone number copied!");
                                setTimeout(() => setCopiedPhoneId(null), 2000);
                              }}
                              className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
                              title="Copy Phone"
                            >
                              {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No phone number provided</p>
                      )}

                      {details.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{details.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Pickup Address & Navigation */}
                    <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                          <span>Pickup Address</span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed pl-5">
                          {details.location}
                        </p>
                      </div>

                      {details.mapsUrl && (
                        <a
                          href={details.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-brand-500 text-brand-700 hover:text-brand-800 font-bold text-xs transition-all shadow-2xs hover:shadow-xs mt-2"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-brand-600" />
                          <span>Open Google Maps Directions</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-mono">ID: {b.id.slice(0, 14)}</span>
                    <Button variant="danger" size="sm" onClick={() => handleCancelBooking(b.id)} className="h-8 text-xs font-semibold px-3">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Cancel Lesson
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
