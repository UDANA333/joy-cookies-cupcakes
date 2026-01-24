import { memo, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Loader2, CheckCircle2, AlertCircle, QrCode } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";
import { submitOrder } from "@/lib/api";

// Placeholder QR code - client will provide actual Venmo QR
const VENMO_QR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f5f5f5' width='200' height='200'/%3E%3Ctext x='50%25' y='45%25' font-family='sans-serif' font-size='14' fill='%23666' text-anchor='middle'%3EVenmo QR%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='sans-serif' font-size='12' fill='%23999' text-anchor='middle'%3ECode Here%3C/text%3E%3C/svg%3E";

const Payment = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  
  const { formData } = (location.state as { 
    formData: { 
      firstName: string; 
      email: string; 
      phone?: string;
      pickupDate: string; 
      pickupTime: string 
    } 
  }) || { formData: null };

  // Redirect to checkout if accessed directly without form data
  useEffect(() => {
    if (!formData || !formData.email || items.length === 0) {
      navigate('/checkout', { replace: true });
    }
  }, [formData, items.length, navigate]);

  const handleSubmitOrder = useCallback(async () => {
    if (!formData) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare order data
      const orderData = {
        customerName: formData.firstName || '',
        customerEmail: formData.email,
        customerPhone: formData.phone || undefined,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
        })),
        total: totalPrice,
      };
      
      // Submit to backend
      const response = await submitOrder(orderData);
      
      if (response.success) {
        setOrderNumber(response.orderNumber);
        setOrderSuccess(true);
        clearCart();
        
        // Navigate to confirmation after a short delay
        setTimeout(() => {
          navigate("/confirmation", { 
            state: { 
              orderNumber: response.orderNumber,
              formData, 
              totalPrice,
              items,
            },
            replace: true,
          });
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order. Please try again.');
      console.error('Order submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, items, totalPrice, clearCart, navigate]);

  // Show success state
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartCount={0} />
        <section className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 min-h-[70vh] sm:min-h-[80vh] flex items-center">
          <FloatingShapes variant="section" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              className="max-w-md mx-auto text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Order Submitted!
              </h2>
              <p className="text-muted-foreground mb-2">
                Your order number is:
              </p>
              <p className="font-mono text-xl font-bold text-primary mb-4">
                {orderNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to confirmation page...
              </p>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />

      <section className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 min-h-[70vh] sm:min-h-[80vh] flex items-center">
        <FloatingShapes variant="section" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
              >
                <CreditCard className="w-6 h-6 sm:w-7 md:w-8 sm:h-7 md:h-8 text-primary" />
              </motion.div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Payment
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Pay via Venmo at pickup
              </p>
            </div>

            <motion.div
              className="bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-medium space-y-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Order Total */}
              <div className="bg-secondary/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Order Total</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </p>
              </div>

              {/* Venmo QR Code Section */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-[#008CFF] font-semibold">
                  <QrCode className="w-5 h-5" />
                  <span>Venmo Payment</span>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-100 inline-block mx-auto">
                  <img 
                    src={VENMO_QR_PLACEHOLDER} 
                    alt="Venmo QR Code" 
                    className="w-40 h-40 sm:w-48 sm:h-48 mx-auto"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Scan this QR code with your Venmo app at pickup
                </p>
              </div>

              {/* Payment Instructions */}
              <div className="bg-rose-light/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-rose/20">
                <h3 className="font-semibold text-chocolate text-sm mb-2">
                  Payment Instructions
                </h3>
                <ol className="text-xs sm:text-sm text-chocolate-light space-y-1.5 list-decimal list-inside">
                  <li>Click "Place Order" to confirm your order</li>
                  <li>Pay via Venmo when you pick up your treats</li>
                  <li>Show your order confirmation email at pickup</li>
                </ol>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Place Order Button */}
              <Button
                variant="default"
                size="xl"
                className="w-full bg-[#008CFF] hover:bg-[#0070CC] text-white touch-manipulation"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.5 2h-15A2.5 2.5 0 0 0 2 4.5v15A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 19.5 2zm-2.65 4.97c.19.31.27.62.27 1.02 0 1.27-.99 2.92-1.8 4.08l-1.89 2.77c-.11.16-.27.24-.45.24H9.77c-.23 0-.43-.18-.46-.42l-1.25-7.44c-.02-.12.01-.24.08-.33a.44.44 0 0 1 .29-.16l2.39-.27c.29-.03.52.2.56.49l.63 3.98c.36-.63.82-1.61.82-2.3 0-.39-.06-.66-.13-.87l2.35-.27c.29-.03.52.2.56.49z"/>
                    </svg>
                    Place Order - Pay at Pickup
                  </>
                )}
              </Button>

              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                By placing your order, you agree to pay via Venmo at pickup.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
});

Payment.displayName = "Payment";

export default Payment;
