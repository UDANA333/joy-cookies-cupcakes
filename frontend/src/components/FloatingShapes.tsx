import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { memo, useMemo } from "react";

interface FloatingShapesProps {
  variant?: "hero" | "section" | "footer";
}

const FloatingShapes = memo(({ variant = "hero" }: FloatingShapesProps) => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  
  // Memoize transforms to prevent recalculation
  const y1 = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, -80]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, -30]);

  // Animation variants - disabled if reduced motion
  const floatAnimation = useMemo(() => 
    shouldReduceMotion ? {} : {
      y: [0, -15, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }, [shouldReduceMotion]);

  const scaleAnimation = useMemo(() => 
    shouldReduceMotion ? {} : {
      scale: [1, 1.1, 1],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
    }, [shouldReduceMotion]);

  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Large pink blob - hidden on mobile for performance */}
        <motion.div
          className="absolute -top-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-rose-light/30 rounded-full blur-3xl hidden sm:block"
          style={{ y: y1, rotate: rotate1, willChange: "transform" }}
        />
        
        {/* Coral accent - hidden on mobile */}
        <motion.div
          className="absolute top-1/3 -left-32 w-48 md:w-64 h-48 md:h-64 bg-coral-light/40 blob blur-2xl hidden md:block"
          style={{ y: y2, willChange: "transform" }}
          animate={scaleAnimation}
        />
        
        {/* Small floating circles - simplified on mobile */}
        <motion.div
          className="absolute top-20 right-1/4 w-6 md:w-8 h-6 md:h-8 bg-primary/20 rounded-full hidden sm:block"
          style={{ y: y3, willChange: "transform" }}
          animate={floatAnimation}
        />
        
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-8 md:w-12 h-8 md:h-12 bg-mint/30 rounded-full blur-sm hidden md:block"
          style={{ y: y2, rotate: rotate2, willChange: "transform" }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.2, 1],
            transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }
          }}
        />
        
        <motion.div
          className="absolute top-1/2 right-10 w-4 md:w-6 h-4 md:h-6 bg-caramel/30 rounded-full hidden sm:block"
          animate={shouldReduceMotion ? {} : {
            y: [0, -20, 0], x: [0, 10, 0],
            transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }
          }}
        />
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute -top-40 -left-40 w-60 md:w-80 h-60 md:h-80 bg-secondary/50 rounded-full blur-3xl hidden sm:block"
          style={{ y: y1, willChange: "transform" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-40 md:w-60 h-40 md:h-60 bg-rose-light/20 rounded-full blur-2xl hidden sm:block"
          style={{ y: y2, willChange: "transform" }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute top-0 left-1/2 w-full h-32 bg-gradient-to-b from-rose-light/10 to-transparent hidden sm:block"
        style={{ y: y1, willChange: "transform" }}
      />
    </div>
  );
});

FloatingShapes.displayName = 'FloatingShapes';

export default FloatingShapes;
