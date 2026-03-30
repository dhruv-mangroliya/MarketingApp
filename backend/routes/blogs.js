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

// Get blog by id
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const blog = await db.collection('blogs').findOne({ id: parseInt(req.params.id) });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

module.exports = router;