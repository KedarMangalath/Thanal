import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import communityRouter from "./routes/community";
import placesRouter from "./routes/places";
import railRouter from "./routes/rail";
import routeRouter from "./routes/route";
import savedRoutesRouter from "./routes/savedRoutes";
import weatherRouter from "./routes/weather";

const app = express();
const port = Number(process.env.PORT ?? 4010);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "thanal-backend" });
});

app.use("/api/route", routeRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/places", placesRouter);
app.use("/api/rail", railRouter);
app.use("/api/community", communityRouter);
app.use("/api/saved-routes", savedRoutesRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Thanal backend listening on http://localhost:${port}`);
});
