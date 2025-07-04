const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  column: {
    type: Schema.Types.ObjectId,
    ref: 'Column',
    required: true
  },
  position: {
    type: Number,
    default: 0
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  startDate: Date,
  // estimatedHours: {
  //   type: Number,
  //   min: 0
  // },
  // actualHours: {
  //   type: Number,
  //   min: 0
  // },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },

  labels: [{
    type: Schema.Types.ObjectId,
    ref: 'Label'
  }],

  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },

  checklist: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    position: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  attachments: [{
    name: { 
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  timeEntries: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  invitedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'Users'
  }],

  lastActivity: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});


taskSchema.index({ column: 1, position: 1 });
taskSchema.index({ board: 1, isArchived: 1 });
// taskSchema.index({ assignee: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ lastActivity: -1 });

// Pre-save middleware to update lastActivity
taskSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

const taskModel = mongoose.model('Task', taskSchema);
module.exports = taskModel;