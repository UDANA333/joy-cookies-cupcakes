import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Leaf, ArrowLeft, ShoppingBag, Cookie, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";
import { getProductById, getRelatedProducts, getRandomProducts, Product } from "@/data/products";
import { cn } from "@/lib/utils";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, totalItems, showNotification } = useCart();
  const [regularQuantity, setRegularQuantity] = useState(1);
  const [veganQuantity, setVeganQuantity] = useState(1);
  const [isVegan, setIsVegan] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const relatedSectionRef = useRef<HTMLElement>(null);

  // Reset quantities when product ID changes
  useEffect(() => {
    setRegularQuantity(1);
    setVeganQuantity(1);
    setIsVegan(false);
    setShowScrollHint(false);
  }, [id]);

  // Hide scroll hint when user scrolls to related section
  useEffect(() => {
    const handleScroll = () => {
      if (relatedSectionRef.current) {
        const rect = relatedSectionRef.current.getBoundingClientRect();
        // Hide hint when related section is visible in viewport
        if (rect.top < window.innerHeight - 100) {
          setShowScrollHint(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToRelated = () => {
    if (relatedSectionRef.current) {
      const yOffset = -100; // Account for navbar height + some padding
      const element = relatedSectionRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setShowScrollHint(false);
  };

  const product = getProductById(id || "");
  
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartCount={totalItems} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">Sorry, we couldn't find the product you're looking for.</p>
          <Button variant="hero" asChild>
            <Link to="/#menu">Back to Menu</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Get related products from same category, or random if not enough
  let relatedProducts = getRelatedProducts(product.id, product.category, 4);
  if (relatedProducts.length < 4) {
    const randomProducts = getRandomProducts(product.id, 4 - relatedProducts.length);
    relatedProducts = [...relatedProducts, ...randomProducts];
  }

  const handleAddToCart = () => {
    // When vegan is toggled ON, add both regular and vegan if regularQuantity > 0
    if (isVegan) {
      // Add regular items if any
      if (regularQuantity > 0) {
        addItem({
          id: `${product.id}-reg`,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          isVegan: false,
          quantity: regularQuantity,
        });
      }
      // Add vegan items
      addItem({
        id: `${product.id}-veg`,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        isVegan: true,
        quantity: veganQuantity,
      });
      const totalQty = regularQuantity + veganQuantity;
      showNotification(
        `Added ${totalQty} ${product.name} to your order!`,
        regularQuantity > 0 
          ? `${regularQuantity} Regular + ${veganQuantity} Vegan`
          : `${veganQuantity} Vegan`
      );
      setShowScrollHint(true);
    } else {
      // Just add regular
      addItem({
        id: `${product.id}-reg`,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        isVegan: false,
        quantity: regularQuantity,
      });
      showNotification(
        `Added ${regularQuantity} ${product.name} to your order!`,
        "Regular option"
      );
      setShowScrollHint(true);
    }
  };

  const handleBuyNow = () => {
    // When vegan is toggled ON, add both regular and vegan if regularQuantity > 0
    if (isVegan) {
      if (regularQuantity > 0) {
        addItem({
          id: `${product.id}-reg`,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          isVegan: false,
          quantity: regularQuantity,
        });
      }
      addItem({
        id: `${product.id}-veg`,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        isVegan: true,
        quantity: veganQuantity,
      });
    } else {
      addItem({
        id: `${product.id}-reg`,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        isVegan: false,
        quantity: regularQuantity,
      });
    }
    navigate("/checkout");
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "cookies": return "Cookie";
      case "cupcakes": return "Cupcake";
      case "cakepops": return "Cake Pop";
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-20 sm:pt-24">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            className="mb-4 sm:mb-6 text-muted-foreground hover:text-foreground touch-manipulation"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </motion.div>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16 lg:mb-20">
          {/* Product Image */}
          <motion.div
            className="relative bg-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-card/90 backdrop-blur-sm text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-soft text-chocolate-light">
              {getCategoryLabel(product.category)}
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-1 sm:mb-2">
                {product.name}
              </h1>
              <p className="text-2xl sm:text-3xl font-bold text-primary font-body">
                ${product.price.toFixed(2)}
              </p>
            </div>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Ingredients */}
            <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft">
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                Ingredients
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {product.ingredients.join(", ")}
              </p>
            </div>

            {/* Vegan Toggle */}
            <div className="flex items-center justify-between bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Leaf className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                  isVegan ? "text-mint" : "text-muted-foreground"
                )} />
                <span className="text-foreground font-medium font-body">
                  Vegan
                </span>
              </div>
              <motion.button
                className={cn(
                  "relative w-14 h-8 rounded-full p-1 transition-colors duration-300",
                  isVegan ? "bg-mint" : "bg-secondary"
                )}
                onClick={() => {
                  const newIsVegan = !isVegan;
                  setIsVegan(newIsVegan);
                  // Reset regular quantity to 1 when turning vegan off
                  if (!newIsVegan && regularQuantity === 0) {
                    setRegularQuantity(1);
                  }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-6 h-6 bg-card rounded-full shadow-medium"
                  animate={{ x: isVegan ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Quantity Selectors */}
            <div className="space-y-3 sm:space-y-4">
              {/* Regular Quantity */}
              <div className="flex items-center justify-between bg-card rounded-xl p-3 sm:p-4 shadow-soft transition-all">
                <div className="flex items-center gap-2">
                  <Cookie className="w-4 h-4 sm:w-5 sm:h-5 transition-colors text-caramel" />
                  <div className="relative h-5 sm:h-6 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isVegan ? "regular" : "quantity"}
                        className="text-foreground text-sm sm:text-base font-medium font-body block"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        {isVegan ? "Regular" : "Quantity"}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-center bg-secondary rounded-xl overflow-hidden">
                  <motion.button
                    className="p-2 sm:p-3 text-chocolate-light hover:text-chocolate transition-colors touch-manipulation"
                    onClick={() => setRegularQuantity(Math.max(isVegan ? 0 : 1, regularQuantity - 1))}
                    whileTap={{ scale: 0.85 }}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <span className="w-10 sm:w-12 text-center text-lg sm:text-xl font-semibold text-foreground">
                    {regularQuantity}
                  </span>
                  <motion.button
                    className="p-2 sm:p-3 text-chocolate-light hover:text-chocolate transition-colors touch-manipulation"
                    onClick={() => setRegularQuantity(regularQuantity + 1)}
                    whileTap={{ scale: 0.85 }}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Vegan Quantity - only show when vegan is toggled on */}
              <AnimatePresence>
                {isVegan && (
                  <motion.div
                    className="flex items-center justify-between bg-mint/20 border-2 border-mint rounded-xl p-3 sm:p-4"
                    initial={{ opacity: 0, y: -10, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, y: -10, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-mint" />
                    <span className="text-foreground text-sm sm:text-base font-medium font-body">Vegan</span>
                  </div>
                  <div className="flex items-center bg-card rounded-xl overflow-hidden shadow-soft">
                    <motion.button
                      className="p-2 sm:p-3 text-chocolate-light hover:text-chocolate transition-colors touch-manipulation"
                      onClick={() => setVeganQuantity(Math.max(1, veganQuantity - 1))}
                      whileTap={{ scale: 0.85 }}
                      aria-label="Decrease vegan quantity"
                    >
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                    <span className="w-10 sm:w-12 text-center text-lg sm:text-xl font-semibold text-mint">
                      {veganQuantity}
                    </span>
                    <motion.button
                      className="p-2 sm:p-3 text-chocolate-light hover:text-chocolate transition-colors touch-manipulation"
                      onClick={() => setVeganQuantity(veganQuantity + 1)}
                      whileTap={{ scale: 0.85 }}
                      aria-label="Increase vegan quantity"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
              <Button
                variant="hero"
                size="xl"
                className="flex-1 touch-manipulation"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground touch-manipulation"
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
            </div>
          </motion.div>
        </div>

        {/* You May Also Like Section */}
        <motion.section
          ref={relatedSectionRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 sm:mb-8 text-center">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {relatedProducts.map((relatedProduct, index) => (
              <RelatedProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                index={index}
              />
            ))}
          </div>
        </motion.section>
      </div>

      {/* Sticky Peek Section - Shows preview of related products */}
      <AnimatePresence>
        {showScrollHint && relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* Blur layer */}
            <div 
              className="absolute inset-0 rounded-t-3xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: '0 -4px 30px rgba(0,0,0,0.08)',
              }}
            />
            <button
              onClick={scrollToRelated}
              className="w-full cursor-pointer transition-colors relative"
              style={{ height: '120px' }}
            >
              {/* Content positioned inside */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                {/* Pull tab indicator - in the top tier */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">You May Also Like</span>
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </motion.div>
                </div>
                
                {/* Product previews - in the lower tier */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  {relatedProducts.slice(0, 4).map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-soft ring-2 ring-white">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

// Simple related product card
const RelatedProductCard = ({ product, index }: { product: Product; index: number }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="bg-card rounded-2xl overflow-hidden shadow-soft cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, boxShadow: "var(--shadow-lifted)" }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground mb-1 truncate">
          {product.name}
        </h3>
        <p className="text-primary font-bold font-body">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductPage;
