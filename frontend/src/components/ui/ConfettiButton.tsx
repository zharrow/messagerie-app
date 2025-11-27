import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

export function ConfettiButton() {
  const handleClick = () => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      title="Célébrer 🎉"
      className="h-9 w-9 rounded-full hover:bg-gray-100"
    >
      <PartyPopper className="h-5 w-5 text-blue-600" />
    </Button>
  );
}
