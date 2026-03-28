const express = require('express');
const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const blogs = await db.collection('blogs').find({}).toArray();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

module.exports = router;