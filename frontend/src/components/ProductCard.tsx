import { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  onAddToCart?: (id: string) => void;
}

const ProductCard = memo(({ id, name, price, image, category, onAddToCart }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddToCart?.(id);
  }, [id, onAddToCart]);

  const handleCardClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  return (
    <motion.div
      className="relative bg-card rounded-3xl overflow-hidden shadow-soft cursor-pointer touch-manipulation"
      style={{ 
        transformStyle: "preserve-3d", 
        perspective: "1000px",
        willChange: "transform",
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -8,
        boxShadow: "var(--shadow-lifted)",
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{
        scale: 0.98,
        boxShadow: "var(--shadow-pressed)",
        transition: { duration: 0.1 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-white flex items-center justify-center p-3 sm:p-4">
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-secondary animate-pulse" />
        )}
        <motion.img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        {/* Cart icon - appears on hover/touch */}
        <motion.button
          className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary text-primary-foreground p-2 sm:p-2.5 rounded-full shadow-medium touch-manipulation"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.5,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          onClick={handleAddToCart}
          onTouchEnd={handleAddToCart}
          aria-label={`Add ${name} to cart`}
        >
          <ShoppingBag className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Content - Just name and price */}
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-display text-base sm:text-lg font-semibold text-foreground leading-tight line-clamp-1">
            {name}
          </h3>
          <span className="text-base sm:text-lg font-bold text-primary font-body whitespace-nowrap">
            ${price.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
