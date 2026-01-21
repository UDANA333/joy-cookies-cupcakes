import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, totalPrice, clearCart } = useCart();
  const { formData } = (location.state as { formData: { firstName: string; email: string; pickupDate: string; pickupTime: string } }) || { formData: {} };

  const handlePayment = (method: "paypal" | "venmo") => {
    // UI only - just navigate to confirmation
    clearCart();
    navigate("/confirmation", { 
      state: { 
        formData, 
        totalPrice,
        paymentMethod: method 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />

      <section className="relative pt-28 pb-20 min-h-[80vh] flex items-center">
        <FloatingShapes variant="section" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
              >
                <CreditCard className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="font-display text-4xl font-bold text-foreground mb-2">
                Payment
              </h1>
              <p className="text-muted-foreground">
                Choose your preferred payment method
              </p>
            </div>

            <motion.div
              className="bg-card rounded-3xl p-8 shadow-medium space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Order Total */}
              <div className="bg-secondary/50 rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Order Total</p>
                <p className="font-display text-3xl font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Redirect Notice */}
              <div className="bg-rose-light/20 rounded-xl p-4 border border-rose/20">
                <p className="text-sm text-chocolate-light text-center flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  You'll be redirected to complete payment
                </p>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="default"
                    size="xl"
                    className="w-full bg-[#0070BA] hover:bg-[#005C9A] text-white"
                    onClick={() => handlePayment("paypal")}
                  >
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.407A.77.77 0 0 1 5.704 1.7h7.048c2.715 0 4.675.545 5.822 1.62.49.46.849 1.007 1.064 1.627.224.649.269 1.412.134 2.27-.016.1-.034.198-.053.297-.015.076-.03.152-.047.227-.35 1.68-1.084 2.97-2.193 3.846-1.155.914-2.738 1.377-4.707 1.377h-1.2a.95.95 0 0 0-.937.801l-.917 5.837-.247 1.565a.598.598 0 0 1-.594.54l-.001-.37z"/>
                    </svg>
                    Pay with PayPal
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="default"
                    size="xl"
                    className="w-full bg-[#008CFF] hover:bg-[#0070CC] text-white"
                    onClick={() => handlePayment("venmo")}
                  >
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.5 2h-15A2.5 2.5 0 0 0 2 4.5v15A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 19.5 2zm-2.65 4.97c.19.31.27.62.27 1.02 0 1.27-.99 2.92-1.8 4.08l-1.89 2.77c-.11.16-.27.24-.45.24H9.77c-.23 0-.43-.18-.46-.42l-1.25-7.44c-.02-.12.01-.24.08-.33a.44.44 0 0 1 .29-.16l2.39-.27c.29-.03.52.2.56.49l.63 3.98c.36-.63.82-1.61.82-2.3 0-.39-.06-.66-.13-.87l2.35-.27c.29-.03.52.2.56.49z"/>
                    </svg>
                    Pay with Venmo
                  </Button>
                </motion.div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Secure payment processing. Your data is protected.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Payment;
