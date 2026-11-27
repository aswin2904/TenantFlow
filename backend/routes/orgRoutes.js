const express = require('express');
const router = express.Router();
const {
  createOrganization,
  switchOrganization,
  addMember,
  getCurrentOrg,
  getAuditLogs,
} = require('../controllers/orgController');
const { protect } = require('../middleware/authMiddleware');
const { verifyTenant, authorizeRoles } = require('../middleware/tenantMiddleware');

router.use(protect);

router.post('/', createOrganization);
router.patch('/:orgId/switch', switchOrganization);
router.get('/current', verifyTenant, getCurrentOrg);
router.post('/members', verifyTenant, authorizeRoles('ADMIN'), addMember);
router.get('/audit-logs', verifyTenant, authorizeRoles('ADMIN', 'MANAGER'), getAuditLogs);

module.exports = router;