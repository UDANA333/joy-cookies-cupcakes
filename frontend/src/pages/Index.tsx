import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";
import { useProducts } from "@/components/ProductContext";
import { useSeasonalTheme } from "@/components/SeasonalThemeContext";
import { fetchActiveSeasonalTheme, fetchSeasonalThemes, SeasonalTheme, Product as APIProduct } from "@/lib/api";
import heroImage from "@/assets/hero-banner.webp";

// Helper to format category slug to display name
function formatCategoryName(slug: string): string {
  if (slug === "cakepops") return "Cake Pops";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

const Index = memo(() => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { addItem, totalItems, showNotification } = useCart();
  const { products, getProductById } = useProducts();
  const { bannerVisible } = useSeasonalTheme();
  
  // Seasonal theme state
  const [seasonalTheme, setSeasonalTheme] = useState<SeasonalTheme | null>(null);
  const [seasonalProducts, setSeasonalProducts] = useState<APIProduct[]>([]);
  const [allSeasonalCategories, setAllSeasonalCategories] = useState<Set<string>>(new Set());
  
  // Fetch active seasonal theme AND all seasonal categories
  useEffect(() => {
    const loadSeasonalData = async () => {
      try {
        // Fetch all themes to know which categories are seasonal
        const allThemes = await fetchSeasonalThemes();
        const seasonalCats = new Set(allThemes.map(t => t.category_slug));
        setAllSeasonalCategories(seasonalCats);
        
        // Fetch active theme
        const data = await fetchActiveSeasonalTheme();
        setSeasonalTheme(data.theme);
        setSeasonalProducts(data.products);
      } catch (error) {
        console.error('Failed to fetch seasonal theme:', error);
      }
    };
    loadSeasonalData();
  }, []);

  // Dynamically get unique categories from products, sorted by product count (most first)
  // Exclude ALL seasonal categories from regular menu - they only show via their seasonal section
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    
    // Filter out ALL seasonal categories (only show them when their theme is active)
    const filteredCategories = uniqueCategories.filter(cat => !allSeasonalCategories.has(cat));
    
    // Sort categories by number of products (descending - most options first)
    const sortedCategories = filteredCategories.sort((a, b) => {
      const countA = products.filter(p => p.category === a).length;
      const countB = products.filter(p => p.category === b).length;
      return countB - countA; // Descending order
    });
    
    return [
      { id: "all", label: "All Treats" },
      ...sortedCategories.map(cat => ({ id: cat, label: formatCategoryName(cat) }))
    ];
  }, [products, allSeasonalCategories]);

  // Filter out ALL seasonal products from regular display
  // They only appear in the seasonal section when their theme is active
  const regularProducts = useMemo(() => {
    if (allSeasonalCategories.size === 0) return products;
    return products.filter(p => !allSeasonalCategories.has(p.category));
  }, [products, allSeasonalCategories]);

  const filteredProducts = activeCategory === "all" 
    ? regularProducts 
    : regularProducts.filter(p => p.category === activeCategory);

  const handleAddToCart = useCallback((id: string) => {
    console.log('[Index] handleAddToCart called', { id, timestamp: Date.now() });
    const product = getProductById(id);
    if (product) {
      console.log('[Index] calling addItem for', product.name);
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: 1,
      });
      showNotification(`Added ${product.name} to your order!`);
    }
  }, [addItem, showNotification, getProductById]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />
      
      {/* Hero Section - Optimized for all devices */}
      <section className={`relative min-h-[100svh] flex items-center justify-center overflow-hidden ${bannerVisible ? 'pt-24 md:pt-28' : 'pt-16 md:pt-20'}`}>
        <FloatingShapes variant="hero" />
        
        {/* Hero Background Image - Lazy loaded */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img 
            src={heroImage} 
            alt="Bakery treats" 
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </motion.div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <motion.h1 
              className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-foreground leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Homemade goodness
              <br />
              <span className="text-gradient">baked with joy</span>
            </motion.h1>
            
            <motion.p
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md sm:max-w-lg mx-auto px-4 sm:px-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              Fresh-baked cookies, cupcakes & cake pops made with love. 
              Pre-order for easy pickup!
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4 sm:px-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full sm:w-auto touch-manipulation"
                onClick={() => {
                  // Scroll to seasonal section if active, otherwise regular menu
                  const targetId = seasonalTheme && seasonalProducts.length > 0 ? 'seasonal' : 'menu';
                  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Start Ordering
              </Button>
              <Button variant="outline" size="xl" className="w-full sm:w-auto touch-manipulation" asChild>
                <a href="/about">Our Story</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Seasonal Section - Shows when a seasonal theme is active */}
      {seasonalTheme && seasonalProducts.length > 0 && (
        <section 
          id="seasonal"
          className="relative py-12 sm:py-16 overflow-hidden scroll-mt-20"
          style={{
            background: `linear-gradient(135deg, ${seasonalTheme.primary_color}15 0%, ${seasonalTheme.secondary_color}15 100%)`
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Seasonal Banner */}
            <motion.div
              className="text-center mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-4"
                style={{
                  background: `linear-gradient(135deg, ${seasonalTheme.primary_color} 0%, ${seasonalTheme.secondary_color} 100%)`,
                  boxShadow: `0 4px 20px ${seasonalTheme.primary_color}40`
                }}
              >
                <span className="text-3xl">{seasonalTheme.icon}</span>
                <span className="text-white font-bold text-lg">
                  {seasonalTheme.banner_text || `${seasonalTheme.name} Specials`}
                </span>
                <span className="text-3xl">{seasonalTheme.icon}</span>
              </div>
              {seasonalTheme.banner_subtext && (
                <p className="text-muted-foreground max-w-md mx-auto">
                  {seasonalTheme.banner_subtext}
                </p>
              )}
              {/* Inline scroll hint */}
              <button
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                <span>Full menu below</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </motion.div>

            {/* Seasonal Products Grid */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {seasonalProducts.map((product, index) => {
                // Find the mapped product from our products context for proper image handling
                const mappedProduct = products.find(p => p.id === product.id) || {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image_path.startsWith('uploads/') ? `/${product.image_path}` : '',
                  category: product.category,
                  description: product.description
                };
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="relative"
                  >
                    {/* Seasonal badge */}
                    <div 
                      className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg"
                      style={{ backgroundColor: seasonalTheme.accent_color }}
                    >
                      {seasonalTheme.icon}
                    </div>
                    <ProductCard
                      {...mappedProduct}
                      onAddToCart={handleAddToCart}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
          
          {/* Decorative accent line */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${seasonalTheme.accent_color}, transparent)` 
            }}
          />
        </section>
      )}

      {/* Menu Section */}
      <section id="menu" className="relative py-12 sm:py-16 md:py-20 scroll-mt-20">
        <FloatingShapes variant="section" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Sweet Menu
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Every treat is baked fresh for your pickup. Select your favorites below!
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {categories.map((cat, index) => (
              <motion.button
                key={cat.id}
                className={`px-5 py-2.5 rounded-full font-body font-medium text-sm transition-all duration-300 ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-medium"
                    : "bg-card text-muted-foreground hover:bg-secondary shadow-soft"
                }`}
                onClick={() => setActiveCategory(cat.id)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0, scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {cat.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Product Grid - Show by category sections when "All Treats" is selected */}
          {activeCategory === "all" ? (
            <div className="space-y-16">
              {/* Dynamic Category Sections */}
              {categories.filter(cat => cat.id !== "all").map((category) => {
                const categoryProducts = regularProducts.filter(p => p.category === category.id);
                if (categoryProducts.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <motion.h3
                      className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      {category.label}
                    </motion.h3>
                    <motion.div
                      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
                      layout
                    >
                      {categoryProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                        >
                          <ProductCard
                            {...product}
                            onAddToCart={handleAddToCart}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
              layout
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <ProductCard
                    {...product}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-rose-light/30 to-coral-light/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            className="max-w-xl mx-auto space-y-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Ready to Order?
            </h2>
            <p className="text-muted-foreground">
              Add your favorites to the cart and schedule a convenient pickup time. 
              Fresh treats will be waiting for you!
            </p>
            <Button variant="hero" size="xl" asChild>
              <a href="/checkout">View Your Order</a>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
});

Index.displayName = "Index";

export default Index;
