const express = require('express');
const router = express.Router();
const { sendSMS, verifySMS } = require('../handlers/smsHandlers');

router.post('/send', sendSMS);
router.post('/verify', verifySMS);

module.exports = router;