const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const WebSocket = require("ws");



const app = express();

const MONGODB_URI = "mongodb+srv://abdo97:1234@cluster0.8rva7e3.mongodb.net/tutoring-app?retryWrites=true&w=majority";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // or even 20mb


const JWT_SECRET = "my-strong-secret-key";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["student", "tutor"] },
  subject: { type: String },
  price: { type: Number },
  rating: { type: Number, default: 4.5 },
  image: { type: String },
  availability: { type: Object, default: {} }
});

const User = mongoose.model("User", UserSchema);


// 👇 Add this after the User model
const sessionSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  tutorId: String,
  tutorName: String,
  subject: String,
  day: String,
  time: String,
});

const Session = mongoose.model("Session", sessionSchema);





const studyMaterialSchema = new mongoose.Schema({
  title: String,
  subject: String,
  fileData: String, // Base64
  fileName: String,
  uploadedBy: String, // store tutor name or ID
});

const StudyMaterial = mongoose.model("StudyMaterial", studyMaterialSchema);

// Chat Message Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  senderName: String,
  role: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const ChatMessage = mongoose.model("ChatMessage", messageSchema);









const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token.split(" ")[1], JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role, subject, price, image } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      subject: role === "tutor" ? subject : undefined,
      price: role === "tutor" ? price : undefined,
      image: role === "tutor" ? image : undefined
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "2h" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        subject: user.subject,
        price: user.price,
        rating: user.rating,
        image: user.image,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update Tutor Profile Info (subject, price, image)
app.put("/api/tutors/profile", authMiddleware, async (req, res) => {
  if (req.user.role !== "tutor") {
    return res.status(403).json({ message: "Only tutors can update profile" });
  }

  const { subject, price, image } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { subject, price, image },
      { new: true }
    );

    res.json({
      message: "Profile updated",
      user: {
        name: updatedUser.name,
        subject: updatedUser.subject,
        price: updatedUser.price,
        image: updatedUser.image,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});


app.get("/api/tutors", async (req, res) => {
  try {
    const tutors = await User.find({ role: "tutor" }).select("-password");
    res.json(tutors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tutors", error: err.message });
  }
});

app.post("/api/tutors/availability", authMiddleware, async (req, res) => {
  try {
    const { availability } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "tutor") {
      return res.status(403).json({ message: "Unauthorized: Only tutors can set availability" });
    }

    user.availability = availability;
    await user.save();

    res.json({ message: "Availability saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving availability", error: err.message });
  }
});

app.post("/api/sessions/book", authMiddleware, async (req, res) => {
  try {
    const { tutorId, day, time } = req.body;
    const studentId = req.user.id;

    //  Get the tutor
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== "tutor") {
      return res.status(404).json({ message: "Tutor not found" });
    }

    //  Check if slot is valid
    if (!tutor.availability[day] || !tutor.availability[day].includes(time)) {
      return res.status(400).json({ message: "Selected time slot not available" });
    }

    //  Get student info
    const student = await User.findById(studentId);

    //  Create session
    const newSession = new Session({
      studentId,
      studentName: student.name,
      tutorId,
      tutorName: tutor.name,
      subject: tutor.subject,
      day,
      time,
    });

    await newSession.save();

    // Remove booked time slot from tutor availability
    tutor.availability[day] = tutor.availability[day].filter(slot => slot !== time);
    if (tutor.availability[day].length === 0) {
      delete tutor.availability[day];
    }
    await tutor.save();

    res.json({ message: "✅ Session booked successfully!" });

  } catch (err) {
    res.status(500).json({ message: "❌ Booking failed", error: err.message });
  }
});


app.get("/api/dashboard", authMiddleware, (req, res) => {
  res.json({ message: `Welcome, ${req.user.role}!` });
});



app.get("/api/sessions/my", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view their sessions" });
    }

    const sessions = await Session.find({ studentId: req.user.id });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Failed to load sessions", error: err.message });
  }
});

// ✅ Get all sessions booked for the logged-in tutor
app.get("/api/sessions/tutor", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "tutor") {
      return res.status(403).json({ message: "Only tutors can view their sessions" });
    }

    const sessions = await Session.find({ tutorId: req.user.id });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Failed to load tutor sessions", error: err.message });
  }
});


app.delete("/api/sessions/:sessionId", authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const tutor = await User.findById(session.tutorId);
    if (tutor) {
      if (!tutor.availability[session.day]) {
        tutor.availability[session.day] = [];
      }
      tutor.availability[session.day].push(session.time);
      await tutor.save();
    }

    await Session.findByIdAndDelete(sessionId);

    res.json({ message: "❌ Session cancelled successfully." });
  } catch (err) {
    res.status(500).json({ message: "Cancellation failed", error: err.message });
  }
});



app.post("/api/materials/upload", authMiddleware, async (req, res) => {
  if (req.user.role !== "tutor") {
    return res.status(403).json({ message: "Only tutors can upload materials" });
  }

  const { title, subject, fileName, fileData } = req.body;

  try {
    const material = new StudyMaterial({
      title,
      subject,
      fileName,
      fileData,
      uploadedBy: req.user.id, // or name
    });

    await material.save();
    res.json({ message: "✅ Material uploaded" });
  } catch (err) {
    res.status(500).json({ message: "❌ Upload failed", error: err.message });
  }
});



app.get("/api/materials", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "tutor") {
      // Tutor sees only their own uploads
      const materials = await StudyMaterial.find({ uploadedBy: userId });
      return res.json(materials);
    } else if (role === "student") {
      // Student sees only files from tutors they've booked
      const sessions = await Session.find({ studentId: userId });
      const tutorIds = [...new Set(sessions.map(s => s.tutorId))];

      const materials = await StudyMaterial.find({
        uploadedBy: { $in: tutorIds }
      });

      return res.json(materials);
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }
  } catch (err) {
    console.error("❌ Error fetching materials:", err);
    res.status(500).json({ message: "❌ Failed to fetch materials" });
  }
});



app.delete("/api/materials/:id", authMiddleware, async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);

  if (!material) {
    return res.status(404).json({ message: "Material not found" });
  }

  if (material.uploadedBy !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to delete this material" });
  }

  await material.deleteOne();
  res.json({ message: "✅ Material deleted" });
});




const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
// WebSocket chat handler
wss.on("connection", async (ws) => {
  console.log("🟢 WebSocket client connected");

  const previousMessages = await ChatMessage.find().sort({ timestamp: 1 }).limit(300);

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
    const parsed = JSON.parse(message);
    const { sender, senderName, role, text } = parsed;

    const newMessage = new ChatMessage({ sender, senderName, role, text });
    await newMessage.save();

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
    console.log("🔴 WebSocket client disconnected");
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running on port ${PORT}`);
});
