"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[0.9375rem] font-semibold tracking-[-0.01em] shadow-soft transition-[color,transform,box-shadow,opacity] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[1.0625rem]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-[1.05] hover:shadow-card",
        destructive:
          "bg-destructive text-white hover:brightness-[1.06] hover:shadow-card",
        outline:
          "border border-input bg-transparent shadow-soft hover:bg-muted/85 hover:brightness-[1.01]",
        ghost: "shadow-none hover:bg-muted/85",
        link: "text-primary shadow-none underline-offset-[3px] hover:underline hover:brightness-[1.02]",
      },
      size: {
        default: "min-h-[2.875rem] px-5 py-3",
        sm: "min-h-10 rounded-lg px-3.5 text-sm",
        lg: "min-h-14 rounded-2xl px-8 py-4 text-[1rem] md:rounded-xl",
        icon: "min-h-[2.875rem] min-w-[2.875rem] md:rounded-xl",
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
