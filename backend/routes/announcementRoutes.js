const express = require('express');
const router = express.Router();
const {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    updateStatus
} = require('../controllers/announcementController');

router.get('/all-announcements', getAnnouncements);
router.post('/new-announcement', createAnnouncement);
router.put('/update-announcement/:id', updateAnnouncement);
router.delete('/delete-announcement/:id', deleteAnnouncement);
router.put('/:id/status', updateStatus);

module.exports = router; 