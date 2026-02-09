import { memo, useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Loader2, CheckCircle2, AlertCircle, DollarSign, Banknote } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingShapes from "@/components/FloatingShapes";
import { getOrder, payRemainingBalance } from "@/lib/api";

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  pickupDate: string;
  pickupTime: string;
  total: number;
  depositAmount: number;
  remainingBalance: number;
  paymentStatus: string;
}

const PayBalance = memo(() => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = searchParams.get("order");
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoadError, setPaypalLoadError] = useState(false);
  
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const venmoContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonRendered = useRef(false);
  const venmoButtonRendered = useRef(false);

  // Fetch order details
  useEffect(() => {
    if (!orderNumber) {
      setError("No order number provided");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await getOrder(orderNumber);
        if (data.order) {
          const orderData: OrderData = {
            orderNumber: data.order.orderNumber,
            customerName: data.order.customerName,
            customerEmail: data.order.customerEmail,
            pickupDate: data.order.pickupDate,
            pickupTime: data.order.pickupTime,
            total: data.order.total,
            depositAmount: data.order.depositAmount || 0,
            remainingBalance: data.order.remainingBalance || data.order.total,
            paymentStatus: data.order.paymentStatus,
          };
          
          if (orderData.paymentStatus === "paid") {
            setError("This order has already been fully paid!");
          } else {
            setOrder(orderData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

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
        setError('Payment system failed to load. Please refresh the page.');
      } else {
        setTimeout(checkPayPal, 500);
      }
    };
    checkPayPal();
    
    return () => { attempts = maxAttempts; };
  }, []);

  // Handle successful payment
  const handlePaymentSuccess = useCallback(async (paymentDetails: {
    transactionId: string;
    paymentMethod: string;
    payerEmail?: string;
  }) => {
    if (!order) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await payRemainingBalance(order.orderNumber, {
        transactionId: paymentDetails.transactionId,
        paymentMethod: paymentDetails.paymentMethod,
        payerEmail: paymentDetails.payerEmail,
      });
      
      setPaymentSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  }, [order]);

  // Initialize PayPal Button
  useEffect(() => {
    if (!paypalReady || !paypalContainerRef.current || paypalButtonRendered.current || !order || order.remainingBalance <= 0) return;
    
    try {
      const paypalButtons = window.paypal?.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'pill',
          label: 'pay',
          height: 55,
          tagline: false,
        },
        fundingSource: window.paypal?.FUNDING.PAYPAL,
        createOrder: (_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              description: `Joy Cookies & Cupcakes - Remaining Balance for ${order.orderNumber}`,
              amount: {
                currency_code: 'USD',
                value: order.remainingBalance.toFixed(2),
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
  }, [paypalReady, order, handlePaymentSuccess]);

  // Initialize Venmo Button
  useEffect(() => {
    if (!paypalReady || !venmoContainerRef.current || venmoButtonRendered.current || !order || order.remainingBalance <= 0) return;
    
    try {
      const venmoButtons = window.paypal?.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'pill',
          label: 'pay',
          height: 55,
          tagline: false,
        },
        fundingSource: window.paypal?.FUNDING.VENMO,
        createOrder: (_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              description: `Joy Cookies & Cupcakes - Remaining Balance for ${order.orderNumber}`,
              amount: {
                currency_code: 'USD',
                value: order.remainingBalance.toFixed(2),
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
  }, [paypalReady, order, handlePaymentSuccess]);

  // Success state
  if (paymentSuccess) {
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
                Payment Complete!
              </h2>
              <p className="text-muted-foreground mb-2">
                Your remaining balance for order
              </p>
              <p className="font-mono text-xl font-bold text-primary mb-4">
                {order?.orderNumber}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                has been paid in full. See you at pickup! 🎉
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Home
              </button>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartCount={0} />
        <section className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center">
          <FloatingShapes variant="section" />
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Error state (no order found or already paid)
  if (error && !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartCount={0} />
        <section className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 min-h-[70vh] sm:min-h-[80vh] flex items-center">
          <FloatingShapes variant="section" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              className="max-w-md mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                {error}
              </h2>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Back to Home
              </button>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={0} />

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
                Pay Remaining Balance
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Complete payment for order {order?.orderNumber}
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
                  <span className="font-semibold">${order?.total.toFixed(2)}</span>
                </div>
                
                {/* Deposit Paid */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">Deposit Already Paid</span>
                    </div>
                    <span className="font-semibold text-green-700">
                      ${order?.depositAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Remaining Balance - Highlighted */}
                <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-300">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-700">Amount Due Now</span>
                    </div>
                    <span className="font-display text-2xl font-bold text-amber-700">
                      ${order?.remainingBalance.toFixed(2)}
                    </span>
                  </div>
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
                    <span className="text-sm text-muted-foreground">Processing payment...</span>
                    <span className="text-xs text-muted-foreground/70">Please don't close this page</span>
                  </div>
                ) : (
                  <>
                    {/* Venmo Button */}
                    <div className="space-y-2">
                      <div ref={venmoContainerRef} className="min-h-[55px]" />
                    </div>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-3 text-muted-foreground">or</span>
                      </div>
                    </div>
                    
                    {/* PayPal Button */}
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

              {/* Cash Option */}
              <div className="bg-secondary/50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Banknote className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-sm">Prefer to pay with cash?</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can also pay in cash when you pick up your order!
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
});

PayBalance.displayName = "PayBalance";

export default PayBalance;
