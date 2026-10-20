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
    "--color-loading": tokens.colors.status.loading,
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
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              background: linear-gradient(135deg, ${tokens.colors.neutral.bgGradStart} 0%, ${tokens.colors.neutral.bgGradMid} 55%, ${tokens.colors.neutral.bgGradEnd} 100%) !important;
              color: ${tokens.colors.neutral.navyText};
              font-family: ${tokens.typography.fontFamily.sans};
              font-size: 14px;
              line-height: 20px;
              min-height: 100vh;
            }
            .Script { font-family: ${tokens.typography.fontFamily.script} !important; }
            .Frame { width: 100%; max-width: 1440px; min-height: 1024px; margin: 0 auto; position: relative; }
            .Shell { display: flex; width: 100%; min-height: 1024px; }
            .Sidebar { width: 248px; flex: none; position: relative; display: flex; flex-direction: column; background: rgba(255,255,255,0.72); backdrop-filter: blur(8px); border-right: 1px solid ${tokens.colors.neutral.borderBlue}; min-height: 100vh; }
            .LogoBlock { display: flex; align-items: center; gap: 8px; padding: 30px 16px 0 20px; }
            .LogoName { font-size: 28px; line-height: 32px; font-weight: 700; color: ${tokens.colors.neutral.navyDark}; }
            .LogoSub { font-size: 11px; line-height: 14px; color: ${tokens.colors.neutral.subText}; white-space: nowrap; }
            .Nav { margin: 36px 16px 0; }
            .NavItem { display: flex; align-items: center; gap: 14px; height: 48px; padding: 0 18px; margin-bottom: 6px; border-radius: 16px; font-size: 15px; font-weight: 500; color: ${tokens.colors.neutral.lightMuted}; cursor: pointer; transition: all 0.15s ease; user-select: none; }
            .NavItem:hover { background: rgba(220, 232, 251, 0.4); color: ${tokens.colors.primary.brand}; }
            .NavOn { color: #4A5A7A; }
            .NavActive { background: ${tokens.colors.primary.brandLight}; color: ${tokens.colors.primary.brand}; font-weight: 600; }
            .NavNote { margin: 10px 20px 0; font-size: 12px; line-height: 16px; color: ${tokens.colors.neutral.mutedText}; }
            .SideBottom { margin-top: auto; position: relative; padding: 0 16px 36px; }
            .Promo { display: flex; align-items: center; gap: 8px; height: 104px; padding: 0 14px; margin-bottom: 26px; border-radius: 22px; background: ${tokens.colors.secondary.promoBg}; }
            .PromoText { font-size: 19px; line-height: 24px; font-weight: 600; color: ${tokens.colors.secondary.promoText}; }
            .Plant { position: absolute; left: -26px; bottom: -10px; opacity: 0.9; pointer-events: none; }
            .UserBlock { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; padding-left: 20px; cursor: pointer; }
            .Avatar { width: 44px; height: 44px; border-radius: 22px; flex: none; background: linear-gradient(135deg, #FFD6A5, #F4A0A0); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; color: #6B3A2A; }
            .UserName { font-weight: 600; font-size: 14px; line-height: 18px; }
            .UserSub { font-size: 11.5px; line-height: 16px; color: ${tokens.colors.neutral.subText}; white-space: nowrap; }
            .Content { flex: 1; padding: 0 32px 36px 32px; min-width: 0; position: relative; }
            .TopbarFlow { height: 88px; display: flex; align-items: center; justify-content: space-between; }
            .Search { display: flex; align-items: center; gap: 10px; width: 400px; height: 44px; padding: 0 18px; border-radius: 22px; background: #FFFFFF; border: 1px solid ${tokens.colors.neutral.borderLight}; color: ${tokens.colors.neutral.mutedText}; font-size: 13px; }
            .TopRight { display: flex; align-items: center; gap: 22px; }
            .Bell { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: ${tokens.colors.primary.brand}; cursor: pointer; }
            .Dot { position: absolute; right: 8px; top: 7px; width: 9px; height: 9px; border-radius: 5px; background: ${tokens.colors.status.badgeRed}; border: 2px solid #F2F7FD; }
            .Me { width: 44px; height: 44px; border-radius: 22px; background: #B9C7DD; display: flex; align-items: center; justify-content: center; color: ${tokens.colors.neutral.bodyText}; cursor: pointer; }
            .HomeRow { display: flex; gap: 28px; align-items: stretch; }
            .HomeCard { position: relative; width: 836px; flex: none; min-height: 890px; display: flex; flex-direction: column; border-radius: 30px; background: #FFFFFF; box-shadow: ${tokens.shadows.homeCard}; overflow: hidden; }
            .Hero { position: relative; height: 192px; margin: 8px 8px 0; border-radius: 24px; overflow: hidden; flex: none; }
            .HeroTitle { position: absolute; left: 56px; top: 22px; font-size: 38px; line-height: 46px; font-weight: 700; color: ${tokens.colors.neutral.navyText}; }
            .HeroSun { position: absolute; left: 22px; top: 60px; }
            .HeroSub { position: absolute; left: 56px; top: 122px; width: 340px; font-size: 13px; line-height: 20px; color: #2C3B5E; }
            .GoodTrip { position: absolute; right: 40px; top: 20px; font-size: 24px; line-height: 28px; font-weight: 700; color: #3E68D8; transform: rotate(-6deg); }
            .Body { padding: 18px 30px 0 28px; }
            .Sec { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
            .NumC { width: 30px; height: 30px; border-radius: 15px; background: ${tokens.colors.primary.brand}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex: none; }
            .STitle { font-size: 17px; line-height: 22px; font-weight: 700; color: ${tokens.colors.neutral.navyText}; }
            .SSub { font-size: 12px; line-height: 16px; color: ${tokens.colors.neutral.subText}; }
            .Presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
            .Preset { position: relative; display: flex; align-items: center; gap: 9px; height: 76px; padding: 0 10px 0 12px; border-radius: 18px; background: #FFFFFF; border: 1px solid ${tokens.colors.neutral.borderBlue}; box-shadow: ${tokens.shadows.preset}; cursor: pointer; transition: all 0.15s ease; }
            .Preset:hover { transform: translateY(-1px); border-color: ${tokens.colors.neutral.borderPreset}; }
            .PresetOn { background: ${tokens.colors.primary.brandActive}; border: 1.5px solid ${tokens.colors.neutral.borderPreset}; }
            .PName { font-size: 14px; line-height: 18px; font-weight: 700; color: ${tokens.colors.neutral.navyText}; }
            .PSub { font-size: 11.5px; line-height: 16px; color: ${tokens.colors.neutral.subText}; white-space: nowrap; }
            .Badge { position: absolute; right: 8px; top: 8px; width: 20px; height: 20px; border-radius: 10px; background: ${tokens.colors.primary.brand}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; }
            .TwoCol { display: flex; gap: 22px; margin-bottom: 22px; }
            .TwoCol > div:last-child { flex: 1; }
            .GLabel { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #2C3B5E; }
            .ChipsNo { display: flex; flex-wrap: nowrap; gap: 6px; }
            .ChipsWrap { display: flex; flex-wrap: wrap; gap: 6px; }
            .Chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px; border-radius: 16px; background: #FFFFFF; border: 1px solid ${tokens.colors.neutral.borderCard}; font-size: 13px; font-weight: 500; color: #2C3B5E; white-space: nowrap; cursor: pointer; transition: all 0.15s ease; }
            .Chip:hover { border-color: ${tokens.colors.primary.brand}; color: ${tokens.colors.primary.brand}; }
            .ChipOn { background: ${tokens.colors.primary.brand}; border-color: ${tokens.colors.primary.brand}; color: #FFFFFF; font-weight: 600; }
            .ChipIcon { height: 38px; padding: 0 14px; font-size: 12.5px; box-shadow: ${tokens.shadows.chip}; }
            .Section { margin-bottom: 22px; }
            .Area { position: relative; height: 88px; padding: 14px 16px; border-radius: 18px; border: 1px solid ${tokens.colors.neutral.borderLight}; color: ${tokens.colors.neutral.mutedText}; font-size: 13px; background: #FFFFFF; }
            .Counter { position: absolute; right: 16px; bottom: 10px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: ${tokens.colors.neutral.mutedText}; }
            .BarWrap { margin-top: auto; padding: 12px 30px 28px 28px; }
            .BarIn { display: flex; align-items: center; justify-content: space-between; height: 74px; padding: 0 14px 0 22px; border-radius: 24px; background: ${tokens.colors.primary.brandSoft}; }
            .BarText { display: flex; align-items: center; gap: 12px; font-size: 13px; color: ${tokens.colors.neutral.bodyText}; }
            .Go { display: flex; align-items: center; justify-content: center; gap: 10px; width: 200px; height: 50px; border-radius: 25px; background: ${tokens.colors.primary.brand}; color: #FFFFFF; font-size: 15px; font-weight: 600; box-shadow: ${tokens.shadows.btnGo}; cursor: pointer; border: none; flex: none; transition: all 0.2s ease; }
            .Go:hover { background: ${tokens.colors.primary.brandHover}; transform: translateY(-1px); }
            .GoOff { background: #C9D3E6; box-shadow: none; cursor: not-allowed; }
            .HomeRight { position: relative; width: 264px; flex: none; overflow: hidden; min-height: 890px; }
            .Quote { position: absolute; left: 16px; top: 30px; width: 240px; font-size: 28px; line-height: 38px; font-weight: 600; color: #4B72D9; transform: rotate(-7deg); transform-origin: left top; }
            .RightArt { position: absolute; left: -30px; bottom: 0; }
            .Fade { position: absolute; left: 0; bottom: 0; width: 80px; height: 700px; background: linear-gradient(90deg, #EEF4FC 0%, rgba(238,244,252,0) 100%); pointer-events: none; }
            .DayCard { background: #FFFFFF; border: 1px solid ${tokens.colors.neutral.borderBlue}; border-radius: 22px; margin-bottom: 16px; box-shadow: ${tokens.shadows.dayCard}; }
            .DayHead { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #EAF0FA; }
            .DayName { font-size: 16px; line-height: 24px; font-weight: 700; }
            .DayTotal { font-size: 14px; color: ${tokens.colors.neutral.subText}; font-weight: 600; }
            .Item { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #F0F4FB; transition: background 0.15s ease; }
            .Item:hover { background: #F8FAFD; }
            .NoLine { border-bottom: none; }
            .Time { width: 46px; flex: none; font-size: 14px; color: ${tokens.colors.neutral.subText}; }
            .Tag { width: 84px; flex: none; padding: 3px 0; text-align: center; border: 1px solid #BFD0F0; border-radius: 12px; font-size: 12px; line-height: 16px; color: ${tokens.colors.neutral.bodyText}; background: #F3F8FF; }
            .Info { flex: 1; min-width: 0; }
            .InfoTitle { font-weight: 700; color: ${tokens.colors.neutral.navyText}; }
            .InfoSub { font-size: 13px; color: ${tokens.colors.neutral.subText}; }
            .Amount { width: 140px; flex: none; text-align: right; font-size: 14px; font-weight: 600; }
            .AmountSub { display: block; font-size: 12px; font-weight: 400; color: ${tokens.colors.neutral.subText}; }
            .Action { width: 52px; flex: none; display: flex; justify-content: flex-end; }
            .Btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 20px; border: 1px solid #BFD0F0; border-radius: 20px; background: #FFFFFF; color: ${tokens.colors.primary.brand}; font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: all 0.15s ease; }
            .Btn:hover { border-color: ${tokens.colors.primary.brand}; background: ${tokens.colors.primary.brandSoft}; }
            .BtnGhost { color: ${tokens.colors.neutral.lightMuted}; border-color: ${tokens.colors.neutral.borderCard}; }
            .BtnPrimary { background: ${tokens.colors.primary.brand}; border-color: ${tokens.colors.primary.brand}; color: #FFFFFF; box-shadow: ${tokens.shadows.btnPrimary}; }
            .BtnPrimary:hover { background: ${tokens.colors.primary.brandHover}; border-color: ${tokens.colors.primary.brandHover}; }
            .BtnSmall { height: 32px; padding: 0 14px; font-size: 13px; border-radius: 16px; }
            .BtnFull { width: 100%; height: 48px; border-radius: 24px; }
            .BtnDone { background: #EEF3FB; border-color: ${tokens.colors.neutral.borderCard}; color: ${tokens.colors.neutral.mutedText}; }
            .BtnOff { background: #C9D3E6; border-color: #C9D3E6; color: #FFFFFF; box-shadow: none; cursor: not-allowed; }
            .Box { width: 18px; height: 18px; flex: none; border: 1.5px solid #8FA6D3; border-radius: 5px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
            .BoxOn { background: ${tokens.colors.primary.brand}; border-color: ${tokens.colors.primary.brand}; color: #FFFFFF; }
            .H1 { font-size: 24px; line-height: 32px; font-weight: 700; margin-bottom: 6px; color: ${tokens.colors.neutral.navyText}; }
            .Sub { font-size: 13px; line-height: 18px; color: ${tokens.colors.neutral.subText}; margin-bottom: 20px; }
            .Main { width: 780px; flex: none; }
            .MainWide { width: 100%; max-width: 1100px; }
            .Row2 { display: flex; gap: 28px; align-items: flex-start; }
            .Side { width: 324px; flex: none; }
            .Tabs { display: flex; gap: 8px; margin-bottom: 16px; }
            .Tab { height: 38px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid ${tokens.colors.neutral.borderCard}; border-radius: 20px; background: #FFFFFF; font-size: 14px; line-height: 20px; color: #2C3B5E; font-weight: 500; cursor: pointer; transition: all 0.15s ease; box-sizing: border-box; }
            .Tab:hover { border-color: ${tokens.colors.primary.brand}; color: ${tokens.colors.primary.brand}; }
            .TabOn { background: ${tokens.colors.primary.brand}; border-color: ${tokens.colors.primary.brand}; color: #FFFFFF; font-weight: 600; }
            .TabOn:hover { background: ${tokens.colors.primary.brandHover}; border-color: ${tokens.colors.primary.brandHover}; color: #FFFFFF; }
            .BudgetSummary { padding: 20px; background: #FFFFFF; border: 1px solid ${tokens.colors.neutral.borderBlue}; border-radius: 24px; box-shadow: ${tokens.shadows.budget}; }
            .Label { font-size: 13px; color: ${tokens.colors.neutral.subText}; }
            .Big { margin-top: 4px; font-size: 30px; line-height: 38px; font-weight: 800; color: ${tokens.colors.neutral.navyText}; }
            .BigSub { font-size: 13px; color: ${tokens.colors.neutral.subText}; margin-bottom: 12px; }
            .BarTrack { height: 12px; background: ${tokens.colors.neutral.trackBg}; border-radius: 6px; overflow: hidden; }
            .BarFill { height: 12px; background: ${tokens.colors.primary.brand}; border-radius: 6px; transition: width 0.3s ease; }
            .BarRed { background: ${tokens.colors.status.error}; }
            .Divider { height: 1px; background: ${tokens.colors.neutral.trackBg}; margin: 6px 0 14px; }
            .Link { font-size: 13px; color: ${tokens.colors.primary.brand}; text-decoration: underline; font-weight: 500; cursor: pointer; }
            .Modal { position: fixed; background: #FFFFFF; border: 1px solid ${tokens.colors.neutral.borderCard}; border-radius: 28px; padding: 28px; box-shadow: ${tokens.shadows.modal}; z-index: 1000; }
            .ModalTitle { font-size: 22px; line-height: 30px; font-weight: 700; margin-bottom: 4px; color: ${tokens.colors.neutral.navyText}; }
            .Dim { opacity: 0.32; pointer-events: none; }
            .Pop { position: absolute; width: 300px; background: #FFFFFF; border: 1px solid ${tokens.colors.neutral.borderCard}; border-radius: 20px; padding: 8px; box-shadow: ${tokens.shadows.popover}; z-index: 500; }
            .PopTitle { padding: 10px 12px 4px; font-weight: 700; color: ${tokens.colors.neutral.navyText}; }
            .PopSub { padding: 0 12px 8px; font-size: 12px; color: ${tokens.colors.neutral.subText}; }
            .PopItem { padding: 10px 12px; border-radius: 12px; font-size: 14px; cursor: pointer; transition: background 0.15s ease; color: ${tokens.colors.neutral.bodyText}; }
            .PopItem:hover { background: ${tokens.colors.primary.brandSoft}; color: ${tokens.colors.primary.brand}; font-weight: 600; }
            .Drop { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 220px; border: 2px dashed #9DB5E6; border-radius: 20px; background: #F6F9FE; text-align: center; cursor: pointer; transition: border-color 0.2s; }
            .Drop:hover { border-color: ${tokens.colors.primary.brand}; }
            .PhotoBig { display: flex; align-items: center; justify-content: center; width: 200px; height: 140px; flex: none; background: linear-gradient(135deg, #CFE5F8, #E9F4FE); border-radius: 14px; font-size: 13px; color: ${tokens.colors.neutral.subText}; overflow: hidden; }
            .Field { margin-bottom: 16px; }
            .FieldLabel { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: ${tokens.colors.neutral.navyText}; }
            .Input { height: 44px; padding: 0 14px; display: flex; align-items: center; border: 1px solid ${tokens.colors.neutral.borderInput}; border-radius: 14px; background: #FFFFFF; color: ${tokens.colors.neutral.bodyText}; font-size: 14px; width: 100%; outline: none; }
            .Input:focus { border-color: ${tokens.colors.primary.brand}; }
            .InputBig { height: 58px; font-size: 26px; font-weight: 800; color: ${tokens.colors.neutral.navyText}; }
            .Hint { font-size: 12px; line-height: 16px; color: ${tokens.colors.neutral.subText}; margin-top: 6px; }
            .Row { display: flex; gap: 16px; align-items: center; }
            .RowTop { display: flex; gap: 16px; align-items: flex-start; }
            .Grow { flex: 1; min-width: 0; }
            .Toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; padding: 14px 18px; background: ${tokens.colors.neutral.navyText}; color: #FFFFFF; border-radius: 20px; font-size: 14px; z-index: 1000; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
            .ToastBtn { padding: 6px 14px; border: 1px solid #FFFFFF; border-radius: 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
          `,
        }}
      />
      <div style={styles} className="min-h-screen text-[var(--color-navy-text)] antialiased">
        {children}
      </div>
    </>
  );
}
