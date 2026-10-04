const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { optionalAuth } = require('../middleware/auth');

// Apply optional auth to all task routes (works for both authenticated and unauthenticated)
router.use(optionalAuth);

router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.patch('/:id/toggle', taskController.toggleComplete);
router.patch('/reorder', taskController.reorderTasks);
router.delete('/:id', taskController.deleteTask);
router.post('/reset', taskController.resetTasks);

module.exports = router;
