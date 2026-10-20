import { describe, it, expect } from "vitest";
import { boundingBox } from "./overpassClient";

describe("overpassClient - boundingBox", () => {
  it("với tâm (16.0685, 108.2240) và nuaCanhVi 0.03 trả đúng south, north, west, east (sai số <= 0.0001)", () => {
    const tam = { lat: 16.0685, lng: 108.224 };
    const b = boundingBox(tam, 0.03);

    expect(b.south).toBeCloseTo(16.0385, 4);
    expect(b.north).toBeCloseTo(16.0985, 4);
    expect(b.west).toBeCloseTo(108.19278, 4);
    expect(b.east).toBeCloseTo(108.25522, 4);
  });

  it("với tâm (16.0685, 108.2240) và nuaCanhVi 0.15 trả đúng south, north, west, east (sai số <= 0.0001)", () => {
    const tam = { lat: 16.0685, lng: 108.224 };
    const b = boundingBox(tam, 0.15);

    expect(b.south).toBeCloseTo(15.9185, 4);
    expect(b.north).toBeCloseTo(16.2185, 4);
    expect(b.west).toBeCloseTo(108.0679, 4);
    expect(b.east).toBeCloseTo(108.3801, 4);
  });
});
