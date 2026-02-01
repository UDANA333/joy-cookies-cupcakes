import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchProducts as fetchProductsAPI, Product as APIProduct } from '@/lib/api';

// Local image imports
import chocolateChipCookie from "@/assets/cookies/Chocolate Chip.webp";
import sugarCookie from "@/assets/cookies/Sugar Cookie.webp";
import germanChocolateCookie from "@/assets/cookies/German Chocolate Cookie.webp";
import doubleChocolateCookie from "@/assets/cookies/Double Chocolate Cookie.webp";
import biscoffCookie from "@/assets/cookies/Biscoff Cookie.webp";
import oatmealRaisinCookie from "@/assets/cookies/Oatmeal Raisin Cookie.webp";
import whiteChocolateMacadamiaCookie from "@/assets/cookies/White Chocolate Macadamia Cookie.webp";
import peanutButterCookie from "@/assets/cookies/Peanut Butter Cookie.webp";
import vanillaCupcake from "@/assets/cupcakes/Vanilla Cupcake.webp";
import chocolateCupcake from "@/assets/cupcakes/Chocolate Cupcake.webp";
import lemonBlueberryCupcake from "@/assets/cupcakes/Lemon Blueberry Cupcake.webp";
import cookiesAndCreamCupcake from "@/assets/cupcakes/Cookies and Cream Cupcake.webp";
import saltedCaramelCupcake from "@/assets/cupcakes/Salted Caramel Cupcake.webp";
import funfettiCupcake from "@/assets/cupcakes/Funfetti Cupcake.webp";
import chocolateCakePop from "@/assets/cakepops/Chocolate Cake Pop.webp";
import vanillaCakePop from "@/assets/cakepops/Vanilla Cake Pop.webp";

// Map image paths to imported images
const imageMap: Record<string, string> = {
  'cookies/Chocolate Chip.webp': chocolateChipCookie,
  'cookies/Sugar Cookie.webp': sugarCookie,
  'cookies/German Chocolate Cookie.webp': germanChocolateCookie,
  'cookies/Double Chocolate Cookie.webp': doubleChocolateCookie,
  'cookies/Biscoff Cookie.webp': biscoffCookie,
  'cookies/Oatmeal Raisin Cookie.webp': oatmealRaisinCookie,
  'cookies/White Chocolate Macadamia Cookie.webp': whiteChocolateMacadamiaCookie,
  'cookies/Peanut Butter Cookie.webp': peanutButterCookie,
  'cupcakes/Vanilla Cupcake.webp': vanillaCupcake,
  'cupcakes/Chocolate Cupcake.webp': chocolateCupcake,
  'cupcakes/Lemon Blueberry Cupcake.webp': lemonBlueberryCupcake,
  'cupcakes/Cookies and Cream Cupcake.webp': cookiesAndCreamCupcake,
  'cupcakes/Salted Caramel Cupcake.webp': saltedCaramelCupcake,
  'cupcakes/Funfetti Cupcake.webp': funfettiCupcake,
  'cakepops/Chocolate Cake Pop.webp': chocolateCakePop,
  'cakepops/Vanilla Cake Pop.webp': vanillaCakePop,
};

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getRelatedProducts: (currentId: string, category: string, limit?: number) => Product[];
  getRandomProducts: (currentId: string, limit?: number) => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Fallback products (used when API is unavailable)
const fallbackProducts: Product[] = [
  { id: "1", name: "Chocolate Chip", price: 2.50, image: chocolateChipCookie, category: "cookies", description: "Our classic chocolate chip cookie is crispy on the edges and chewy in the center, loaded with premium semi-sweet chocolate chips." },
  { id: "2", name: "Sugar Cookie", price: 2.50, image: sugarCookie, category: "cookies", description: "A soft and buttery sugar cookie with a delicate sweetness." },
  { id: "3", name: "German Chocolate Cookie", price: 2.50, image: germanChocolateCookie, category: "cookies", description: "Rich chocolate cookie inspired by German chocolate cake." },
  { id: "4", name: "Double Chocolate Cookie", price: 2.50, image: doubleChocolateCookie, category: "cookies", description: "For the ultimate chocolate lover - a rich, fudgy chocolate cookie." },
  { id: "5", name: "Biscoff Cookie", price: 2.50, image: biscoffCookie, category: "cookies", description: "Inspired by the beloved European speculoos with warm cinnamon." },
  { id: "6", name: "Oatmeal Raisin Cookie", price: 2.50, image: oatmealRaisinCookie, category: "cookies", description: "A wholesome, chewy cookie with hearty oats and plump raisins." },
  { id: "7", name: "White Chocolate Macadamia Cookie", price: 2.50, image: whiteChocolateMacadamiaCookie, category: "cookies", description: "Buttery cookie studded with creamy white chocolate chips and macadamia nuts." },
  { id: "8", name: "Peanut Butter Cookie", price: 2.50, image: peanutButterCookie, category: "cookies", description: "Rich and crumbly peanut butter cookie with the classic crosshatch pattern." },
  { id: "9", name: "Vanilla Cupcake", price: 3.50, image: vanillaCupcake, category: "cupcakes", description: "Light and fluffy vanilla cupcake topped with smooth vanilla buttercream." },
  { id: "10", name: "Chocolate Cupcake", price: 3.50, image: chocolateCupcake, category: "cupcakes", description: "Moist, rich chocolate cupcake crowned with silky chocolate buttercream." },
  { id: "11", name: "Lemon Blueberry Cupcake", price: 3.50, image: lemonBlueberryCupcake, category: "cupcakes", description: "Bright, zesty lemon cupcake bursting with fresh blueberries." },
  { id: "12", name: "Cookies & Cream Cupcake", price: 3.50, image: cookiesAndCreamCupcake, category: "cupcakes", description: "Vanilla cupcake loaded with crushed chocolate sandwich cookies." },
  { id: "13", name: "Salted Caramel Cupcake", price: 3.50, image: saltedCaramelCupcake, category: "cupcakes", description: "Buttery caramel cupcake with a caramel center and salted caramel buttercream." },
  { id: "14", name: "Funfetti Cupcake", price: 3.50, image: funfettiCupcake, category: "cupcakes", description: "Cheerful vanilla cupcake filled with colorful sprinkles." },
  { id: "15", name: "Chocolate Cake Pop", price: 1.50, image: chocolateCakePop, category: "cakepops", description: "Rich chocolate cake mixed with chocolate frosting, dipped in smooth chocolate coating." },
  { id: "16", name: "Vanilla Cake Pop", price: 1.50, image: vanillaCakePop, category: "cakepops", description: "Moist vanilla cake blended with vanilla frosting, coated in white chocolate." },
];

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiProducts = await fetchProductsAPI();
      // Map API products to include local images or uploaded images
      const mappedProducts: Product[] = apiProducts.map((p: APIProduct) => {
        // Check if it's a mapped asset image
        if (imageMap[p.image_path]) {
          return {
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            description: p.description,
            image: imageMap[p.image_path],
          };
        }
        // Check if it's an uploaded image (starts with 'uploads/')
        if (p.image_path && p.image_path.startsWith('uploads/')) {
          return {
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            description: p.description,
            image: `/${p.image_path}`,
          };
        }
        // Fallback to finding in fallback products
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          description: p.description,
          image: fallbackProducts.find(fp => fp.id === p.id)?.image || '',
        };
      });
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Failed to fetch products, using fallback:', err);
      setError('Using cached menu data');
      // Keep using fallback products
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const getProductById = useCallback((id: string): Product | undefined => {
    return products.find(p => p.id === id);
  }, [products]);

  const getRelatedProducts = useCallback((currentId: string, category: string, limit: number = 4): Product[] => {
    return products
      .filter(p => p.id !== currentId && p.category === category)
      .slice(0, limit);
  }, [products]);

  const getRandomProducts = useCallback((currentId: string, limit: number = 4): Product[] => {
    return products
      .filter(p => p.id !== currentId)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }, [products]);

  return (
    <ProductContext.Provider value={{
      products,
      isLoading,
      error,
      refreshProducts,
      getProductById,
      getRelatedProducts,
      getRandomProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
