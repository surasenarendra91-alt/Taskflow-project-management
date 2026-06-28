const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// Get comments for a task
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatarUrl')
      .populate('mentions', 'name email')
      .sort('createdAt');

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create comment
exports.createComment = async (req, res) => {
  try {
    const { content, mentions } = req.body;
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('assignees', '_id');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await Comment.create({
      content,
      task: taskId,
      author: req.user._id,
      mentions: mentions || []
    });

    await comment.populate('author', 'name email avatarUrl');
    await comment.populate('mentions', 'name email avatarUrl');

    // Notify task assignees (except author)
    const notifyUsers = task.assignees
      .map(a => a._id.toString())
      .filter(id => id !== req.user._id.toString());

    if (notifyUsers.length > 0) {
      const notifications = notifyUsers.map(userId => ({
        recipient: userId,
        sender: req.user._id,
        type: 'task_commented',
        title: 'New Comment',
        message: `${req.user.name} commented on "${task.title}"`,
        project: task.project,
        task: taskId
      }));
      await Notification.insertMany(notifications);
    }

    // Notify mentions
    if (mentions && mentions.length > 0) {
      const mentionNotifs = mentions
        .filter(id => id !== req.user._id.toString())
        .map(userId => ({
          recipient: userId,
          sender: req.user._id,
          type: 'mention',
          title: 'Mentioned in Comment',
          message: `${req.user.name} mentioned you in "${task.title}"`,
          project: task.project,
          task: taskId
        }));
      if (mentionNotifs.length > 0) await Notification.insertMany(mentionNotifs);
    }

    const io = req.app.get('io');
    io.to(`task:${taskId}`).emit('comment:created', comment);
    io.to(`project:${task.project}`).emit('task:commented', { taskId, comment });

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('author', 'name email avatarUrl');

    const io = req.app.get('io');
    io.to(`task:${comment.task}`).emit('comment:updated', comment);

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    io.to(`task:${comment.task}`).emit('comment:deleted', { commentId: req.params.id });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
