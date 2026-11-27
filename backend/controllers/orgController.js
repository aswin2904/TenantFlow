const Organization = require('../models/Organization');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Create a new Organization (Tenant)
// @route   POST /api/orgs
exports.createOrganization = async (req, res) => {
  try {
    const { name } = req.body;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const org = await Organization.create({
      name,
      slug,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'ADMIN' }],
    });

    await User.findByIdAndUpdate(req.user._id, { activeOrganization: org._id });

    await AuditLog.create({
      organizationId: org._id,
      actor: req.user._id,
      action: 'CREATED_ORGANIZATION',
      entityType: 'ORGANIZATION',
      entityId: org._id,
      metadata: { name: org.name },
    });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create organization', error: error.message });
  }
};

// @desc    Switch active Organization
// @route   PATCH /api/orgs/:orgId/switch
exports.switchOrganization = async (req, res) => {
  try {
    const org = await Organization.findOne({
      _id: req.params.orgId,
      'members.user': req.user._id,
    });

    if (!org) {
      return res.status(403).json({ message: 'You are not a member of this organization' });
    }

    await User.findByIdAndUpdate(req.user._id, { activeOrganization: org._id });
    res.status(200).json({ message: 'Switched active organization', activeOrganization: org._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to switch organization', error: error.message });
  }
};

// @desc    Invite/Add an existing user to the Organization
// @route   POST /api/orgs/members
exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email: email.toLowerCase() });

    if (!userToAdd) {
      return res.status(404).json({ message: 'No registered user found with this email' });
    }

    const alreadyMember = req.organization.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this organization' });
    }

    req.organization.members.push({ user: userToAdd._id, role: role || 'DEVELOPER' });
    await req.organization.save();

    if (!userToAdd.activeOrganization) {
      userToAdd.activeOrganization = req.organizationId;
      await userToAdd.save();
    }

    await AuditLog.create({
      organizationId: req.organizationId,
      actor: req.user._id,
      action: 'ADDED_MEMBER',
      entityType: 'ORGANIZATION',
      entityId: req.organizationId,
      metadata: { addedUser: userToAdd.email, role: role || 'DEVELOPER' },
    });

    const populatedOrg = await Organization.findById(req.organizationId).populate(
      'members.user',
      'name email'
    );

    res.status(200).json(populatedOrg);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add member', error: error.message });
  }
};

// @desc    Get current tenant details & members
// @route   GET /api/orgs/current
exports.getCurrentOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId).populate(
      'members.user',
      'name email'
    );
    res.status(200).json({ organization: org, role: req.tenantRole });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch organization', error: error.message });
  }
};

// @desc    Get tenant Audit Logs
// @route   GET /api/orgs/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ organizationId: req.organizationId })
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
};