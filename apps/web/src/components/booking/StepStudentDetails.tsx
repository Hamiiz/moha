"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createBooking } from "@/lib/api";
import type { BookingConfirmationResponse } from "@/lib/types";
import { User, Mail, Phone, CheckCircle2, Loader2, MapPin, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const StudentFormSchema = z.object({
  studentName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

type StudentFormData = z.infer<typeof StudentFormSchema>;

interface StepStudentDetailsProps {
  bookingData: any;
  onBack: () => void;
}

export function StepStudentDetails({ bookingData, onBack }: StepStudentDetailsProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmationResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(StudentFormSchema),
    defaultValues: {
      studentName: "",
      email: "",
      phone: "",
      experienceLevel: "beginner",
    },
  });

  const onSubmit = async (values: StudentFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        slot: bookingData.slot,
        pickupAddress: bookingData.pickupAddress,
        pickupLat: bookingData.pickupLat,
        pickupLng: bookingData.pickupLng,
        surcharge: bookingData.surcharge,
        basePrice: bookingData.basePrice,
      };

      const res = await createBooking(payload);
      setConfirmation(res);
      toast.success("Booking confirmed! Check your email for calendar details.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30 p-6 space-y-6 text-center animate-in zoom-in-95">
        <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 mb-2">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div>
          <Badge variant="success">Confirmed</Badge>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Lesson Booked Successfully!</h2>
          <p className="text-sm text-slate-600 mt-1">
            Confirmation ID: <span className="font-mono font-bold text-slate-800">{confirmation.bookingId}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 text-left space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <User className="h-4 w-4 text-brand-600" />
            <span className="font-semibold">{confirmation.studentName}</span> ({confirmation.email})
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-4 w-4 text-brand-600" />
            <span>
              {new Date(confirmation.slot.start).toLocaleDateString("en-CA", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              at {new Date(confirmation.slot.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="h-4 w-4 text-brand-600 mt-0.5" />
            <span>{confirmation.pickupAddress}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={confirmation.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors text-sm"
          >
            <span>Open Pickup Location in Maps</span>
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button variant="outline" onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}>
            Book Another Session
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">4. Student Contact Information</h2>
        <p className="text-sm text-slate-500 mt-1">
          Provide your details for Google Calendar syncing and instructor contact.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="studentName">Full Name</Label>
          <Input id="studentName" placeholder="e.g. Sarah Jenkins" {...register("studentName")} />
          {errors.studentName && (
            <p className="text-xs text-red-500 mt-1">{errors.studentName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="sarah@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Mobile Phone</Label>
            <Input id="phone" type="tel" placeholder="(416) 555-0199" {...register("phone")} />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="experienceLevel">Driving Experience Level</Label>
          <select
            id="experienceLevel"
            {...register("experienceLevel")}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[48px]"
          >
            <option value="beginner">Beginner (First time behind wheel)</option>
            <option value="intermediate">Intermediate (G1 driver with practice)</option>
            <option value="advanced">Test Prep (Refining skills for G2 / G)</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="w-1/3">
            Back
          </Button>
          <Button type="submit" disabled={submitting} className="w-2/3">
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Confirming Booking...
              </span>
            ) : (
              "Confirm & Lock Slot"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
