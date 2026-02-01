import { useState, memo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, ArrowRight, Trash2, Minus, Plus, MapPin, Navigation } from "lucide-react";
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

const weekendTimeSlots = [
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
];

const weekdayTimeSlots = [
  "5:00 PM - 6:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
];

const isWeekend = (dateString: string): boolean => {
  if (!dateString) return true;
  const date = new Date(dateString + 'T12:00:00'); // Use noon to avoid timezone issues
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

// Format a Date object to YYYY-MM-DD in LOCAL timezone (not UTC!)
// This is important for US users - toISOString() uses UTC which can be a day ahead
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if a date string (YYYY-MM-DD) is today in local timezone
const isToday = (dateString: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  return dateString === formatDateForInput(today);
};

// Parse time slot start time to hours (24h format)
const parseSlotStartHour = (slot: string): number => {
  // e.g., "5:00 PM - 6:00 PM" -> 17, "10:00 AM - 11:00 AM" -> 10
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour;
};

// Get available time slots for a given date, filtering out past slots if it's today
const getAvailableTimeSlots = (dateString: string): string[] => {
  if (!dateString) return [];
  
  const baseSlots = isWeekend(dateString) ? weekendTimeSlots : weekdayTimeSlots;
  
  if (!isToday(dateString)) {
    return baseSlots; // Return all slots for future dates
  }
  
  // For today, filter out slots that have already passed
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  return baseSlots.filter(slot => {
    const slotStartHour = parseSlotStartHour(slot);
    
    // Allow if slot hasn't started yet
    if (slotStartHour > currentHour) return true;
    
    // Grace period: Allow booking up to 10 minutes after slot start time
    // This gives customers a last chance to order for the current slot
    if (slotStartHour === currentHour && currentMinutes <= 10) return true;
    
    return false;
  });
};

// Check if a slot is in "last chance" mode (within 10 minutes of start)
const isLastChanceSlot = (slot: string, dateString: string): boolean => {
  if (!isToday(dateString)) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const slotStartHour = parseSlotStartHour(slot);
  
  // It's last chance if slot has already started but within 10 min grace period
  return slotStartHour === currentHour && currentMinutes <= 10;
};

// Format phone number to USA format: (XXX) XXX-XXXX
const formatUSAPhone = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits (remove country code if present)
  const trimmed = digits.slice(0, 10);
  
  // Format based on length
  if (trimmed.length === 0) return '';
  if (trimmed.length <= 3) return `(${trimmed}`;
  if (trimmed.length <= 6) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
  return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
};

// Validate USA phone number (10 digits)
const isValidUSAPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 0 || digits.length === 10;
};

// Sanitize text input to prevent XSS
const sanitizeInput = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 100); // Limit length
};

// Email validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Common email domain typos and their corrections
const EMAIL_TYPO_MAP: Record<string, string> = {
  'gmail.con': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'yahoo.con': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'icloud.con': 'icloud.com',
  'icoud.com': 'icloud.com',
};

interface EmailValidation {
  isValid: boolean;
  error: string | null;
  suggestion: string | null;
}

const validateEmail = (email: string): EmailValidation => {
  if (!email) return { isValid: true, error: null, suggestion: null };
  
  // Check basic format
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address', suggestion: null };
  }
  
  // Check for common typos
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && EMAIL_TYPO_MAP[domain]) {
    const corrected = email.replace(domain, EMAIL_TYPO_MAP[domain]);
    return { isValid: true, error: null, suggestion: `Did you mean ${corrected}?` };
  }
  
  return { isValid: true, error: null, suggestion: null };
};

const Checkout = memo(() => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    phone: "",
    pickupDate: "",
    pickupTime: "",
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailValidation, setEmailValidation] = useState<EmailValidation>({ isValid: true, error: null, suggestion: null });
  
  // Track scroll position for sticky location banner
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Trigger when scrolled past 300px
      setIsScrolled(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Reset time slot when date changes (in case the current time is invalid for new date)
    if (name === 'pickupDate') {
      setFormData(prev => ({ ...prev, [name]: value, pickupTime: '' }));
    } else if (name === 'phone') {
      // Auto-format phone number to USA format
      const formatted = formatUSAPhone(value);
      setFormData(prev => ({ ...prev, phone: formatted }));
      // Validate and show error if incomplete
      if (!isValidUSAPhone(formatted)) {
        setPhoneError('Please enter a valid 10-digit phone number');
      } else {
        setPhoneError(null);
      }
    } else if (name === 'firstName') {
      // Sanitize name input
      setFormData(prev => ({ ...prev, firstName: sanitizeInput(value).slice(0, 50) }));
    } else if (name === 'email') {
      // Validate email and check for typos
      const trimmed = value.slice(0, 100);
      setFormData(prev => ({ ...prev, email: trimmed }));
      setEmailValidation(validateEmail(trimmed));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  // Get available time slots based on selected date (filters past slots if today)
  const availableTimeSlots = getAvailableTimeSlots(formData.pickupDate);

  const handleTimeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, pickupTime: value }));
  }, []);

  const handleContinue = useCallback(() => {
    if (formData.email && emailValidation.isValid && formData.pickupDate && formData.pickupTime && items.length > 0) {
      navigate("/payment", { state: { formData, items, totalPrice } });
    }
  }, [formData, emailValidation.isValid, items, totalPrice, navigate]);

  const isFormValid = formData.email && emailValidation.isValid && formData.pickupDate && formData.pickupTime && items.length > 0;

  // Always allow today as minimum date - time slot filtering handles unavailable times
  const minDateStr = formatDateForInput(new Date());

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} />

      <section className="relative pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20">
        <FloatingShapes variant="section" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 sm:mb-4">
              Your Order
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Review your treats and schedule your pickup
            </p>
          </motion.div>

          {/* Prominent Pickup Location Banner - Original Position */}
          <motion.a
            href="https://maps.app.goo.gl/z3BufPyu399hN2Dw9"
            target="_blank"
            rel="noopener noreferrer"
            className={`block max-w-xl mx-auto mb-8 sm:mb-10 md:mb-12 transition-opacity duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isScrolled ? 0 : 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative bg-gradient-to-r from-rose-light/40 via-coral-light/30 to-mint-light/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-primary/30 shadow-medium hover:shadow-lifted hover:border-primary/50 transition-all group overflow-hidden">
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
                  🚗 Pickup only – No delivery available<br className="sm:hidden" />
                  <span className="hidden sm:inline"> • </span>Please bring your confirmation email
                </p>
              </div>
            </div>
          </motion.a>

          {/* Floating Sticky Location Button - Appears when scrolled */}
          <AnimatePresence>
            {isScrolled && (
              <motion.a
                href="https://maps.app.goo.gl/z3BufPyu399hN2Dw9"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed right-3 sm:right-4 md:right-6 top-16 sm:top-20 md:top-24 z-40"
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* Mobile: Compact circle button */}
                <div className="sm:hidden bg-gradient-to-br from-primary to-rose-deep rounded-full p-2.5 shadow-lifted hover:shadow-glow transition-all group border border-white/20">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-white" />
                    <Navigation className="w-4 h-4 text-white/90" />
                  </div>
                </div>
                
                {/* Desktop: Full button with text */}
                <div className="hidden sm:block bg-gradient-to-br from-primary to-rose-deep rounded-2xl p-3 md:p-4 shadow-lifted hover:shadow-glow transition-all group border border-white/20">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs text-white/80 font-medium uppercase tracking-wide">Pickup at</p>
                      <p className="text-xs md:text-sm text-white font-bold">Joy Cookies</p>
                    </div>
                    <Navigation className="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors ml-1" />
                  </div>
                </div>
              </motion.a>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
            {/* Order Summary */}
            <motion.div
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                Order Summary
              </h2>

              {items.length === 0 ? (
                <motion.div
                  className="bg-card rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-soft text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Your cart is empty</p>
                  <Button variant="rose" asChild className="touch-manipulation">
                    <a href="/#menu">Browse Menu</a>
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-soft"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Top row - Image, Name, Delete */}
                      <div className="flex items-center gap-2 sm:gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 sm:w-14 sm:h-14 object-cover rounded-lg sm:rounded-xl flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <motion.button
                          className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive transition-colors touch-manipulation flex-shrink-0"
                          onClick={() => removeItem(item.id)}
                          whileTap={{ scale: 0.85 }}
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      {/* Bottom row - Quantity controls and Price */}
                      <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-1">
                          <motion.button
                            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            whileTap={{ scale: 0.85 }}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </motion.button>
                          <span className="w-6 sm:w-8 text-center text-sm sm:text-base font-semibold">
                            {item.quantity}
                          </span>
                          <motion.button
                            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            whileTap={{ scale: 0.85 }}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </motion.button>
                        </div>
                        <span className="font-semibold text-primary text-base sm:text-lg">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Total */}
                  <div className="bg-secondary/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                      <span>Subtotal ({totalItems} items)</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-display text-lg sm:text-xl font-semibold text-foreground">
                      <span>Total</span>
                      <span className="text-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pickup Details Form - Sticky on desktop */}
            <motion.div
              className="space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:self-start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                Pickup Details
              </h2>

              <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-soft space-y-4 sm:space-y-5">
                {/* Pickup Only Notice */}
                <div className="bg-coral-light/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-coral/20">
                  <p className="text-xs sm:text-sm text-chocolate-light font-medium text-center">
                    📍 Pickup only – no delivery available
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="firstName" className="text-foreground text-sm sm:text-base">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Your first name"
                      maxLength={50}
                      autoComplete="given-name"
                      className="mt-1.5 touch-manipulation"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-foreground text-sm sm:text-base">
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
                      maxLength={100}
                      autoComplete="email"
                      className={`mt-1.5 touch-manipulation ${emailValidation.error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {emailValidation.error && formData.email && (
                      <p className="text-xs text-destructive mt-1">{emailValidation.error}</p>
                    )}
                    {emailValidation.suggestion && (
                      <button
                        type="button"
                        onClick={() => {
                          const corrected = formData.email.replace(
                            formData.email.split('@')[1],
                            EMAIL_TYPO_MAP[formData.email.split('@')[1]?.toLowerCase()]
                          );
                          setFormData(prev => ({ ...prev, email: corrected }));
                          setEmailValidation({ isValid: true, error: null, suggestion: null });
                        }}
                        className="text-xs text-primary hover:underline mt-1 text-left"
                      >
                        {emailValidation.suggestion}
                      </button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-foreground text-sm sm:text-base">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      className={`mt-1.5 touch-manipulation ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {phoneError && formData.phone && (
                      <p className="text-xs text-destructive mt-1">{phoneError}</p>
                    )}
                  </div>

                  {/* Pickup Hours Notice */}
                  <div className="bg-mint/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-mint/20">
                    <p className="text-xs sm:text-sm text-chocolate-light">
                      <span className="font-semibold">⏰ Pickup Hours:</span><br />
                      <span className="text-muted-foreground">
                        Weekdays (Mon-Fri): 5PM - 8PM<br />
                        Weekends (Sat-Sun): 10AM - 5PM
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="pickupDate" className="text-foreground text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                        <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Pickup Date <span className="text-primary">*</span>
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="pickupDate"
                          name="pickupDate"
                          type="date"
                          min={minDateStr}
                          value={formData.pickupDate}
                          onChange={handleInputChange}
                          required
                          className={`touch-manipulation w-full pr-10 ${!formData.pickupDate ? '[color:transparent]' : ''}`}
                          style={{ minWidth: 0 }}
                        />
                        {!formData.pickupDate && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-sm sm:text-base">
                            mm/dd/yyyy
                          </span>
                        )}
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pickupTime" className="text-foreground text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Time Slot <span className="text-primary">*</span>
                      </Label>
                      {formData.pickupDate && availableTimeSlots.length === 0 ? (
                        <div className="mt-1.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            No time slots available for this date. Please select a different date.
                          </p>
                        </div>
                      ) : (
                        <Select 
                          key={formData.pickupDate} 
                          onValueChange={handleTimeChange}
                          value={formData.pickupTime}
                        >
                          <SelectTrigger className="mt-1.5 touch-manipulation">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots.map((slot) => {
                              const isLastChance = isLastChanceSlot(slot, formData.pickupDate);
                              return (
                                <SelectItem key={slot} value={slot}>
                                  {isLastChance ? (
                                    <span className="flex items-center gap-2">
                                      {slot}
                                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium animate-pulse">
                                        ⚡ Last chance!
                                      </span>
                                    </span>
                                  ) : slot}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mt-4 sm:mt-6 touch-manipulation hidden lg:flex"
                  onClick={handleContinue}
                  disabled={!isFormValid}
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar - Mobile/Tablet */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{totalItems} items</p>
                  <p className="font-display text-lg sm:text-xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="touch-manipulation px-6 sm:px-8"
                  onClick={handleContinue}
                  disabled={!isFormValid}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add padding at bottom to account for sticky bar on mobile */}
      <div className="h-20 lg:hidden" />

      <Footer />
    </div>
  );
});

Checkout.displayName = "Checkout";

export default Checkout;
