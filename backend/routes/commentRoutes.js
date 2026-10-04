const express = require('express');
const router = express.Router();
const cc = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', cc.getComments);
router.post('/', cc.createComment);
router.put('/:id', cc.updateComment);
router.delete('/:id', cc.deleteComment);

module.exports = router;
