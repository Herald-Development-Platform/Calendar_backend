const mongoose = require("mongoose");

if (!process.env.MONGODB_URI) {
  console.error("MongoDB URI is missing");
  process.exit(1);
}

// Connect to mongodb
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("Failed to connect to MongoDB", e);
  }
};

module.exports = { connectToMongoDB };
