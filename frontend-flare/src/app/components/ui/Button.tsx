"use client";

import { ComponentProps, forwardRef } from "react";

// Define variants manually to avoid external dependency
const variants = {
  variant: {
    default: "bg-white text-black hover:bg-white/90",
    destructive: "bg-red-500 text-white hover:bg-red-500/90",
    outline: "border border-white bg-transparent hover:bg-white hover:text-black",
    ghost: "hover:bg-white/20",
  },
  size: {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
  },
};

const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: keyof typeof variants.variant;
  size?: keyof typeof variants.size;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    
    const variantClass = variants.variant[variant];
    const sizeClass = variants.size[size];
    
    // Combine classes manually
    const finalClassName = [baseClasses, variantClass, sizeClass, className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        className={finalClassName}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Note: buttonVariants export is removed as it was tied to cva
export { Button };
