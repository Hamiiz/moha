"use client";

import { useState } from "react";
import { StepLocation } from "@/components/booking/StepLocation";
import { StepLessonOptions } from "@/components/booking/StepLessonOptions";
import { StepSlotPicker } from "@/components/booking/StepSlotPicker";
import { StepStudentDetails } from "@/components/booking/StepStudentDetails";
import { Card } from "@/components/ui/card";

export default function BookingWizardPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [bookingState, setBookingState] = useState<{
    postalCode?: string;
    pickupAddress?: string;
    pickupLat?: number;
    pickupLng?: number;
    distanceKm?: number;
    surcharge?: number;
    lessonType?: string;
    lessonTitle?: string;
    basePrice?: number;
    date?: string;
    slot?: { start: string; end: string };
  }>({});

  const updateState = (data: Partial<typeof bookingState>) => {
    setBookingState((prev) => ({ ...prev, ...data }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>Step {step} of 4</span>
          <span>
            {step === 1 && "Location"}
            {step === 2 && "Package"}
            {step === 3 && "Date & Time"}
            {step === 4 && "Confirmation"}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        {step === 1 && (
          <StepLocation
            initialData={bookingState}
            onComplete={(data: any) => {
              updateState(data);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <StepLessonOptions
            surcharge={bookingState.surcharge || 0}
            distanceKm={bookingState.distanceKm || 0}
            pickupAddress={bookingState.pickupAddress || ""}
            initialData={bookingState}
            onBack={() => setStep(1)}
            onComplete={(data: any) => {
              updateState(data);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <StepSlotPicker
            initialData={bookingState}
            onBack={() => setStep(2)}
            onComplete={(data: any) => {
              updateState(data);
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <StepStudentDetails
            bookingData={bookingState}
            onBack={() => setStep(3)}
          />
        )}
      </Card>
    </div>
  );
}
