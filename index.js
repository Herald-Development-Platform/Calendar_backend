const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { createServer } = require("http");
const {
  sendOngoingEventsNotification,
} = require("./controllers/cron/events.job");
// Importing intialization functions
const { connectToMongoDB } = require("./services/database.services");

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
    "http://localhost:5050",
    "http://localhost:5174",
    "http://localhost:5413",
    "http://localhost:9787",
    "http://localhost:8080",
    "http://localhost:5000",
    "http://localhost:7575",
    "https://calendar-frontend-suen.onrender.com",
    "https://calendar-frontend-tmhj.onrender.com",
    "http://10.99.0.35:7575",
    "http://10.99.0.35:10000",
    "http://10.99.0.35:7575",
    "http://10.99.0.35:5000",
    "http://10.99.0.35:10000",
    "http://10.99.0.35",
    "http://10.22.2.224:7575",
    "http://10.22.2.224:5000",
    "http://10.22.2.224:10000",
    "http://10.22.2.224:9787",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
// routes import
const mainRouter = require("./routes/index.routes");
const errorHandler = require("./middlewares/error.middleware");
const {
  handleWSConnection,
} = require("./controllers/websocket/socket.controller");

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
    const server = createServer(app); // Actual Web server
    const WSapp = require("socket.io")(server, { cors: corsOptions }); // Websocker Server
    WSapp.on("connection", handleWSConnection);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      sendOngoingEventsNotification();
    });
  } catch (error) {
    console.error("Error while starting the server: ", error);
  }
};
