import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";
import heroImage from "@/assets/hero-banner.jpg";
import cookieImage from "@/assets/cookie-hero.jpg";
import cupcakeImage from "@/assets/cupcake-hero.jpg";
import cakepopImage from "@/assets/cakepop-hero.jpg";

type Category = "all" | "cookies" | "cupcakes" | "cakepops" | "seasonal";

const products = [
  // Cookies
  { id: "1", name: "Classic Chocolate Chip", price: 3.5, image: cookieImage, category: "cookies" },
  { id: "2", name: "Double Fudge Brownie", price: 4.0, image: cookieImage, category: "cookies" },
  { id: "3", name: "Snickerdoodle Delight", price: 3.5, image: cookieImage, category: "cookies" },
  { id: "4", name: "Oatmeal Raisin Love", price: 3.5, image: cookieImage, category: "cookies" },
  // Cupcakes
  { id: "5", name: "Vanilla Dream", price: 4.5, image: cupcakeImage, category: "cupcakes" },
  { id: "6", name: "Red Velvet Bliss", price: 5.0, image: cupcakeImage, category: "cupcakes" },
  { id: "7", name: "Strawberry Swirl", price: 4.75, image: cupcakeImage, category: "cupcakes" },
  { id: "8", name: "Chocolate Ganache", price: 5.0, image: cupcakeImage, category: "cupcakes" },
  // Cake Pops
  { id: "9", name: "Birthday Sprinkles", price: 3.0, image: cakepopImage, category: "cakepops" },
  { id: "10", name: "Pink Velvet Pop", price: 3.25, image: cakepopImage, category: "cakepops" },
  { id: "11", name: "Cookies & Cream", price: 3.25, image: cakepopImage, category: "cakepops" },
  // Seasonal
  { id: "12", name: "Pumpkin Spice Cookie", price: 4.0, image: cookieImage, category: "seasonal" },
  { id: "13", name: "Maple Pecan Cupcake", price: 5.5, image: cupcakeImage, category: "seasonal" },
];

const categories: { id: Category; label: string }[] = [
  { id: "all", label: "All Treats" },
  { id: "cookies", label: "Cookies" },
  { id: "cupcakes", label: "Cupcakes" },
  { id: "cakepops", label: "Cake Pops" },
  { id: "seasonal", label: "Seasonal ✨" },
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const { addItem, totalItems } = useCart();

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleAddToCart = (id: string, quantity: number, isVegan: boolean) => {
    const product = products.find(p => p.id === id);
    if (product) {
      addItem({
        id: `${id}-${isVegan ? 'veg' : 'reg'}`,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        isVegan,
        quantity,
      });
      toast.success(`Added ${quantity} ${product.name} to your order!`, {
        description: isVegan ? "Vegan option selected" : "Regular option",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
        <FloatingShapes variant="hero" />
        
        {/* Hero Background Image */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <img 
            src={heroImage} 
            alt="Bakery treats" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-2xl mx-auto text-center space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.h1 
              className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Homemade goodness
              <br />
              <span className="text-gradient">baked with joy</span>
            </motion.h1>
            
            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Fresh-baked cookies, cupcakes & cake pops made with love. 
              Pre-order for easy pickup!
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Button variant="hero" size="xl" onClick={() => {
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Start Ordering
              </Button>
              <Button variant="outline" size="xl" asChild>
                <a href="/about">Our Story</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-primary/30 flex justify-center pt-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-1.5 h-3 bg-primary/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="relative py-20">
        <FloatingShapes variant="section" />
        
        <div className="container mx-auto px-4 relative z-10">
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

          {/* Seasonal Notice */}
          {activeCategory === "seasonal" && (
            <motion.div
              className="text-center mb-8 p-4 bg-coral-light/30 rounded-2xl border border-coral/20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-chocolate-light text-sm font-medium">
                ✨ Seasonal flavors • Prices may vary based on availability
              </p>
            </motion.div>
          )}

          {/* Product Grid */}
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
