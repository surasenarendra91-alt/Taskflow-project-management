const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// Get tasks for a project
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId, isArchived: false })
      .populate('assignees', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .sort('order');

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .populate('project', 'name members');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, columnId, assignees, priority, dueDate, labels } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Get highest order in column
    const lastTask = await Task.findOne({ project: projectId, columnId }).sort('-order');
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title, description, columnId, assignees, priority, dueDate, labels,
      project: projectId,
      createdBy: req.user._id,
      order
    });

    await task.populate('assignees', 'name email avatarUrl');
    await task.populate('createdBy', 'name email avatarUrl');

    // Notify assignees
    if (assignees && assignees.length > 0) {
      const notifications = assignees
        .filter(id => id !== req.user._id.toString())
        .map(userId => ({
          recipient: userId,
          sender: req.user._id,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${req.user.name} assigned you to "${title}"`,
          project: projectId,
          task: task._id
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        const io = req.app.get('io');
        assignees.forEach(userId => {
          io.to(`user:${userId}`).emit('notification:new', {
            type: 'task_assigned',
            message: `You were assigned to "${title}"`
          });
        });
      }
    }

    const io = req.app.get('io');
    io.to(`project:${projectId}`).emit('task:created', task);

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { title, description, assignees, priority, dueDate, labels, checklist, columnId, order } = req.body;

    const oldAssignees = task.assignees.map(a => a.toString());
    Object.assign(task, { title, description, priority, dueDate, labels, checklist });
    if (assignees !== undefined) task.assignees = assignees;
    if (columnId) task.columnId = columnId;
    if (order !== undefined) task.order = order;

    await task.save();
    await task.populate('assignees', 'name email avatarUrl');
    await task.populate('createdBy', 'name email avatarUrl');

    // Notify new assignees
    if (assignees) {
      const newAssignees = assignees.filter(id => !oldAssignees.includes(id) && id !== req.user._id.toString());
      if (newAssignees.length > 0) {
        const notifications = newAssignees.map(userId => ({
          recipient: userId,
          sender: req.user._id,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${req.user.name} assigned you to "${task.title}"`,
          project: task.project,
          task: task._id
        }));
        await Notification.insertMany(notifications);

        const io = req.app.get('io');
        newAssignees.forEach(userId => {
          io.to(`user:${userId}`).emit('notification:new', {
            type: 'task_assigned',
            message: `You were assigned to "${task.title}"`
          });
        });
      }
    }

    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('task:updated', task);

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Move task (drag and drop)
exports.moveTask = async (req, res) => {
  try {
    const { columnId, order } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { columnId, order },
      { new: true }
    ).populate('assignees', 'name email avatarUrl');

    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('task:moved', { taskId: task._id, columnId, order });

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const io = req.app.get('io');
    io.to(`project:${task.project}`).emit('task:deleted', { taskId: req.params.id });

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
