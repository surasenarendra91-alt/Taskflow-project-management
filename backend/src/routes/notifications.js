const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');

router.use(protect);
router.get('/', getNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
