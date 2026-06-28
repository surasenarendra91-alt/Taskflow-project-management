const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, moveTask, deleteTask } = require('../controllers/taskController');

router.use(protect);
router.get('/project/:projectId', getTasks);
router.post('/project/:projectId', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/move', moveTask);
router.delete('/:id', deleteTask);

module.exports = router;
