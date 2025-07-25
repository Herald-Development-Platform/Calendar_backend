const mongoose = require("mongoose");
const { Schema } = mongoose;

const labelSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

labelSchema.index({ createdBy: 1, position: 1 });
labelSchema.index({ createdBy: 1, isArchived: 1 });

const labelModel = mongoose.model("Label", labelSchema);
module.exports = labelModel;
