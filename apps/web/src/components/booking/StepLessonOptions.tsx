"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CostSummaryCard } from "@/components/CostSummaryCard";
import { getPublicPackages } from "@/lib/api";
import type { LessonTypeOption } from "@/lib/types";

interface StepLessonOptionsProps {
  surcharge: number;
  distanceKm: number;
  pickupAddress: string;
  onComplete: (data: { lessonType: string; lessonTitle: string; basePrice: number }) => void;
  onBack: () => void;
  initialData?: any;
}

export function StepLessonOptions({
  surcharge,
  distanceKm,
  pickupAddress,
  onComplete,
  onBack,
  initialData,
}: StepLessonOptionsProps) {
  const [packages, setPackages] = useState<LessonTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(initialData?.lessonType || "");

  useEffect(() => {
    getPublicPackages()
      .then((data) => {
        setPackages(data);
        if (!selectedId && data[0]) {
          setSelectedId(data[0].id);
        }
      })
      .catch(() => {
        // Fallback default if API offline
        const defaults: LessonTypeOption[] = [
          { id: "single", title: "Single 90-Minute Session", description: "Standard intensive single session.", basePrice: 90 },
          { id: "pass5", title: "5-Lesson Value Package", description: "Complete package covering city driving & test prep.", basePrice: 400, badge: "Save $50" },
        ];
        setPackages(defaults);
        if (!selectedId) setSelectedId(defaults[0]!.id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedOption = packages.find((o) => o.id === selectedId) || packages[0] || {
    id: "single",
    title: "Single 90-Minute Session",
    description: "Standard session",
    basePrice: 90,
  };

  const handleNext = () => {
    onComplete({
      lessonType: selectedOption.id,
      lessonTitle: selectedOption.title,
      basePrice: selectedOption.basePrice,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">2. Select Lesson Package</h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose a lesson package tailored to your current driving experience.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {packages.map((opt) => {
            const isSelected = opt.id === selectedId;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedId(opt.id)}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? "border-brand-600 bg-brand-50/20 ring-2 ring-brand-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{opt.title}</span>
                      {opt.badge && <Badge variant="success">{opt.badge}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{opt.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-slate-900 text-lg">${opt.basePrice}</span>
                    <span className="text-xs text-slate-400 block">CAD</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transparent Live Cost Breakdown */}
      <CostSummaryCard
        lessonTitle={selectedOption.title}
        basePrice={selectedOption.basePrice}
        surcharge={surcharge}
        distanceKm={distanceKm}
        pickupAddress={pickupAddress}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-1/3">
          Back
        </Button>
        <Button onClick={handleNext} disabled={loading} className="w-2/3">
          Continue to Schedule
        </Button>
      </div>
    </div>
  );
}
