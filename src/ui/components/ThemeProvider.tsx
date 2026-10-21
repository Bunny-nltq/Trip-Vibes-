"use client";
import React from "react";
import tokens from "@/design/tokens.json";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const styles = {
    "--color-primary-500": tokens.colors.primary["500"],
    "--color-primary-400": tokens.colors.primary["400"],
    "--color-primary-100": tokens.colors.primary["100"],
    "--color-primary-brand": tokens.colors.primary.brand,
    "--color-primary-hover": tokens.colors.primary.brandHover,
    "--color-primary-light": tokens.colors.primary.brandLight,
    "--color-primary-soft": tokens.colors.primary.brandSoft,
    "--color-primary-active": tokens.colors.primary.brandActive,
    "--color-secondary-500": tokens.colors.secondary["500"],
    "--color-secondary-400": tokens.colors.secondary["400"],
    "--color-secondary-100": tokens.colors.secondary["100"],
    "--color-promo-bg": tokens.colors.secondary.promoBg,
    "--color-promo-text": tokens.colors.secondary.promoText,
    "--color-success": tokens.colors.status.success,
    "--color-warning": tokens.colors.status.warning,
    "--color-error": tokens.colors.status.error,
    "--color-info": tokens.colors.status.info,
    "--color-badge-red": tokens.colors.status.badgeRed,
    "--color-neutral-navy": tokens.colors.neutral.navy,
    "--color-navy-dark": tokens.colors.neutral.navyDark,
    "--color-navy-text": tokens.colors.neutral.navyText,
    "--color-sub-text": tokens.colors.neutral.subText,
    "--color-body-text": tokens.colors.neutral.bodyText,
    "--color-muted-text": tokens.colors.neutral.mutedText,
    "--color-light-muted": tokens.colors.neutral.lightMuted,
    "--color-neutral-700": tokens.colors.neutral.gray700,
    "--color-neutral-500": tokens.colors.neutral.gray500,
    "--color-neutral-400": tokens.colors.neutral.gray400,
    "--color-neutral-300": tokens.colors.neutral.gray300,
    "--color-neutral-100": tokens.colors.neutral.gray100,
    "--color-neutral-50": tokens.colors.neutral.gray50,
    "--color-border-blue": tokens.colors.neutral.borderBlue,
    "--color-border-light": tokens.colors.neutral.borderLight,
    "--color-border-card": tokens.colors.neutral.borderCard,
    "--color-border-input": tokens.colors.neutral.borderInput,
    "--color-border-preset": tokens.colors.neutral.borderPreset,
    "--color-track-bg": tokens.colors.neutral.trackBg,
    "--color-bg-grad-start": tokens.colors.neutral.bgGradStart,
    "--color-bg-grad-mid": tokens.colors.neutral.bgGradMid,
    "--color-bg-grad-end": tokens.colors.neutral.bgGradEnd,
    "--color-background": tokens.colors.background,
    "--color-surface": tokens.colors.surface,
    "--font-family-sans": tokens.typography.fontFamily.sans,
    "--font-family-script": tokens.typography.fontFamily.script,
    "--shadow-home-card": tokens.shadows.homeCard,
    "--shadow-modal": tokens.shadows.modal,
    "--shadow-popover": tokens.shadows.popover,
    "--shadow-btn-primary": tokens.shadows.btnPrimary,
    "--shadow-btn-go": tokens.shadows.btnGo,
    "--shadow-day-card": tokens.shadows.dayCard,
    "--shadow-preset": tokens.shadows.preset,
    "--shadow-chip": tokens.shadows.chip,
    "--shadow-budget": tokens.shadows.budget,
    "--radius-sm": tokens.radius.sm,
    "--radius-md": tokens.radius.md,
    "--radius-lg": tokens.radius.lg,
    "--radius-xl": tokens.radius.xl,
    "--radius-full": tokens.radius.full,
  } as React.CSSProperties;

  return (
    <div style={styles} className="min-h-screen text-[var(--color-navy-text)] antialiased">
      {children}
    </div>
  );
}
