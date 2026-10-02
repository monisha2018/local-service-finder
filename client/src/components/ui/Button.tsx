import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({ variant = "primary", size = "md", children, className = "", ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "text-xs px-4 py-2", md: "text-sm px-6 py-3", lg: "text-base px-8 py-4" };
  const variants = {
    primary: "bg-primary text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] hover:bg-primary-dark",
    secondary: "bg-white text-primary border border-primary/20 hover:bg-primary-light",
    ghost: "text-text-secondary hover:bg-surface-alt",
    danger: "bg-error text-white hover:opacity-90",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
