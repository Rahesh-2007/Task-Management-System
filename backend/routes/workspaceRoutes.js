const express = require('express');
const router = express.Router();
const wc = require('../controllers/workspaceController');
const { authMiddleware } = require('../middleware/auth');

// Public invite verification routes
router.get('/invitations/:token', wc.getInviteByToken);
router.get('/invite-info', wc.getInviteByToken);

// Protected workspace routes
router.use(authMiddleware);

router.get('/', wc.getMyWorkspaces);
router.post('/', wc.createWorkspace);
router.get('/my-invitations', wc.getMyPendingInvitations);
router.post('/accept-invite', wc.acceptInvite);
router.post('/invitations/:token/accept', wc.acceptInvite);
router.post('/invitations/:token/decline', wc.declineInvite);

router.post('/bulk-delete', wc.bulkDeleteWorkspaces);
router.delete('/bulk-delete', wc.bulkDeleteWorkspaces);
router.get('/:id', wc.getWorkspace);
router.delete('/:id', wc.deleteWorkspace);
router.get('/:id/members', wc.getMembers);
router.delete('/:id/members/:userId', wc.removeMember);
router.post('/:id/invite', wc.inviteMember);
router.get('/:id/invitations', wc.getInvitations);
router.get('/:id/activity', wc.getActivity);

module.exports = router;
