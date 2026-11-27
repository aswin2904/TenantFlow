const express = require('express');
const router = express.Router();
const {
  createTask,
  getProjectTasks,
  updateTask,
  addComment,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { verifyTenant, authorizeRoles } = require('../middleware/tenantMiddleware');

router.use(protect, verifyTenant);

router.post('/', authorizeRoles('ADMIN', 'MANAGER', 'DEVELOPER'), createTask);
router.get('/project/:projectId', getProjectTasks);
router.patch('/:taskId', authorizeRoles('ADMIN', 'MANAGER', 'DEVELOPER'), updateTask);
router.post('/:taskId/comments', authorizeRoles('ADMIN', 'MANAGER', 'DEVELOPER'), addComment);
router.delete('/:taskId', authorizeRoles('ADMIN', 'MANAGER'), deleteTask);

module.exports = router;