import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

export const PasswordSection = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const handleResetPassword = async () => {
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - lastRequestTime;
    
    // Empêcher les requêtes trop fréquentes (60 secondes minimum entre chaque demande)
    if (timeSinceLastRequest < 60000) {
      const remainingTime = Math.ceil((60000 - timeSinceLastRequest) / 1000);
      toast({
        title: "Veuillez patienter",
        description: `Vous pourrez renvoyer un nouveau lien dans ${remainingTime} secondes`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast({
          title: "Erreur",
          description: "Email non trouvé",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/account/reset-password#`,
      });

      if (error) {
        if (error.status === 429) {
          toast({
            title: "Trop de tentatives",
            description: "Veuillez patienter quelques minutes avant de réessayer",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur",
            description: "Impossible d'envoyer le lien de réinitialisation",
            variant: "destructive",
          });
        }
        return;
      }

      setLastRequestTime(currentTime);
      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte mail pour modifier votre mot de passe",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Modifier votre mot de passe</h3>
      <Button 
        variant="outline" 
        onClick={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? "Envoi en cours..." : "Recevoir un lien de modification"}
      </Button>
    </div>
  );
};