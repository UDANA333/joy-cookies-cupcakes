import { memo, useCallback, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Loader2, CheckCircle2, AlertCircle, DollarSign, Banknote } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { useCart } from "@/components/CartContext";
import { submitOrder } from "@/lib/api";

const Payment = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isNavigatingToConfirmation, setIsNavigatingToConfirmation] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoadError, setPaypalLoadError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'venmo' | 'paypal' | null>(null);
  
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const venmoContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonRendered = useRef(false);
  const venmoButtonRendered = useRef(false);
  
  const { formData } = (location.state as { 
    formData: { 
      firstName: string; 
      email: string; 
      phone?: string;
      pickupDate: string; 
      pickupTime: string 
    } 
  }) || { formData: null };

  // Calculate deposit (50%) and remaining balance
  const depositAmount = Math.round(totalPrice * 0.5 * 100) / 100;
  const remainingBalance = Math.round((totalPrice - depositAmount) * 100) / 100;

  // Redirect to checkout if accessed directly without form data
  useEffect(() => {
    if (isNavigatingToConfirmation || orderSuccess) return;
    
    if (!formData || !formData.email || items.length === 0) {
      navigate('/checkout', { replace: true });
    }
  }, [formData, items.length, navigate, isNavigatingToConfirmation, orderSuccess]);

  // Check if PayPal SDK is loaded with timeout
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total
    
    const checkPayPal = () => {
      attempts++;
      if (window.paypal) {
        setPaypalReady(true);
        setPaypalLoadError(false);
      } else if (attempts >= maxAttempts) {
        setPaypalLoadError(true);
        setError('Payment system failed to load. Please refresh the page or try again later.');
      } else {
        setTimeout(checkPayPal, 500);
      }
    };
    checkPayPal();
    
    return () => { attempts = maxAttempts; }; // Cleanup
  }, []);

  // Submit order after successful payment
  const handlePaymentSuccess = useCallback(async (paymentDetails: {
    transactionId: string;
    paymentMethod: string;
    payerEmail?: string;
  }) => {
    if (!formData) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
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
          // Include box item details for box products
          ...(item.isBox && item.boxItems && {
            isBox: true,
            boxItems: item.boxItems,
          }),
        })),
        total: totalPrice,
        depositAmount: depositAmount,
        remainingBalance: remainingBalance,
        paymentDetails: {
          transactionId: paymentDetails.transactionId,
          paymentMethod: paymentDetails.paymentMethod,
          payerEmail: paymentDetails.payerEmail,
          depositPaid: true,
        },
      };
      
      const response = await submitOrder(orderData);
      
      if (response.success) {
        setOrderNumber(response.orderNumber);
        setOrderSuccess(true);
        setIsNavigatingToConfirmation(true);
        clearCart();
        
        setTimeout(() => {
          navigate("/confirmation", { 
            state: { 
              orderNumber: response.orderNumber,
              formData, 
              totalPrice,
              depositAmount,
              remainingBalance,
              items,
              paymentMethod: paymentDetails.paymentMethod,
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
  }, [formData, items, totalPrice, depositAmount, remainingBalance, clearCart, navigate]);

  // Initialize PayPal Buttons
  useEffect(() => {
    if (!paypalReady || !paypalContainerRef.current || paypalButtonRendered.current || depositAmount <= 0) return;
    
    try {
      const paypalButtons = window.paypal?.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'pill',
          label: 'pay',
          height: 55, // Larger for mobile touch
          tagline: false,
        },
        fundingSource: window.paypal?.FUNDING.PAYPAL,
        createOrder: (_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              description: `Joy Cookies & Cupcakes - 50% Deposit`,
              amount: {
                currency_code: 'USD',
                value: depositAmount.toFixed(2),
              },
            }],
            application_context: {
              brand_name: 'Joy Cookies & Cupcakes',
              user_action: 'PAY_NOW',
            },
          });
        },
        onApprove: async (_data, actions) => {
          try {
            const details = await actions.order.capture();
            setPaymentMethod('paypal');
            await handlePaymentSuccess({
              transactionId: details.id,
              paymentMethod: 'PayPal',
              payerEmail: details.payer?.email_address,
            });
          } catch (err) {
            setError('Payment capture failed. Please try again.');
            console.error('PayPal capture error:', err);
          }
        },
        onError: (err) => {
          setError('PayPal encountered an error. Please try again.');
          console.error('PayPal error:', err);
        },
        onCancel: () => {
          setError('Payment was cancelled. Please try again when ready.');
        },
      });
      
      if (paypalButtons?.isEligible()) {
        paypalButtons.render(paypalContainerRef.current);
        paypalButtonRendered.current = true;
      }
    } catch (err) {
      console.error('PayPal button error:', err);
    }
  }, [paypalReady, depositAmount, handlePaymentSuccess]);

  // Initialize Venmo Button
  useEffect(() => {
    if (!paypalReady || !venmoContainerRef.current || venmoButtonRendered.current || depositAmount <= 0) return;
    
    try {
      const venmoButtons = window.paypal?.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'pill',
          label: 'pay',
          height: 55, // Larger for mobile touch
          tagline: false,
        },
        fundingSource: window.paypal?.FUNDING.VENMO,
        createOrder: (_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              description: `Joy Cookies & Cupcakes - 50% Deposit`,
              amount: {
                currency_code: 'USD',
                value: depositAmount.toFixed(2),
              },
            }],
            application_context: {
              brand_name: 'Joy Cookies & Cupcakes',
              user_action: 'PAY_NOW',
            },
          });
        },
        onApprove: async (_data, actions) => {
          try {
            const details = await actions.order.capture();
            setPaymentMethod('venmo');
            await handlePaymentSuccess({
              transactionId: details.id,
              paymentMethod: 'Venmo',
              payerEmail: details.payer?.email_address,
            });
          } catch (err) {
            setError('Payment capture failed. Please try again.');
            console.error('Venmo capture error:', err);
          }
        },
        onError: (err) => {
          setError('Venmo encountered an error. Please try again.');
          console.error('Venmo error:', err);
        },
        onCancel: () => {
          setError('Payment was cancelled. Please try again when ready.');
        },
      });
      
      if (venmoButtons?.isEligible()) {
        venmoButtons.render(venmoContainerRef.current);
        venmoButtonRendered.current = true;
      }
    } catch (err) {
      console.error('Venmo button error:', err);
    }
  }, [paypalReady, depositAmount, handlePaymentSuccess]);

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
                Deposit Received!
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
                Pay Deposit
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                50% deposit required to confirm your order
              </p>
            </div>

            <motion.div
              className="bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-medium space-y-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Order Summary */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
                
                {/* Deposit Amount - Highlighted */}
                <div className="bg-[#008CFF]/10 rounded-xl p-4 border-2 border-[#008CFF]/30">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#008CFF]" />
                      <span className="font-semibold text-[#008CFF]">Deposit Due Now (50%)</span>
                    </div>
                    <span className="font-display text-2xl font-bold text-[#008CFF]">
                      ${depositAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Remaining Balance */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-700">Due at Pickup</span>
                    </div>
                    <span className="font-display text-xl font-bold text-amber-700">
                      ${remainingBalance.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    Pay via Venmo/PayPal or Cash at pickup
                  </p>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground font-medium">
                  Choose your payment method
                </p>
                
                {paypalLoadError ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium mb-1">Payment system unavailable</p>
                      <p className="text-xs text-muted-foreground mb-3">Please try refreshing the page</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors touch-manipulation"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                ) : !paypalReady ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#008CFF]" />
                    <span className="text-sm text-muted-foreground">Loading payment options...</span>
                    <span className="text-xs text-muted-foreground/70">This may take a few seconds on mobile</span>
                  </div>
                ) : isSubmitting ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#008CFF]" />
                    <span className="text-sm text-muted-foreground">Processing your order...</span>
                    <span className="text-xs text-muted-foreground/70">Please don't close this page</span>
                  </div>
                ) : (
                  <>
                    {/* Venmo Button - Primary option */}
                    <div className="space-y-2">
                      <div ref={venmoContainerRef} className="min-h-[55px]" />
                      {!venmoButtonRendered.current && paypalReady && (
                        <p className="text-xs text-center text-amber-600">
                          Venmo is only available in the US. Use PayPal if Venmo doesn't appear.
                        </p>
                      )}
                    </div>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-3 text-muted-foreground">or</span>
                      </div>
                    </div>
                    
                    {/* PayPal Button - Alternative */}
                    <div ref={paypalContainerRef} className="min-h-[55px]" />
                  </>
                )}
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

              {/* Payment Info */}
              <div className="bg-secondary/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">
                  How it works
                </h3>
                <ol className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Pay 50% deposit now via Venmo or PayPal</li>
                  <li>We'll confirm your order via email</li>
                  <li>Pay remaining 50% at pickup (Venmo, PayPal, or Cash)</li>
                </ol>
              </div>

              <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                Your deposit is required to reserve your order. Secure payments powered by PayPal.
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
