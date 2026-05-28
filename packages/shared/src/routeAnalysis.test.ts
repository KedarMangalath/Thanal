import { describe, expect, it } from "vitest";
import { calculateComfortScore } from "./comfortIndex";
import { analyzeRoute, classifySunSide, seatAwayFromSun } from "./routeAnalysis";

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

  it("returns a complete timeline for every route segment", () => {
    const analysis = analyzeRoute(
      [
        { lat: 8.5241, lng: 76.9366 },
        { lat: 9.4981, lng: 76.3388 },
        { lat: 10.5276, lng: 76.2144 }
      ],
      {
        departureTime: new Date("2026-03-21T08:30:00+05:30"),
        averageSpeedKmh: 42
      }
    );

    expect(analysis.timeline).toHaveLength(2);
    expect(analysis.totalDistanceMeters).toBeGreaterThan(200000);
    expect(analysis.totalDurationMinutes).toBeGreaterThan(250);
    expect(["left", "right", "either"]).toContain(analysis.recommendedSeat);
  });
});

describe("comfort score", () => {
  it("penalizes harsh humid high-uv weather more than mild weather", () => {
    const mild = calculateComfortScore({
      temperatureC: 28,
      relativeHumidity: 60,
      uvIndex: 3,
      precipitationProbability: 5
    });
    const harsh = calculateComfortScore({
      temperatureC: 35,
      relativeHumidity: 88,
      uvIndex: 10,
      precipitationProbability: 40
    });

    expect(mild.score).toBeGreaterThan(harsh.score);
    expect(harsh.label).toBe("avoid");
  });
});
