import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Car, MapPin } from "lucide-react";

interface CostSummaryCardProps {
  lessonTitle?: string;
  basePrice: number;
  surcharge: number;
  distanceKm?: number;
  pickupAddress?: string;
}

export function CostSummaryCard({
  lessonTitle = "Lesson Package",
  basePrice,
  surcharge,
  distanceKm,
  pickupAddress,
}: CostSummaryCardProps) {
  const total = basePrice + surcharge;

  return (
    <Card className="border-brand-100 bg-gradient-to-br from-brand-50/50 to-white">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-brand-600" />
          <span className="font-semibold text-slate-800">{lessonTitle}</span>
        </div>
        <Badge variant="default">CAD</Badge>
      </div>

      <div className="space-y-2 py-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Base Rate</span>
          <span className="font-medium text-slate-800">{formatCurrency(basePrice)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1.5">
            Distance Travel Surcharge
            {distanceKm !== undefined && (
              <span className="text-xs text-slate-400">({distanceKm} km)</span>
            )}
          </span>
          <span className="font-medium text-slate-800">
            {surcharge > 0 ? formatCurrency(surcharge) : "FREE ($0)"}
          </span>
        </div>

        {pickupAddress && (
          <div className="flex items-start gap-1.5 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="truncate">{pickupAddress}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <span className="font-bold text-slate-900 text-base">Total Cost</span>
        <span className="font-extrabold text-brand-700 text-xl">{formatCurrency(total)}</span>
      </div>
    </Card>
  );
}
