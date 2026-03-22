const express = require('express');
const router = express.Router();
const { subscribeNewsletter, unsubscribeNewsletter, getSubscriptions } = require('../handlers/newsletterHandlers');
const { verifyToken } = require('../handlers/authHandlers');

router.post('/subscribe', subscribeNewsletter);
router.post('/unsubscribe', unsubscribeNewsletter);
router.get('/subscriptions', verifyToken, getSubscriptions);

module.exports = router;