import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import healthRoutes from "./routes/healthRoutes";
import routes from "./routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
});

app.use("/", healthRoutes);
app.use("/api", routes);
app.use(errorMiddleware);

export function startServer() {
  app.listen(env.PORT, () => {
    console.log(`Backend listening on http://localhost:${env.PORT}`);
  });
}

export default app;

