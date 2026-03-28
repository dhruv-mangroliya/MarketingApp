const express = require('express');
const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const reviews = await db.collection('reviews').find({}).toArray();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;