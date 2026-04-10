import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/db.js";

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception");
  console.error(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection");
  console.error(reason);
  process.exit(1);
});

dotenv.config();
console.log("Booting ServiceBuddy backend...");
console.log("NODE_ENV:", process.env.NODE_ENV || "not-set");
console.log("PORT:", process.env.PORT || "not-set");
console.log("CLIENT_URL configured:", Boolean(process.env.CLIENT_URL));
console.log("MONGO_URI configured:", Boolean(process.env.MONGO_URI));
await connectDB();

const server = http.createServer(app);
const allowedOrigins = String(process.env.CLIENT_URL || "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(String(userId));
  });
});

app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
