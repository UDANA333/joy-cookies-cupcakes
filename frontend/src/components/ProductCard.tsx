import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  onAddToCart?: (id: string, quantity: number, isVegan: boolean) => void;
}

const ProductCard = ({ id, name, price, image, category, onAddToCart }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isVegan, setIsVegan] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAdd = () => {
    onAddToCart?.(id, quantity, isVegan);
  };

  return (
    <motion.div
      className="relative bg-card rounded-3xl overflow-hidden shadow-soft"
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{
        y: -12,
        rotateX: 2,
        rotateY: -2,
        boxShadow: "var(--shadow-lifted)",
      }}
      whileTap={{
        y: -4,
        scale: 0.98,
        boxShadow: "var(--shadow-pressed)",
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <motion.div 
        className="relative h-48 overflow-hidden bg-secondary/30"
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          animate={{
            scale: isHovered ? 1.08 : 1,
            z: isHovered ? 20 : 0,
          }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        />
        {/* Floating badge */}
        <motion.div
          className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full shadow-soft text-chocolate-light"
          animate={{
            y: isHovered ? -3 : 0,
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {category}
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="font-display text-xl font-semibold text-foreground leading-tight">
            {name}
          </h3>
          <span className="text-lg font-bold text-primary font-body">
            ${price.toFixed(2)}
          </span>
        </div>

        {/* Vegan Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-body">
            Preference
          </span>
          <motion.button
            className={cn(
              "relative flex items-center w-24 h-9 rounded-full p-1 transition-colors duration-300",
              isVegan ? "bg-mint" : "bg-secondary"
            )}
            onClick={() => setIsVegan(!isVegan)}
            whileTap={{ scale: 0.95 }}
          >
            {/* Sliding knob */}
            <motion.div
              className="absolute flex items-center justify-center w-10 h-7 bg-card rounded-full shadow-medium"
              animate={{ x: isVegan ? 52 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {isVegan && <Leaf className="w-4 h-4 text-mint" />}
            </motion.div>
            <span className={cn(
              "flex-1 text-xs font-semibold text-center transition-opacity",
              !isVegan ? "opacity-100 text-chocolate-light" : "opacity-50"
            )}>
              Reg
            </span>
            <span className={cn(
              "flex-1 text-xs font-semibold text-center transition-opacity",
              isVegan ? "opacity-100 text-chocolate-light" : "opacity-50"
            )}>
              Veg
            </span>
          </motion.button>
        </div>

        {/* Quantity & Add */}
        <div className="flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-secondary rounded-xl overflow-hidden">
            <motion.button
              className="p-2.5 text-chocolate-light hover:text-chocolate transition-colors"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              whileTap={{ scale: 0.85 }}
            >
              <Minus className="w-4 h-4" />
            </motion.button>
            <span className="w-8 text-center font-semibold text-foreground">
              {quantity}
            </span>
            <motion.button
              className="p-2.5 text-chocolate-light hover:text-chocolate transition-colors"
              onClick={() => setQuantity(quantity + 1)}
              whileTap={{ scale: 0.85 }}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Add Button */}
          <Button
            variant="hero"
            className="flex-1"
            onClick={handleAdd}
          >
            Add to Order
          </Button>
        </div>

        {/* Vegan notice */}
        {isVegan && (
          <motion.p
            className="text-xs text-muted-foreground italic"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            Vegan availability may vary
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
