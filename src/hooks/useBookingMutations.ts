import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Booking } from "./useBookings";

export const useBookingMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, newStatus }: { bookingId: string, newStatus: string }) => {
      console.log('Starting booking status update:', { bookingId, newStatus });
      
      try {
        // Vérifier la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('Session error:', sessionError);
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        // Vérifier si l'utilisateur est admin
        const userEmail = session.user.email;
        if (!userEmail || userEmail !== 'mendar.bouchali@gmail.com') {
          console.error('User not admin:', userEmail);
          throw new Error('Permission refusée');
        }

        // Mettre à jour la réservation
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking:', updateError);
          throw new Error('Erreur lors de la mise à jour de la réservation');
        }

        // Récupérer la réservation mise à jour
        const { data: updatedBooking, error: fetchError } = await supabase
          .from('bookings')
          .select()
          .eq('id', bookingId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching updated booking:', fetchError);
          throw new Error('Erreur lors de la récupération de la réservation mise à jour');
        }

        if (!updatedBooking) {
          console.error('No booking found after update:', bookingId);
          throw new Error('Réservation non trouvée après la mise à jour');
        }

        console.log('Successfully updated booking:', updatedBooking);
        return updatedBooking;

      } catch (error: any) {
        console.error('Error in updateBookingStatus:', error);
        
        // Gérer la déconnexion si la session est expirée
        if (error.message.includes('Session expirée')) {
          await supabase.auth.signOut();
          window.location.reload();
        }
        
        throw error;
      }
    },
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(['bookings'], (old: Booking[] | undefined) => {
        if (!old) return [updatedBooking];
        return old.map(booking => 
          booking.id === updatedBooking.id ? updatedBooking : booking
        );
      });

      toast({
        title: "Succès",
        description: "Le statut a été mis à jour",
      });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    return updateBookingMutation.mutateAsync({ bookingId, newStatus });
  };

  return {
    updateBookingStatus,
  };
};