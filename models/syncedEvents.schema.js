const mongoose = require("mongoose");
const BaseMongooseSchema = require("./base.schema");

const SyncedEvent = new BaseMongooseSchema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Events",
    required: true,
  },
  googleEventId: {
    type: String,
    required: true,
  },
});

const syncedEventModel = mongoose.model("SyncedEvents", SyncedEvent);
module.exports = syncedEventModel;
