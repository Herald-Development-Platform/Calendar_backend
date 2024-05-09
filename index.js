const express = require("express");
require("dotenv").config();

// Importing intialization functions
const { connectToMongoDB } = require("./services/database.services");

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://admin-codecraft.netlify.app",
    "https://admin.codynn.com",
    "https://codynn.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5050",
    "https://betacompiler.codynn.com",
    "http://localhost:5174",
    "http://localhost:5413",
    "http://localhost:9787",
    "https://beta.codynn.com",
    "https://betachallenges.codynn.com",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
// routes import
const mainRouter = require("./routes/index.routes");
const errorHandler = require("./middlewares/error.middleware");

// Use routes
app.use("/api", mainRouter);

app.use(errorHandler);

app.use((req, res) => {
  res
    .status(404)
    .json({ message: `The route '${req.url}' doesn't exists on the API!` });
});

connectToMongoDB().then(async () => {
  startServer();
});

const startServer = async () => {
  try {
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error while starting the server: ", error);
  }
};
