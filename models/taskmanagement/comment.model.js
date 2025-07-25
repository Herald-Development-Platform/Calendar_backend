const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    // Comment threading
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },

    // Mentions
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],

    // Edit history
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    originalText: {
      type: String,
    },

    // Status
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

// Indexes for efficient queries
commentSchema.index({ task: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isDeleted: 1 });

// Virtual for reply count
commentSchema.virtual("replyCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
  count: true,
  match: { isDeleted: false },
});

const commentModel = mongoose.model("Comment", commentSchema);
module.exports = commentModel;
