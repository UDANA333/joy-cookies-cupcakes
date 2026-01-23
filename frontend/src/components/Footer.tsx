import { memo } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = memo(() => {
  return (
    <motion.footer
      className="relative bg-secondary/50 border-t border-border py-8 sm:py-10 md:py-12 mt-12 sm:mt-16 md:mt-20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              <span className="font-display text-base sm:text-lg font-semibold text-foreground">
                Joy <span className="text-primary">Cookies & Cupcakes</span>
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xs mx-auto sm:mx-0">
              Homemade goodness baked with joy. Every treat made with love for your special moments.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4 text-center">
            <h4 className="font-display text-base sm:text-lg font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-row sm:flex-col gap-4 sm:gap-2 justify-center items-center">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors text-sm touch-manipulation">
                Home
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm touch-manipulation">
                About Us
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm touch-manipulation">
                Contact
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-right sm:col-span-2 md:col-span-1">
            <h4 className="font-display text-base sm:text-lg font-semibold text-foreground">Get in Touch</h4>
            <p className="text-muted-foreground text-xs sm:text-sm">
              hello@joycookies.com
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm italic">
              Pickup orders only • Made with love
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            © {new Date().getFullYear()} Joy Cookies & Cupcakes. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
