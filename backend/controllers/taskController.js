const Task = require('../models/Task');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

// @desc    Create a Task in a Project
// @route   POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { projectId, title, description, priority, assignee, dueDate } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      organizationId: req.organizationId,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found in your organization' });
    }

    const taskCount = await Task.countDocuments({ projectId, status: 'TODO' });

    const task = await Task.create({
      organizationId: req.organizationId,
      projectId,
      title,
      description,
      priority: priority || 'MEDIUM',
      assignee: assignee || null,
      reporter: req.user._id,
      dueDate: dueDate || null,
      order: taskCount,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email');

    await AuditLog.create({
      organizationId: req.organizationId,
      actor: req.user._id,
      action: 'CREATED_TASK',
      entityType: 'TASK',
      entityId: task._id,
      metadata: { title: task.title, projectId },
    });

    req.io.to(projectId.toString()).emit('task_created', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// @desc    Get all Tasks for a Project
// @route   GET /api/tasks/project/:projectId
exports.getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      organizationId: req.organizationId,
      projectId: req.params.projectId,
    })
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('comments.author', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

// @desc    Update Task (including Kanban Drag-and-Drop column/order changes)
// @route   PATCH /api/tasks/:taskId
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      organizationId: req.organizationId,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const previousStatus = task.status;
    Object.assign(task, req.body);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('comments.author', 'name email');

    if (req.body.status && req.body.status !== previousStatus) {
      await AuditLog.create({
        organizationId: req.organizationId,
        actor: req.user._id,
        action: `MOVED_TASK_${previousStatus}_TO_${req.body.status}`,
        entityType: 'TASK',
        entityId: task._id,
        metadata: { title: task.title },
      });
    }

    req.io.to(task.projectId.toString()).emit('task_updated', populatedTask);

    res.status(200).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// @desc    Add a Comment to a Task
// @route   POST /api/tasks/:taskId/comments
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      organizationId: req.organizationId,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({ author: req.user._id, text: req.body.text });
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('comments.author', 'name email');

    req.io.to(task.projectId.toString()).emit('task_updated', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// @desc    Delete a Task
// @route   DELETE /api/tasks/:taskId
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      organizationId: req.organizationId,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    req.io.to(task.projectId.toString()).emit('task_deleted', task._id);

    res.status(200).json({ message: 'Task deleted', taskId: task._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};