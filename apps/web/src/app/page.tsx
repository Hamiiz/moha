import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, MapPin, Calendar, ArrowRight } from "lucide-react";

export default function HomePage() {
  const googleBusinessUrl = "https://business.google.com/n/15174751428373661115/profile?hl=en&fid=6617246450351903208";
  const googleMapEmbedUrl = "https://maps.google.com/maps?q=1002+King+Street+West,+Toronto,+ON+M6K+1J7,+Canada&output=embed";

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            <ShieldCheck className="h-4 w-4" /> Certified Instructor Service
          </span>

          <a
            href={googleBusinessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <span className="text-amber-500">★ 5.0</span>
            <span>Google Business Profile</span>
          </a>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Master the Road with Confidence in Toronto
        </h1>

        <p className="text-slate-600 text-base sm:text-lg">
          Book 90-minute intensive driving sessions with instant door-to-door pickup calculation from our main location at <span className="font-semibold text-slate-800">1002 King St W</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/book">
            <Button size="lg" className="gap-2 shadow-lg shadow-brand-600/20 w-full sm:w-auto">
              <span>Book Your Lesson Now</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <a href={googleBusinessUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
              <MapPin className="h-5 w-5 text-brand-600" />
              <span>View Google Business</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center p-6 space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-brand-50 text-brand-600 mb-1">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900">Instant Geocoding</h3>
          <p className="text-xs text-slate-500">
            Enter your Canadian postal code for instant pickup validation relative to 1002 King St W.
          </p>
        </Card>

        <Card className="text-center p-6 space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-1">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900">Buffered Slots</h3>
          <p className="text-xs text-slate-500">
            Live Google Calendar sync ensuring 30-minute travel buffers so lessons always start on time.
          </p>
        </Card>

        <Card className="text-center p-6 space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-1">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900">Transparent Pricing</h3>
          <p className="text-xs text-slate-500">
            Clear itemized breakdown of base rates and distance surcharges before you lock in your booking.
          </p>
        </Card>
      </div>

      {/* Embedded Google Business Profile Map */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Main Pickup & Training Hub</h3>
            <p className="text-xs text-slate-500">1002 King Street West, Toronto, ON M6K 1J7</p>
          </div>
          <a
            href={googleBusinessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>Open Google Business Profile</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-[320px]">
          <iframe
            src={googleMapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Business Profile Main Location"
          />
        </div>
      </Card>
    </div>
  );
}
