require("dotenv").config();
const cors = require("cors");
const express = require("express");

const leadRoutes = require("./routes/leadRoutes");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/leads", leadRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found"
        }
    });
});

app.use(errorHandler);
app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});