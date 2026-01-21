import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";
import { products } from "@/data/products";
import heroImage from "@/assets/hero-banner.jpg";

type Category = "all" | "cookies" | "cupcakes" | "cakepops";

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All Treats" },
  { id: "cookies", label: "Cookies" },
  { id: "cupcakes", label: "Cupcakes" },
  { id: "cakepops", label: "Cake Pops" },
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const { addItem, totalItems, showNotification } = useCart();

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleAddToCart = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        isVegan: false,
        quantity: 1,
      });
      showNotification(`Added ${product.name} to your order!`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />
      
      {/* Hero Section - Optimized for all devices */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-16 md:pt-20">
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
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
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

      {/* Menu Section */}
      <section id="menu" className="relative py-12 sm:py-16 md:py-20">
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
              {/* Cookies Section */}
              <div>
                <motion.h3
                  className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  Cookies
                </motion.h3>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  layout
                >
                  {products.filter(p => p.category === "cookies").map((product, index) => (
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

              {/* Cupcakes Section */}
              <div>
                <motion.h3
                  className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  Cupcakes
                </motion.h3>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  layout
                >
                  {products.filter(p => p.category === "cupcakes").map((product, index) => (
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

              {/* Cake Pops Section */}
              <div>
                <motion.h3
                  className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  Cake Pops
                </motion.h3>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  layout
                >
                  {products.filter(p => p.category === "cakepops").map((product, index) => (
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
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
};

export default Index;
