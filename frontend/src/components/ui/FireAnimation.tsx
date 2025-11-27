import { useEffect, useState, useRef } from "react";
import { Fire3DShaders } from "./fire-3d-shaders";

interface FireAnimationProps {
  duration?: number;
}

export function FireAnimation({ duration = 4000 }: FireAnimationProps) {
  const [fadeProgress, setFadeProgress] = useState(0);
  const [distortionIntensity, setDistortionIntensity] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize component
  useEffect(() => {
    console.log('🔥 FireAnimation mounted');
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    console.log('🔥 Starting fire animation fade effects');
    // Smooth fade-in animation (0 -> 1 over 800ms)
    const fadeInDuration = 800;
    const fadeInSteps = 60;
    const fadeInInterval = fadeInDuration / fadeInSteps;

    let step = 0;
    const fadeIn = setInterval(() => {
      step++;
      const progress = Math.min(step / fadeInSteps, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setFadeProgress(eased);
      setDistortionIntensity(eased * 0.03);

      if (progress >= 1) {
        clearInterval(fadeIn);
      }
    }, fadeInInterval);

    // Start fade-out before end
    const fadeOutStart = duration - 1000;
    const fadeOutTimer = setTimeout(() => {
      const fadeOutDuration = 1000;
      const fadeOutSteps = 60;
      const fadeOutInterval = fadeOutDuration / fadeOutSteps;

      let outStep = 0;
      const fadeOut = setInterval(() => {
        outStep++;
        const progress = Math.min(outStep / fadeOutSteps, 1);
        // Ease-in cubic
        const eased = 1 - Math.pow(progress, 3);
        setFadeProgress(eased);
        setDistortionIntensity(eased * 0.03);

        if (progress >= 1) {
          clearInterval(fadeOut);
        }
      }, fadeOutInterval);
    }, fadeOutStart);

    return () => {
      clearInterval(fadeIn);
      clearTimeout(fadeOutTimer);
    };
  }, [duration, isReady]);

  // Heat distortion effect on background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (distortionIntensity > 0) {
        // Create heat wave distortion effect
        const gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height,
          0,
          canvas.width / 2,
          canvas.height,
          canvas.height * 0.8
        );

        const alpha = distortionIntensity * 0.15;

        gradient.addColorStop(0, `rgba(255, 100, 0, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(255, 150, 50, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add wavey distortion lines
        ctx.strokeStyle = `rgba(255, 150, 0, ${alpha * 0.3})`;
        ctx.lineWidth = 2;

        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const yOffset = canvas.height * 0.3 + i * 80;

          for (let x = 0; x < canvas.width; x += 5) {
            const wave = Math.sin(x * 0.01 + time + i) * 20 * distortionIntensity;
            const y = yOffset + wave;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [distortionIntensity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Heat distortion background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          mixBlendMode: 'screen',
          filter: 'blur(30px)',
        }}
      />

      {/* Dark overlay for contrast */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: fadeProgress * 0.4 }}
      />

      {/* Main volumetric flame shader */}
      {isReady && (
        <div className="absolute inset-0 flex items-end justify-center">
          <div
            className="relative transition-all duration-300 ease-out"
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${0.8 + fadeProgress * 0.2})`,
              opacity: fadeProgress,
            }}
          >
            <Fire3DShaders
              speed={1.2}
              intensity={1.8}
              fadeProgress={fadeProgress}
            />
          </div>
        </div>
      )}

      {/* Additional glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 100%, rgba(255, 100, 0, 0.3) 0%, transparent 50%)',
          opacity: fadeProgress * 0.6,
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}
