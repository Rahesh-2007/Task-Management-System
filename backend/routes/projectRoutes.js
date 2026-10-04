const express = require('express');
const router = express.Router();
const pc = require('../controllers/projectController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', pc.getProjects);
router.post('/', pc.createProject);
router.get('/:id', pc.getProject);
router.put('/:id', pc.updateProject);
router.delete('/:id', pc.deleteProject);

module.exports = router;
