import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Clock, ArrowRight, Trash2, Minus, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/CartContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const timeSlots = [
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phone: "",
    pickupDate: "",
    pickupTime: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimeChange = (value: string) => {
    setFormData({ ...formData, pickupTime: value });
  };

  const handleContinue = () => {
    if (formData.email && formData.pickupDate && formData.pickupTime && items.length > 0) {
      navigate("/payment", { state: { formData, items, totalPrice } });
    }
  };

  const isFormValid = formData.email && formData.pickupDate && formData.pickupTime && items.length > 0;

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />

      <section className="relative pt-28 pb-20">
        <FloatingShapes variant="section" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Your Order
            </h1>
            <p className="text-muted-foreground">
              Review your treats and schedule your pickup
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Order Summary */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Order Summary
              </h2>

              {items.length === 0 ? (
                <motion.div
                  className="bg-card rounded-2xl p-8 shadow-soft text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-muted-foreground mb-4">Your cart is empty</p>
                  <Button variant="rose" asChild>
                    <a href="/">Browse Menu</a>
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="bg-card rounded-2xl p-4 shadow-soft flex items-center gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.isVegan ? "Vegan" : "Regular"} • ${item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          whileTap={{ scale: 0.85 }}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <span className="w-6 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <motion.button
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          whileTap={{ scale: 0.85 }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                      <span className="font-semibold text-primary w-16 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <motion.button
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeItem(item.id)}
                        whileTap={{ scale: 0.85 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}

                  <div className="bg-secondary/50 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({totalItems} items)</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-display text-xl font-semibold text-foreground">
                      <span>Total</span>
                      <span className="text-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pickup Details Form */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Pickup Details
              </h2>

              <div className="bg-card rounded-2xl p-6 shadow-soft space-y-5">
                {/* Pickup Only Notice */}
                <div className="bg-coral-light/30 rounded-xl p-4 border border-coral/20">
                  <p className="text-sm text-chocolate-light font-medium text-center">
                    📍 Pickup only – no delivery available
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firstName" className="text-foreground">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Your first name"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-foreground">
                      Email <span className="text-primary">*</span>
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
                    <Label htmlFor="phone" className="text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pickupDate" className="text-foreground flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Pickup Date <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="pickupDate"
                        name="pickupDate"
                        type="date"
                        min={minDateStr}
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pickupTime" className="text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time Slot <span className="text-primary">*</span>
                      </Label>
                      <Select onValueChange={handleTimeChange}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mt-6"
                  onClick={handleContinue}
                  disabled={!isFormValid}
                >
                  Continue to Payment
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Checkout;
