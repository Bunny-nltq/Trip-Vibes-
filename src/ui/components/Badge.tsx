import { cn } from "@/ui/utils";
import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClass =
    variant === "success"
      ? "border-transparent bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
      : variant === "warning"
      ? "border-transparent bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]"
      : variant === "error"
      ? "border-transparent bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
      : variant === "outline"
      ? "border-[var(--color-border)] text-[var(--color-text-sub)]"
      : "border-transparent bg-[var(--color-primary-tint)] text-[var(--color-primary)]";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[var(--font-size-caption)] font-medium transition-colors",
        variantClass,
        className
      )}
      {...props}
    />
  );
}
