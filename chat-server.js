const WebSocket = require("ws");
const mongoose = require("mongoose");

const MONGODB_URI = "mongodb+srv://abdo97:1234@cluster0.8rva7e3.mongodb.net/tutoring-app?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Chat Server connected to MongoDB"))
  .catch((err) => console.error("❌ Chat Server MongoDB error:", err));

//  Updated schema to include role
const messageSchema = new mongoose.Schema({
  sender: String,         // "student" or "tutor"
  senderName: String,     // e.g., "Ali"
  role: String,           // student or tutor (again, can be same as sender)
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const ChatMessage = mongoose.model("ChatMessage", messageSchema);

const wss = new WebSocket.Server({ port: 3000 }, () => {
  console.log("🚀 WebSocket server running on ws://localhost:3000");
});

wss.on("connection", async (ws) => {
  console.log("🟢 Client connected");

  // Send last 50 messages to new client
  const previousMessages = await ChatMessage.find()
    .sort({ timestamp: 1 })
    .limit(300);

  previousMessages.forEach((msg) => {
    ws.send(JSON.stringify({
      id: msg._id,
      sender: msg.sender,
      senderName: msg.senderName,
      role: msg.role,
      text: msg.text,
      time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    
  });

  ws.on("message", async (message) => {
    console.log("📩 Received:", message);

    const parsed = JSON.parse(message);
    const { sender, senderName, role, text } = parsed;

    const newMessage = new ChatMessage({ sender, senderName, role, text });
    await newMessage.save();

    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          id: newMessage._id,
          sender,
          senderName,
          role,
          text,
          time: new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        
      }
    });
  });

  ws.on("close", () => {
    console.log("🔴 Client disconnected");
  });
});
