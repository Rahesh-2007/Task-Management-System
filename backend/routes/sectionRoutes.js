const express = require('express');
const router = express.Router();
const sec = require('../controllers/sectionsController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', sec.getSections);
router.post('/', sec.createSection);
router.put('/:id', sec.updateSection);
router.delete('/:id', sec.deleteSection);

module.exports = router;
