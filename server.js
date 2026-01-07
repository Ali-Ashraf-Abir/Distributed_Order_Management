// server.js
import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./db/db.js";
import { Server } from "socket.io";

const server = http.createServer(app);


export const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});

// 3️⃣ Socket lifecycle
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`🚀 API + Socket running on port ${PORT}`);
  });
}

start();
