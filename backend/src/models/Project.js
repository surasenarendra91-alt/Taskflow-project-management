const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  icon: {
    type: String,
    default: '📋'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  columns: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, default: '#94a3b8' },
    order: { type: Number, default: 0 }
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  dueDate: Date,
  tags: [String]
}, {
  timestamps: true
});

// Default columns
projectSchema.pre('save', function(next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { id: 'todo', name: 'To Do', color: '#94a3b8', order: 0 },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b', order: 1 },
      { id: 'review', name: 'Review', color: '#8b5cf6', order: 2 },
      { id: 'done', name: 'Done', color: '#10b981', order: 3 }
    ];
  }
  next();
});

// Add owner as member
projectSchema.pre('save', function(next) {
  if (this.isNew) {
    const ownerExists = this.members.some(m => m.user?.toString() === this.owner?.toString());
    if (!ownerExists) {
      this.members.push({ user: this.owner, role: 'owner' });
    }
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
