const Organization = require('../models/Organization');

const verifyTenant = async (req, res, next) => {
  try {
    const orgId = req.headers['x-organization-id'] || req.user.activeOrganization;
    if (!orgId) {
      return res.status(400).json({ message: 'Organization context missing (x-organization-id)' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const membership = org.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!membership) {
      return res.status(403).json({ message: 'Access denied: Not a member of this tenant' });
    }

    req.organization = org;
    req.organizationId = org._id;
    req.tenantRole = membership.role;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Tenant verification failed', error: error.message });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.tenantRole || !allowedRoles.includes(req.tenantRole)) {
      return res.status(403).json({
        message: `Role '${req.tenantRole}' is not permitted to perform this action`,
      });
    }
    next();
  };
};

module.exports = { verifyTenant, authorizeRoles };