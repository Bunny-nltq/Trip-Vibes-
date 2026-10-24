import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "./logger";

const env = { ...process.env };

afterEach(() => {
  process.env = { ...env };
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("LOG_LEVEL=debug in cả debug lẫn warn", () => {
    process.env.LOG_LEVEL = "debug";
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.debug("a");
    logger.warn("b");
    expect(log).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("LOG_LEVEL=warn không in debug và info", () => {
    process.env.LOG_LEVEL = "warn";
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    expect(log).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("LOG_LEVEL=tat tắt hết, kể cả error", () => {
    process.env.LOG_LEVEL = "tat";
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("x");
    expect(err).not.toHaveBeenCalled();
  });

  it("mặc định ở production chỉ in warn trở lên", () => {
    delete process.env.LOG_LEVEL;
    delete process.env.NEXT_PUBLIC_LOG_LEVEL;
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    expect(log).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("giá trị LOG_LEVEL sai thì dùng mặc định", () => {
    process.env.LOG_LEVEL = "linh-tinh";
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.debug("a");
    expect(log).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
