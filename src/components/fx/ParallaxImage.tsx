import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

interface Props {
  src: string;
  alt: string;
  /** Pixels to translate over the entire scroll-through. Positive = drifts up as you scroll down. */
  amount?: number;
  className?: string;
  imgClassName?: string;
}

export default function ParallaxImage({ src, alt, amount = 80, className, imgClassName }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        <img src={src} alt={alt} loading="lazy" className={imgClassName} />
      </div>
    );
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ''}`}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ y }}
        className={`w-full h-full object-cover ${imgClassName ?? ''}`}
      />
    </div>
  );
}
