import { useState, memo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/CartContext";
import { useSeasonalTheme } from "@/components/SeasonalThemeContext";

interface NavbarProps {
  cartCount?: number;
}

const Navbar = memo(({ cartCount = 0 }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { notification, hideNotification } = useCart();
  const { bannerVisible } = useSeasonalTheme();

  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  const links = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About Us" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      className={cn(
        "fixed left-0 right-0 z-50 glass border-b border-border/50",
        bannerVisible ? "top-[40px]" : "top-0"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 touch-manipulation">
            <motion.div
              className="flex items-center gap-1.5 sm:gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img 
                src="/logo.jpeg" 
                alt="Joy Cookies & Cupcakes" 
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain rounded-lg"
              />
              <span className="font-display text-base sm:text-lg md:text-xl font-semibold text-foreground">
                Joy <span className="text-primary">Cookies & Cupcakes</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {links.map((link) => (
              <Link key={link.path} to={link.path} className="touch-manipulation group">
                <motion.div
                  className={cn(
                    "relative px-4 lg:px-5 py-2 rounded-xl font-body font-medium text-base lg:text-lg transition-colors",
                    isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary"
                  )}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {link.label}
                  {/* Active dot */}
                  {isActive(link.path) && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                      layoutId="activeNav"
                      style={{ x: "-50%" }}
                    />
                  )}
                  {/* Hover dot - only show when not active */}
                  {!isActive(link.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary scale-0 group-hover:scale-100 transition-transform duration-200" />
                  )}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <Link to="/checkout" className="touch-manipulation">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="cream" size="icon" className="relative w-10 h-10 sm:w-11 sm:h-11">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                    {cartCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              </Link>
              
              {/* Cart Notification Popup */}
              <AnimatePresence>
                {notification.visible && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute top-full right-0 mt-2 w-64 sm:w-72 bg-background border border-border rounded-xl shadow-lifted p-2.5 sm:p-3 z-50"
                    onClick={hideNotification}
                  >
                    {/* Arrow pointing up to bag */}
                    <div className="absolute -top-2 right-3 sm:right-4 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-background border-l border-t border-border rotate-45" />
                    
                    <div className="flex items-start gap-2 sm:gap-3 relative">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          {notification.message}
                        </p>
                        {notification.description && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            {notification.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 text-foreground touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-medium"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-1 sm:space-y-2">
              {links.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    to={link.path}
                    onClick={closeMenu}
                    className={cn(
                      "block px-4 py-3 rounded-xl font-body font-medium text-base sm:text-lg transition-colors touch-manipulation",
                      isActive(link.path)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-primary/10 hover:text-primary active:bg-primary/15"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
