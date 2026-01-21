import { motion } from "framer-motion";
import { Heart, Sparkles, Cookie } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";
import heroImage from "@/assets/hero-banner.jpg";

const About = () => {
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 min-h-[60vh] flex items-center overflow-hidden">
        <FloatingShapes variant="hero" />

        {/* Background */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.15 }}
          transition={{ duration: 1.2 }}
        >
          <img
            src={heroImage}
            alt="Bakery"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-rose-light/50 rounded-full flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            >
              <Heart className="w-10 h-10 text-primary fill-primary" />
            </motion.div>

            <motion.h1
              className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Our Story
            </motion.h1>

            <motion.p
              className="text-xl text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Where every bite tells a story of love, tradition, and homemade happiness
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* The Beginning */}
            <motion.div
              className="grid md:grid-cols-2 gap-10 items-center mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-coral" />
                  <h2 className="font-display text-3xl font-bold text-foreground">
                    The Beginning
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Joy Cookies & Cupcakes started in a cozy kitchen with a simple dream: 
                  to spread happiness, one treat at a time. What began as baking for 
                  family and friends quickly grew into something magical.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Every recipe has been perfected over years of love and taste-testing 
                  (our favorite part!). We believe that the best treats come from real 
                  ingredients, time-honored techniques, and a whole lot of heart.
                </p>
              </div>
              <motion.div
                className="bg-gradient-to-br from-rose-light/30 to-coral-light/30 rounded-3xl p-8 text-center"
                whileHover={{ y: -8, boxShadow: "var(--shadow-lifted)" }}
                transition={{ duration: 0.4 }}
              >
                <Cookie className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="font-display text-2xl font-semibold text-foreground mb-2">
                  100% Homemade
                </p>
                <p className="text-muted-foreground">
                  Every single treat, baked with care
                </p>
              </motion.div>
            </motion.div>

            {/* Values */}
            <motion.div
              className="bg-card rounded-3xl p-10 shadow-medium mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl font-bold text-foreground text-center mb-10">
                What We Believe In
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "🧈",
                    title: "Real Ingredients",
                    desc: "Fresh butter, farm eggs, quality chocolate. No shortcuts, no artificial anything.",
                  },
                  {
                    icon: "💕",
                    title: "Made with Love",
                    desc: "Every batch is baked with intention, care, and a sprinkle of joy.",
                  },
                  {
                    icon: "✨",
                    title: "Special Moments",
                    desc: "We're honored to be part of your celebrations, big and small.",
                  },
                ].map((value, index) => (
                  <motion.div
                    key={index}
                    className="text-center space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-4xl">{value.icon}</span>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{value.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Ready to Taste the Joy?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Browse our menu and discover your new favorite treat. 
                We can't wait to bake for you!
              </p>
              <Button variant="hero" size="xl" asChild>
                <a href="/" className="flex items-center gap-2">
                  <Cookie className="w-5 h-5" />
                  Explore Our Menu
                </a>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
