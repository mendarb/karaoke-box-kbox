import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { BookingStatus } from "@/integrations/supabase/types/booking";

export const useBookingActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setIsLoading(true);
    console.log('Starting status update:', { bookingId, status });

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      toast({
        title: "Succès",
        description: "Le statut de la réservation a été mis à jour",
      });

      return data;
    } catch (error: any) {
      console.error('Update failed:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setIsLoading(true);
    console.log('Starting deletion:', { bookingId });
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          deleted_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Deletion successful');
      
      // Invalidate and refetch to update the UI
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      toast({
        title: "Succès",
        description: "La réservation a été supprimée",
      });
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réservation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateBookingStatus,
    deleteBooking,
    isLoading
  };
};