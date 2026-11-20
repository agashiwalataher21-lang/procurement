"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 focus:ring-blue-600",
        secondary: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-500",
        danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 focus:ring-rose-600",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 focus:ring-emerald-600",
        warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20 focus:ring-amber-500",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-500",
        link: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-4 hover:underline focus:ring-blue-600",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-base",
        icon: "w-9 h-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

// Button Group Component
const ButtonGroup = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`inline-flex rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${className || ""}`} {...props}>
      {React.Children.map(children, (child, index) => (
        <div className={`relative ${index > 0 ? "-ml-[1px]" : ""}`}>
          {child}
        </div>
      ))}
    </div>
  );
};

// Action Menu Button (Dropdown trigger)
const ActionMenuButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
      {...props}
    >
      {children}
    </button>
  );
};

// Link Button (for Next.js links styled as buttons)
const LinkButton = ({ children, className, variant, size, ...props }: React.ComponentProps<typeof Button> & { href: string }) => {
  // This would be used with Next.js Link component
  // For now, just return the Button component
  return <Button variant={variant} size={size} className={className} {...props}>{children}</Button>;
};

export {
  Button,
  ButtonGroup,
  ActionMenuButton,
  LinkButton,
  buttonVariants,
};
