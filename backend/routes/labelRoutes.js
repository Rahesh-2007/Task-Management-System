const express = require('express');
const router = express.Router();
const lc = require('../controllers/labelController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', lc.getLabels);
router.post('/', lc.createLabel);
router.put('/:id', lc.updateLabel);
router.delete('/:id', lc.deleteLabel);

module.exports = router;
