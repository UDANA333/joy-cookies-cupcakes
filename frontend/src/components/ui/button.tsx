import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold font-body ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pressed",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pressed",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground shadow-soft hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pressed",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pressed",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // Premium Bakery Variants
        hero:
          "bg-gradient-to-r from-primary to-rose-deep text-primary-foreground shadow-medium hover:shadow-lifted hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0.5 active:scale-[0.98] active:shadow-pressed",
        warm:
          "bg-gradient-to-br from-coral to-accent text-accent-foreground shadow-soft hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pressed",
        cream:
          "bg-cream text-chocolate shadow-soft border border-border hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pressed",
        rose:
          "bg-rose-light text-rose-deep shadow-soft hover:bg-rose hover:text-primary-foreground hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-pressed",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-13 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
