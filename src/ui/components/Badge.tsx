import { cn } from "@/ui/utils";
import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[var(--font-size-caption)] font-medium transition-colors",
        {
          "border-transparent bg-[var(--color-primary-100)] text-[var(--color-primary-500)]": variant === "default",
          "border-transparent bg-[#DCFCE7] text-[var(--color-success)]": variant === "success",
          "border-transparent bg-[#FEF3C7] text-[var(--color-warning)]": variant === "warning",
          "border-transparent bg-[#FEE2E2] text-[var(--color-error)]": variant === "error",
          "border-transparent bg-[#DBEAFE] text-[var(--color-info)]": variant === "info",
          "border-[var(--color-neutral-300)] text-[var(--color-neutral-500)]": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
