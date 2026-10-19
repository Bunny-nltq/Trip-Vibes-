"use client";
import React from "react";
import tokens from "@/design/tokens.json";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const styles = {
    "--color-primary-500": tokens.colors.primary["500"],
    "--color-primary-400": tokens.colors.primary["400"],
    "--color-primary-100": tokens.colors.primary["100"],
    "--color-secondary-500": tokens.colors.secondary["500"],
    "--color-secondary-400": tokens.colors.secondary["400"],
    "--color-secondary-100": tokens.colors.secondary["100"],
    "--color-success": tokens.colors.status.success,
    "--color-warning": tokens.colors.status.warning,
    "--color-error": tokens.colors.status.error,
    "--color-info": tokens.colors.status.info,
    "--color-loading": tokens.colors.status.loading,
    "--color-neutral-navy": tokens.colors.neutral.navy,
    "--color-neutral-700": tokens.colors.neutral.gray700,
    "--color-neutral-500": tokens.colors.neutral.gray500,
    "--color-neutral-400": tokens.colors.neutral.gray400,
    "--color-neutral-300": tokens.colors.neutral.gray300,
    "--color-neutral-100": tokens.colors.neutral.gray100,
    "--color-neutral-50": tokens.colors.neutral.gray50,
    "--color-background": tokens.colors.background,
    "--color-surface": tokens.colors.surface,
    "--font-size-h1": tokens.typography.heading1.fontSize,
    "--font-size-h2": tokens.typography.heading2.fontSize,
    "--font-size-h3": tokens.typography.heading3.fontSize,
    "--font-size-body-lg": tokens.typography.bodyLarge.fontSize,
    "--font-size-body-md": tokens.typography.bodyMedium.fontSize,
    "--font-size-body-sm": tokens.typography.bodySmall.fontSize,
    "--font-size-caption": tokens.typography.caption.fontSize,
    "--radius-sm": tokens.radius.sm,
    "--radius-md": tokens.radius.md,
    "--radius-lg": tokens.radius.lg,
    "--radius-xl": tokens.radius.xl,
    "--radius-full": tokens.radius.full,
    "--spacing-xs": tokens.spacing.xs,
    "--spacing-sm": tokens.spacing.sm,
    "--spacing-md": tokens.spacing.md,
    "--spacing-lg": tokens.spacing.lg,
    "--spacing-xl": tokens.spacing.xl,
    "--spacing-2xl": tokens.spacing["2xl"],
    "--spacing-3xl": tokens.spacing["3xl"],
    "--spacing-4xl": tokens.spacing["4xl"],
  } as React.CSSProperties;

  return (
    <div style={styles} className="min-h-screen bg-[var(--color-background)] text-[var(--color-neutral-navy)] font-sans antialiased">
      {children}
    </div>
  );
}
