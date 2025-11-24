import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words';
  from?: { opacity?: number; y?: number; x?: number };
  to?: { opacity?: number; y?: number; x?: number };
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right';
  onLetterAnimationComplete?: () => void;
}

const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 0.5,
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  textAlign = 'left',
  onLetterAnimationComplete,
}: SplitTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);

  const elements = splitType === 'chars' ? text.split('') : text.split(' ');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (animatedCount === elements.length && onLetterAnimationComplete) {
      onLetterAnimationComplete();
    }
  }, [animatedCount, elements.length, onLetterAnimationComplete]);

  const handleAnimationEnd = () => {
    setAnimatedCount((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={cn('inline-flex flex-wrap', className)}
      style={{ textAlign }}
    >
      {elements.map((element, index) => (
        <span
          key={index}
          className="inline-block transition-all"
          style={{
            opacity: isVisible ? to.opacity : from.opacity,
            transform: isVisible
              ? `translateY(${to.y || 0}px) translateX(${to.x || 0}px)`
              : `translateY(${from.y || 0}px) translateX(${from.x || 0}px)`,
            transitionDuration: `${duration}s`,
            transitionDelay: `${index * delay}ms`,
            transitionTimingFunction: 'cubic-bezier(0.33, 1, 0.68, 1)',
          }}
          onTransitionEnd={index === elements.length - 1 ? handleAnimationEnd : undefined}
        >
          {element === ' ' ? '\u00A0' : element}
          {splitType === 'words' && index < elements.length - 1 && '\u00A0'}
        </span>
      ))}
    </div>
  );
};

export default SplitText;
