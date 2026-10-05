"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CostSummaryCard } from "@/components/CostSummaryCard";
import type { LessonTypeOption } from "@/lib/types";
import { Check, Clock, Award, ShieldCheck } from "lucide-react";

const LESSON_OPTIONS: LessonTypeOption[] = [
  {
    id: "single",
    title: "Single 90-Minute Session",
    description: "Standard intensive single session. Great for skill refinement and parallel parking practice.",
    basePrice: 90,
  },
  {
    id: "pass5",
    title: "5-Lesson Value Package",
    description: "Complete package covering city driving, highway entry, and mock road test evaluations.",
    basePrice: 400,
    badge: "Save $50",
  },
  {
    id: "roadtest",
    title: "Road Test Warmup & Car Rental",
    description: "60-min pre-test warm up session plus instructor vehicle rental for your G2 / G road test.",
    basePrice: 150,
  },
];

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
  const [selectedId, setSelectedId] = useState(initialData?.lessonType || "single");

  const selectedOption = LESSON_OPTIONS.find((o) => o.id === selectedId) || LESSON_OPTIONS[0]!;


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

      <div className="space-y-3">
        {LESSON_OPTIONS.map((opt) => {
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
        <Button onClick={handleNext} className="w-2/3">
          Continue to Schedule
        </Button>
      </div>
    </div>
  );
}
