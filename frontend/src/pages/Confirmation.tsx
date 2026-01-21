import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Clock, Mail, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";

const Confirmation = () => {
  const location = useLocation();
  const { formData, totalPrice, paymentMethod } = (location.state as { 
    formData: { firstName: string; email: string; pickupDate: string; pickupTime: string }; 
    totalPrice: number;
    paymentMethod: string;
  }) || { 
    formData: { firstName: "", email: "", pickupDate: "", pickupTime: "" }, 
    totalPrice: 0,
    paymentMethod: "" 
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      weekday: "long", 
      month: "long", 
      day: "numeric" 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-28 pb-20 min-h-[80vh] flex items-center">
        <FloatingShapes variant="hero" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-lg mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Success Icon */}
            <motion.div
              className="relative w-24 h-24 mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-mint/30 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-mint rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-chocolate" />
              </div>
            </motion.div>

            <motion.h1
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Order Confirmed!
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Thank you{formData.firstName ? `, ${formData.firstName}` : ""}! Your sweet treats are being prepared with love.
            </motion.p>

            {/* Order Details Card */}
            <motion.div
              className="bg-card rounded-3xl p-8 shadow-medium text-left space-y-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-display text-2xl font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Date</p>
                    <p className="font-semibold text-foreground">
                      {formatDate(formData.pickupDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup Time</p>
                    <p className="font-semibold text-foreground">
                      {formData.pickupTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmation Email</p>
                    <p className="font-semibold text-foreground">
                      {formData.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-rose-light/30 rounded-xl p-4 border border-rose/20">
                <p className="text-sm text-chocolate-light text-center flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  A confirmation and bill will be sent to your email.
                </p>
              </div>
            </motion.div>

            {/* Back to Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Back to Menu
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Confirmation;
