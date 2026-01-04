// app.js
import express from "express"
import orderRoutes from "./routes/order.routes.js"

const app = express()
app.use(express.json())

app.use("/api/orders", orderRoutes)

export default app
