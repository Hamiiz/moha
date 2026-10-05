"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateLocation } from "@/lib/api";
import type { LocationValidateResponse } from "@/lib/types";
import { MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StepLocationProps {
  onComplete: (data: {
    postalCode: string;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    distanceKm: number;
    surcharge: number;
  }) => void;
  initialData?: any;
}

export function StepLocation({ onComplete, initialData }: StepLocationProps) {
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || "");
  const [address, setAddress] = useState(initialData?.pickupAddress || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocationValidateResponse | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode.trim()) {
      toast.error("Please enter a Canadian postal code");
      return;
    }

    setLoading(true);
    try {
      const res = await validateLocation(postalCode);
      setResult(res);

      if (res.isWithinServiceArea) {
        toast.success(`Service available! ${res.distanceKm}km from instructor base.`);
      } else {
        toast.warning("Outside primary door-to-door area. Please select a pickup hub.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to validate postal code");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmHub = (hub: { name: string; address: string; lat: number; lng: number }) => {
    onComplete({
      postalCode: postalCode.toUpperCase(),
      pickupAddress: `${hub.name} (${hub.address})`,
      pickupLat: hub.lat,
      pickupLng: hub.lng,
      distanceKm: 20,
      surcharge: 10,
    });
  };

  const handleConfirmStandard = () => {
    if (!result || !result.location) return;
    const finalAddr = address.trim() || result.location.displayName;

    onComplete({
      postalCode: postalCode.toUpperCase(),
      pickupAddress: finalAddr,
      pickupLat: result.location.lat,
      pickupLng: result.location.lng,
      distanceKm: result.distanceKm,
      surcharge: result.surcharge || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">1. Pickup Location & Eligibility</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter your Canadian postal code to check instructor service area and travel surcharge.
        </p>
      </div>

      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <Label htmlFor="postalCode">Canadian Postal Code</Label>
          <div className="flex gap-2">
            <Input
              id="postalCode"
              placeholder="e.g. M5V 2T6"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
              className="uppercase font-medium tracking-wider"
              maxLength={7}
              required
            />
            <Button type="submit" disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check Availability"}
            </Button>
          </div>
        </div>
      </form>

      {/* Validation Result */}
      {result && result.isWithinServiceArea && (
        <Card className="border-emerald-200 bg-emerald-50/50 space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-emerald-900">Door-to-Door Service Available</h3>
                <Badge variant="success">${result.surcharge} Surcharge</Badge>
              </div>
              <p className="text-sm text-emerald-700 mt-0.5">
                Distance: <span className="font-semibold">{result.distanceKm} km</span> from Toronto Downtown base.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="pickupStreet">Street Address or Pickup Notes (Optional)</Label>
            <Input
              id="pickupStreet"
              placeholder={result.location?.displayName || "e.g., 100 Queen St W, Front Entrance"}
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            />
          </div>

          <Button onClick={handleConfirmStandard} className="w-full">
            Continue with this Location
          </Button>
        </Card>
      )}

      {/* Fallback Pickup Hubs */}
      {result && !result.isWithinServiceArea && (
        <Card className="border-amber-200 bg-amber-50/30 space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Outside Direct Pickup Zone ({result.distanceKm} km)</h3>
              <p className="text-sm text-amber-700 mt-0.5">
                We can still conduct your lesson! Please select one of our designated meeting hubs below:
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {result.availablePickupHubs?.map((hub: { name: string; address: string; lat: number; lng: number }) => (
              <div
                key={hub.name}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-brand-500 transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{hub.name}</div>
                  <div className="text-xs text-slate-500">{hub.address}</div>
                </div>
                <Button size="sm" onClick={() => handleConfirmHub(hub)}>
                  Select Hub
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
