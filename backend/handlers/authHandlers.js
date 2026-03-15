const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { MongoClient, ObjectId } = require('mongodb');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// MongoDB connection
let db;
MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017')
  .then(client => {
    db = client.db(process.env.DB_NAME || 'kurtibazaar');
  })
  .catch(error => console.error('Auth MongoDB connection error:', error));

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists in MongoDB
    let user = await db.collection('users').findOne({ email });
    
    if (!user) {
      // Create new user in MongoDB
      user = {
        googleId,
        email,
        name,
        picture,
        createdAt: new Date()
      };
      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid Google token', error: error.message });
  }
};

const verifyToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

module.exports = {
  googleAuth,
  verifyToken,
  getProfile
};