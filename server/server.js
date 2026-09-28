const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const listRoutes = require("./routes/listRoutes");
const itemRoutes = require("./routes/itemRoutes");
const notificationRoutes = require(
  "./routes/notificationRoutes"
);

const app = express();

const configuredOrigins = (
  process.env.CLIENT_ORIGINS ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) =>
    origin.trim().replace(/\/$/, "")
  )
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        configuredOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "OddsnSods API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/items", itemRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
};

startServer();
