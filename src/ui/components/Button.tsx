import { cn } from "@/ui/utils";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "done";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  className,
  variant = "outline",
  size = "md",
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-400)] border border-[var(--color-primary-500)]": variant === "primary",
          "bg-[var(--color-secondary-500)] text-white hover:bg-[var(--color-secondary-400)] border border-[var(--color-secondary-500)]": variant === "secondary",
          "border border-[var(--color-neutral-400)] bg-transparent hover:bg-[var(--color-neutral-50)] text-[var(--color-neutral-navy)]": variant === "outline",
          "border-transparent bg-transparent hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]": variant === "ghost",
          "bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] border border-[var(--color-neutral-300)]": variant === "done",
        },
        {
          "h-8 px-3 text-[var(--font-size-body-sm)]": size === "sm",
          "h-10 px-4 text-[var(--font-size-body-md)]": size === "md",
          "h-11 px-8 text-[var(--font-size-body-lg)]": size === "lg",
        },
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
}
