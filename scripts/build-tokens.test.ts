import { describe, it, expect } from "vitest";
import { sinhCSSTuTokens } from "./build-tokens";

describe("sinhCSSTuTokens", () => {
  it("đổi giá trị primary trong tokens thì file CSS sinh ra đổi tương ứng", () => {
    const tokensGoc = {
      colors: {
        primary: {
          main: "#2B55D6",
          text: "#FFFFFF",
          tint: "#EAF1FE",
        },
      },
    };

    const cssGoc = sinhCSSTuTokens(tokensGoc);
    expect(cssGoc).toContain("--color-primary: #2B55D6;");
    expect(cssGoc).toContain("--color-primary-main: #2B55D6;");

    const tokensMoi = {
      colors: {
        primary: {
          main: "#FF0000",
          text: "#FFFFFF",
          tint: "#FFE5E5",
        },
      },
    };

    const cssMoi = sinhCSSTuTokens(tokensMoi);
    expect(cssMoi).toContain("--color-primary: #FF0000;");
    expect(cssMoi).toContain("--color-primary-main: #FF0000;");
    expect(cssMoi).not.toContain("--color-primary: #2B55D6;");
  });
});
