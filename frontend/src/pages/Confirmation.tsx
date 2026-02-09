import { memo, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Clock, Mail, Heart, MapPin, DollarSign, Banknote } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";

const Confirmation = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData, totalPrice, orderNumber, items, depositAmount, remainingBalance, paymentMethod } = (location.state as { 
    formData: { firstName: string; lastName?: string; email: string; pickupDate: string; pickupTime: string }; 
    totalPrice: number;
    orderNumber: string;
    items?: { id: string; name: string; price: number; quantity: number }[];
    depositAmount?: number;
    remainingBalance?: number;
    paymentMethod?: string;
  }) || { 
    formData: null, 
    totalPrice: 0,
    orderNumber: "",
    items: [],
    depositAmount: 0,
    remainingBalance: 0,
    paymentMethod: "",
  };

  // Redirect to home if accessed directly without order data
  useEffect(() => {
    if (!formData || !formData.email || !orderNumber) {
      navigate('/', { replace: true });
    }
  }, [formData, orderNumber, navigate]);

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
            className="max-w-sm sm:max-w-md lg:max-w-4xl mx-auto text-center"
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

            {/* Order Details & Location - Side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Order Details Card - Left */}
              <motion.div
                className="bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-medium text-left space-y-4 sm:space-y-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                {/* Order Number */}
                <div className="bg-primary/10 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Order Number</p>
                  <p className="font-mono text-lg sm:text-xl font-bold text-primary tracking-wider">
                    {orderNumber}
                  </p>
                </div>

                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-border">
                  <span className="text-sm sm:text-base text-muted-foreground">Order Total</span>
                  <span className="font-display text-xl sm:text-2xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* Payment Summary - Show if deposit was paid */}
                {depositAmount && depositAmount > 0 && (
                  <div className="space-y-3 pb-3 sm:pb-4 border-b border-border">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Deposit Paid ({paymentMethod})</span>
                        </div>
                        <span className="font-semibold text-green-700">${depositAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Due at Pickup</span>
                        </div>
                        <span className="font-semibold text-amber-700">${(remainingBalance || 0).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-amber-600 mt-1">
                        Pay via Venmo, PayPal, or Cash
                      </p>
                    </div>
                  </div>
                )}

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
                    <span>
                      {remainingBalance && remainingBalance > 0 
                        ? `Confirmation email sent! Remember to bring $${remainingBalance.toFixed(2)} for pickup.`
                        : 'A confirmation and bill will be sent to your email.'
                      }
                    </span>
                  </p>
                </div>
              </motion.div>

              {/* Pickup Location Card - Right */}
              <motion.a
                href="https://maps.app.goo.gl/z3BufPyu399hN2Dw9"
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="relative h-full bg-gradient-to-br from-rose-light/40 via-coral-light/30 to-mint-light/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-primary/30 shadow-medium hover:shadow-lifted hover:border-primary/50 transition-all group overflow-hidden flex flex-col justify-center">
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-14 h-14 sm:w-16 sm:h-16 bg-mint/20 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative flex flex-col items-center text-center gap-3 sm:gap-4">
                    {/* Map Pin Icon */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    
                    {/* Location Info */}
                    <div>
                      <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">📍 Pickup Location</span>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mt-1">
                        Joy Cookies & Cupcakes
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Tap to get directions on Google Maps
                      </p>
                    </div>
                  </div>
                  
                  {/* Bottom notice */}
                  <div className="relative mt-4 pt-3 sm:pt-4 border-t border-primary/20">
                    <p className="text-[10px] sm:text-xs text-chocolate-light text-center font-medium leading-relaxed">
                      🚗 Don't forget to bring your confirmation email!
                    </p>
                  </div>
                </div>
              </motion.a>
            </div>

            {/* Back to Menu */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
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
