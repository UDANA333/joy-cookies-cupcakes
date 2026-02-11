import { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSeasonalTheme } from '@/components/SeasonalThemeContext';
import type { SeasonalTheme } from '@/lib/api';

// Map theme names/slugs to their decorative icons
const getThemeDecorations = (theme: SeasonalTheme): string[] => {
  const name = theme.name.toLowerCase();
  const slug = theme.slug.toLowerCase();
  
  if (name.includes('valentine') || slug.includes('valentine')) {
    return ['💕', '💗', '💖', '❤️', '💝'];
  }
  if (name.includes('halloween') || slug.includes('halloween')) {
    return ['🎃', '👻', '🦇', '🕷️', '🕸️'];
  }
  if (name.includes('christmas') || slug.includes('christmas') || name.includes('holiday')) {
    return ['❄️', '🎄', '⭐', '🎁', '✨'];
  }
  if (name.includes('easter') || slug.includes('easter')) {
    return ['🐰', '🥚', '🌸', '🐣', '🌷'];
  }
  if (name.includes('summer') || slug.includes('summer')) {
    return ['☀️', '🌴', '🍉', '🌺', '🌊'];
  }
  if (name.includes('fall') || name.includes('autumn') || slug.includes('fall')) {
    return ['🍂', '🍁', '🎃', '🌾', '🍎'];
  }
  if (name.includes('spring') || slug.includes('spring')) {
    return ['🌸', '🌷', '🦋', '🌼', '🐝'];
  }
  return theme.icon ? [theme.icon] : ['✨', '⭐', '💫'];
};

// CSS keyframes for floating animation (added once to document)
// Using -webkit- prefix for iOS Safari compatibility
const FLOAT_KEYFRAMES = `
@-webkit-keyframes seasonal-float {
  0% {
    -webkit-transform: translate3d(0, -5%, 0) rotate(0deg);
    transform: translate3d(0, -5%, 0) rotate(0deg);
  }
  100% {
    -webkit-transform: translate3d(0, 105vh, 0) rotate(360deg);
    transform: translate3d(0, 105vh, 0) rotate(360deg);
  }
}
@keyframes seasonal-float {
  0% {
    -webkit-transform: translate3d(0, -5%, 0) rotate(0deg);
    transform: translate3d(0, -5%, 0) rotate(0deg);
  }
  100% {
    -webkit-transform: translate3d(0, 105vh, 0) rotate(360deg);
    transform: translate3d(0, 105vh, 0) rotate(360deg);
  }
}
`;

export default function SeasonalThemeOverlay() {
  const { theme, bannerVisible, dismissBanner, isLoading } = useSeasonalTheme();
  const location = useLocation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Inject keyframes once
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const styleId = 'seasonal-float-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = FLOAT_KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  // Don't show overlay on admin pages
  const isAdminPage = location.pathname.startsWith('/joy-manage') || location.pathname.startsWith('/joy-setup');

  // Generate particles with CSS animation styles - optimized for mobile visibility
  const particles = useMemo(() => {
    if (!theme || prefersReducedMotion) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 5 + (i * 12) + (Math.random() * 6), // Spread across screen with tighter gaps
      delay: i * 1.5 + Math.random() * 2, // Staggered start
      duration: 16 + Math.random() * 8, // 16-24 seconds
      size: 20 + Math.random() * 8, // 20-28px - larger for mobile visibility
      opacity: 0.4 + Math.random() * 0.2, // 0.4-0.6 - more visible
    }));
  }, [theme, prefersReducedMotion]);

  const decorations = theme ? getThemeDecorations(theme) : [];

  if (isLoading || !theme || isAdminPage) return null;

  return (
    <>
      {/* Subtle Background Tint - Static, no animation */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `linear-gradient(180deg, ${theme.primary_color}06 0%, transparent 40%, transparent 60%, ${theme.secondary_color}04 100%)`,
        }}
      />

      {/* Floating Decorations - Using CSS animations for GPU acceleration */}
      {!prefersReducedMotion && (
        <div 
          className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
          aria-hidden="true"
        >
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute will-change-transform"
              style={{
                left: `${particle.x}%`,
                fontSize: `${particle.size}px`,
                opacity: particle.opacity,
                WebkitAnimation: `seasonal-float ${particle.duration}s linear ${particle.delay}s infinite`,
                animation: `seasonal-float ${particle.duration}s linear ${particle.delay}s infinite`,
                WebkitTransform: 'translate3d(0,0,0)',
                contain: 'layout style paint',
              }}
            >
              {decorations[particle.id % decorations.length]}
            </div>
          ))}
        </div>
      )}

      {/* Static Corner Decorations - Visible on all devices */}
      <div 
        className="fixed top-20 sm:top-24 left-2 sm:left-4 pointer-events-none z-[2] opacity-50 text-2xl sm:text-3xl md:text-4xl"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        aria-hidden="true"
      >
        {theme.icon || decorations[0]}
      </div>
      
      <div 
        className="fixed top-20 sm:top-24 right-2 sm:right-4 pointer-events-none z-[2] opacity-50 text-2xl sm:text-3xl md:text-4xl"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        aria-hidden="true"
      >
        {theme.icon || decorations[0]}
      </div>

      {/* Bottom Corner Decorations - Static, visible on all devices */}
      <div 
        className="fixed bottom-20 sm:bottom-4 left-2 sm:left-4 pointer-events-none z-[2] opacity-35 text-xl sm:text-2xl"
        aria-hidden="true"
      >
        <span className="flex gap-1">
          {decorations.slice(0, 2).map((d, i) => (
            <span key={i} className="hidden sm:inline">{d}</span>
          ))}
          {/* Show only 1 on mobile */}
          <span className="sm:hidden">{decorations[0]}</span>
        </span>
      </div>

      <div 
        className="fixed bottom-20 sm:bottom-4 right-2 sm:right-4 pointer-events-none z-[2] opacity-35 text-xl sm:text-2xl"
        aria-hidden="true"
      >
        <span className="flex gap-1">
          {decorations.slice(0, 2).reverse().map((d, i) => (
            <span key={i} className="hidden sm:inline">{d}</span>
          ))}
          {/* Show only 1 on mobile */}
          <span className="sm:hidden">{decorations[0]}</span>
        </span>
      </div>

      {/* Top Announcement Bar - Only part that uses Framer Motion */}
      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-[60]"
            style={{
              background: `linear-gradient(90deg, ${theme.primary_color} 0%, ${theme.secondary_color} 100%)`,
            }}
          >
            <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 relative">
              <span className="text-lg">{theme.icon}</span>
              <span className="text-white text-sm font-medium text-center">
                {theme.banner_text || `${theme.name} Specials Available!`}
              </span>
              <span className="text-lg">{theme.icon}</span>
              <button
                onClick={dismissBanner}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
                aria-label="Dismiss banner"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
