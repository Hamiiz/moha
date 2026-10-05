"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvailability } from "@/lib/api";
import type { TimeSlot } from "@/lib/types";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StepSlotPickerProps {
  onComplete: (data: { slot: TimeSlot; date: string }) => void;
  onBack: () => void;
  initialData?: any;
}

export function StepSlotPicker({ onComplete, onBack, initialData }: StepSlotPickerProps) {
  // Default to tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(initialData?.date || defaultDateStr);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(initialData?.slot || null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["availability", selectedDate],
    queryFn: () => getAvailability(selectedDate),
    enabled: Boolean(selectedDate),
  });

  const handleNext = () => {
    if (!selectedSlot) {
      toast.error("Please select a 90-minute time slot");
      return;
    }
    onComplete({ slot: selectedSlot, date: selectedDate });
  };

  const formatSlotTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">3. Select Lesson Date & Time</h2>
        <p className="text-sm text-slate-500 mt-1">
          Available 90-minute slots automatically include 30-minute travel buffers between sessions.
        </p>
      </div>

      {/* Date Picker Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Select Date
        </label>
        <input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSelectedDate(e.target.value);
            setSelectedSlot(null);
          }}
          className="w-full rounded-xl border border-slate-300 p-3 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[48px]"
        />
      </div>

      {/* Time Slots Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Available 90-min Slots</span>
          {data && (
            <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-1 rounded-full">
              {data.totalAvailableSlots} slots open
            </span>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 text-red-700 p-4 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Could not load slots: {(error as Error).message}</span>
          </Card>
        )}

        {data && data.slots.length === 0 && (
          <Card className="text-center py-8 text-slate-500 bg-slate-50 border-dashed">
            <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">No available slots on this date</p>
            <p className="text-xs text-slate-400">Please choose another date on the calendar.</p>
          </Card>
        )}

        {data && data.slots.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {data.slots.map((slot: TimeSlot) => {
              const isSelected = selectedSlot?.start === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3.5 rounded-xl border text-left font-medium text-sm transition-all min-h-[48px] ${
                    isSelected
                      ? "border-brand-600 bg-brand-600 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold">{formatSlotTime(slot.start)}</div>
                  <div className={`text-xs ${isSelected ? "text-brand-100" : "text-slate-400"}`}>
                    to {formatSlotTime(slot.end)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-1/3">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!selectedSlot} className="w-2/3">
          Continue to Student Details
        </Button>
      </div>
    </div>
  );
}
