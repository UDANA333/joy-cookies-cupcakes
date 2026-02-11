import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchActiveSeasonalTheme, type SeasonalTheme } from '@/lib/api';

interface SeasonalThemeContextType {
  theme: SeasonalTheme | null;
  bannerVisible: boolean;
  dismissBanner: () => void;
  isLoading: boolean;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType>({
  theme: null,
  bannerVisible: false,
  dismissBanner: () => {},
  isLoading: true,
});

export function SeasonalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SeasonalTheme | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const data = await fetchActiveSeasonalTheme();
        if (data?.theme) {
          setTheme(data.theme);
          // Check if user dismissed this specific theme's banner
          const dismissedThemeId = sessionStorage.getItem('dismissed_seasonal_banner');
          if (dismissedThemeId !== String(data.theme.id)) {
            setBannerVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to load seasonal theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Update body data attribute for CSS-based layout adjustments
  useEffect(() => {
    if (bannerVisible) {
      document.body.setAttribute('data-seasonal-banner', 'true');
    } else {
      document.body.removeAttribute('data-seasonal-banner');
    }
    return () => {
      document.body.removeAttribute('data-seasonal-banner');
    };
  }, [bannerVisible]);

  const dismissBanner = () => {
    setBannerVisible(false);
    if (theme) {
      sessionStorage.setItem('dismissed_seasonal_banner', String(theme.id));
    }
  };

  return (
    <SeasonalThemeContext.Provider value={{ theme, bannerVisible, dismissBanner, isLoading }}>
      {children}
    </SeasonalThemeContext.Provider>
  );
}

export function useSeasonalTheme() {
  return useContext(SeasonalThemeContext);
}
