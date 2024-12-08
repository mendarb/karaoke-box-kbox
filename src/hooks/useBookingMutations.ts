import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Booking } from "./useBookings";
import { useBookingEmail } from "./useBookingEmail";
import { useBookingCache } from "./useBookingCache";
import { useBookingNotifications } from "./useBookingNotifications";

export const useBookingMutations = () => {
  const queryClient = useQueryClient();
  const { sendEmail } = useBookingEmail();
  const { notifySuccess, notifyError } = useBookingNotifications();

  const mutation = useMutation({
    mutationFn: async ({ bookingId, newStatus }: { bookingId: string; newStatus: string }): Promise<Booking> => {
      console.log('Début de la mutation pour la réservation:', bookingId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Pas de session trouvée');
        throw new Error('Session expirée');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== "mendar.bouchali@gmail.com") {
        console.error('Utilisateur non admin:', user?.email);
        throw new Error('Accès refusé');
      }

      // Vérifions d'abord si la réservation existe
      console.log('Vérification de l\'existence de la réservation:', bookingId);
      const { data: bookings, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId);

      if (fetchError) {
        console.error('Erreur lors de la vérification de la réservation:', fetchError);
        throw new Error('Erreur lors de la vérification de la réservation');
      }

      if (!bookings || bookings.length === 0) {
        console.error('Aucune réservation trouvée avec l\'id:', bookingId);
        throw new Error('Réservation introuvable');
      }

      const booking = bookings[0];
      console.log('Réservation trouvée:', booking);

      // Mise à jour de la réservation
      const { data: updatedBookings, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select('*');

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError);
        throw updateError;
      }

      if (!updatedBookings || updatedBookings.length === 0) {
        console.error('Mise à jour échouée - réservation non trouvée:', bookingId);
        throw new Error('La mise à jour a échoué');
      }

      const updatedBooking = updatedBookings[0];
      console.log('Mise à jour réussie:', updatedBooking);

      // Envoi de l'email après la mise à jour réussie
      try {
        await sendEmail(updatedBooking);
        console.log('Email envoyé avec succès');
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        // On ne throw pas l'erreur ici pour ne pas annuler la mise à jour
      }

      return updatedBooking;
    },
    onSuccess: () => {
      // Invalider le cache pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      notifySuccess();
    },
    onError: (error: Error) => {
      notifyError(error);
    }
  });

  const updateBookingStatus = async (bookingId: string, newStatus: string): Promise<Booking> => {
    return mutation.mutateAsync({ bookingId, newStatus });
  };

  return { updateBookingStatus };
};