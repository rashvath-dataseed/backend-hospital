const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const PORT = process.env.PORT || 5000;

// Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const initializeSocket = require("./src/sockets/chatSocket");
initializeSocket(io);
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Hospital Management System API running on port ${PORT}`);
  console.log(`Socket.IO ready for real-time chat`);
});
