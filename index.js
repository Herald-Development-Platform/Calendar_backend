const express = require("express");
require("dotenv").config();

const cors = require("cors");
const { Server } = require("socket.io");

const { createServer } = require("http");
const { sendOngoingEventsNotification } = require("./controllers/cron/events.job");

// Importing intialization functions
const { connectToMongoDB } = require("./services/database.services");

// Initialize Express app
const app = express();

const ALLOWED_IPS = [
  "localhost",
  "127.0.0.1",
  "10.99.0.35",
  "110.34.30.60",
  "events.heraldcollege.edu.np",
  "certificate.heraldcollege.edu.np",
  "",
];

// Middleware
app.use(express.json());

const corsOptions = {
  origin: (origin, callback) => {
    return callback(null, true);
    if (!origin) {
    }
    if (origin?.includes("//")) {
      origin = origin?.split("//")[1];
    }
    if (origin?.includes(":")) {
      origin = origin?.split(":")[0];
    }
    if (ALLOWED_IPS.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
// routes import
const mainRouter = require("./routes/index.routes");
const errorHandler = require("./middlewares/error.middleware");
const { handleWSConnection } = require("./controllers/websocket/socket.controller");

// Use routes
app.use("/api", mainRouter);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `The route '${req.method} ${req.url}' doesn't exists on the API!`,
  });
});

connectToMongoDB().then(async () => {
  startServer();
});

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 10000;
    const server = createServer(app);
    const io = new Server(server, {
      cors: corsOptions,
      transports: ["websocket", "polling"],
    });

    io.on("connection", socket => {
      try {
        handleWSConnection(socket);
      } catch (error) {
        console.error("⚠️ WebSocket connection error:", error);
      }
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      sendOngoingEventsNotification();
    });
  } catch (error) {
    console.error("Error while starting the server: ", error);
  }
};
