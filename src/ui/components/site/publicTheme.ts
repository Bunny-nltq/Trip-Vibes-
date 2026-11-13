import type { CSSProperties } from "react";
import tokens from "@/design/tokens.json";
import journeyScene from "@/design/assets/coastal-journey-v3.png";

const sceneSrc = typeof journeyScene === "string" ? journeyScene : journeyScene.src;

export const publicTheme = {
  ...Object.fromEntries(Object.entries(tokens.home).map(([key, value]) => [`--home-${key}`, value])),
  "--v4-scene": `url(${sceneSrc})`,
} as CSSProperties;
