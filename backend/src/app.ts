import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import routes from "./routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

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

app.get("/health", (_req, res) => {
  return res.status(200).json({ ok: true });
});

app.use("/api", routes);
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
