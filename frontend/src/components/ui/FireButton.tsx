import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { FireAnimation } from "@/components/ui/FireAnimation";

export function FireButton() {
  const [showFire, setShowFire] = useState(false);

  const handleClick = () => {
    console.log('🔥 FireButton clicked!');
    setShowFire(true);
  };

  useEffect(() => {
    if (showFire) {
      console.log('🔥 Showing fire animation');
      const timer = setTimeout(() => {
        console.log('🔥 Hiding fire animation');
        setShowFire(false);
      }, 4000); // Afficher pendant 4 secondes

      return () => clearTimeout(timer);
    }
  }, [showFire]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        title="Enflammer 🔥"
        className="h-9 w-9 rounded-full hover:bg-gray-100"
      >
        <Flame className="h-5 w-5 text-primary-600" />
      </Button>

      {showFire && <FireAnimation duration={4000} />}
    </>
  );
}
