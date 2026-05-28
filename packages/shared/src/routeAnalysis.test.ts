import { describe, expect, it } from "vitest";
import { classifySunSide, seatAwayFromSun } from "./routeAnalysis";

describe("route sun side analysis", () => {
  it("classifies a sun bearing clockwise from travel as the right side", () => {
    expect(classifySunSide(0, 90, 45)).toBe("right");
  });

  it("classifies a sun bearing counter-clockwise from travel as the left side", () => {
    expect(classifySunSide(0, 270, 45)).toBe("left");
  });

  it("ignores sun exposure when the sun is too low", () => {
    expect(classifySunSide(0, 90, -2)).toBe("none");
  });

  it("recommends the seat opposite the sun side", () => {
    expect(seatAwayFromSun("left")).toBe("right");
    expect(seatAwayFromSun("right")).toBe("left");
    expect(seatAwayFromSun("front")).toBe("either");
  });
});
