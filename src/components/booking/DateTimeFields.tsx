import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useDisabledDates } from "./date-time/hooks/useDisabledDates";
import { useDateTimeSelection } from "./date-time/hooks/useDateTimeSelection";
import { CalendarSection } from "./date-time/CalendarSection";
import { TimeSlotsSection } from "./date-time/TimeSlotsSection";
import { useBookingSettings } from "./date-time/hooks/useBookingSettings";

interface DateTimeFieldsProps {
  form: UseFormReturn<any>;
  onAvailabilityChange: (date: Date | undefined, availableHours: number) => void;
}

export const DateTimeFields = ({ form, onAvailabilityChange }: DateTimeFieldsProps) => {
  const {
    selectedDate,
    availableSlots,
    handleDateSelect,
    handleTimeSlotChange
  } = useDateTimeSelection(form, onAvailabilityChange);

  const { minDate, maxDate, settings } = useBookingSettings();
  const { disabledDates } = useDisabledDates({ 
    minDate, 
    maxDate, 
    isDayExcluded: (date) => {
      if (!settings?.openingHours) return true;
      const dayOfWeek = date.getDay();
      // Fermer les lundis (1) et mardis (2)
      return dayOfWeek === 1 || dayOfWeek === 2;
    }
  });

  useEffect(() => {
    const timeSlot = form.watch("timeSlot");
    if (timeSlot && selectedDate) {
      handleTimeSlotChange(timeSlot);
    }
  }, [form.watch("timeSlot")]);

  console.log('DateTimeFields render:', {
    selectedDate,
    minDate,
    maxDate,
    disabledDates: disabledDates.length
  });

  return (
    <div className="space-y-8">
      <CalendarSection
        form={form}
        selectedDate={selectedDate}
        minDate={minDate}
        maxDate={maxDate}
        disabledDates={disabledDates}
        onDateSelect={handleDateSelect}
      />

      {selectedDate && (
        <TimeSlotsSection
          form={form}
          availableSlots={availableSlots}
          isLoading={false}
        />
      )}
    </div>
  );
};