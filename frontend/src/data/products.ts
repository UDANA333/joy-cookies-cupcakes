// Cookie images
import chocolateChipCookie from "@/assets/cookies/Chocolate Chip.png";
import sugarCookie from "@/assets/cookies/Sugar Cookie.png";
import germanChocolateCookie from "@/assets/cookies/German Chocolate Cookie.png";
import doubleChocolateCookie from "@/assets/cookies/Double Chocolate Cookie.png";
import biscoffCookie from "@/assets/cookies/Biscoff Cookie.png";
import oatmealRaisinCookie from "@/assets/cookies/Oatmeal Raisin Cookie.png";
import whiteChocolateMacadamiaCookie from "@/assets/cookies/White Chocolate Macadamia Cookie.png";
import peanutButterCookie from "@/assets/cookies/Peanut Butter Cookie.png";

// Cupcake images
import vanillaCupcake from "@/assets/cupcakes/Vanilla Cupcake.png";
import chocolateCupcake from "@/assets/cupcakes/Chocolate Cupcake.png";
import lemonBlueberryCupcake from "@/assets/cupcakes/Lemon Blueberry Cupcake.png";
import cookiesAndCreamCupcake from "@/assets/cupcakes/Cookies and Cream Cupcake.png";
import saltedCaramelCupcake from "@/assets/cupcakes/Salted Caramel Cupcake.png";
import funfettiCupcake from "@/assets/cupcakes/Funfetti Cupcake.png";

// Cake Pop images
import chocolateCakePop from "@/assets/cakepops/Chocolate Cake Pop.png";
import vanillaCakePop from "@/assets/cakepops/Vanilla Cake Pop.png";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  ingredients: string[];
}

export const products: Product[] = [
  // Cookies - $2.50 each
  {
    id: "1",
    name: "Chocolate Chip",
    price: 2.50,
    image: chocolateChipCookie,
    category: "cookies",
    description: "Our classic chocolate chip cookie is crispy on the edges and chewy in the center, loaded with premium semi-sweet chocolate chips.",
    ingredients: ["All-purpose flour", "Butter", "Brown sugar", "White sugar", "Eggs", "Vanilla extract", "Baking soda", "Salt", "Semi-sweet chocolate chips"]
  },
  {
    id: "2",
    name: "Sugar Cookie",
    price: 2.50,
    image: sugarCookie,
    category: "cookies",
    description: "A soft and buttery sugar cookie with a delicate sweetness. Perfect for those who love simple, classic flavors.",
    ingredients: ["All-purpose flour", "Butter", "Sugar", "Eggs", "Vanilla extract", "Baking powder", "Salt", "Cream of tartar"]
  },
  {
    id: "3",
    name: "German Chocolate Cookie",
    price: 2.50,
    image: germanChocolateCookie,
    category: "cookies",
    description: "Rich chocolate cookie inspired by German chocolate cake, featuring coconut and pecan notes in every bite.",
    ingredients: ["All-purpose flour", "Cocoa powder", "Butter", "Brown sugar", "Eggs", "Vanilla extract", "Shredded coconut", "Chopped pecans", "Chocolate chips"]
  },
  {
    id: "4",
    name: "Double Chocolate Cookie",
    price: 2.50,
    image: doubleChocolateCookie,
    category: "cookies",
    description: "For the ultimate chocolate lover - a rich, fudgy chocolate cookie packed with chocolate chips for double the indulgence.",
    ingredients: ["All-purpose flour", "Dutch cocoa powder", "Butter", "Brown sugar", "White sugar", "Eggs", "Vanilla extract", "Dark chocolate chips", "Milk chocolate chips"]
  },
  {
    id: "5",
    name: "Biscoff Cookie",
    price: 2.50,
    image: biscoffCookie,
    category: "cookies",
    description: "Inspired by the beloved European speculoos, this cookie features warm cinnamon and caramelized sugar flavors.",
    ingredients: ["All-purpose flour", "Butter", "Brown sugar", "Biscoff spread", "Cinnamon", "Nutmeg", "Ginger", "Eggs", "Vanilla extract", "Biscoff cookie pieces"]
  },
  {
    id: "6",
    name: "Oatmeal Raisin Cookie",
    price: 2.50,
    image: oatmealRaisinCookie,
    category: "cookies",
    description: "A wholesome, chewy cookie with hearty oats and plump raisins, lightly spiced with cinnamon.",
    ingredients: ["Old-fashioned oats", "All-purpose flour", "Butter", "Brown sugar", "Eggs", "Raisins", "Cinnamon", "Baking soda", "Vanilla extract"]
  },
  {
    id: "7",
    name: "White Chocolate Macadamia Cookie",
    price: 2.50,
    image: whiteChocolateMacadamiaCookie,
    category: "cookies",
    description: "Buttery cookie studded with creamy white chocolate chips and crunchy roasted macadamia nuts.",
    ingredients: ["All-purpose flour", "Butter", "Brown sugar", "White sugar", "Eggs", "Vanilla extract", "White chocolate chips", "Roasted macadamia nuts", "Salt"]
  },
  {
    id: "8",
    name: "Peanut Butter Cookie",
    price: 2.50,
    image: peanutButterCookie,
    category: "cookies",
    description: "Rich and crumbly peanut butter cookie with the classic crosshatch pattern. A peanut butter lover's dream!",
    ingredients: ["Creamy peanut butter", "All-purpose flour", "Butter", "Brown sugar", "White sugar", "Eggs", "Vanilla extract", "Baking soda", "Salt"]
  },
  // Cupcakes - $3.50 each
  {
    id: "9",
    name: "Vanilla Cupcake",
    price: 3.50,
    image: vanillaCupcake,
    category: "cupcakes",
    description: "Light and fluffy vanilla cupcake topped with smooth vanilla buttercream frosting. Simple perfection.",
    ingredients: ["All-purpose flour", "Butter", "Sugar", "Eggs", "Vanilla extract", "Milk", "Baking powder", "Salt", "Vanilla buttercream frosting"]
  },
  {
    id: "10",
    name: "Chocolate Cupcake",
    price: 3.50,
    image: chocolateCupcake,
    category: "cupcakes",
    description: "Moist, rich chocolate cupcake crowned with silky chocolate buttercream. Pure chocolate bliss.",
    ingredients: ["All-purpose flour", "Dutch cocoa powder", "Butter", "Sugar", "Eggs", "Vanilla extract", "Buttermilk", "Chocolate buttercream frosting"]
  },
  {
    id: "11",
    name: "Lemon Blueberry Cupcake",
    price: 3.50,
    image: lemonBlueberryCupcake,
    category: "cupcakes",
    description: "Bright, zesty lemon cupcake bursting with fresh blueberries, topped with lemon cream cheese frosting.",
    ingredients: ["All-purpose flour", "Butter", "Sugar", "Eggs", "Fresh lemon zest", "Lemon juice", "Fresh blueberries", "Milk", "Lemon cream cheese frosting"]
  },
  {
    id: "12",
    name: "Cookies & Cream Cupcake",
    price: 3.50,
    image: cookiesAndCreamCupcake,
    category: "cupcakes",
    description: "Vanilla cupcake loaded with crushed chocolate sandwich cookies, topped with cookies and cream frosting.",
    ingredients: ["All-purpose flour", "Butter", "Sugar", "Eggs", "Vanilla extract", "Milk", "Crushed chocolate sandwich cookies", "Cookies and cream buttercream"]
  },
  {
    id: "13",
    name: "Salted Caramel Cupcake",
    price: 3.50,
    image: saltedCaramelCupcake,
    category: "cupcakes",
    description: "Buttery caramel cupcake with a caramel center, topped with salted caramel buttercream and a drizzle of caramel sauce.",
    ingredients: ["All-purpose flour", "Butter", "Brown sugar", "Eggs", "Vanilla extract", "Caramel sauce", "Sea salt", "Salted caramel buttercream"]
  },
  {
    id: "14",
    name: "Funfetti Cupcake",
    price: 3.50,
    image: funfettiCupcake,
    category: "cupcakes",
    description: "Cheerful vanilla cupcake filled with colorful sprinkles, topped with vanilla buttercream and more sprinkles!",
    ingredients: ["All-purpose flour", "Butter", "Sugar", "Eggs", "Vanilla extract", "Milk", "Rainbow sprinkles", "Vanilla buttercream frosting"]
  },
  // Cake Pops - $1.50 each
  {
    id: "15",
    name: "Chocolate Cake Pop",
    price: 1.50,
    image: chocolateCakePop,
    category: "cakepops",
    description: "Rich chocolate cake mixed with chocolate frosting, dipped in smooth chocolate coating. A bite-sized treat!",
    ingredients: ["Chocolate cake crumbs", "Chocolate frosting", "Chocolate candy coating", "Sprinkles"]
  },
  {
    id: "16",
    name: "Vanilla Cake Pop",
    price: 1.50,
    image: vanillaCakePop,
    category: "cakepops",
    description: "Moist vanilla cake blended with vanilla frosting, coated in white chocolate. Sweet and delightful!",
    ingredients: ["Vanilla cake crumbs", "Vanilla frosting", "White chocolate candy coating", "Sprinkles"]
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
