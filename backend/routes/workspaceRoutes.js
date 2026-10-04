const express = require('express');
const router = express.Router();
const wc = require('../controllers/workspaceController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', wc.getMyWorkspaces);
router.post('/', wc.createWorkspace);
router.post('/accept-invite', wc.acceptInvite);
router.get('/invite-info', wc.getPendingInviteByToken);
router.get('/:id', wc.getWorkspace);
router.get('/:id/members', wc.getMembers);
router.delete('/:id/members/:userId', wc.removeMember);
router.post('/:id/invite', wc.inviteMember);
router.get('/:id/invitations', wc.getInvitations);
router.get('/:id/activity', wc.getActivity);

module.exports = router;
