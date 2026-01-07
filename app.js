// app.js
import express from "express";
import cors from "cors";
import orderRoutes from "./routes/order.routes.js";
import internalRoutes from "./routes/internal.routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "http://localhost:3001", 
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/orders", orderRoutes);
app.use("/internal", internalRoutes);

export default app;
