import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  isPreviousMonthDisabled: boolean;
}

export const CalendarHeader = ({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  isPreviousMonthDisabled,
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <Button
        variant="ghost"
        onClick={onPreviousMonth}
        disabled={isPreviousMonthDisabled}
        className={cn(
          "h-9 w-9 p-0",
          isPreviousMonthDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="text-lg font-semibold text-gray-900">
        {format(currentMonth, 'MMMM yyyy', { locale: fr })}
      </div>
      <Button
        variant="ghost"
        onClick={onNextMonth}
        className="h-9 w-9 p-0"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};