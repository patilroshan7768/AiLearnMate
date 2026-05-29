const express = require("express");
const cors = require("cors");
const path = require("path");
// Load .env from the backend folder explicitly so server works regardless of cwd
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { sequelize, testConnection } = require("./src/config/database");
const { swaggerUi, swaggerSpec } = require("./src/config/swagger");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const recommendationRoutes = require("./src/routes/recommendationRoutes");
const logRoutes = require("./src/routes/logRoutes");
const emailRoutes = require("./src/routes/emailRoutes");
const myLearningRoutes = require("./src/routes/myLearningRoutes");
const assignmentRoutes = require("./src/routes/assignmentRoutes");
const searchRoutes = require("./src/routes/searchRoutes");

// Load YouTube cache cron job
require("./src/utils/youtubeCron");

// Import models
const User = require("./src/models/User");
const Course = require("./src/models/Course");
const Log = require("./src/models/Log");
const MyLearning = require("./src/models/MyLearning");
const Lecture = require("./src/models/Lecture");
const Pdf = require("./src/models/Pdf");
const Transcript = require("./src/models/Transcript");
const Note = require("./src/models/Note");
const Flashcard = require("./src/models/Flashcard");
const Quiz = require("./src/models/Quiz");
const Result = require("./src/models/Result");
const Assignment = require("./src/models/Assignment");
const Submission = require("./src/models/Submission");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  }),
);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/my-learning", myLearningRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/search", searchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
   console.log("STEP 1");

await testConnection();

console.log("STEP 2 - DB Connected");

console.time("SYNC");

await sequelize.sync({ force: false });

console.timeEnd("SYNC");
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
