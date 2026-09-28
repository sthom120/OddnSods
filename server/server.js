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

connectDB();

app.use(cors());
app.use(express.json());

app.use(
  "/api/notifications",
  notificationRoutes
);

app.get("/", (req, res) => {
  res.json({ message: "List app API is running" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Test route works" });
});

app.use("/api/lists", listRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});