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
  updateInstructorSettings,
  updateInstructorWeeklySchedule,
  getInstructorHubs,
  createInstructorHub,
  deleteInstructorHub,
  getPublicPackages,
  createInstructorPackage,
  deleteInstructorPackage,
  getInstructorFleet,
  createInstructorVehicle,
  deleteInstructorVehicle,
  getInstructorBookings,
  deleteInstructorBooking,
  syncGoogleReviews,
  getPublicReviews,
  updateInstructorReviews,
  deleteInstructorReview,
} from "@/lib/api";
import type { GoogleReviewItem, ReviewsData } from "@/lib/types";
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
  Settings,
  Car,
  AlertCircle,
  Star,
  RefreshCw,
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
  const [activeTab, setActiveTab] = useState<"settings" | "schedule" | "packages" | "fleet" | "hubs" | "bookings">("settings");

  // Site Settings state
  const [siteSettings, setSiteSettings] = useState({
    phone:                 "(647) 912-7040",
    email:                 "mohadriving@gmail.com",
    instructorName:        "Moha",
    bannerNotice:          "",
    baseAddress:           "1002 King Street West, Toronto, ON M6K 1J7",
    bufferMinutes:         30,
    lessonDurationMinutes: 90,
    googlePlaceId:         "",
    hourlyRates: {
      g2:        55,
      g:         60,
      beginner:  50,
      refresher: 55,
    },
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncingReviews, setSyncingReviews] = useState(false);

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

  // Fleet state (No image upload required)
  const [fleetList, setFleetList] = useState<any[]>([]);
  const [vehName, setVehName] = useState("");
  const [vehSub, setVehSub] = useState("");
  const [vehBadge, setVehBadge] = useState("");
  const [vehFeatures, setVehFeatures] = useState("");
  const [addingVehicle, setAddingVehicle] = useState(false);

  // Bookings state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTime, setNewReviewTime] = useState("1 week ago");
  const [newReviewText, setNewReviewText] = useState("");
  const [addingReview, setAddingReview] = useState(false);

  const parseBookingDetails = (b: any) => {
    const desc = b.description || "";

    const phoneMatch = desc.match(/Phone:\s*([^\n]+)/i) || desc.match(/(\+?\d[\d\s\-\(\)]{8,}\d)/);
    const phone = phoneMatch ? phoneMatch[1].trim() : "";

    const emailMatch = desc.match(/Email:\s*([^\n]+)/i);
    const email = emailMatch ? emailMatch[1].trim() : "";

    const levelMatch = desc.match(/Level:\s*([^\n]+)/i);
    const level = levelMatch ? levelMatch[1].trim() : "";

    let studentName = "";
    const nameMatch = desc.match(/Name:\s*([^\n]+)/i);
    if (nameMatch) {
      studentName = nameMatch[1].trim();
    } else if (b.summary) {
      studentName = b.summary.replace(/^Driving Lesson:\s*/i, "").trim();
    }

    const directionsMatch = desc.match(/Directions:\s*(https?:\/\/[^\s\n]+)/i);
    const mapsUrl = directionsMatch
      ? directionsMatch[1].trim()
      : b.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.location)}`
      : null;

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
    loadFleet(stored);
    loadHubs(stored);
    loadPackages();
    loadReviewsData();
    loadBookings(stored, selectedDate);
  }, []);

  const loadReviewsData = async () => {
    try {
      const data = await getPublicReviews();
      if (data) setReviewsData(data);
    } catch {
      // ignore
    }
  };

  const handleSyncReviews = async () => {
    if (!token) return;
    setSyncingReviews(true);
    try {
      const res = await syncGoogleReviews(token, true);
      if (res.success) {
        toast.success(res.message);
        await loadReviewsData();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync reviews");
    } finally {
      setSyncingReviews(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newReviewAuthor.trim() || !newReviewText.trim()) return;
    setAddingReview(true);
    try {
      const newReview: GoogleReviewItem = {
        id: `custom-${Date.now()}`,
        authorName: newReviewAuthor.trim(),
        rating: Number(newReviewRating) || 5,
        relativeTime: newReviewTime.trim() || "Recent",
        text: newReviewText.trim(),
        initials: newReviewAuthor.trim().charAt(0).toUpperCase() || "U",
      };
      const existing = reviewsData?.reviews || [];
      const updatedList = [newReview, ...existing];
      const updated = await updateInstructorReviews(token, { reviews: updatedList });
      setReviewsData(updated);
      setNewReviewAuthor("");
      setNewReviewText("");
      setNewReviewRating(5);
      setNewReviewTime("1 week ago");
      setShowAddReviewForm(false);
      toast.success("New review added live to the homepage!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add review");
    } finally {
      setAddingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!token) return;
    try {
      const updated = await deleteInstructorReview(token, id);
      setReviewsData(updated);
      toast.success("Review deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete review");
    }
  };

  const loadSettings = async (tok: string) => {
    try {
      const data = await getInstructorSettings(tok);
      setWeeklySchedule(data.weeklySchedule || []);
      setSiteSettings({
        phone:                 data.phone || "(647) 912-7040",
        email:                 data.email || "mohadriving@gmail.com",
        instructorName:        data.instructorName || "Moha",
        bannerNotice:          data.bannerNotice || "",
        baseAddress:           data.baseAddress || "1002 King Street West, Toronto, ON M6K 1J7",
        bufferMinutes:         data.bufferMinutes ?? 30,
        lessonDurationMinutes: data.lessonDurationMinutes ?? 90,
        googlePlaceId:         data.googlePlaceId || "",
        hourlyRates: {
          g2:        data.hourlyRates?.g2 ?? 55,
          g:         data.hourlyRates?.g ?? 60,
          beginner:  data.hourlyRates?.beginner ?? 50,
          refresher: data.hourlyRates?.refresher ?? 55,
        },
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadFleet = async (tok: string) => {
    try {
      const data = await getInstructorFleet(tok);
      setFleetList(data || []);
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

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingSettings(true);
    try {
      await updateInstructorSettings(token, siteSettings);
      toast.success("Site settings & pricing rates updated live!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingSettings(false);
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

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddingVehicle(true);
    try {
      const featuresArray = vehFeatures
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const created = await createInstructorVehicle(token, {
        name: vehName,
        subtitle: vehSub,
        badgeText: vehBadge.trim() || undefined,
        features: featuresArray.length > 0 ? featuresArray : ["Dual controls", "Automatic trans."],
      });
      setFleetList((prev) => [...prev, created]);
      setVehName("");
      setVehSub("");
      setVehBadge("");
      setVehFeatures("");
      toast.success("Vehicle added to training fleet!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!token) return;
    try {
      await deleteInstructorVehicle(token, id);
      setFleetList((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vehicle removed from fleet");
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
            <Shield className="h-6 w-6 text-secondary" />
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Instructor Management Portal
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage live pricing, phone number, vehicle fleet, travel buffer, and auto-geocoded hubs.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "settings" ? "bg-secondary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Settings className="h-4 w-4 inline mr-1.5" />
          Site Settings & Rates
        </button>

        <button
          onClick={() => setActiveTab("fleet")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "fleet" ? "bg-secondary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Car className="h-4 w-4 inline mr-1.5" />
          Vehicle Fleet ({fleetList.length})
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "schedule" ? "bg-secondary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Clock className="h-4 w-4 inline mr-1.5" />
          Working Hours
        </button>

        <button
          onClick={() => setActiveTab("packages")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "packages" ? "bg-secondary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Tag className="h-4 w-4 inline mr-1.5" />
          Lesson Packages ({packagesList.length})
        </button>

        <button
          onClick={() => setActiveTab("hubs")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "hubs" ? "bg-secondary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <MapPin className="h-4 w-4 inline mr-1.5" />
          Pickup Hubs ({hubs.length})
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "bookings" ? "bg-secondary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-1.5" />
          Daily Schedule
        </button>
      </div>

      {/* ───── TAB 1: SITE SETTINGS & RATES ───── */}
      {activeTab === "settings" && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Live Website Information & Pricing Rates</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates here immediately sync to the homepage fare calculator, call buttons, and dispatch buffer.
            </p>
          </div>

          <form onSubmit={handleSaveSiteSettings} className="space-y-5">
            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Contact Phone Number (Displayed to Students)</Label>
                <Input
                  id="phone"
                  value={siteSettings.phone}
                  onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                  placeholder="(647) 912-7040"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={siteSettings.email}
                  onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                  placeholder="mohadriving@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Travel Buffer Gap & Base Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buffer">Pickup Gap / Travel Buffer (Minutes between lessons)</Label>
                <Input
                  id="buffer"
                  type="number"
                  min="0"
                  max="120"
                  value={siteSettings.bufferMinutes}
                  onChange={(e) => setSiteSettings({ ...siteSettings, bufferMinutes: Number(e.target.value) })}
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  e.g., 30 mins means a 30-min buffer gap is reserved between each booked lesson.
                </span>
              </div>
              <div>
                <Label htmlFor="baseAddress">Main Training Hub Address</Label>
                <Input
                  id="baseAddress"
                  value={siteSettings.baseAddress}
                  onChange={(e) => setSiteSettings({ ...siteSettings, baseAddress: e.target.value })}
                  placeholder="1002 King Street West, Toronto, ON"
                  required
                />
              </div>
            </div>

            {/* Hourly Fare Estimator Rates */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Fare Calculator Hourly Rates (CAD $/hour)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="rateG2">G2 Road Test Prep</Label>
                  <Input
                    id="rateG2"
                    type="number"
                    value={siteSettings.hourlyRates.g2}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        hourlyRates: { ...siteSettings.hourlyRates, g2: Number(e.target.value) },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rateG">G Road Test Prep</Label>
                  <Input
                    id="rateG"
                    type="number"
                    value={siteSettings.hourlyRates.g}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        hourlyRates: { ...siteSettings.hourlyRates, g: Number(e.target.value) },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rateBeg">Beginner Lessons</Label>
                  <Input
                    id="rateBeg"
                    type="number"
                    value={siteSettings.hourlyRates.beginner}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        hourlyRates: { ...siteSettings.hourlyRates, beginner: Number(e.target.value) },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rateRef">Refresher Lessons</Label>
                  <Input
                    id="rateRef"
                    type="number"
                    value={siteSettings.hourlyRates.refresher}
                    onChange={(e) =>
                      setSiteSettings({
                        ...siteSettings,
                        hourlyRates: { ...siteSettings.hourlyRates, refresher: Number(e.target.value) },
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Banner Notice */}
            <div>
              <Label htmlFor="bannerNotice">Top Alert Banner Notice (Optional)</Label>
              <Input
                id="bannerNotice"
                value={siteSettings.bannerNotice}
                onChange={(e) => setSiteSettings({ ...siteSettings, bannerNotice: e.target.value })}
                placeholder="e.g., Note: Limited slots available for this weekend's DriveTest warmup sessions."
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Leave empty to hide the announcement banner on the homepage.
              </span>
            </div>

            {/* Google Business Reviews Integration */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <h4 className="font-bold text-slate-800 text-sm">Google Business Reviews</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddReviewForm(!showAddReviewForm)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-md hover:bg-emerald-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {showAddReviewForm ? "Close Form" : "Add Review"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncReviews}
                    disabled={syncingReviews}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${syncingReviews ? "animate-spin" : ""}`} />
                    {syncingReviews ? "Syncing..." : "Sync from Google Now"}
                  </button>
                </div>
              </div>

              {/* Live Badge */}
              {reviewsData && (
                <div className="flex flex-wrap items-center gap-2 py-1.5 px-3 bg-white/90 rounded-lg border border-emerald-200/60 text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    {reviewsData.rating.toFixed(1)}★
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">{reviewsData.userRatingsTotal}+ Google Reviews</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-medium">{reviewsData.reviews.length} Active Cards on Homepage</span>
                  {reviewsData.lastSyncedAt && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 text-[11px]">
                        Last checked: {new Date(reviewsData.lastSyncedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="googlePlaceId">Google Place ID (Unique Business Identifier)</Label>
                <Input
                  id="googlePlaceId"
                  value={siteSettings.googlePlaceId || ""}
                  onChange={(e) => setSiteSettings({ ...siteSettings, googlePlaceId: e.target.value })}
                  placeholder="e.g., ChIJ... (from Google Place ID Finder)"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Remember to click "Save Site Settings & Rates" below if you change your Place ID.</span>
                  <a
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    Find your Place ID
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Add Custom / Google Review Form */}
              {showAddReviewForm && (
                <div className="p-3.5 bg-white rounded-lg border border-emerald-200 space-y-3">
                  <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    Add Real Student Review / Testimonial
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <Label htmlFor="revAuthor" className="text-[11px]">Student Name</Label>
                      <Input
                        id="revAuthor"
                        placeholder="e.g. Sarah J."
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="revRating" className="text-[11px]">Rating (1–5 Stars)</Label>
                      <Input
                        id="revRating"
                        type="number"
                        min="1"
                        max="5"
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="revTime" className="text-[11px]">Relative Time</Label>
                      <Input
                        id="revTime"
                        placeholder="e.g. 2 weeks ago"
                        value={newReviewTime}
                        onChange={(e) => setNewReviewTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="revText" className="text-[11px]">Review Text / Quote</Label>
                    <textarea
                      id="revText"
                      rows={2}
                      placeholder="Paste the student's review from your Google Business Profile..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddReviewForm(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddReview}
                      disabled={addingReview}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {addingReview ? "Saving..." : "Add to Homepage"}
                    </button>
                  </div>
                </div>
              )}

              {/* Active Reviews List */}
              {reviewsData && reviewsData.reviews.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Currently Displayed Reviews ({reviewsData.reviews.length})
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {reviewsData.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800">{rev.authorName}</span>
                            <div className="flex gap-0.5 text-amber-500">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-500" />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400">{rev.relativeTime}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] line-clamp-2 italic">"{rev.text}"</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove this review card"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={savingSettings} className="w-full">
              {savingSettings ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Site Settings & Rates"}
            </Button>
          </form>
        </Card>
      )}

      {/* ───── TAB 2: VEHICLE FLEET MANAGEMENT ───── */}
      {activeTab === "fleet" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add Vehicle to Fleet (No Images Required)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vehicles appear dynamically on the homepage with dual-control test-ready specifications.
              </p>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vehName">Vehicle Make & Model</Label>
                  <Input
                    id="vehName"
                    placeholder="e.g. 2024 Hyundai Elantra"
                    value={vehName}
                    onChange={(e) => setVehName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehSub">Role / Subtitle</Label>
                  <Input
                    id="vehSub"
                    placeholder="e.g. Dual-control highway training"
                    value={vehSub}
                    onChange={(e) => setVehSub(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vehBadge">Badge / Tag (Optional)</Label>
                  <Input
                    id="vehBadge"
                    placeholder="e.g. Most Popular, DriveTest Ready"
                    value={vehBadge}
                    onChange={(e) => setVehBadge(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vehFeatures">Features List (Comma-separated)</Label>
                  <Input
                    id="vehFeatures"
                    placeholder="Automatic trans., Dual controls, 360° camera, A/C"
                    value={vehFeatures}
                    onChange={(e) => setVehFeatures(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={addingVehicle} className="w-full">
                {addingVehicle ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Vehicle to Fleet"}
              </Button>
            </form>
          </Card>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Active Training Vehicles ({fleetList.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fleetList.map((v) => (
                <Card key={v.id} className="p-4 space-y-3 border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-base">{v.name}</div>
                      <div className="text-xs text-slate-500">{v.subtitle}</div>
                    </div>
                    {v.badgeText && (
                      <Badge variant="success" className="text-xs">
                        {v.badgeText}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {v.features?.map((f: string, i: number) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        ✓ {f}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Button variant="danger" size="sm" onClick={() => handleDeleteVehicle(v.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───── TAB 3: PER-DAY WORKING HOURS ───── */}
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
                    className="h-4 w-4 accent-secondary rounded"
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

      {/* ───── TAB 4: PRICES & PACKAGES ───── */}
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

      {/* ───── TAB 5: AUTO-GEOCODED PICKUP HUBS ───── */}
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

      {/* ───── TAB 6: DAILY SCHEDULE ───── */}
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
              <Loader2 className="h-5 w-5 animate-spin text-secondary" />
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary-container/20 text-secondary font-extrabold text-xs tracking-wide">
                        <Clock className="h-3.5 w-3.5 text-secondary" />
                        {details.timeRange}
                      </span>
                      {details.level && (
                        <Badge variant="default" className="capitalize text-xs font-bold border-secondary-container/40 text-secondary bg-secondary-container/10">
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
                          <User className="h-4 w-4 text-secondary" />
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
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/90 active:scale-95 text-white font-extrabold text-xs transition-all shadow-sm shrink-0"
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
                              {isCopied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
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
                          <MapPin className="h-3.5 w-3.5 text-secondary shrink-0" />
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
                          className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-secondary text-secondary font-bold text-xs transition-all shadow-2xs hover:shadow-xs mt-2"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-secondary" />
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
