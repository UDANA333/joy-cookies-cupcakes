// Cookie images
import chocolateChipCookie from "@/assets/cookies/Chocolate Chip.webp";
import sugarCookie from "@/assets/cookies/Sugar Cookie.webp";
import germanChocolateCookie from "@/assets/cookies/German Chocolate Cookie.webp";
import doubleChocolateCookie from "@/assets/cookies/Double Chocolate Cookie.webp";
import biscoffCookie from "@/assets/cookies/Biscoff Cookie.webp";
import oatmealRaisinCookie from "@/assets/cookies/Oatmeal Raisin Cookie.webp";
import whiteChocolateMacadamiaCookie from "@/assets/cookies/White Chocolate Macadamia Cookie.webp";
import peanutButterCookie from "@/assets/cookies/Peanut Butter Cookie.webp";

// Cupcake images
import vanillaCupcake from "@/assets/cupcakes/Vanilla Cupcake.webp";
import chocolateCupcake from "@/assets/cupcakes/Chocolate Cupcake.webp";
import lemonBlueberryCupcake from "@/assets/cupcakes/Lemon Blueberry Cupcake.webp";
import cookiesAndCreamCupcake from "@/assets/cupcakes/Cookies and Cream Cupcake.webp";
import saltedCaramelCupcake from "@/assets/cupcakes/Salted Caramel Cupcake.webp";
import funfettiCupcake from "@/assets/cupcakes/Funfetti Cupcake.webp";

// Cake Pop images
import chocolateCakePop from "@/assets/cakepops/Chocolate Cake Pop.webp";
import vanillaCakePop from "@/assets/cakepops/Vanilla Cake Pop.webp";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export const products: Product[] = [
  // Cookies - $2.50 each
  {
    id: "1",
    name: "Chocolate Chip",
    price: 2.50,
    image: chocolateChipCookie,
    category: "cookies",
    description: "Our classic chocolate chip cookie is crispy on the edges and chewy in the center, loaded with premium semi-sweet chocolate chips."
  },
  {
    id: "2",
    name: "Sugar Cookie",
    price: 2.50,
    image: sugarCookie,
    category: "cookies",
    description: "A soft and buttery sugar cookie with a delicate sweetness. Perfect for those who love simple, classic flavors."
  },
  {
    id: "3",
    name: "German Chocolate Cookie",
    price: 2.50,
    image: germanChocolateCookie,
    category: "cookies",
    description: "Rich chocolate cookie inspired by German chocolate cake, featuring coconut and pecan notes in every bite."
  },
  {
    id: "4",
    name: "Double Chocolate Cookie",
    price: 2.50,
    image: doubleChocolateCookie,
    category: "cookies",
    description: "For the ultimate chocolate lover - a rich, fudgy chocolate cookie packed with chocolate chips for double the indulgence."
  },
  {
    id: "5",
    name: "Biscoff Cookie",
    price: 2.50,
    image: biscoffCookie,
    category: "cookies",
    description: "Inspired by the beloved European speculoos, this cookie features warm cinnamon and caramelized sugar flavors."
  },
  {
    id: "6",
    name: "Oatmeal Raisin Cookie",
    price: 2.50,
    image: oatmealRaisinCookie,
    category: "cookies",
    description: "A wholesome, chewy cookie with hearty oats and plump raisins, lightly spiced with cinnamon."
  },
  {
    id: "7",
    name: "White Chocolate Macadamia Cookie",
    price: 2.50,
    image: whiteChocolateMacadamiaCookie,
    category: "cookies",
    description: "Buttery cookie studded with creamy white chocolate chips and crunchy roasted macadamia nuts."
  },
  {
    id: "8",
    name: "Peanut Butter Cookie",
    price: 2.50,
    image: peanutButterCookie,
    category: "cookies",
    description: "Rich and crumbly peanut butter cookie with the classic crosshatch pattern. A peanut butter lover's dream!"
  },
  // Cupcakes - $3.50 each
  {
    id: "9",
    name: "Vanilla Cupcake",
    price: 3.50,
    image: vanillaCupcake,
    category: "cupcakes",
    description: "Light and fluffy vanilla cupcake topped with smooth vanilla buttercream frosting. Simple perfection."
  },
  {
    id: "10",
    name: "Chocolate Cupcake",
    price: 3.50,
    image: chocolateCupcake,
    category: "cupcakes",
    description: "Moist, rich chocolate cupcake crowned with silky chocolate buttercream. Pure chocolate bliss."
  },
  {
    id: "11",
    name: "Lemon Blueberry Cupcake",
    price: 3.50,
    image: lemonBlueberryCupcake,
    category: "cupcakes",
    description: "Bright, zesty lemon cupcake bursting with fresh blueberries, topped with lemon cream cheese frosting."
  },
  {
    id: "12",
    name: "Cookies & Cream Cupcake",
    price: 3.50,
    image: cookiesAndCreamCupcake,
    category: "cupcakes",
    description: "Vanilla cupcake loaded with crushed chocolate sandwich cookies, topped with cookies and cream frosting."
  },
  {
    id: "13",
    name: "Salted Caramel Cupcake",
    price: 3.50,
    image: saltedCaramelCupcake,
    category: "cupcakes",
    description: "Buttery caramel cupcake with a caramel center, topped with salted caramel buttercream and a drizzle of caramel sauce."
  },
  {
    id: "14",
    name: "Funfetti Cupcake",
    price: 3.50,
    image: funfettiCupcake,
    category: "cupcakes",
    description: "Cheerful vanilla cupcake filled with colorful sprinkles, topped with vanilla buttercream and more sprinkles!"
  },
  // Cake Pops - $1.50 each
  {
    id: "15",
    name: "Chocolate Cake Pop",
    price: 1.50,
    image: chocolateCakePop,
    category: "cakepops",
    description: "Rich chocolate cake mixed with chocolate frosting, dipped in smooth chocolate coating. A bite-sized treat!"
  },
  {
    id: "16",
    name: "Vanilla Cake Pop",
    price: 1.50,
    image: vanillaCakePop,
    category: "cakepops",
    description: "Moist vanilla cake blended with vanilla frosting, coated in white chocolate. Sweet and delightful!"
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getRelatedProducts = (currentId: string, category: string, limit: number = 4): Product[] => {
  return products
    .filter(p => p.id !== currentId && p.category === category)
    .slice(0, limit);
};

export const getRandomProducts = (currentId: string, limit: number = 4): Product[] => {
  return products
    .filter(p => p.id !== currentId)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
};
