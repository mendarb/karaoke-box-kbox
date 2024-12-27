import { Users, Music2, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <div className="bg-white/10 p-6 md:p-8 flex flex-col justify-center min-h-[200px] md:min-h-0">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
        Votre Box Karaoké Privatif à Metz
      </h1>
      <p className="text-white/90 text-sm md:text-base mb-6">
        Partagez des moments uniques avec vos proches dans notre espace privatif et confortable.
      </p>
      <div className="flex flex-col gap-3">
        <div className="inline-block bg-kbox-coral text-white px-4 py-2 md:px-6 md:py-3 w-full text-center border border-white text-sm md:text-base">
          À partir de 10€ par pers. et par heure
        </div>
        <Link 
          to="/box-3d" 
          className="inline-block bg-white/20 hover:bg-white/30 transition-colors text-white px-4 py-2 md:px-6 md:py-3 w-full text-center border border-white text-sm md:text-base"
        >
          Découvrir notre box en 3D
        </Link>
      </div>
    </div>
  );
};