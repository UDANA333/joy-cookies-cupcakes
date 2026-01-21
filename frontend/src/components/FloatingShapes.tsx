import { motion, useScroll, useTransform } from "framer-motion";

interface FloatingShapesProps {
  variant?: "hero" | "section" | "footer";
}

const FloatingShapes = ({ variant = "hero" }: FloatingShapesProps) => {
  const { scrollYProgress } = useScroll();
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -30]);

  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large pink blob */}
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 bg-rose-light/30 rounded-full blur-3xl"
          style={{ y: y1, rotate: rotate1 }}
        />
        
        {/* Coral accent */}
        <motion.div
          className="absolute top-1/3 -left-32 w-64 h-64 bg-coral-light/40 blob blur-2xl"
          style={{ y: y2 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Small floating circles */}
        <motion.div
          className="absolute top-20 right-1/4 w-8 h-8 bg-primary/20 rounded-full"
          style={{ y: y3 }}
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-mint/30 rounded-full blur-sm"
          style={{ y: y2, rotate: rotate2 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        <motion.div
          className="absolute top-1/2 right-10 w-6 h-6 bg-caramel/30 rounded-full"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-secondary/50 rounded-full blur-3xl"
          style={{ y: y1 }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-60 h-60 bg-rose-light/20 rounded-full blur-2xl"
          style={{ y: y2 }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-0 left-1/2 w-full h-32 bg-gradient-to-b from-rose-light/10 to-transparent"
        style={{ y: y1 }}
      />
    </div>
  );
};

export default FloatingShapes;
