import { memo } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Clock, Mail, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";

const Confirmation = memo(() => {
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

      <section className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 min-h-[70vh] sm:min-h-[80vh] flex items-center">
        <FloatingShapes variant="hero" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Icon */}
            <motion.div
              className="relative w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 mx-auto mb-4 sm:mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-mint/30 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-mint rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 text-chocolate" />
              </div>
            </motion.div>

            <motion.h1
              className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Order Confirmed!
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 px-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Thank you{formData.firstName ? `, ${formData.firstName}` : ""}! Your sweet treats are being prepared with love.
            </motion.p>

            {/* Order Details Card */}
            <motion.div
              className="bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-medium text-left space-y-4 sm:space-y-6 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border">
                <span className="text-sm sm:text-base text-muted-foreground">Order Total</span>
                <span className="font-display text-xl sm:text-2xl font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Pickup Date</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {formatDate(formData.pickupDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Pickup Time</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {formData.pickupTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Confirmation Email</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {formData.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-rose-light/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-rose/20">
                <p className="text-xs sm:text-sm text-chocolate-light text-center flex items-center justify-center gap-1.5 sm:gap-2">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>A confirmation and bill will be sent to your email.</span>
                </p>
              </div>
            </motion.div>

            {/* Back to Menu */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button variant="hero" size="xl" asChild className="w-full sm:w-auto touch-manipulation">
                <Link to="/" className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
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
});

Confirmation.displayName = "Confirmation";

export default Confirmation;
