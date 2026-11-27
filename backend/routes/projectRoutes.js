const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getTenantAnalytics,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { verifyTenant, authorizeRoles } = require('../middleware/tenantMiddleware');

router.use(protect, verifyTenant);

router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createProject);
router.get('/', getProjects);
router.get('/analytics', getTenantAnalytics);

module.exports = router;