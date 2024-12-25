import { UseFormReturn } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export const useBookingSubmit = (
  form: UseFormReturn<any>,
  groupSize: string,
  duration: string,
  calculatedPrice: number,
  setIsSubmitting: (value: boolean) => void
) => {
  const handleSubmit = async (data: any) => {
    try {
      console.log('🎯 Starting booking process:', {
        email: data.email,
        date: data.date,
        timeSlot: data.timeSlot,
        duration,
        groupSize,
        price: calculatedPrice
      });

      setIsSubmitting(true);

      const formattedDate = format(new Date(data.date), 'yyyy-MM-dd');

      // Vérifier la disponibilité du créneau
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', formattedDate)
        .neq('status', 'cancelled')
        .is('deleted_at', null);

      if (checkError) {
        throw checkError;
      }

      const startHour = parseInt(data.timeSlot);
      const endHour = startHour + parseInt(duration);

      const hasOverlap = existingBookings?.some(booking => {
        const bookingStart = parseInt(booking.time_slot);
        const bookingEnd = bookingStart + parseInt(booking.duration);
        return (
          (startHour >= bookingStart && startHour < bookingEnd) ||
          (endHour > bookingStart && endHour <= bookingEnd) ||
          (startHour <= bookingStart && endHour >= bookingEnd)
        );
      });

      if (hasOverlap) {
        toast({
          title: "Créneau indisponible",
          description: "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
          variant: "destructive",
        });
        return;
      }

      // Appeler la nouvelle fonction Edge pour créer la réservation
      const { data: response, error } = await supabase.functions.invoke(
        'create-booking',
        {
          body: {
            email: data.email,
            fullName: data.fullName,
            phone: data.phone,
            date: formattedDate,
            timeSlot: data.timeSlot,
            duration,
            groupSize,
            price: calculatedPrice,
            message: data.message,
            isTestMode: data.isTestMode || false,
          }
        }
      );

      if (error) {
        console.error('❌ Error creating booking:', error);
        throw error;
      }

      console.log('✅ Booking created and payment link generated:', {
        bookingId: response.bookingId,
        checkoutUrl: response.checkoutUrl
      });

      // Rediriger vers la page de paiement Stripe
      window.location.href = response.checkoutUrl;

    } catch (error: any) {
      console.error('❌ Error in booking process:', error);
      toast({
        title: "Erreur lors de la réservation",
        description: error.message || "Une erreur est survenue lors de la réservation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit };
};