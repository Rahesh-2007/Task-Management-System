const express = require('express');
const router = express.Router();
const nc = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', nc.getMyNotifications);
router.patch('/read-all', nc.markAllAsRead);
router.patch('/:id/read', nc.markAsRead);

module.exports = router;
