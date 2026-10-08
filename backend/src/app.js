require("dotenv").config();
const cors = require("cors");
const express = require("express");

//Import routes for CSV/XLSX lead uploads.
const importRoutes = require("./routes/importRoutes");

const leadRoutes = require("./routes/leadRoutes");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");

const {startImportWorker} = require("./workers/importWorker");

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

//Register the lead import API.
app.use("/api/imports", importRoutes);

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

    startImportWorker();
});