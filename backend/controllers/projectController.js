const Project = require('../models/Project');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');

// @desc    Create a new Project inside active Tenant
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, key, description } = req.body;

    const project = await Project.create({
      organizationId: req.organizationId,
      name,
      key: key.toUpperCase(),
      description,
      lead: req.user._id,
    });

    await AuditLog.create({
      organizationId: req.organizationId,
      actor: req.user._id,
      action: 'CREATED_PROJECT',
      entityType: 'PROJECT',
      entityId: project._id,
      metadata: { name: project.name, key: project.key },
    });

    res.status(201).json(project);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Project key already exists in this organization' });
    }
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

// @desc    Get all Projects for active Tenant
// @route   GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ organizationId: req.organizationId })
      .populate('lead', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

// @desc    Get Tenant Sprint & Task Analytics (MongoDB Aggregation)
// @route   GET /api/projects/analytics
exports.getTenantAnalytics = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { organizationId: req.organizationId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { organizationId: req.organizationId } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({ byStatus: stats, byPriority: priorityStats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};