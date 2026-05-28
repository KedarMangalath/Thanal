import { analyzeRoute, type LatLng } from "@thanal/shared";
import { Router } from "express";
import { z } from "zod";
import { fetchRoadRoutes, routeCoordinates } from "../services/osrm";
import { planRailRoute } from "../services/rail";

const router = Router();

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const requestSchema = z.object({
  message: z.string().min(2),
  mode: z.enum(["bus", "bike", "walk", "train"]).default("bus"),
  start: latLngSchema.nullish(),
  end: latLngSchema.nullish(),
  departureTime: z.string().datetime().optional()
});

router.post("/plan", async (request, response, next) => {
  try {
    const body = requestSchema.parse(request.body);
    const departureTime = body.departureTime ? new Date(body.departureTime) : new Date();
    const toolTrace = await runAssistantTools({
      mode: body.mode,
      start: body.start ?? undefined,
      end: body.end ?? undefined,
      departureTime
    });

    const answer = await askGemini(body.message, toolTrace);
    response.json({
      answer: answer ?? fallbackAnswer(toolTrace),
      model: answer ? process.env.GEMINI_MODEL ?? "gemini-2.5-flash" : "deterministic-fallback",
      toolTrace
    });
  } catch (error) {
    next(error);
  }
});

async function runAssistantTools(input: {
  mode: "bus" | "bike" | "walk" | "train";
  start?: LatLng;
  end?: LatLng;
  departureTime: Date;
}) {
  if (!input.start || !input.end) {
    return [{ tool: "needs_route_inputs", output: "Start and destination are required for route advice." }];
  }

  if (input.mode === "train") {
    const rail = planRailRoute({
      start: input.start,
      end: input.end,
      departureTime: input.departureTime
    });

    return [
      {
        tool: "get_train_route_options",
        output: rail.options.map((option) => ({
          id: option.id,
          label: option.label,
          durationMinutes: Math.round(option.analysis.totalDurationMinutes),
          distanceKm: Number((option.analysis.totalDistanceMeters / 1000).toFixed(1)),
          recommendedSeat: option.analysis.recommendedSeat,
          directSunMinutesBySide: option.analysis.directSunMinutesBySide
        }))
      }
    ];
  }

  const routes = await fetchRoadRoutes(input.start, input.end, 3);
  return [
    {
      tool: "get_road_route_options",
      output: routes.map((route, index) => {
        const coordinates = routeCoordinates(route);
        const analysis = analyzeRoute(coordinates, {
          departureTime: input.departureTime,
          averageSpeedKmh: Math.max(18, (route.distance / route.duration) * 3.6)
        });
        return {
          id: `road-${index + 1}`,
          label: index === 0 ? "Recommended road route" : `Alternative road route ${index + 1}`,
          durationMinutes: Math.round(analysis.totalDurationMinutes),
          distanceKm: Number((analysis.totalDistanceMeters / 1000).toFixed(1)),
          recommendedSeat: analysis.recommendedSeat,
          directSunMinutesBySide: analysis.directSunMinutesBySide
        };
      })
    }
  ];
}

async function askGemini(message: string, toolTrace: unknown[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are Thanal, a Kerala travel comfort assistant. Use the tool trace as ground truth. Do not invent routes, train names, prices, or live delays. Give concise practical advice and explain why."
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: JSON.stringify({ userMessage: message, toolTrace })
              }
            ]
          }
        ]
      })
    }
  );

  if (!geminiResponse.ok) return null;
  const data = await geminiResponse.json();
  return data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim() || null;
}

function fallbackAnswer(toolTrace: unknown[]) {
  return `I checked the available route tools. ${JSON.stringify(toolTrace)}`;
}

export default router;
