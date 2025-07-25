const mongoose = require("mongoose");
const { Schema } = mongoose;

const columnSchema = new Schema(
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

columnSchema.index({ createdBy: 1, position: 1 });
columnSchema.index({ createdBy: 1, isArchived: 1 });

const columnModel = mongoose.model("Column", columnSchema);
module.exports = columnModel;
