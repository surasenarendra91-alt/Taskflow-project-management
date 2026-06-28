const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Get all projects for current user
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
      isArchived: false
    }).populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl')
      .sort('-createdAt');

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create project
exports.createProject = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    const project = await Project.create({
      name, description, color, icon,
      owner: req.user._id
    });

    await project.populate('owner', 'name email avatarUrl');
    await project.populate('members.user', 'name email avatarUrl');

    const io = req.app.get('io');
    io.emit('project:created', project);

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { name, description, color, icon, columns } = req.body;
    Object.assign(project, { name, description, color, icon });
    if (columns) project.columns = columns;

    await project.save();
    await project.populate('members.user', 'name email avatarUrl');

    const io = req.app.get('io');
    io.to(`project:${project._id}`).emit('project:updated', project);

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Invite member to project
exports.inviteMember = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const inviter = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to invite' });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) return res.status(404).json({ success: false, message: 'User not found' });

    const alreadyMember = project.members.some(m => m.user.toString() === userToInvite._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User already a member' });

    project.members.push({ user: userToInvite._id, role });
    await project.save();
    await project.populate('members.user', 'name email avatarUrl');

    // Create notification
    await Notification.create({
      recipient: userToInvite._id,
      sender: req.user._id,
      type: 'project_invited',
      title: 'Project Invitation',
      message: `${req.user.name} invited you to join "${project.name}"`,
      project: project._id
    });

    const io = req.app.get('io');
    io.to(`project:${project._id}`).emit('project:member_added', { project, member: userToInvite });
    io.to(`user:${userToInvite._id}`).emit('notification:new', {
      type: 'project_invited',
      message: `You were invited to "${project.name}"`
    });

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove member
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can delete' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
