const express = require('express');
const router = express.Router();
const { googleAuth, verifyToken, getProfile } = require('../handlers/authHandlers');

router.post('/google', googleAuth);
router.get('/profile', verifyToken, getProfile);

module.exports = router;