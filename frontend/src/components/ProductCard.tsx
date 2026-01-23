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
      className="group relative bg-card rounded-3xl overflow-hidden shadow-soft cursor-pointer touch-manipulation"
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
      <div className="relative h-32 sm:h-52 md:h-56 overflow-hidden bg-white flex items-center justify-center p-2 sm:p-4">
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

        {/* Cart icon - always visible on mobile, hover on desktop */}
        <button
          className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-primary text-primary-foreground w-8 h-8 sm:w-10 sm:h-10 !min-h-0 flex items-center justify-center rounded-full shadow-medium touch-manipulation opacity-100 scale-100 md:opacity-0 md:scale-75 md:group-hover:opacity-100 md:group-hover:scale-100 transition-all duration-200 hover:scale-110 active:scale-90"
          onClick={handleAddToCart}
          onTouchEnd={handleAddToCart}
          aria-label={`Add ${name} to cart`}
        >
          <ShoppingBag className="w-4 h-4" />
        </button>
      </div>

      {/* Content - Just name and price */}
      <div className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
          <h3 className="font-display text-sm sm:text-lg font-semibold text-foreground leading-tight line-clamp-1">
            {name}
          </h3>
          <span className="text-sm sm:text-lg font-bold text-primary font-body whitespace-nowrap">
            ${price.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
