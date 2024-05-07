const express = require('express');
require('dotenv').config();

// Importing intialization functions
const { connectToMongoDB } = require('./services/database.services');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// routes import
const mainRouter = require('./routes/index.routes');
const errorHandler = require('./middlewares/error.middleware');

// Use routes
app.use('/api', mainRouter);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: `The route '${req.url}' doesn't exists on the API!` });
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
    console.error('Error while starting the server: ', error);
  }
};


