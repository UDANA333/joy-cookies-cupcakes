import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MessageCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/CartContext";

const Contact = () => {
  const { totalItems } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent!", {
      description: "We'll get back to you soon with lots of love! 💕",
    });
    setFormData({ name: "", email: "", message: "" });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />

      <section className="relative pt-28 pb-20">
        <FloatingShapes variant="hero" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            className="text-center mb-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-6 bg-rose-light/50 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
            >
              <MessageCircle className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground">
              We'd love to hear from you! Whether it's a special order, 
              a question, or just to say hello – we're here for you.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <motion.div
              className="order-2 lg:order-1"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  className="bg-card rounded-3xl p-8 shadow-medium space-y-6"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <Label htmlFor="name" className="text-foreground">
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="What should we call you?"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-foreground">
                      Your Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us what's on your mind... custom orders, questions, or just a friendly hello!"
                      rows={5}
                      required
                      className="mt-1.5 resize-none"
                    />
                  </div>

                  <Button variant="hero" size="xl" className="w-full">
                    <Send className="w-5 h-5" />
                    Send Message
                  </Button>
                </motion.div>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              className="order-1 lg:order-2 space-y-8"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Email Card */}
              <motion.div
                className="bg-card rounded-3xl p-8 shadow-soft"
                whileHover={{ y: -4, boxShadow: "var(--shadow-medium)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      Email Us
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      For orders, questions, or sweet conversations
                    </p>
                    <a
                      href="mailto:hello@joycookies.com"
                      className="text-primary font-semibold hover:text-rose-deep transition-colors"
                    >
                      hello@joycookies.com
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Encouragement Card */}
              <motion.div
                className="bg-gradient-to-br from-rose-light/40 to-coral-light/40 rounded-3xl p-8 border border-rose/20"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-6 h-6 text-primary fill-primary" />
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    Special Orders Welcome!
                  </h3>
                </div>
                <p className="text-chocolate-light leading-relaxed">
                  Planning a birthday, celebration, or just want something 
                  extra special? We love creating custom treats! Tell us 
                  your vision and we'll make it happen with extra love baked in.
                </p>
              </motion.div>

              {/* Response Time */}
              <motion.div
                className="bg-secondary/50 rounded-2xl p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-muted-foreground text-sm">
                  We typically respond within <span className="font-semibold text-foreground">24 hours</span>
                  <br />
                  with a warm reply and maybe a cookie emoji 🍪
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
