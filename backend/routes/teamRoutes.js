const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Meetings (Google Meet)
router.get('/workspaces/:workspaceId/meetings', teamController.getMeetings);
router.post('/workspaces/:workspaceId/meetings', teamController.createMeeting);
router.delete('/workspaces/:workspaceId/meetings/:meetingId', teamController.deleteMeeting);

// Team Chat
router.get('/workspaces/:workspaceId/chat', teamController.getChatMessages);
router.post('/workspaces/:workspaceId/chat', teamController.sendChatMessage);

// Vacations / Time-off
router.get('/workspaces/:workspaceId/vacations', teamController.getVacations);
router.post('/workspaces/:workspaceId/vacations', teamController.createVacation);
router.put('/workspaces/:workspaceId/vacations/:vacationId/status', teamController.updateVacationStatus);
router.delete('/workspaces/:workspaceId/vacations/:vacationId', teamController.deleteVacation);

// Activity Stream
router.get('/workspaces/:workspaceId/activities', teamController.getActivityStream);

module.exports = router;
